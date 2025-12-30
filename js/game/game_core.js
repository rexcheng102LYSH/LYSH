// ================= 核心游戏逻辑 (Core Game Logic) =================
// [Alpha 0.7.8.3]
// - DJ 底鼓提示灯开关系统：可在帧率选择中开启/关闭
// - 无限制按钮改造：改为底鼓提示灯开关，不改变实际帧数
//
// [Alpha 0.7.8.2]
// - DJ 胜利特效完善：修复判定逻辑、MISS/PERFECT 显示位置优化
//
// [Alpha 0.7.8.1 State Management Separation]
// - 将 GameState 分离到 gamestate.js，减轻 game.js 负担
// - 专注于游戏逻辑：棋盘渲染、回合管理、技能系统、胜负判定
//
// [Alpha 0.7.8.0 State Management Refactoring]
// - 引入集中式 GameState 对象，统一管理所有游戏状态
// - 提供 resetGame()、createSnapshot()、restoreSnapshot() 等状态管理方法
// - 完全向后兼容，保留旧的全局变量引用
// - 为未来的存档/读档、回放、统计等功能打下基础
//
// [Alpha 0.7.7.9 Final Release]
// - 整合 DJ 节奏游戏：在 updateWinCelebrationUI 中恢复 DJ 选项，并在 highlightWin 中正确触发
// - 优化胜负逻辑：PvE 败北时播放 playDefeat() 并静默特效；胜利时根据选项触发 VisualFX
// - 强化状态管理：enterTurnSelection 和 initGame 强制清除特效，防止残留


