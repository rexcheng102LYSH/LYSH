// ================= 全局变量 =================/
const BOARD_SIZE = 15, EMPTY = 0, MAPLE = 1, SUN = 2, CORRODED = -1;
const ICONS = { [MAPLE]: '🍁', [SUN]: '☀️' };
const SKILL_IDS = ['double','voodoo','move_self','move_enemy','zone','bomb','god_hand','chaos','short_battle','swap'];

// SVG 图标库
const SKILL_ICONS = {
    double: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13l-5-5L15 2l5 5-10 6z"/><path d="M14 17l-5-5L19 6l5 5-10 6z"/><path d="M4 22l6-6"/></svg>',
    voodoo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 13s1.5 1.5 3 0 3 0"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>',
    move_self: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="3"/><path d="M8 12h11"/><path d="M16 9l3 3-3 3"/></svg>',
    move_enemy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M12 12l9 9"/><path d="M16 16l5 5"/></svg>',
    zone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>',
    bomb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="13" r="9"/><path d="M11 4v-1"/><path d="M11 4h2"/><path d="M22 2l-3 3"/><path d="M14.5 9.5L19 5"/></svg>',
    god_hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
    chaos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="12" cy="12" r="1"/></svg>',
    short_battle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><line x1="8" y1="8" x2="4" y2="4"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v-3a3 3 0 0 1 3-3h13m-3-3l3 3-3 3"/><path d="M20 12v3a3 3 0 0 1-3 3H4m3 3l-3-3 3-3"/></svg>'
};

let board = [], currentPlayer = MAPLE, gameMode = 'pvp', aiDifficulty = 'medium', gameActive = false;
let isBO3 = false, p1Score = 0, p2Score = 0, playerSides = { [MAPLE]: 'p1', [SUN]: 'p2' }, chooser = 'p1', humanSide = MAPLE;
let playerSkills = { [MAPLE]: null, [SUN]: null }, skillUsed = { [MAPLE]: false, [SUN]: false };
let activeEffect = null, effectData = {}, territoryZones = [], isDoubleMoveActive = false;
let chaosDebuff = { [MAPLE]: 0, [SUN]: 0 }, shortBattleTurns = 0;
let bombActive = false, bombOwner = null, bombTime = 150, bombInterval = null;
let timeRemaining = { [MAPLE]: 240, [SUN]: 240 }; 
let gameTicker = null, aiTimer = null; 
let historyStack = [];
let selectedCell = null;
let bombTarget = null; 
let userMusicPref = 'origin';
let currentSkin = 'nature';
let currentSeason = 'spring';

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
}

function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    // 音乐
    document.getElementById('sliderMusic').value = SoundEngine.musicVolume * 100;
    document.getElementById('valMusic').innerText = Math.round(SoundEngine.musicVolume * 100) + '%';
    // 音效
    document.getElementById('sliderSfx').value = SoundEngine.sfxVolume * 100;
    document.getElementById('valSfx').innerText = Math.round(SoundEngine.sfxVolume * 100) + '%';
    // 环境音效 (新增)
    document.getElementById('sliderAmbient').value = SoundEngine.ambientVolume * 100;
    document.getElementById('valAmbient').innerText = Math.round(SoundEngine.ambientVolume * 100) + '%';
    
    updateTrackUI();
    updateSeasonUI(); 
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
}
function closeSkinMenu() { document.getElementById('skinModal').style.display = 'none'; }
function changeSkin(skin) {
    SoundEngine.playPlace();
    currentSkin = skin;
    updateSkinUI();
    if (gameActive) restoreState(historyStack.length > 0 ? historyStack[historyStack.length-1] : {board, currentPlayer, skillUsed, territoryZones, chaosDebuff, shortBattleTurns, timeRemaining, bombTarget});
}
function updateSkinUI() {
    document.querySelectorAll('.skin-option').forEach(el => el.classList.remove('active'));
    if (currentSkin === 'nature') document.getElementById('skinNature').classList.add('active');
    else document.getElementById('skinClassic').classList.add('active');
}

// 核心音量控制修改
function updateVolume(type, val) {
    const v = val / 100;
    if (type === 'music') { 
        SoundEngine.setMusicVolume(v); 
        document.getElementById('valMusic').innerText = val + '%'; 
    } else if (type === 'sfx') { 
        SoundEngine.sfxVolume = v; 
        document.getElementById('valSfx').innerText = val + '%'; 
    } else if (type === 'ambient') { // 新增环境音量控制
        SoundEngine.setAmbientVolume(v);
        document.getElementById('valAmbient').innerText = val + '%';
    }
}

