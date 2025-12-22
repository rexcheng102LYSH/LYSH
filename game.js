// ================= 核心遊戲邏輯 (Core Game Logic) =================
// [Alpha 0.7.8.1 State Management Separation]
// - 將 GameState 分離到 gamestate.js，減輕 game.js 負擔
// - 專注於遊戲邏輯：棋盤渲染、回合管理、技能系統、勝負判定
//
// [Alpha 0.7.8.0 State Management Refactoring]
// - 引入集中式 GameState 對象，統一管理所有遊戲狀態
// - 提供 resetGame()、createSnapshot()、restoreSnapshot() 等狀態管理方法
// - 完全向後兼容，保留舊的全局變量引用
// - 為未來的存檔/讀檔、回放、統計等功能打下基礎
//
// [Alpha 0.7.7.9 Final Release]
// - 整合 DJ 节奏游戏：在 updateWinCelebrationUI 中恢复 DJ 选项，并在 highlightWin 中正确触发
// - 优化胜负逻辑：PvE 败北时播放 playDefeat() 并静默特效；胜利时根据选项触发 VisualFX
// - 强化状态管理：enterTurnSelection 和 initGame 强制清除特效，防止残留

function getIcon(player) {
    if (typeof PIECE_ICONS === 'undefined') return (player === MAPLE ? 'B' : 'W');
    
    let iconData;
    if (currentSkin === 'nature') {
        iconData = (player === MAPLE ? PIECE_ICONS.maple : PIECE_ICONS.sun);
    } else {
        iconData = (player === MAPLE ? PIECE_ICONS.classic_black : PIECE_ICONS.classic_white);
    }

    if (typeof iconData === 'string') {
        return iconData;
    } else if (iconData && iconData.type === 'image') {
        return `<img src="${iconData.src}" alt="${iconData.alt}" class="piece-img inline-icon-img" style="width:100%;height:100%;object-fit:contain;vertical-align:middle;">`;
    }
    return '?';
}