// ================= 帧率控制系统 =================
// 统一的主循环管理器，确保稳定的帧率
const FrameRateController = {
    targetFPS: 60,  // 锁定 60fps
    frameTime: 1000 / 60,  // 每帧时间 (ms)
    lastFrameTime: 0,
    animationId: null,
    
    // 更新帧率限制（暂时禁用无限制模式）
    setFPSLimit: function(limit) {
        // 先停止当前动画循环
        const wasRunning = this.animationId !== null;
        if (wasRunning) {
            this.stop();
        }
        
        // 强制锁定 60fps
        this.targetFPS = 60;
        this.frameTime = 1000 / 60;
        
        // 重置时间戳，避免 deltaTime 异常
        this.lastFrameTime = performance.now();
        
        // 如果之前在运行，重新启动
        if (wasRunning) {
            this.start();
        }
    },
    
    init: function() {
        this.lastFrameTime = performance.now();
        this.setFPSLimit(GameState.fpsLimit);  // 根据设置初始化
        this.start();
    },
    
    start: function() {
        if (this.animationId) return;
        const loop = (now) => {
            const deltaTime = now - this.lastFrameTime;
            
            // 只在达到目标帧时间时执行（无限制模式下 frameTime = 0，总是执行）
            if (deltaTime >= this.frameTime) {
                // 更新时间戳（无限制模式下直接使用当前时间）
                if (this.frameTime > 0) {
                    this.lastFrameTime = now - (deltaTime % this.frameTime);
                } else {
                    this.lastFrameTime = now;
                }
                
                // [CRITICAL FIX] 执行所有引擎的更新，添加异常捕获防止渲染循环中断
                try {
                    if (typeof BackgroundEngine !== 'undefined' && BackgroundEngine.loop) {
                        BackgroundEngine.loop();
                    }
                } catch (error) {
                    console.error('[FrameRateController] BackgroundEngine.loop 错误:', error);
                    // 不中断循环，继续执行
                }
                
                try {
                    if (typeof VisualFX !== 'undefined' && VisualFX.renderFrame) {
                        VisualFX.renderFrame(now);
                    }
                } catch (error) {
                    console.error('[FrameRateController] VisualFX.renderFrame 错误:', error);
                    // 不中断循环，继续执行
                }
            }
            
            // [CRITICAL FIX] 确保无论如何都会调度下一帧
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

function goToMenu() { 
    GameState.gameActive = false;
    gameActive = false; // 同步
    
    // 清理所有計時器
    if (GameState.gameTicker) clearInterval(GameState.gameTicker);
    if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
    if (GameState.bombInterval) clearInterval(GameState.bombInterval);
    
    // [Fix Alpha 0.7.8.4] 完整状态重置，解决系统性 bug
    
    // 1. 重新启用所有被禁用的按钮（修复技能按钮失效）
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
        skillBtn.disabled = false;
        skillBtn.style.pointerEvents = 'auto';
    }
    const undoBtn = document.querySelector('[onclick="undoMove()"]');
    if (undoBtn) {
        undoBtn.disabled = false;
        undoBtn.style.pointerEvents = 'auto';
    }
    
    // 2. [Fix Alpha 0.7.8.4] 彻底停止 DJ 游戏和音乐
    if (SoundEngine.djGame.active) {
        SoundEngine.stopDJGame();
        // 强制切换到用户选择的音乐
        SoundEngine.switchTrack(GameState.userMusicPref);
    }
    // 如果当前是炸弹音乐，也要恢复用户选择的音乐
    else if (SoundEngine.currentTrack === 'bomb') {
        SoundEngine.switchTrack(GameState.userMusicPref);
    }
    
    // 3. 完整重置 GameState 向后兼容变量（修复悔棋失效）
    GameState.historyStack = [];
    GameState.isBO3 = false;
    GameState.activeEffect = null;
    GameState.selectedCell = null;
    GameState.bombTarget = null;
    
    // 同步所有向后兼容变量
    historyStack = GameState.historyStack;
    isBO3 = GameState.isBO3;
    activeEffect = GameState.activeEffect;
    selectedCell = GameState.selectedCell;
    bombTarget = GameState.bombTarget;
    
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
    
    // [Fix Alpha 0.7.8.4] 重新启用按钮，修复【再来一局】bug
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
        skillBtn.disabled = false;
        skillBtn.style.pointerEvents = 'auto';
    }
    const undoBtn = document.querySelector('[onclick="undoMove()"]');
    if (undoBtn) {
        undoBtn.disabled = false;
        undoBtn.style.pointerEvents = 'auto';
    }
    
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
function handleTurnChoice(c) {
    SoundEngine.playPlace();
    if (gameMode === 'pve') {
        GameState.humanSide = (c === 1) ? MAPLE : SUN; // 修复：同步 GameState，避免 PVE 永远先手
        humanSide = GameState.humanSide; // 同步旧全局变量
        enterDraftPhase();
    } else {
        if (c === 1) { playerSides[MAPLE] = chooser; playerSides[SUN] = (chooser === 'p1' ? 'p2' : 'p1'); }
        else { playerSides[SUN] = chooser; playerSides[MAPLE] = (chooser === 'p1' ? 'p2' : 'p1'); }
        enterDraftPhase();
    }
}

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
    activeEffect = GameState.activeEffect;
    effectData = GameState.effectData;
    isDoubleMoveActive = GameState.isDoubleMoveActive;
    bombActive = GameState.bombActive;
    bombOwner = GameState.bombOwner;
    bombTime = GameState.bombTime;
    selectedCell = GameState.selectedCell;
    
    // [Alpha 0.7.9.0] 同步落子锁定状态
    lastMove = GameState.lastMove;
    moveCount = GameState.moveCount;
    
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
    
    // [Alpha 0.7.9.0] 悔棋后更新落子锁定标记
    if (typeof updateLastMoveMarker === 'function') {
        updateLastMoveMarker();
    }
}


function handleCellClick(r, c, bypassConfirm = false) {
    if (!gameActive) return;
    
    // [Alpha 0.7.9.0] 修复 PvE 模式下玩家可以在 AI 回合落子的 bug
    // 注意：bypassConfirm = true 表示是 AI 调用，不需要检查
    if (!bypassConfirm && GameState.gameMode === 'pve' && GameState.currentPlayer !== GameState.humanSide) {
        // AI 回合，玩家无法操作
        SoundEngine.playError();
        showToast(t('errAITurn', 'toast'));
        return;
    }
    
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
        const origR = r;
        const origC = c;
        let candidates = []; 
        for (let i = r-1; i <= r+1; i++) for (let j = c-1; j <= c+1; j++) if (isValid(i, j) && board[i][j] === EMPTY && !isZoneRestricted(i, j, currentPlayer)) candidates.push({r: i, c: j}); 
        if (candidates.length > 0) { 
            const pick = candidates[Math.floor(Math.random() * candidates.length)]; 
            r = pick.r; c = pick.c;
            wasChaosed = (pick.r !== origR || pick.c !== origC);
        } 
        if (wasChaosed) {
            SoundEngine.playChaos();
            showToast(t('chaosTrigger', 'toast'));
        } else {
            if (typeof SoundEngine.playChaosLucky === 'function') SoundEngine.playChaosLucky();
            else SoundEngine.playChaos();
            showToast(t('chaosLucky', 'toast'));
        }
        GameState.chaosDebuff[currentPlayer]--;
        chaosDebuff = GameState.chaosDebuff; // 同步
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
    
    // [Alpha 0.7.9.0] 更新落子锁定标记
    if (typeof updateLastMoveMarker === 'function') {
        updateLastMoveMarker();
    }
    
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
                // 【新增】如果是 DJ 模式，立即播放 bgm5.mp3
                if (winCelebration === 'dj' && typeof SoundEngine !== 'undefined' && SoundEngine.playVictoryBGM) {
                    SoundEngine.playVictoryBGM();
                }
                // 【新增】如果是流金模式，立即播放 bgm6.mp3
                if (winCelebration === 'golden' && typeof SoundEngine !== 'undefined' && SoundEngine.playGoldenBGM) {
                    SoundEngine.playGoldenBGM();
                }
                if (winCelebration === 'fireworks' && typeof SoundEngine !== 'undefined' && SoundEngine.playFireworksBGM) {
                    SoundEngine.playFireworksBGM();
                }
                VisualFX.startCelebration(winCelebration);
            }
        }
    }

    line.forEach(pos => {
        const cell = getCell(pos.r, pos.c);
        if (cell) cell.classList.add('win-highlight');
    });
    
    // 延遲顯示結算界面，等待連珠特效播放完畢
    const delay = 1200;
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
    
    // 【修復】禁用技能按鈕和悔棋按鈕
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
        skillBtn.disabled = true;
        skillBtn.style.pointerEvents = 'none';
    }
    const undoBtn = document.querySelector('[onclick="undoMove()"]');
    if (undoBtn) {
        undoBtn.disabled = true;
        undoBtn.style.pointerEvents = 'none';
    }
    
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

function isValid(r, c) { return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE; }
function isZoneRestricted(r, c, p) { for(let z of territoryZones) { if (Math.abs(z.r - r) <= 1 && Math.abs(z.c - c) <= 1 && z.owner !== p) { return true; } } return false; }


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
    
    // 初始化特效引擎
    if (typeof VisualFX !== 'undefined') {
        VisualFX.init();
    }
});

if (window.GameHost && typeof window.GameHost.register === 'function') {
    window.GameHost.register('core', { init: function() {} });
}