function changeTrack(track) { 
    if (SoundEngine.currentTrack === 'bomb') { userMusicPref = track; updateTrackUI(); return; } 
    userMusicPref = track; 
    SoundEngine.switchTrack(track); 
    updateTrackUI(); 
}
function updateTrackUI() {
    document.querySelectorAll('.music-opt').forEach(el => el.classList.remove('active'));
    if (userMusicPref === 'origin') document.getElementById('trackOrigin').classList.add('active');
    else if (userMusicPref === 'overture') document.getElementById('trackOverture').classList.add('active');
    else if (userMusicPref === 'bgm2') document.getElementById('trackBgm2').classList.add('active');
}

// === 安全的季节切换逻辑 ===
function changeSeason(season) {
    SoundEngine.playPlace();
    currentSeason = season;
    
    if (window.BackgroundEngine && typeof window.BackgroundEngine.switchSeason === 'function') {
        window.BackgroundEngine.switchSeason(season);
    } else {
        console.warn("BackgroundEngine or switchSeason missing!");
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

// --- 导航与流程 ---
function goToMenu() { 
    gameActive=false; 
    clearInterval(gameTicker); clearTimeout(aiTimer); 
    document.getElementById('winnerModal').style.display='none'; 
    showScreen('main'); 
}
function confirmExit() { if(confirm(t('confirmExit'))) goToMenu(); }
function showDifficultyScreen() { SoundEngine.playPlace(); showScreen('diff'); }
function startPvPFlow(subMode) { SoundEngine.playPlace(); isBO3 = (subMode === 'bo3'); p1Score = 0; p2Score = 0; chooser = 'p1'; updateScoreBoard(); enterTurnSelection('pvp', null); }
function enterTurnSelection(mode, diff) { SoundEngine.playPlace(); document.getElementById('winnerModal').style.display = 'none'; showScreen('turn'); gameMode = mode; aiDifficulty = diff; if (gameMode === 'pve') { isBO3 = false; } const tEl = document.getElementById('turnSelectTitle'), dEl = document.getElementById('turnSelectDesc'); updateStaticText(); if (isBO3 && (p1Score > 0 || p2Score > 0)) { tEl.innerText = t('titlePickSide'); dEl.innerText = `${t('descPickSideLoser')} (${chooser==='p1'?"P1":"P2"})`; } else { tEl.innerText = t('titlePickSide'); dEl.innerText = t('descPickSide'); } }
function goBackFromTurn() { SoundEngine.playPlace(); if (gameMode === 'pve') { showScreen('diff'); } else { goToMenu(); } }
function handleTurnChoice(c) { SoundEngine.playPlace(); if (gameMode === 'pve') { humanSide = (c === 1) ? MAPLE : SUN; enterDraftPhase(); } else { if (c === 1) { playerSides[MAPLE] = chooser; playerSides[SUN] = (chooser === 'p1' ? 'p2' : 'p1'); } else { playerSides[SUN] = chooser; playerSides[MAPLE] = (chooser === 'p1' ? 'p2' : 'p1'); } enterDraftPhase(); } }
function enterDraftPhase() { document.getElementById('winnerModal').style.display = 'none'; showScreen('draft'); if (gameMode === 'pve') draftTurn = SUN; else draftTurn = SUN; playerSkills = { [MAPLE]: null, [SUN]: null }; renderSkillGrid(); updateDraftTitle(); SoundEngine.init(); }
let draftTurn = SUN;

// 渲染带图标的技能网格
function renderSkillGrid() { 
    const g = document.getElementById('skillGrid'); 
    g.innerHTML = ''; 
    SKILL_IDS.forEach(sid => { 
        const sd = t(sid, 'skills'); 
        const iconSvg = SKILL_ICONS[sid] || ''; 
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

function updateDraftTitle() { const tEl = document.getElementById('draftTitle'); let pickerName = t('names')[draftTurn]; if (gameMode === 'pve') { const isAITurn = (humanSide === MAPLE && draftTurn === SUN) || (humanSide === SUN && draftTurn === MAPLE); if (isAITurn) pickerName += " (AI)"; else pickerName += " (You)"; if (isAITurn) setTimeout(() => { const avail = SKILL_IDS.filter(s => !Object.values(playerSkills).includes(s)); pickSkill(avail[Math.floor(Math.random()*avail.length)]); }, 800); } tEl.innerHTML = t('draftTitle').replace('{icon}', ICONS[draftTurn]).replace('{name}', pickerName); tEl.style.color = draftTurn === MAPLE ? '#d32f2f' : '#f9a825'; }
function pickSkill(id) { SoundEngine.playPlace(); playerSkills[draftTurn] = id; if (draftTurn === SUN) { draftTurn = MAPLE; renderSkillGrid(); updateDraftTitle(); } else initGame(); }

// --- 游戏初始化 ---
function initGame() {
    showScreen('game'); 
    board = Array(BOARD_SIZE).fill(0).map(()=>Array(BOARD_SIZE).fill(EMPTY)); 
    currentPlayer = MAPLE; gameActive = true; 
    historyStack = []; skillUsed = {[MAPLE]:false, [SUN]:false}; 
    activeEffect = null; territoryZones = []; isDoubleMoveActive = false; 
    chaosDebuff = {[MAPLE]:0, [SUN]:0}; shortBattleTurns = 0;
    timeRemaining = { [MAPLE]: 240, [SUN]: 240 }; 
    selectedCell = null; bombTarget = null; 
    
    SoundEngine.setCritical(false);
    SoundEngine.switchTrack(userMusicPref);

    clearInterval(gameTicker); clearTimeout(aiTimer); 
    updateStaticText(); updateDynamicUI(); renderBoard();

    gameTicker = setInterval(() => {
        if(!gameActive) return;
        timeRemaining[currentPlayer]--;
        
        if (bombTarget !== null && currentPlayer === bombTarget) {
            if (timeRemaining[currentPlayer] < 30) SoundEngine.setCritical(true);
            else SoundEngine.setCritical(false);
        } else {
            SoundEngine.setCritical(false);
        }

        updateDynamicUI(); 
        if(timeRemaining[currentPlayer] <= 0) { 
            if (bombTarget === currentPlayer) triggerExplosion();
            else { showToast(t('timeOut', 'toast')); handleMatchEnd(currentPlayer === MAPLE ? SUN : MAPLE); }
        }
    }, 1000);

    document.getElementById('winnerModal').style.display = 'none'; 
    const dt = document.getElementById('diffTag'), sb = document.getElementById('scoreBoard');
    if(gameMode === 'pve') { dt.style.display = 'inline-block'; sb.style.display = 'none'; dt.innerText = t('pveTag') + t('diff' + aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)); } else { dt.style.display = 'none'; sb.style.display = isBO3 ? 'block' : 'none'; updateScoreBoard(); }
    
    if (gameMode === 'pve' && humanSide === SUN) { aiTimer = setTimeout(aiMove, 800); }
}

function updateScoreBoard() { document.getElementById('scoreBoard').innerText = `P1 (${p1Score}) : (${p2Score}) P2`; }

// --- 渲染棋盘 (DOM) ---
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
}
function getCell(r, c) { return document.getElementById(`c-${r}-${c}`); }

// --- 状态管理 ---
function saveState() { historyStack.push({ board: JSON.parse(JSON.stringify(board)), currentPlayer: currentPlayer, skillUsed: JSON.parse(JSON.stringify(skillUsed)), territoryZones: JSON.parse(JSON.stringify(territoryZones)), chaosDebuff: JSON.parse(JSON.stringify(chaosDebuff)), shortBattleTurns: shortBattleTurns, timeRemaining: JSON.parse(JSON.stringify(timeRemaining)), bombTarget: bombTarget }); }
function restoreState(state) { 
    board = state.board; currentPlayer = state.currentPlayer; skillUsed = state.skillUsed; territoryZones = state.territoryZones; chaosDebuff = state.chaosDebuff; shortBattleTurns = state.shortBattleTurns; timeRemaining = state.timeRemaining; bombTarget = state.bombTarget; 
    SoundEngine.setCritical(false);
    
    document.querySelectorAll('.win-highlight').forEach(el => el.classList.remove('win-highlight'));

    for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) { 
        const cell = getCell(r,c); 
        cell.className = 'cell'; 
        cell.innerHTML = ''; 
        if(cell.getAttribute('data-star')==='true') { 
            const d=document.createElement('div'); d.className='dot'; cell.appendChild(d); 
        } 
        const val = board[r][c]; 
        
        if (val === MAPLE || val === SUN) { 
            if (currentSkin === 'classic') {
                const pc = document.createElement('div'); 
                pc.className = `piece skin-classic ${val===MAPLE?'p1':'p2'}`; 
                cell.appendChild(pc);
            } else {
                const pc = document.createElement('span'); 
                pc.className = 'piece skin-nature'; 
                pc.innerText = ICONS[val]; 
                cell.appendChild(pc); 
            }
        } else if (val === CORRODED) { 
            cell.className = 'cell corroded';
        } 
    } 
    updateTerritoriesUI(); 
    updateDynamicUI(); 
}

function placePiece(r, c, p, m=false, chaos=false) { 
    if(!m) board[r][c]=p; else board[r][c]=p; 
    const cell = getCell(r,c); 
    if(cell) { 
        if (currentSkin === 'classic') {
            const pc = document.createElement('div'); 
            pc.className = `piece skin-classic ${p===MAPLE?'p1':'p2'}`; 
            cell.appendChild(pc);
        } else {
            const pc = document.createElement('span'); 
            pc.className = 'piece skin-nature'; 
            pc.innerText = ICONS[p]; 
            cell.appendChild(pc); 
        }
        SoundEngine.playPlace(); 
    } 
}

function handleCellClick(r, c, bypassConfirm = false) {
    if (!gameActive) return;
    if (activeEffect) { handleSkillInteraction(r, c); return; }
    if (board[r][c] !== EMPTY) { SoundEngine.playError(); return; }
    if (isZoneRestricted(r, c, currentPlayer)) { showToast(t('errZone', 'toast')); SoundEngine.playError(); return; }
    if (!bypassConfirm && !isDoubleMoveActive) { if (!selectedCell || selectedCell.r !== r || selectedCell.c !== c) { if(selectedCell) { const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); } selectedCell = {r, c}; const newCell = getCell(r, c); if(newCell) newCell.classList.add('selected-move'); SoundEngine.playPlace(); return; } else { const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); selectedCell = null; } }
    if (!isDoubleMoveActive) saveState();
    let wasChaosed = false;
    if (chaosDebuff[currentPlayer] > 0) { let candidates = []; for (let i = r-1; i <= r+1; i++) for (let j = c-1; j <= c+1; j++) if (isValid(i, j) && board[i][j] === EMPTY && !isZoneRestricted(i, j, currentPlayer)) candidates.push({r: i, c: j}); if (candidates.length > 0) { const pick = candidates[Math.floor(Math.random() * candidates.length)]; r = pick.r; c = pick.c; wasChaosed = true; } SoundEngine.playChaos(); showToast(t('chaosTrigger', 'toast')); chaosDebuff[currentPlayer]--; }
    placePiece(r, c, currentPlayer, false, wasChaosed);
    if(selectedCell) { const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); selectedCell = null; }
    if (isDoubleMoveActive) { 
        isDoubleMoveActive = false; showToast(t('doubleNext', 'toast')); SoundEngine.playSkill(); 
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
    territoryZones.forEach(z => { if(z.owner===currentPlayer) z.turns--; }); territoryZones = territoryZones.filter(z => z.turns > 0); updateTerritoriesUI();
    if (shortBattleTurns > 0) shortBattleTurns--;
    currentPlayer = currentPlayer === MAPLE ? SUN : MAPLE; 
    if (bombTarget !== null && currentPlayer === bombTarget) { SoundEngine.switchTrack('bomb'); } 
    else { SoundEngine.switchTrack(userMusicPref); }
    updateDynamicUI(); 
    clearTimeout(aiTimer);
    if (gameMode === 'pve' && currentPlayer !== humanSide && gameActive) { aiTimer = setTimeout(aiMove, 600); }
}