// ================= 幀率控制系統 =================
// 統一的主循環管理器，確保穩定的幀率
const FrameRateController = {
    targetFPS: 60,  // 鎖定 60fps
    frameTime: 1000 / 60,  // 每幀時間 (ms)
    lastFrameTime: 0,
    animationId: null,
    
    // 更新幀率限制（暫時禁用無限制模式）
    setFPSLimit: function(limit) {
        // 先停止當前動畫循環
        const wasRunning = this.animationId !== null;
        if (wasRunning) {
            this.stop();
        }
        
        // 強制鎖定 60fps
        this.targetFPS = 60;
        this.frameTime = 1000 / 60;
        
        // 重置時間戳，避免 deltaTime 異常
        this.lastFrameTime = performance.now();
        
        // 如果之前在運行，重新啟動
        if (wasRunning) {
            this.start();
        }
    },
    
    init: function() {
        this.lastFrameTime = performance.now();
        this.setFPSLimit(GameState.fpsLimit);  // 根據設置初始化
        this.start();
    },
    
    start: function() {
        if (this.animationId) return;
        const loop = (now) => {
            const deltaTime = now - this.lastFrameTime;
            
            // 只在達到目標幀時間時執行（無限制模式下 frameTime = 0，總是執行）
            if (deltaTime >= this.frameTime) {
                // 更新時間戳（無限制模式下直接使用當前時間）
                if (this.frameTime > 0) {
                    this.lastFrameTime = now - (deltaTime % this.frameTime);
                } else {
                    this.lastFrameTime = now;
                }
                
                // 執行所有引擎的更新
                if (typeof BackgroundEngine !== 'undefined' && BackgroundEngine.loop) {
                    BackgroundEngine.loop();
                }
                if (typeof VisualFX !== 'undefined' && VisualFX.renderFrame) {
                    VisualFX.renderFrame(now);
                }
            }
            
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    },
    
    stop: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

// ================= 界面控制 =================
const screens = { 
    main: document.getElementById('mainMenu'), 
    diff: document.getElementById('difficultyScreen'), 
    turn: document.getElementById('turnSelectScreen'), 
    draft: document.getElementById('skillSelectScreen'), 
    game: document.getElementById('gameScreen'), 
    settings: document.getElementById('settingsModal'),
    skin: document.getElementById('skinModal')
};

function showScreen(n) { 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    Object.values(screens).forEach(s => { 
        if(s && !s.classList.contains('modal')) s.classList.remove('active'); 
    }); 
    if (screens[n]) screens[n].classList.add('active'); 
    if (n === 'game') {
        setTimeout(() => {
            if (typeof VisualFX !== 'undefined') VisualFX.init();
        }, 100);
    }
}

function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('sliderMusic').value = SoundEngine.musicVolume * 100;
    document.getElementById('valMusic').innerText = Math.round(SoundEngine.musicVolume * 100) + '%';
    document.getElementById('sliderSfx').value = SoundEngine.sfxVolume * 100;
    document.getElementById('valSfx').innerText = Math.round(SoundEngine.sfxVolume * 100) + '%';
    document.getElementById('sliderAmbient').value = SoundEngine.ambientVolume * 100;
    document.getElementById('valAmbient').innerText = Math.round(SoundEngine.ambientVolume * 100) + '%';
    updateTrackUI();
    updateSeasonUI();
    updateFPSUI();
}
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

function openSkinMenu() {
    if (gameActive) {
        showToast(t('errNoSkinInGame'));
        SoundEngine.playError();
        return;
    }
    document.getElementById('skinModal').style.display = 'flex';
    updateSkinUI();
    updateWinEffectUI();
    updateWinCelebrationUI(); 
}
function closeSkinMenu() { document.getElementById('skinModal').style.display = 'none'; }

function changeSkin(skin) {
    SoundEngine.playPlace();
    GameState.currentSkin = skin;
    currentSkin = GameState.currentSkin; // 同步
    updateSkinUI();
    if (screens.turn.classList.contains('active')) {
        document.querySelector('.turn-card.maple .icon').innerHTML = getIcon(MAPLE);
        document.querySelector('.turn-card.sun .icon').innerHTML = getIcon(SUN);
    }
}

function changeWinEffect(effect) {
    SoundEngine.playPlace();
    GameState.winEffect = effect;
    winEffect = GameState.winEffect; // 同步
    updateWinEffectUI();
}

function changeWinCelebration(type) {
    SoundEngine.playPlace();
    GameState.winCelebration = type;
    winCelebration = GameState.winCelebration; // 同步
    updateWinCelebrationUI();
}

function updateSkinUI() {
    document.querySelectorAll('.skin-option').forEach(el => el.classList.remove('active'));
    if (currentSkin === 'classic') document.getElementById('skinClassic').classList.add('active');
    else document.getElementById('skinNature').classList.add('active');
}

function updateWinEffectUI() {
    document.querySelectorAll('.effect-opt').forEach(el => el.classList.remove('active'));
    if (winEffect === 'default') document.getElementById('winDefault').classList.add('active');
    else if (winEffect === 'lightning') document.getElementById('winLightning').classList.add('active');
    else if (winEffect === 'gold') document.getElementById('winGold').classList.add('active');
    else if (winEffect === 'future') document.getElementById('winFuture').classList.add('active');
}

function updateWinCelebrationUI() {
    document.querySelectorAll('.celebration-opt').forEach(el => el.classList.remove('active'));
    // [Alpha 0.7.7.9] 恢复 DJ 选项，Chromatic 暂时隐藏或保留按钮但无效果
    if (winCelebration === 'default') {
        const el = document.getElementById('celDefault'); if(el) el.classList.add('active');
    } else if (winCelebration === 'fireworks') {
        const el = document.getElementById('celFireworks'); if(el) el.classList.add('active');
    } else if (winCelebration === 'chromatic') {
        const el = document.getElementById('celChromatic'); if(el) el.classList.add('active');
    } else if (winCelebration === 'dj') {
        const el = document.getElementById('celDJ'); if(el) el.classList.add('active');
    }
}

function updateVolume(type, val) {
    const v = val / 100;
    if (type === 'music') { 
        SoundEngine.setMusicVolume(v); 
        document.getElementById('valMusic').innerText = val + '%'; 
    } else if (type === 'sfx') { 
        SoundEngine.sfxVolume = v; 
        document.getElementById('valSfx').innerText = val + '%'; 
    } else if (type === 'ambient') {
        SoundEngine.setAmbientVolume(v);
        document.getElementById('valAmbient').innerText = val + '%';
    }
}

function changeTrack(track) { 
    if (SoundEngine.currentTrack === 'bomb') { 
        GameState.userMusicPref = track; 
        userMusicPref = GameState.userMusicPref; // 同步
        updateTrackUI(); 
        return; 
    } 
    GameState.userMusicPref = track; 
    userMusicPref = GameState.userMusicPref; // 同步
    SoundEngine.switchTrack(track); 
    updateTrackUI(); 
}

function updateTrackUI() {
    const trackIds = ['trackOrigin', 'trackBgm1', 'trackBgm2', 'trackBgm3', 'trackBgm4'];
    trackIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    let activeId = 'trackOrigin';
    if (userMusicPref === 'bgm1') activeId = 'trackBgm1';
    else if (userMusicPref === 'bgm2') activeId = 'trackBgm2';
    else if (userMusicPref === 'bgm3') activeId = 'trackBgm3';
    else if (userMusicPref === 'bgm4') activeId = 'trackBgm4';
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

function changeSeason(season) {
    SoundEngine.playPlace();
    GameState.currentSeason = season;
    currentSeason = GameState.currentSeason; // 同步
    if (window.BackgroundEngine && typeof window.BackgroundEngine.switchSeason === 'function') {
        window.BackgroundEngine.switchSeason(season);
    }
    updateSeasonUI();
}

function updateSeasonUI() {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    seasons.forEach(s => {
        const btn = document.getElementById('season' + s.charAt(0).toUpperCase() + s.slice(1));
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById('season' + currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1));
    if (activeBtn) activeBtn.classList.add('active');
}

function changeFPSLimit(limit) {
    SoundEngine.playPlace();
    GameState.fpsLimit = limit;
    fpsLimit = GameState.fpsLimit; // 同步
    FrameRateController.setFPSLimit(limit);
    updateFPSUI();
}

function updateFPSUI() {
    document.querySelectorAll('.fps-opt').forEach(el => el.classList.remove('active'));
    if (fpsLimit === '60') {
        const el = document.getElementById('fps60');
        if (el) el.classList.add('active');
    } else {
        const el = document.getElementById('fpsUnlimited');
        if (el) el.classList.add('active');
    }
}

function goToMenu() { 
    GameState.gameActive = false;
    gameActive = false; // 同步
    
    // 清理所有計時器
    if (GameState.gameTicker) clearInterval(GameState.gameTicker);
    if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
    if (GameState.bombInterval) clearInterval(GameState.bombInterval);
    
    // 不要停止 FrameRateController，讓背景動畫繼續運行
    
    document.getElementById('winnerModal').style.display='none'; 
    showScreen('main'); 
    // [Fix] 返回菜单时清空特效，防止 DJ 鼓点或烟花残留
    if (typeof VisualFX !== 'undefined') VisualFX.clear();
}
function confirmExit() { if(confirm(t('confirmExit'))) goToMenu(); }
function showDifficultyScreen() { SoundEngine.playPlace(); showScreen('diff'); }
function startPvPFlow(subMode) { 
    SoundEngine.playPlace(); 
    GameState.isBO3 = (subMode === 'bo3');
    GameState.p1Score = 0;
    GameState.p2Score = 0;
    GameState.chooser = 'p1';
    
    // 同步向後兼容變量
    isBO3 = GameState.isBO3;
    p1Score = GameState.p1Score;
    p2Score = GameState.p2Score;
    chooser = GameState.chooser;
    
    updateScoreBoard(); 
    enterTurnSelection('pvp', null); 
}
function enterTurnSelection(mode, diff) { 
    // [Fix] 进入新游戏流程前，强制清空上一局的特效
    if (typeof VisualFX !== 'undefined') VisualFX.clear();
    
    SoundEngine.playPlace(); 
    document.getElementById('winnerModal').style.display = 'none'; 
    showScreen('turn'); 
    
    GameState.gameMode = mode;
    GameState.aiDifficulty = diff;
    if (GameState.gameMode === 'pve') { 
        GameState.isBO3 = false; 
    }
    
    // 同步向後兼容變量
    gameMode = GameState.gameMode;
    aiDifficulty = GameState.aiDifficulty;
    isBO3 = GameState.isBO3;
    
    const tEl = document.getElementById('turnSelectTitle'), dEl = document.getElementById('turnSelectDesc'); 
    updateStaticText(); 
    
    if (GameState.isBO3 && (GameState.p1Score > 0 || GameState.p2Score > 0)) { 
        tEl.innerText = t('titlePickSide'); 
        dEl.innerText = `${t('descPickSideLoser')} (${GameState.chooser==='p1'?"P1":"P2"})`; 
    } else { 
        tEl.innerText = t('titlePickSide'); 
        dEl.innerText = t('descPickSide'); 
    } 
    
    document.querySelector('.turn-card.maple .icon').innerHTML = getIcon(MAPLE);
    document.querySelector('.turn-card.sun .icon').innerHTML = getIcon(SUN);
}
function goBackFromTurn() { SoundEngine.playPlace(); if (gameMode === 'pve') { showScreen('diff'); } else { goToMenu(); } }
function handleTurnChoice(c) { SoundEngine.playPlace(); if (gameMode === 'pve') { humanSide = (c === 1) ? MAPLE : SUN; enterDraftPhase(); } else { if (c === 1) { playerSides[MAPLE] = chooser; playerSides[SUN] = (chooser === 'p1' ? 'p2' : 'p1'); } else { playerSides[SUN] = chooser; playerSides[MAPLE] = (chooser === 'p1' ? 'p2' : 'p1'); } enterDraftPhase(); } }
function enterDraftPhase() { 
    document.getElementById('winnerModal').style.display = 'none'; 
    showScreen('draft'); 
    
    if (GameState.gameMode === 'pve') GameState.draftTurn = SUN; 
    else GameState.draftTurn = SUN; 
    
    GameState.playerSkills = { [MAPLE]: null, [SUN]: null };
    
    // 同步向後兼容變量
    draftTurn = GameState.draftTurn;
    playerSkills = GameState.playerSkills;
    
    renderSkillGrid(); 
    updateDraftTitle(); 
    SoundEngine.init(); 
}

function renderSkillGrid() { 
    const g = document.getElementById('skillGrid'); 
    g.innerHTML = ''; 
    SKILL_IDS.forEach(sid => { 
        const sd = t(sid, 'skills'); 
        const iconSvg = (typeof SKILL_ICONS !== 'undefined' ? SKILL_ICONS[sid] : '') || ''; 
        const c = document.createElement('div'); 
        c.className = 'skill-card'; 
        c.innerHTML = `
            <div class="skill-icon">${iconSvg}</div>
            <div class="skill-info">
                <div class="skill-title">${sd.name}</div>
                <div class="skill-desc">${sd.desc}</div>
            </div>
        `; 
        c.onclick = () => pickSkill(sid); 
        if (Object.values(playerSkills).includes(sid)) { c.classList.add('selected'); c.onclick = null; } 
        g.appendChild(c); 
    }); 
}

function updateDraftTitle() { 
    const tEl = document.getElementById('draftTitle'); 
    let pickerName = t('names')[GameState.draftTurn]; 
    
    if (GameState.gameMode === 'pve') { 
        const isAITurn = (GameState.humanSide === MAPLE && GameState.draftTurn === SUN) || 
                         (GameState.humanSide === SUN && GameState.draftTurn === MAPLE); 
        if (isAITurn) pickerName += " (AI)"; 
        else pickerName += " (You)"; 
        
        if (isAITurn) setTimeout(() => { 
            const avail = SKILL_IDS.filter(s => !Object.values(GameState.playerSkills).includes(s)); 
            pickSkill(avail[Math.floor(Math.random()*avail.length)]); 
        }, 800); 
    } 
    
    const iconHTML = `<span style="display:inline-block;width:32px;height:32px;vertical-align:bottom;">${getIcon(GameState.draftTurn)}</span>`;
    tEl.innerHTML = t('draftTitle').replace('{icon}', iconHTML).replace('{name}', pickerName); 
    tEl.style.color = GameState.draftTurn === MAPLE ? '#333' : '#666'; 
}
function pickSkill(id) { 
    SoundEngine.playPlace(); 
    GameState.playerSkills[GameState.draftTurn] = id; 
    
    if (GameState.draftTurn === SUN) { 
        GameState.draftTurn = MAPLE; 
        draftTurn = GameState.draftTurn; // 同步
        playerSkills = GameState.playerSkills; // 同步
        renderSkillGrid(); 
        updateDraftTitle(); 
    } else {
        playerSkills = GameState.playerSkills; // 同步
        initGame(); 
    }
}

function initGame() {
    showScreen('game'); 
    
    // 使用 GameState 的重置方法，更清晰優雅
    GameState.resetGame();
    
    // 同步向後兼容變量
    board = GameState.board;
    currentPlayer = GameState.currentPlayer;
    gameActive = GameState.gameActive;
    historyStack = GameState.historyStack;
    skillUsed = GameState.skillUsed;
    activeEffect = GameState.activeEffect;
    territoryZones = GameState.territoryZones;
    isDoubleMoveActive = GameState.isDoubleMoveActive;
    chaosDebuff = GameState.chaosDebuff;
    shortBattleTurns = GameState.shortBattleTurns;
    timeRemaining = GameState.timeRemaining;
    selectedCell = GameState.selectedCell;
    bombTarget = GameState.bombTarget;
    gameTicker = GameState.gameTicker;
    aiTimer = GameState.aiTimer;
    userMusicPref = GameState.userMusicPref; // 同步
    
    SoundEngine.setCritical(false);
    SoundEngine.switchTrack(GameState.userMusicPref);
    
    // [Fix] 双重保险：开局前清空任何可能残留的视觉特效
    if (typeof VisualFX !== 'undefined') VisualFX.clear();
    
    // FrameRateController 已經在頁面加載時啟動，不需要重複啟動

    updateStaticText(); updateDynamicUI(); renderBoard();

    GameState.gameTicker = setInterval(() => {
        if(!GameState.gameActive) return;
        GameState.timeRemaining[GameState.currentPlayer]--;
        timeRemaining = GameState.timeRemaining; // 同步
        
        if (GameState.bombTarget !== null && GameState.currentPlayer === GameState.bombTarget) {
            if (GameState.timeRemaining[GameState.currentPlayer] < 30) SoundEngine.setCritical(true);
            else SoundEngine.setCritical(false);
        } else {
            SoundEngine.setCritical(false);
        }

        updateDynamicUI(); 
        if(GameState.timeRemaining[GameState.currentPlayer] <= 0) { 
            if (GameState.bombTarget === GameState.currentPlayer) triggerExplosion();
            else { showToast(t('timeOut', 'toast')); handleMatchEnd(GameState.currentPlayer === MAPLE ? SUN : MAPLE); }
        }
    }, 1000);
    gameTicker = GameState.gameTicker; // 同步

    document.getElementById('winnerModal').style.display = 'none'; 
    const dt = document.getElementById('diffTag'), sb = document.getElementById('scoreBoard');
    if(GameState.gameMode === 'pve') { 
        dt.style.display = 'inline-block'; 
        sb.style.display = 'none'; 
        dt.innerText = t('pveTag') + t('diff' + GameState.aiDifficulty.charAt(0).toUpperCase() + GameState.aiDifficulty.slice(1)); 
    } else { 
        dt.style.display = 'none'; 
        sb.style.display = GameState.isBO3 ? 'block' : 'none'; 
        updateScoreBoard(); 
    }
    
    if (GameState.gameMode === 'pve' && GameState.humanSide === SUN) { 
        GameState.aiTimer = setTimeout(aiMove, 800); 
        aiTimer = GameState.aiTimer; // 同步
    }
}

function updateScoreBoard() { document.getElementById('scoreBoard').innerText = `P1 (${p1Score}) : (${p2Score}) P2`; }

function renderBoard() { 
    const b = document.getElementById('board'); 
    b.innerHTML = ''; 
    const stars = [[3,3],[3,11],[7,7],[11,3],[11,11]]; 
    for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) { 
        const cell = document.createElement('div'); 
        cell.className = 'cell'; cell.id = `c-${r}-${c}`; cell.dataset.r=r; cell.dataset.c=c; 
        cell.onclick=()=>handleCellClick(r,c); 
        cell.onmouseenter=()=>handleCellHover(r,c); 
        if(stars.some(s=>s[0]===r&&s[1]===c)) { 
            cell.setAttribute('data-star','true'); 
            const d=document.createElement('div'); d.className='dot'; cell.appendChild(d); 
        } 
        b.appendChild(cell); 
    } 
    if (typeof VisualFX !== 'undefined') VisualFX.init();
}
function getCell(r, c) { return document.getElementById(`c-${r}-${c}`); }

function handleCellHover(r, c) {}

function saveState() { 
    // 使用 GameState 的快照方法，更優雅
    const snapshot = GameState.createSnapshot();
    GameState.historyStack.push(snapshot);
    historyStack = GameState.historyStack; // 同步
}

function restoreState(state) { 
    // 使用 GameState 的恢復方法
    GameState.restoreSnapshot(state);
    
    // 同步向後兼容變量
    board = GameState.board;
    currentPlayer = GameState.currentPlayer;
    skillUsed = GameState.skillUsed;
    territoryZones = GameState.territoryZones;
    chaosDebuff = GameState.chaosDebuff;
    shortBattleTurns = GameState.shortBattleTurns;
    timeRemaining = GameState.timeRemaining;
    bombTarget = GameState.bombTarget;
    
    SoundEngine.setCritical(false);
    if (typeof VisualFX !== 'undefined') VisualFX.clear();
    
    document.querySelectorAll('.win-highlight').forEach(el => el.classList.remove('win-highlight'));

    for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) { 
        const cell = getCell(r,c); 
        cell.className = 'cell'; 
        cell.innerHTML = ''; 
        if(cell.getAttribute('data-star')==='true') { 
            const d=document.createElement('div'); d.className='dot'; cell.appendChild(d); 
        } 
        const val = GameState.board[r][c]; 
        
        if (val === MAPLE || val === SUN) { 
            renderPieceInCell(cell, val);
        } else if (val === CORRODED) { 
            cell.className = 'cell corroded';
        } 
    } 
    updateTerritoriesUI(); 
    updateDynamicUI(); 
}

function placePiece(r, c, p, m=false, chaos=false) { 
    GameState.board[r][c] = p;
    board[r][c] = p; // 同步
    const cell = getCell(r,c); 
    if(cell) { 
        renderPieceInCell(cell, p); 
        SoundEngine.playPlace(); 
    } 
}

function renderPieceInCell(cell, player) {
    const pieceDiv = document.createElement('div');
    if (currentSkin === 'classic') {
        pieceDiv.className = `piece skin-classic ${player===MAPLE?'p1':'p2'}`;
    } else {
        pieceDiv.className = 'piece skin-nature';
        const iconData = (player === MAPLE ? PIECE_ICONS.maple : PIECE_ICONS.sun);
        if (typeof iconData === 'string') {
            pieceDiv.innerHTML = iconData;
        } else if (iconData && iconData.type === 'image') {
            const img = document.createElement('img');
            img.src = iconData.src;
            img.alt = iconData.alt;
            img.className = 'piece-img'; 
            pieceDiv.appendChild(img);
        }
    }
    cell.appendChild(pieceDiv);
}

function handleCellClick(r, c, bypassConfirm = false) {
    if (!gameActive) return;
    if (activeEffect) { handleSkillInteraction(r, c); return; }
    if (board[r][c] !== EMPTY) { SoundEngine.playError(); return; }
    if (isZoneRestricted(r, c, currentPlayer)) { showToast(t('errZone', 'toast')); SoundEngine.playError(); return; }
    if (!bypassConfirm && !isDoubleMoveActive) { 
        if (!selectedCell || selectedCell.r !== r || selectedCell.c !== c) { 
            if(selectedCell) { const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); } 
            GameState.selectedCell = {r, c}; selectedCell = {r, c}; // 同步
            const newCell = getCell(r, c); if(newCell) newCell.classList.add('selected-move'); SoundEngine.playPlace(); return; 
        } else { 
            const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); 
            GameState.selectedCell = null; selectedCell = null; // 同步
        } 
    }
    if (!isDoubleMoveActive) saveState();
    let wasChaosed = false;
    if (chaosDebuff[currentPlayer] > 0) { 
        let candidates = []; 
        for (let i = r-1; i <= r+1; i++) for (let j = c-1; j <= c+1; j++) if (isValid(i, j) && board[i][j] === EMPTY && !isZoneRestricted(i, j, currentPlayer)) candidates.push({r: i, c: j}); 
        if (candidates.length > 0) { 
            const pick = candidates[Math.floor(Math.random() * candidates.length)]; 
            r = pick.r; c = pick.c; wasChaosed = true; 
        } 
        SoundEngine.playChaos(); showToast(t('chaosTrigger', 'toast')); 
        GameState.chaosDebuff[currentPlayer]--; chaosDebuff[currentPlayer]--; // 同步
    }
    placePiece(r, c, currentPlayer, false, wasChaosed);
    if(selectedCell) { const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); GameState.selectedCell = null; selectedCell = null; // 同步
    }
    if (isDoubleMoveActive) { 
        GameState.isDoubleMoveActive = false; isDoubleMoveActive = false; // 同步
        showToast(t('doubleNext', 'toast')); SoundEngine.playSkill(); 
        const winLine = checkWin(r, c, currentPlayer);
        if (winLine) highlightWin(winLine, currentPlayer);
        return; 
    }
    checkWinAndSwitch(r, c, currentPlayer);
}

function checkWinAndSwitch(r, c, p) { 
    const winLine = checkWin(r, c, p);
    if (winLine) { highlightWin(winLine, p); } else { switchTurn(); }
}

function switchTurn() {
    // 更新領地狀態
    GameState.territoryZones.forEach(z => { z.turns--; }); 
    GameState.territoryZones = GameState.territoryZones.filter(z => z.turns > 0); 
    territoryZones = GameState.territoryZones; // 同步
    
    updateTerritoriesUI();
    
    // 更新短兵相接狀態
    if (GameState.shortBattleTurns > 0) GameState.shortBattleTurns--;
    shortBattleTurns = GameState.shortBattleTurns; // 同步
    
    // [Critical Fix] 切換當前玩家 - 必須同時更新 GameState 和舊變量
    GameState.currentPlayer = GameState.currentPlayer === MAPLE ? SUN : MAPLE;
    currentPlayer = GameState.currentPlayer; // 同步到舊變量
    
    // 音樂切換
    if (GameState.bombTarget !== null && GameState.currentPlayer === GameState.bombTarget) { 
        SoundEngine.switchTrack('bomb'); 
    } else { 
        SoundEngine.switchTrack(GameState.userMusicPref); 
    }
    
    updateDynamicUI(); 
    
    // AI 回合處理
    if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
    if (GameState.gameMode === 'pve' && GameState.currentPlayer !== GameState.humanSide && GameState.gameActive) { 
        GameState.aiTimer = setTimeout(aiMove, 600);
        aiTimer = GameState.aiTimer; // 同步
    }
}