function activateSkill() {
    if (!gameActive || skillUsed[currentPlayer]) { showToast(t('skillUsed', 'toast')); return; }
    if(selectedCell) { const old = getCell(selectedCell.r, selectedCell.c); if(old) old.classList.remove('selected-move'); selectedCell = null; }
    saveState();
    const sid = playerSkills[currentPlayer], sname = t(sid, 'skills').name;
    SoundEngine.playSkill(); showToast(t('casting', 'toast') + sname); skillUsed[currentPlayer] = true; updateDynamicUI();
    const b = document.getElementById('board');
    if (sid === 'double') { isDoubleMoveActive = true; showToast(t('doubleStart', 'toast')); }
    else if (sid === 'voodoo') { activeEffect = 'voodoo_pick'; b.classList.add('casting-voodoo'); showToast(t('voodooPick', 'toast')); }
    else if (sid === 'move_self') { activeEffect = 'move_pick'; effectData={mode:'self'}; b.classList.add('casting-move-src'); showToast(t('moveSrcSelf', 'toast')); }
    else if (sid === 'move_enemy') { activeEffect = 'move_pick'; effectData={mode:'enemy'}; b.classList.add('casting-move-src'); showToast(t('moveSrcEnemy', 'toast')); }
    else if (sid === 'zone') { activeEffect = 'zone_pick'; b.classList.add('casting-territory'); showToast(t('zonePick', 'toast')); }
    else if (sid === 'bomb') { 
        const opp = currentPlayer === MAPLE ? SUN : MAPLE;
        timeRemaining[opp] -= 120; showToast(t('bombStart', 'toast'));
        bombTarget = opp;
        if(timeRemaining[opp] <= 0) { triggerExplosion(); return; }
        updateDynamicUI();
    }
    else if (sid === 'god_hand') { activeEffect = 'god_pick_1'; b.classList.add('casting-move-src'); showToast(t('godPick1', 'toast')); }
    else if (sid === 'chaos') { const opp = currentPlayer === MAPLE ? SUN : MAPLE; chaosDebuff[opp] += 2; updateDynamicUI(); }
    else if (sid === 'short_battle') { shortBattleTurns = 6; showToast(t('shortBattleStart', 'toast')); updateDynamicUI(); }
    else if (sid === 'swap') { activeEffect = 'swap_pick_1'; b.classList.add('casting-move-src'); showToast(t('swapPickSelf', 'toast')); }
}