function activateSkill() {
    if (!GameState.gameActive || GameState.skillUsed[GameState.currentPlayer]) { 
        showToast(t('skillUsed', 'toast')); 
        return; 
    }
    
    if(GameState.selectedCell) { 
        const old = getCell(GameState.selectedCell.r, GameState.selectedCell.c); 
        if(old) old.classList.remove('selected-move'); 
        GameState.selectedCell = null;
        selectedCell = null; // 同步
    }
    
    saveState();
    
    const sid = GameState.playerSkills[GameState.currentPlayer];
    const sname = t(sid, 'skills').name;
    
    SoundEngine.playSkill(); 
    showToast(t('casting', 'toast') + sname); 
    
    GameState.skillUsed[GameState.currentPlayer] = true;
    skillUsed = GameState.skillUsed; // 同步
    updateDynamicUI();
    
    const b = document.getElementById('board');
    
    if (sid === 'double') { 
        GameState.isDoubleMoveActive = true;
        isDoubleMoveActive = true; // 同步
        showToast(t('doubleStart', 'toast')); 
    }
    else if (sid === 'voodoo') { 
        GameState.activeEffect = 'voodoo_pick';
        activeEffect = 'voodoo_pick'; // 同步
        b.classList.add('casting-voodoo'); 
        showToast(t('voodooPick', 'toast')); 
    }
    else if (sid === 'move_self') { 
        GameState.activeEffect = 'move_pick';
        GameState.effectData = {mode:'self'};
        activeEffect = 'move_pick'; // 同步
        effectData = {mode:'self'}; // 同步
        b.classList.add('casting-move-src'); 
        showToast(t('moveSrcSelf', 'toast')); 
    }
    else if (sid === 'move_enemy') { 
        GameState.activeEffect = 'move_pick';
        GameState.effectData = {mode:'enemy'};
        activeEffect = 'move_pick'; // 同步
        effectData = {mode:'enemy'}; // 同步
        b.classList.add('casting-move-src'); 
        showToast(t('moveSrcEnemy', 'toast')); 
    }
    else if (sid === 'zone') { 
        GameState.activeEffect = 'zone_pick';
        activeEffect = 'zone_pick'; // 同步
        b.classList.add('casting-territory'); 
        showToast(t('zonePick', 'toast')); 
    }
    else if (sid === 'bomb') { 
        // [Critical Fix] 時間炸彈必須同步到 GameState
        const opp = GameState.currentPlayer === MAPLE ? SUN : MAPLE;
        
        GameState.timeRemaining[opp] -= 150;
        timeRemaining = GameState.timeRemaining; // 同步
        
        GameState.bombTarget = opp;
        bombTarget = GameState.bombTarget; // 同步
        
        showToast(t('bombStart', 'toast'));
        
        if(GameState.timeRemaining[opp] <= 0) { 
            triggerExplosion(); 
            return; 
        }
        
        updateDynamicUI();
    }
    else if (sid === 'god_hand') { 
        GameState.activeEffect = 'god_pick_1';
        activeEffect = 'god_pick_1'; // 同步
        b.classList.add('casting-move-src'); 
        showToast(t('godPick1', 'toast')); 
    }
    else if (sid === 'chaos') { 
        const opp = GameState.currentPlayer === MAPLE ? SUN : MAPLE;
        GameState.chaosDebuff[opp] += 2;
        chaosDebuff = GameState.chaosDebuff; // 同步
        updateDynamicUI(); 
    }
    else if (sid === 'short_battle') { 
        GameState.shortBattleTurns = 6;
        shortBattleTurns = GameState.shortBattleTurns; // 同步
        showToast(t('shortBattleStart', 'toast')); 
        updateDynamicUI(); 
    }
    else if (sid === 'swap') { 
        GameState.activeEffect = 'swap_pick_1';
        activeEffect = 'swap_pick_1'; // 同步
        b.classList.add('casting-move-src'); 
        showToast(t('swapPickSelf', 'toast')); 
    }
}

function handleSkillInteraction(r, c) {
    SoundEngine.playPlace(); const b = document.getElementById('board'); const cell = getCell(r, c); if(!cell) return;
    if (activeEffect === 'voodoo_pick') { 
        if (board[r][c] === EMPTY || board[r][c] === CORRODED) { SoundEngine.playError(); return; } 
        GameState.board[r][c] = CORRODED; board[r][c] = CORRODED; // 同步
        cell.innerHTML = ''; cell.className = 'cell corroded'; 
        GameState.activeEffect = null; activeEffect = null; // 同步
        b.classList.remove('casting-voodoo'); showToast(t('voodooDone', 'toast')); 
    } 
    else if (activeEffect === 'move_pick') { const p = board[r][c]; if ((effectData.mode==='self' && p!==currentPlayer) || (effectData.mode==='enemy' && (p===EMPTY||p===currentPlayer))) { SoundEngine.playError(); return; } 
        GameState.effectData.src = {r, c, val: p}; effectData.src = {r, c, val: p}; // 同步
        GameState.activeEffect = 'move_drop'; activeEffect = 'move_drop'; // 同步
        b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity = '0.5'; showToast(t('moveDest', 'toast')); 
    } 
    else if (activeEffect === 'move_drop') { 
        if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } 
        const src = effectData.src; 
        GameState.board[src.r][src.c] = EMPTY; board[src.r][src.c] = EMPTY; // 同步
        const sc = getCell(src.r, src.c); if(sc){sc.innerHTML=''; sc.style.opacity='1';} 
        placePiece(r, c, src.val, true); 
        GameState.activeEffect = null; activeEffect = null; // 同步
        b.classList.remove('casting-move-dest'); 
        const winLine = checkWin(r, c, src.val);
        if (winLine) highlightWin(winLine, src.val); else showToast(t('moveDone', 'toast')); 
    } 
    else if (activeEffect === 'zone_pick') { 
        document.querySelectorAll('.territory-preview').forEach(el => el.classList.remove('territory-preview')); 
        GameState.territoryZones.push({r, c, owner: currentPlayer, turns: 6}); territoryZones = GameState.territoryZones; // 同步
        updateTerritoriesUI(); 
        GameState.activeEffect = null; activeEffect = null; // 同步
        b.classList.remove('casting-territory'); showToast(t('zoneDone', 'toast')); 
    } 
    else if (activeEffect === 'god_pick_1') { const p = board[r][c]; if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; } 
        GameState.effectData.godSrc1 = {r, c, val: p}; effectData.godSrc1 = {r, c, val: p}; // 同步
        GameState.activeEffect = 'god_drop_1'; activeEffect = 'god_drop_1'; // 同步
        b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity='0.5'; showToast(t('godDest1', 'toast')); 
    } 
    else if (activeEffect === 'god_drop_1') { if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } 
        const s1 = effectData.godSrc1; 
        GameState.board[s1.r][s1.c] = EMPTY; board[s1.r][s1.c] = EMPTY; // 同步
        const c1 = getCell(s1.r, s1.c); if(c1){c1.innerHTML=''; c1.style.opacity='1';} 
        placePiece(r, c, s1.val, true); 
        b.classList.remove('casting-move-dest'); const wl = checkWin(r, c, s1.val); if (wl) { highlightWin(wl, s1.val); return; } 
        GameState.activeEffect = 'god_pick_2'; activeEffect = 'god_pick_2'; // 同步
        b.classList.add('casting-move-src'); showToast(t('godPick2', 'toast')); 
    } 
    else if (activeEffect === 'god_pick_2') { const p = board[r][c]; if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; } 
        GameState.effectData.godSrc2 = {r, c, val: p}; effectData.godSrc2 = {r, c, val: p}; // 同步
        GameState.activeEffect = 'god_drop_2'; activeEffect = 'god_drop_2'; // 同步
        b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity='0.5'; showToast(t('godDest2', 'toast')); 
    } 
    else if (activeEffect === 'god_drop_2') { if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } 
        const s2 = effectData.godSrc2; 
        GameState.board[s2.r][s2.c] = EMPTY; board[s2.r][s2.c] = EMPTY; // 同步
        const c2 = getCell(s2.r, s2.c); if(c2){c2.innerHTML=''; c2.style.opacity='1';} 
        placePiece(r, c, s2.val, true); 
        GameState.activeEffect = null; activeEffect = null; // 同步
        b.classList.remove('casting-move-dest'); const wl = checkWin(r, c, s2.val); if (wl) highlightWin(wl, s2.val); else switchTurn(); 
    } 
    else if (activeEffect === 'swap_pick_1') { const p = board[r][c]; if (p!==currentPlayer) { SoundEngine.playError(); return; } 
        GameState.effectData.swapSrc = {r, c, val: p}; effectData.swapSrc = {r, c, val: p}; // 同步
        GameState.activeEffect = 'swap_pick_2'; activeEffect = 'swap_pick_2'; // 同步
        b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity = '0.5'; showToast(t('swapPickEnemy', 'toast')); 
    } 
    else if (activeEffect === 'swap_pick_2') { 
        const p = board[r][c]; const enemy = currentPlayer===MAPLE?SUN:MAPLE; if (p!==enemy) { SoundEngine.playError(); return; } 
        const s1 = effectData.swapSrc; const s2 = {r, c, val: p}; 
        const c1 = getCell(s1.r, s1.c); if(c1) c1.style.opacity = '1'; 
        GameState.board[s1.r][s1.c] = s2.val; board[s1.r][s1.c] = s2.val; // 同步
        GameState.board[s2.r][s2.c] = s1.val; board[s2.r][s2.c] = s1.val; // 同步
        if(c1) { c1.innerHTML=''; placePiece(s1.r, s1.c, s2.val, true); } 
        const c2 = getCell(s2.r, s2.c); 
        if(c2) { c2.innerHTML=''; placePiece(s2.r, c2.c, s1.val, true); }
        GameState.activeEffect = null; activeEffect = null; // 同步
        b.classList.remove('casting-move-dest'); 
        const wl1 = checkWin(s1.r, s1.c, s2.val); if(wl1) { highlightWin(wl1, s2.val); return; } 
        const wl2 = checkWin(s2.r, s2.c, s1.val); if(wl2) { highlightWin(wl2, s1.val); return; } 
        showToast(t('swapDone', 'toast')); 
    }
}