function handleSkillInteraction(r, c) {
    SoundEngine.playPlace(); const b = document.getElementById('board'); const cell = getCell(r, c); if(!cell) return;
    if (activeEffect === 'voodoo_pick') { 
        if (board[r][c] === EMPTY || board[r][c] === CORRODED) { SoundEngine.playError(); return; } 
        board[r][c] = CORRODED; cell.innerHTML = ''; cell.className = 'cell corroded'; activeEffect = null; b.classList.remove('casting-voodoo'); showToast(t('voodooDone', 'toast')); 
    } 
    else if (activeEffect === 'move_pick') { const p = board[r][c]; if ((effectData.mode==='self' && p!==currentPlayer) || (effectData.mode==='enemy' && (p===EMPTY||p===currentPlayer))) { SoundEngine.playError(); return; } effectData.src = {r, c, val: p}; activeEffect = 'move_drop'; b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity = '0.5'; showToast(t('moveDest', 'toast')); } 
    else if (activeEffect === 'move_drop') { 
        if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } 
        const src = effectData.src; board[src.r][src.c] = EMPTY; const sc = getCell(src.r, src.c); if(sc){sc.innerHTML=''; sc.style.opacity='1';} 
        placePiece(r, c, src.val, true); activeEffect = null; b.classList.remove('casting-move-dest'); 
        const winLine = checkWin(r, c, src.val);
        if (winLine) highlightWin(winLine, src.val); else showToast(t('moveDone', 'toast')); 
    } 
    else if (activeEffect === 'zone_pick') { document.querySelectorAll('.territory-preview').forEach(el => el.classList.remove('territory-preview')); territoryZones.push({r, c, owner: currentPlayer, turns: 6}); updateTerritoriesUI(); activeEffect = null; b.classList.remove('casting-territory'); showToast(t('zoneDone', 'toast')); } 
    else if (activeEffect === 'god_pick_1') { const p = board[r][c]; if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; } effectData.godSrc1 = {r, c, val: p}; activeEffect = 'god_drop_1'; b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity='0.5'; showToast(t('godDest1', 'toast')); } 
    else if (activeEffect === 'god_drop_1') { if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } const s1 = effectData.godSrc1; board[s1.r][s1.c] = EMPTY; const c1 = getCell(s1.r, s1.c); if(c1){c1.innerHTML=''; c1.style.opacity='1';} placePiece(r, c, s1.val, true); b.classList.remove('casting-move-dest'); const wl = checkWin(r, c, s1.val); if (wl) { highlightWin(wl, s1.val); return; } activeEffect = 'god_pick_2'; b.classList.add('casting-move-src'); showToast(t('godPick2', 'toast')); } 
    else if (activeEffect === 'god_pick_2') { const p = board[r][c]; if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; } effectData.godSrc2 = {r, c, val: p}; activeEffect = 'god_drop_2'; b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity='0.5'; showToast(t('godDest2', 'toast')); } 
    else if (activeEffect === 'god_drop_2') { if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } const s2 = effectData.godSrc2; board[s2.r][s2.c] = EMPTY; const c2 = getCell(s2.r, s2.c); if(c2){c2.innerHTML=''; c2.style.opacity='1';} placePiece(r, c, s2.val, true); activeEffect = null; b.classList.remove('casting-move-dest'); const wl = checkWin(r, c, s2.val); if (wl) highlightWin(wl, s2.val); else switchTurn(); } 
    else if (activeEffect === 'swap_pick_1') { const p = board[r][c]; if (p!==currentPlayer) { SoundEngine.playError(); return; } effectData.swapSrc = {r, c, val: p}; activeEffect = 'swap_pick_2'; b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity = '0.5'; showToast(t('swapPickEnemy', 'toast')); } 
    else if (activeEffect === 'swap_pick_2') { 
        const p = board[r][c]; const enemy = currentPlayer===MAPLE?SUN:MAPLE; if (p!==enemy) { SoundEngine.playError(); return; } 
        const s1 = effectData.swapSrc; const s2 = {r, c, val: p}; 
        const c1 = getCell(s1.r, s1.c); if(c1) c1.style.opacity = '1'; board[s1.r][s1.c] = s2.val; board[s2.r][s2.c] = s1.val; 
        if(c1) { c1.innerHTML=''; placePiece(s1.r, s1.c, s2.val, true); } 
        const c2 = getCell(s2.r, s2.c); 
        if(c2) { c2.innerHTML=''; placePiece(s2.r, c2.c, s1.val, true); }
        activeEffect = null; b.classList.remove('casting-move-dest'); 
        const wl1 = checkWin(s1.r, s1.c, s2.val); if(wl1) { highlightWin(wl1, s2.val); return; } 
        const wl2 = checkWin(s2.r, s2.c, s1.val); if(wl2) { highlightWin(wl2, s1.val); return; } 
        showToast(t('swapDone', 'toast')); 
    }
}