function highlightWin(line, winner) {
    GameState.gameActive = false;
    gameActive = false; // 同步
    
    // 胜负判断逻辑优化
    const isPvELoss = (gameMode === 'pve' && winner !== humanSide);

    if (isPvELoss) {
        // AI 获胜：只播放悲伤音乐，不放烟花，不玩 DJ
        SoundEngine.playDefeat();
        // 依然画出连珠线，保持基本视觉反馈
        if (typeof VisualFX !== 'undefined') {
            VisualFX.drawWinLine(line, winEffect);
        }
    } else {
        // 玩家获胜：触发选择的庆祝特效
        SoundEngine.playWinEffect(winEffect);
        if (typeof VisualFX !== 'undefined') {
            VisualFX.drawWinLine(line, winEffect);
            // 只有当不是默认特效时才调用 startCelebration
            if (winCelebration !== 'default') {
                VisualFX.startCelebration(winCelebration);
            }
        }
    }

    line.forEach(pos => {
        const cell = getCell(pos.r, pos.c);
        if (cell) cell.classList.add('win-highlight');
    });
    
    // 延遲顯示結算界面 - DJ 模式也是正常延遲，不綁架玩家操作
    const delay = 2500;
    setTimeout(() => handleMatchEnd(winner), delay);
}

function triggerExplosion() {
    GameState.gameActive = false;
    gameActive = false; // 同步
    
    SoundEngine.playExplosion();
    const overlay = document.getElementById('explosionOverlay');
    overlay.classList.add('explosion-anim');
    
    setTimeout(() => {
        overlay.classList.remove('explosion-anim');
        const loser = GameState.bombTarget;
        const winner = loser === MAPLE ? SUN : MAPLE;
        handleMatchEnd(winner);
    }, 2000);
}

function handleMatchEnd(winSide) {
    GameState.gameActive = false;
    gameActive = false; // 同步
    
    // 清理所有計時器
    if (GameState.bombInterval) clearInterval(GameState.bombInterval);
    if (GameState.gameTicker) clearInterval(GameState.gameTicker);
    if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
    
    // 如果是 DJ 模式正在运行，不要切回 BGM，让音乐继续 High
    // 但如果输了 (isPvELoss)，上面没有 startCelebration，所以这里切回 BGM 没问题
    // 如果赢了且是 DJ，startCelebration 会接管音乐，SoundEngine 内部逻辑会处理
    if (winCelebration !== 'dj' || (gameMode === 'pve' && winSide !== humanSide)) {
         SoundEngine.switchTrack(GameState.userMusicPref); 
    }
    
    const wt = document.getElementById('winnerText'); 
    let title = "";
    // 动态图标
    const winIcon = `<span style="display:inline-block;width:40px;height:40px;vertical-align:text-bottom">${getIcon(winSide)}</span>`;
    
    if (gameMode === 'pve' && winSide !== humanSide) { 
        // 失败标题
        title = `${winIcon} ${t('lose', 'end')}`; 
    } 
    else { 
        // 胜利标题
        title = `${winIcon} ${t('names')[winSide]} ${t('win', 'end')}`; 
    }
    wt.innerHTML = title; wt.style.color = winSide === MAPLE ? '#d32f2f' : '#fbc02d';
    const bc = document.getElementById('endGameButtons'); bc.innerHTML = '';
    const cBtn = (t,f,p) => { const b=document.createElement('button'); b.className=p?'btn primary':'btn secondary'; b.innerText=t; b.onclick=f; return b; };
    if (isBO3) { 
        const winner = playerSides[winSide]; winner === 'p1' ? p1Score++ : p2Score++; updateScoreBoard(); chooser = (winner === 'p1') ? 'p2' : 'p1'; 
        if ((winner==='p1'?p1Score:p2Score) >= 2) { 
            SoundEngine.playGrandWin(); title = `${t('grandWin', 'end')}<br><span style="font-size:0.6em;color:#666">${t('grandWinDesc', 'end').replace('{name}', winner.toUpperCase())}</span>`; 
            wt.innerHTML = title;
            bc.appendChild(cBtn(t('btnMenu', 'end'), goToMenu, true)); 
        } else { 
            bc.appendChild(cBtn(t('btnNext', 'end'), () => enterTurnSelection('pvp', null), true)); 
            bc.appendChild(cBtn(t('btnQuitMatch', 'end'), goToMenu, false)); 
        } 
    } else { 
        const restartAction = (gameMode==='pve')?()=>enterTurnSelection('pve',aiDifficulty):()=>enterTurnSelection('pvp-single',null); 
        bc.appendChild(cBtn(t('btnRestart', 'end'), restartAction, true)); 
        bc.appendChild(cBtn(t('btnMenu', 'end'), goToMenu, false)); 
    }
    document.getElementById('winnerModal').style.display = 'flex';
}

function undoMove() {
    if (GameState.isBO3) { 
        showToast(t('undoPvP', 'toast')); 
        return; 
    }
    
    if (GameState.historyStack.length === 0) return;
    
    if(GameState.selectedCell) { 
        const c = getCell(GameState.selectedCell.r, GameState.selectedCell.c); 
        if(c) c.classList.remove('selected-move'); 
        GameState.selectedCell = null;
        selectedCell = null; // 同步
    }
    
    document.querySelectorAll('.win-highlight').forEach(el => el.classList.remove('win-highlight'));
    
    const state = GameState.historyStack.pop();
    restoreState(state);
    
    // [Fix] 悔棋後檢查炸彈狀態，切換音樂
    if (GameState.bombTarget !== null && GameState.currentPlayer !== GameState.bombTarget) { 
        SoundEngine.switchTrack(GameState.userMusicPref); 
    }
    
    if (GameState.gameMode === 'pve') { 
        if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
        if (GameState.historyStack.length > 0) { 
            const state2 = GameState.historyStack.pop(); 
            restoreState(state2); 
        } 
    }
    
    GameState.gameActive = true;
    gameActive = true; // 同步
    
    document.getElementById('winnerModal').style.display='none'; 
    showToast(t('undoDone', 'toast'));
}

// 辅助函数
function getRandomMove() { const e=[]; for(let r=0; r<BOARD_SIZE; r++) { for(let c=0; c<BOARD_SIZE; c++) { if(board[r][c]===EMPTY && !isZoneRestricted(r,c,currentPlayer)) { e.push({r,c}); } } } return e.length ? e[Math.floor(Math.random()*e.length)] : null; }
function getScoreMove(adv, mas=false) { let max = -Infinity; let ms = []; const ai = currentPlayer; const hum = currentPlayer === MAPLE ? SUN : MAPLE; for(let r=0; r<BOARD_SIZE; r++) { for(let c=0; c<BOARD_SIZE; c++) { if(board[r][c]!==EMPTY || isZoneRestricted(r,c,ai) || !hasNeighbor(r,c)) continue; let a = evalPt(r, c, ai); let d = evalPt(r, c, hum); let s = 0; if (!adv) { s = a + d; } else { s = a * (mas ? 1.2 : 1) + d; if(a >= 1e5) s = Infinity; else if(d >= 1e5) s = 9e7; else if(a >= 1e4) s += 5e4; else if(d >= 1e4) s += 4e4; } s += Math.random() * 10; if (s > max) { max = s; ms = [{r, c}]; } else if (Math.abs(s - max) < 5) { ms.push({r, c}); } } } return ms.length ? ms[Math.floor(Math.random()*ms.length)] : getRandomMove(); }
function evalPt(r, c, t) { let s = 0; const directions = [[1,0], [0,1], [1,1], [1,-1]]; directions.forEach(d => { s += getLn(r, c, d[0], d[1], t); }); return s; }
function getLn(r, c, dr, dc, t) { let ct = 1; let es = 0; let i = 1; while(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === t) { ct++; i++; } if(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === EMPTY) es++; i = 1; while(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === t) { ct++; i++; } if(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === EMPTY) es++; const winLen = shortBattleTurns > 0 ? 4 : 5; if(ct >= winLen) return 1e5; if(ct === winLen - 1) return es === 2 ? 1e4 : (es === 1 ? 1e3 : 0); if(ct === winLen - 2) return es === 2 ? 1e3 : (es === 1 ? 100 : 0); if(ct === winLen - 3) return es === 2 ? 100 : 0; return 0; }
function hasNeighbor(r, c) { for(let i=r-2; i<=r+2; i++) { for(let j=c-2; j<=c+2; j++) { if(isValid(i,j) && board[i][j]!==EMPTY) return true; } } return false; }
function isValid(r, c) { return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE; }
function isZoneRestricted(r, c, p) { for(let z of territoryZones) { if (Math.abs(z.r - r) <= 1 && Math.abs(z.c - c) <= 1 && z.owner !== p) { return true; } } return false; }

function updateTerritoriesUI() { 
    document.querySelectorAll('.territory-zone').forEach(el => el.classList.remove('territory-zone')); 
    territoryZones.forEach(z => { 
        for(let i=z.r-1; i<=z.r+1; i++) { 
            for(let j=z.c-1; j<=z.c+1; j++) { 
                const c = getCell(i, j); 
                if(c) c.classList.add('territory-zone'); 
            } 
        } 
    }); 
}

function checkWin(r, c, p) { const d = [[0,1], [1,0], [1,1], [1,-1]]; const limit = shortBattleTurns > 0 ? 4 : 5; for(let k of d) { let ct = 1; let line = [{r,c}]; let i = r + k[0], j = c + k[1]; while(isValid(i,j) && board[i][j] === p) { line.push({r:i, c:j}); i += k[0]; j += k[1]; ct++; } i = r - k[0]; j = c - k[1]; while(isValid(i,j) && board[i][j] === p) { line.push({r:i, c:j}); i -= k[0]; j -= k[1]; ct++; } if(ct >= limit) return line; } return null; }
function startBombTimer() { 
    if(GameState.bombInterval) clearInterval(GameState.bombInterval); 
    GameState.bombInterval = setInterval(() => { 
        if(!GameState.gameActive) return; 
        if(GameState.currentPlayer !== GameState.bombOwner) { 
            GameState.bombTime--; bombTime = GameState.bombTime; // 同步
            const m = Math.floor(GameState.bombTime/60).toString().padStart(2,'0'); 
            const s = (GameState.bombTime%60).toString().padStart(2,'0'); 
            document.getElementById('bombTimer').innerText=`${m}:${s}`; 
            if(GameState.bombTime <= 0) handleMatchEnd(GameState.bombOwner); 
        } 
    }, 1000); 
    bombInterval = GameState.bombInterval; // 同步
}