function highlightWin(line, winner) {
    gameActive = false;
    SoundEngine.playWin();
    line.forEach(pos => {
        const cell = getCell(pos.r, pos.c);
        if (cell) cell.classList.add('win-highlight');
    });
    setTimeout(() => handleMatchEnd(winner), 1500);
}

function triggerExplosion() {
    gameActive = false;
    SoundEngine.playExplosion();
    const overlay = document.getElementById('explosionOverlay');
    overlay.classList.add('explosion-anim');
    setTimeout(() => {
        overlay.classList.remove('explosion-anim');
        const loser = bombTarget;
        const winner = loser === MAPLE ? SUN : MAPLE;
        handleMatchEnd(winner);
    }, 2000);
}

function handleMatchEnd(winSide) {
    gameActive = false; clearInterval(bombInterval); clearInterval(gameTicker); clearTimeout(aiTimer); 
    SoundEngine.switchTrack(userMusicPref); 
    const wt = document.getElementById('winnerText'); 
    let title = "";
    if (gameMode === 'pve' && winSide !== humanSide) { SoundEngine.playError(); title = `${ICONS[winSide]} ${t('lose', 'end')}`; } 
    else { title = `${ICONS[winSide]} ${t('names')[winSide]} ${t('win', 'end')}`; }
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
    if (isBO3) { showToast(t('undoPvP', 'toast')); return; }
    if (historyStack.length === 0) return;
    if(selectedCell) { const c = getCell(selectedCell.r, selectedCell.c); if(c) c.classList.remove('selected-move'); selectedCell=null; }
    document.querySelectorAll('.win-highlight').forEach(el => el.classList.remove('win-highlight'));
    const state = historyStack.pop();
    restoreState(state);
    if (bombTarget !== null && currentPlayer !== bombTarget) { SoundEngine.switchTrack(userMusicPref); }
    if (gameMode === 'pve') { clearTimeout(aiTimer); if (historyStack.length > 0) { const state2 = historyStack.pop(); restoreState(state2); } }
    gameActive = true; document.getElementById('winnerModal').style.display='none'; showToast(t('undoDone', 'toast'));
}