function updateDynamicUI() {
    // 使用 GameState 確保數據一致性
    const turnTextEl = document.getElementById('turnText');
    const newTurnText = t('names')[GameState.currentPlayer === MAPLE ? 1 : 2];
    if (turnTextEl.innerText !== newTurnText) turnTextEl.innerText = newTurnText;
    
    const turnIconEl = document.getElementById('turnIcon');
    turnIconEl.innerHTML = getIcon(GameState.currentPlayer);
    
    const statusBar = document.getElementById('statusBar');
    const newClass = 'status-pill ' + (GameState.currentPlayer === MAPLE ? 'turn-maple' : 'turn-sun');
    if (statusBar.className !== newClass) statusBar.className = newClass;
    
    const t1 = document.getElementById('timer1');
    const t2 = document.getElementById('timer2');
    
    const getTimerHTML = (player, time) => {
        let base = `<span class="inline-icon" style="width:20px;height:20px;margin-right:4px">${getIcon(player)}</span> ${formatTime(time)}`;
        if (GameState.bombTarget === player && typeof SKILL_ICONS !== 'undefined') {
            const animClass = time < 30 ? 'bomb-status-critical' : 'bomb-status-normal';
            base += `<span class="bomb-attached-icon ${animClass}">${SKILL_ICONS.bomb}</span>`;
        }
        return base;
    };

    t1.innerHTML = getTimerHTML(MAPLE, GameState.timeRemaining[MAPLE]);
    t2.innerHTML = getTimerHTML(SUN, GameState.timeRemaining[SUN]);
    
    const updateTimerVisual = (player, timerEl, time) => {
        timerEl.className = `timer-pill ${GameState.currentPlayer === player ? 'active' : ''}`;
        if (GameState.bombTarget === player) {
            if (time < 30) {
                timerEl.classList.add('timer-critical');
            } else {
                timerEl.classList.add('timer-bomb');
            }
        } else if (time < 30) {
            timerEl.classList.add('timer-critical-normal');
        }
    };
    updateTimerVisual(MAPLE, t1, GameState.timeRemaining[MAPLE]);
    updateTimerVisual(SUN, t2, GameState.timeRemaining[SUN]);
    
    const cc = document.getElementById('chaosCounter');
    const sbc = document.getElementById('shortBattleCounter');
    
    const chaosIcon = (typeof SKILL_ICONS !== 'undefined') ? SKILL_ICONS.chaos : '';
    const sbIcon = (typeof SKILL_ICONS !== 'undefined') ? SKILL_ICONS.short_battle : '';

    if (GameState.chaosDebuff[GameState.currentPlayer] > 0) {
        cc.style.display = 'flex'; 
        cc.innerHTML = `<span class="inline-icon">${chaosIcon}</span> ${t('chaosLabel', 'toast')} ${GameState.chaosDebuff[GameState.currentPlayer]}`;
    } else {
        cc.style.display = 'none';
    }
    
    if (GameState.shortBattleTurns > 0) {
        sbc.style.display = 'flex';
        sbc.innerHTML = `<span class="inline-icon">${sbIcon}</span> ${t('shortBattleLabel', 'toast')} ${GameState.shortBattleTurns}`;
    } else {
        sbc.style.display = 'none';
    }

    if (GameState.territoryZones.length > 0) {
        let zc = document.getElementById('zoneCounter');
        if (!zc) {
            zc = document.createElement('div');
            zc.id = 'zoneCounter';
            zc.className = 'counter-badge zone';
            document.querySelector('.board-wrapper').appendChild(zc);
        }
        zc.style.display = 'flex';
        const zoneIcon = (typeof SKILL_ICONS !== 'undefined') ? SKILL_ICONS.zone : '';
        const maxTurns = Math.max(...GameState.territoryZones.map(z => z.turns));
        const label = t('zoneLabel', 'toast') || 'Zone:';
        zc.innerHTML = `<span class="inline-icon">${zoneIcon}</span> ${label} ${maxTurns}`;
    } else {
        const zc = document.getElementById('zoneCounter');
        if (zc) zc.style.display = 'none';
    }
    
    const ms = playerSkills[currentPlayer];
    const u = skillUsed[currentPlayer];
    const btn = document.getElementById('skillBtn');
    
    if (!ms) {
        btn.disabled = true;
        btn.innerHTML = `<span>---</span><small>---</small>`;
        return;
    }
    
    const so = t(ms, 'skills');
    const iconSvg = (typeof SKILL_ICONS !== 'undefined') ? SKILL_ICONS[ms] : '';
    
    let myC = 0, oppC = 0;
    board.forEach(r => r.forEach(c => {
        if (c === currentPlayer) myC++;
        else if (c !== 0 && c !== -1) oppC++;
    }));
    
    let viable = true;
    if (ms === 'move_self' && myC === 0) viable = false;
    else if (ms === 'move_enemy' && oppC === 0) viable = false;
    else if ((ms === 'god_hand' || ms === 'voodoo') && (myC + oppC) === 0) viable = false;
    else if (ms === 'swap' && (myC === 0 || oppC === 0)) viable = false;
    
    let btnContent = '';
    if (u) {
        btn.disabled = true;
        btnContent = `<span>${so.name}</span><small>${t('skillUsed')}</small>`;
    } else if (!viable) {
        btn.disabled = true;
        btnContent = `<span>${so.name}</span><small>${t('skillNoTarget')}</small>`;
    } else {
        btn.disabled = false;
        btnContent = `<div class="skill-icon-display">${iconSvg}</div><span>${so.name}</span>`;
    }
    
    if (btn.innerHTML !== btnContent) btn.innerHTML = btnContent;
}

function formatTime(s) { if(s<0) s=0; const m=Math.floor(s/60).toString().padStart(2,'0'); const sec=(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function showToast(m){ const t=document.getElementById('toast'); t.innerText=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,3000); }


// ================= 頁面加載初始化 =================
// 在頁面加載完成後立即啟動背景引擎和幀率控制器
window.addEventListener('DOMContentLoaded', function() {
    // 初始化背景引擎
    if (typeof BackgroundEngine !== 'undefined') {
        BackgroundEngine.init();
    }
    
    // 啟動統一的幀率控制器（60fps 默認）
    if (typeof FrameRateController !== 'undefined') {
        FrameRateController.init();
    }
    
    // 初始化背景引擎（必須在 FrameRateController 之後）
    if (typeof BackgroundEngine !== 'undefined') {
        BackgroundEngine.init();
    }
    
    // 初始化特效引擎
    if (typeof VisualFX !== 'undefined') {
        VisualFX.init();
    }
});