// 辅助函数
function getRandomMove() { const e=[]; for(let r=0; r<BOARD_SIZE; r++) { for(let c=0; c<BOARD_SIZE; c++) { if(board[r][c]===EMPTY && !isZoneRestricted(r,c,currentPlayer)) { e.push({r,c}); } } } return e.length ? e[Math.floor(Math.random()*e.length)] : null; }
function getScoreMove(adv, mas=false) { let max = -Infinity; let ms = []; const ai = currentPlayer; const hum = currentPlayer === MAPLE ? SUN : MAPLE; for(let r=0; r<BOARD_SIZE; r++) { for(let c=0; c<BOARD_SIZE; c++) { if(board[r][c]!==EMPTY || isZoneRestricted(r,c,ai) || !hasNeighbor(r,c)) continue; let a = evalPt(r, c, ai); let d = evalPt(r, c, hum); let s = 0; if (!adv) { s = a + d; } else { s = a * (mas ? 1.2 : 1) + d; if(a >= 1e5) s = Infinity; else if(d >= 1e5) s = 9e7; else if(a >= 1e4) s += 5e4; else if(d >= 1e4) s += 4e4; } s += Math.random() * 10; if (s > max) { max = s; ms = [{r, c}]; } else if (Math.abs(s - max) < 5) { ms.push({r, c}); } } } return ms.length ? ms[Math.floor(Math.random()*ms.length)] : getRandomMove(); }
function evalPt(r, c, t) { let s = 0; const directions = [[1,0], [0,1], [1,1], [1,-1]]; directions.forEach(d => { s += getLn(r, c, d[0], d[1], t); }); return s; }
function getLn(r, c, dr, dc, t) { let ct = 1; let es = 0; let i = 1; while(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === t) { ct++; i++; } if(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === EMPTY) es++; i = 1; while(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === t) { ct++; i++; } if(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === EMPTY) es++; const winLen = shortBattleTurns > 0 ? 4 : 5; if(ct >= winLen) return 1e5; if(ct === winLen - 1) return es === 2 ? 1e4 : (es === 1 ? 1e3 : 0); if(ct === winLen - 2) return es === 2 ? 1e3 : (es === 1 ? 100 : 0); if(ct === winLen - 3) return es === 2 ? 100 : 0; return 0; }
function hasNeighbor(r, c) { for(let i=r-2; i<=r+2; i++) { for(let j=c-2; j<=c+2; j++) { if(isValid(i,j) && board[i][j]!==EMPTY) return true; } } return false; }
function isValid(r, c) { return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE; }
function isZoneRestricted(r, c, p) { for(let z of territoryZones) { if (Math.abs(z.r - r) <= 1 && Math.abs(z.c - c) <= 1 && z.owner !== p) { return true; } } return false; }
function updateTerritoriesUI() { document.querySelectorAll('.territory-zone').forEach(el => el.classList.remove('territory-zone')); territoryZones.forEach(z => { for(let i=z.r-1; i<=z.r+1; i++) { for(let j=z.c-1; j<=z.c+1; j++) { const c = getCell(i, j); if(c) c.classList.add('territory-zone'); } } }); }
function checkWin(r, c, p) { const d = [[0,1], [1,0], [1,1], [1,-1]]; const limit = shortBattleTurns > 0 ? 4 : 5; for(let k of d) { let ct = 1; let line = [{r,c}]; let i = r + k[0], j = c + k[1]; while(isValid(i,j) && board[i][j] === p) { line.push({r:i, c:j}); i += k[0]; j += k[1]; ct++; } i = r - k[0]; j = c - k[1]; while(isValid(i,j) && board[i][j] === p) { line.push({r:i, c:j}); i -= k[0]; j -= k[1]; ct++; } if(ct >= limit) return line; } return null; }
function startBombTimer() { if(bombInterval) clearInterval(bombInterval); bombInterval = setInterval(() => { if(!gameActive) return; if(currentPlayer !== bombOwner) { bombTime--; const m = Math.floor(bombTime/60).toString().padStart(2,'0'); const s = (bombTime%60).toString().padStart(2,'0'); document.getElementById('bombTimer').innerText=`${m}:${s}`; if(bombTime <= 0) handleMatchEnd(bombOwner); } }, 1000); }
function updateDynamicUI() { const turnTextEl = document.getElementById('turnText'); const newTurnText = t('names')[currentPlayer===MAPLE?1:2]; if (turnTextEl.innerText !== newTurnText) turnTextEl.innerText = newTurnText; const turnIconEl = document.getElementById('turnIcon'); const newTurnIcon = ICONS[currentPlayer]; if (turnIconEl.innerText !== newTurnIcon) turnIconEl.innerText = newTurnIcon; const statusBar = document.getElementById('statusBar'); const newClass = 'status-pill ' + (currentPlayer === MAPLE ? 'turn-maple' : 'turn-sun'); if (statusBar.className !== newClass) statusBar.className = newClass; const t1 = document.getElementById('timer1'); const t2 = document.getElementById('timer2'); const t1Text = `🍁 ${formatTime(timeRemaining[MAPLE])}`; const t2Text = `☀️ ${formatTime(timeRemaining[SUN])}`; if (t1.innerText !== t1Text) t1.innerText = t1Text; if (t2.innerText !== t2Text) t2.innerText = t2Text; const updateTimerVisual = (player, timerEl, time) => { timerEl.className = `timer-pill ${currentPlayer===player?'active':''}`; if (bombTarget === player) { if (time < 30) { timerEl.classList.add('timer-critical'); } else { timerEl.classList.add('timer-bomb'); } } else if (time < 30) { timerEl.classList.add('timer-critical-normal'); } }; updateTimerVisual(MAPLE, t1, timeRemaining[MAPLE]); updateTimerVisual(SUN, t2, timeRemaining[SUN]); const cc = document.getElementById('chaosCounter'); const sbc = document.getElementById('shortBattleCounter'); if (chaosDebuff[currentPlayer] > 0) { cc.style.display = 'block'; const ccText = `${t('chaosLabel', 'toast')} ${chaosDebuff[currentPlayer]}`; if (cc.innerText !== ccText) cc.innerText = ccText; } else { cc.style.display = 'none'; } if (shortBattleTurns > 0) { sbc.style.display = 'block'; const sbcText = `${t('shortBattleLabel', 'toast')} ${shortBattleTurns}`; if (sbc.innerText !== sbcText) sbc.innerText = sbcText; } else { sbc.style.display = 'none'; } const ms = playerSkills[currentPlayer]; const u = skillUsed[currentPlayer]; const btn = document.getElementById('skillBtn'); if (!ms) { btn.disabled = true; if (btn.querySelector('span').innerText !== "---") btn.querySelector('span').innerText = "---"; if (btn.querySelector('small').innerText !== "") btn.querySelector('small').innerText = ""; return; } const so = t(ms, 'skills'); let myC=0, oppC=0; board.forEach(r=>r.forEach(c=>{ if(c===currentPlayer)myC++; else if(c!==0&&c!==-1)oppC++; })); let viable = true; if(ms==='move_self' && myC===0) viable=false; else if(ms==='move_enemy' && oppC===0) viable=false; else if((ms==='god_hand'||ms==='voodoo') && (myC+oppC)===0) viable=false; else if(ms==='swap' && (myC===0 || oppC===0)) viable=false; const span = btn.querySelector('span'); const small = btn.querySelector('small'); if(u || !viable) { btn.disabled=true; const newSpan = (so?so.name:t('skillName')) + " " + (u?t('skillUsed'):t('skillNoTarget')); if (span.innerText !== newSpan) span.innerText = newSpan; if (small.innerText !== "") small.innerText = ""; } else { btn.disabled=false; const newSpan = so?so.name:t('skillName'); const newSmall = t('skillReady'); if (span.innerText !== newSpan) span.innerText = newSpan; if (small.innerText !== newSmall) small.innerText = newSmall; } }
function formatTime(s) { if(s<0) s=0; const m=Math.floor(s/60).toString().padStart(2,'0'); const sec=(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function showToast(m){ const t=document.getElementById('toast'); t.innerText=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,3000); }