// ================== I18N (语言包) ==================
const I18N = {
    'zh': {
        langName: "简", 
        gameTitle: "落叶 <span style='font-size:0.5em'>VS</span> 生辉", 
        subTitle: "Alpha 0.6.9.1",
        btnPvE: "电脑对战 (PvE)", 
        btnPvPSingle: "双人单局 (PvP)", 
        btnPvPBO3: "三番战 (PvP BO3)", 
        hintSound: "点击任意处开启音效",
        titleDiff: "选择难度", 
        diffEasy: "简单", diffMedium: "中等", diffHard: "困难", diffMaster: "大师", 
        btnBack: "返回",
        titlePickSide: "猜先/选边", 
        descPickSide: "选择身份", 
        descPickSideLoser: "上一局失利者选边",
        sideFirst: "先手(黑)", sideSecond: "后手(白)",
        draftTitle: "{icon} {name} (选技能)", 
        btnUndo: "悔棋", btnExit: "退出", 
        skillReady: "点击释放", skillUsed: "(已用)", skillName: "技能", skillNoTarget: "(缺目标)",
        confirmExit: "确定要退出吗？棋局将丢失。", 
        pveTag: "电脑: ", 
        names: { 1: "落叶方", 2: "生辉方" },
        titleSettings: "系统设置", 
        lblMusicVol: "音乐音量", lblSfxVol: "音效音量", lblMusicTrack: "背景音乐",
        trackOrigin: "原初", trackOverture: "序曲 (MP3)", 
        btnClose: "关闭",
        skills: {
            double: { name: "双连", desc: "本回合落两子" },
            voodoo: { name: "巫毒", desc: "腐蚀一格，继续落子" },
            move_self: { name: "移花接木", desc: "移己方一子，继续落子" },
            move_enemy: { name: "乾坤大挪移", desc: "移敌方一子，继续落子" },
            zone: { name: "领地", desc: "划定3x3禁区(6回合)" },
            bomb: { name: "时间炸弹", desc: "扣除对方2分钟！(致死)" },
            god_hand: { name: "上帝之手", desc: "移任意两子，结束回合" },
            chaos: { name: "混乱骰子", desc: "对手下两步随机偏移" },
            short_battle: { name: "短兵战", desc: "6回合内四子即胜" },
            swap: { name: "置换反应", desc: "换敌我各一子，继续落子" }
        },
        toast: {
            skillUsed: "技能已用尽", casting: "释放：", 
            doubleStart: "双连：请下第1子", doubleNext: "双连：请下第2子！",
            voodooPick: "选择腐蚀目标", voodooDone: "腐蚀完成，请落子", 
            moveSrcSelf: "选择己方棋子", moveSrcEnemy: "选择敌方棋子",
            moveDest: "选择新位置", moveDone: "移动完成，请落子", 
            zonePick: "选择领地中心", zoneDone: "领地生成，请落子",
            bombStart: "炸弹爆炸！对方-2分钟", 
            errInvalid: "无效操作", errZone: "禁区无法落子", undoPvP: "竞技模式无悔棋！",
            godPick1: "上帝之手：选第1子", godDest1: "选第1落点", godPick2: "上帝之手：选第2子", godDest2: "选第2落点",
            chaosTrigger: "混乱触发！落点偏移", chaosLabel: "🎲 混乱:", 
            shortBattleLabel: "⚔️ 短兵:", shortBattleStart: "短兵战！四子即胜",
            swapPickSelf: "置换：选己方子", swapPickEnemy: "置换：选敌方子", swapDone: "置换完成，请落子", 
            undoDone: "悔棋成功", timeOut: "时间耗尽！"
        },
        end: { 
            win: "获胜！", lose: "挑战失败", 
            grandWin: "👑 大胜利！", grandWinDesc: "{name} 赢得三番战", 
            score: "比分", btnNext: "下一局", btnMenu: "主菜单", btnRestart: "再来一局", btnQuitMatch: "退出比赛" 
        }
    },
    'zh-TW': {
        langName: "繁", 
        gameTitle: "落葉 <span style='font-size:0.5em'>VS</span> 生輝", 
        subTitle: "Alpha 0.6.9.1",
        btnPvE: "電腦對戰 (PvE)", 
        btnPvPSingle: "雙人單局 (PvP)", 
        btnPvPBO3: "三番戰 (PvP BO3)", 
        hintSound: "點擊任意處開啟音效",
        titleDiff: "選擇難度", 
        diffEasy: "簡單", diffMedium: "中等", diffHard: "困難", diffMaster: "大師", 
        btnBack: "返回",
        titlePickSide: "猜先/選邊", 
        descPickSide: "選擇身份", 
        descPickSideLoser: "上一局失利者選邊",
        sideFirst: "先手(黑)", sideSecond: "後手(白)",
        draftTitle: "{icon} {name} (選技能)", 
        btnUndo: "悔棋", btnExit: "退出", 
        skillReady: "點擊釋放", skillUsed: "(已用)", skillName: "技能", skillNoTarget: "(缺目標)",
        confirmExit: "確定要退出嗎？棋局將丟失。", 
        pveTag: "電腦: ", 
        names: { 1: "落葉方", 2: "生輝方" },
        titleSettings: "系統設置", 
        lblMusicVol: "音樂音量", lblSfxVol: "音效音量", lblMusicTrack: "背景音樂",
        trackOrigin: "原初", trackOverture: "序曲 (MP3)", 
        btnClose: "關閉",
        skills: {
            double: { name: "雙連", desc: "本回合落兩子" },
            voodoo: { name: "巫毒", desc: "腐蝕一格，繼續落子" },
            move_self: { name: "移花接木", desc: "移己方一子，繼續落子" },
            move_enemy: { name: "乾坤大挪移", desc: "移敵方一子，繼續落子" },
            zone: { name: "領地", desc: "劃定3x3禁區(6回合)" },
            bomb: { name: "時間炸彈", desc: "扣除對方2分鐘！(致死)" },
            god_hand: { name: "上帝之手", desc: "移任意兩子，結束回合" },
            chaos: { name: "混亂骰子", desc: "對手下兩步隨機偏移" },
            short_battle: { name: "短兵戰", desc: "6回合內四子即勝" },
            swap: { name: "置換反應", desc: "換敵我各一子，繼續落子" }
        },
        toast: {
            skillUsed: "技能已用盡", casting: "釋放技能：", 
            doubleStart: "雙連：請下第1子", doubleNext: "雙連：請下第2子！",
            voodooPick: "選擇腐蝕目標", voodooDone: "腐蝕完成，請落子", 
            moveSrcSelf: "選擇己方棋子", moveSrcEnemy: "選擇敵方棋子",
            moveDest: "選擇新位置", moveDone: "移動完成，請落子", 
            zonePick: "選擇領地中心", zoneDone: "領地生成，請落子",
            bombStart: "炸彈已啟動", 
            errInvalid: "無效操作", errZone: "禁區無法落子", undoPvP: "競技模式無悔棋！",
            godPick1: "上帝之手：選擇第1顆棋子", godDest1: "選擇第1次落點", godPick2: "上帝之手：選擇第2顆棋子", godDest2: "選擇第2次落點",
            chaosTrigger: "混亂觸發！落點偏移", chaosLabel: "🎲 混亂:", 
            shortBattleLabel: "⚔️ 短兵:", shortBattleStart: "短兵戰！四子即勝",
            swapPickSelf: "置換：選己方子", swapPickEnemy: "置換：選敵方子", swapDone: "置換完成，請落子", 
            undoDone: "悔棋成功", timeOut: "時間耗盡！"
        },
        end: { 
            win: "獲勝！", lose: "挑戰失敗", 
            grandWin: "👑 大勝利！", grandWinDesc: "{name} 贏得三番戰", 
            score: "比分", btnNext: "下一局", btnMenu: "主菜單", btnRestart: "再來一局", btnQuitMatch: "退出比賽" 
        }
    },
    'en': {
        langName: "En", 
        gameTitle: "Autumn <span style='font-size:0.5em'>VS</span> Radiance", 
        subTitle: "Alpha 0.6.9.1",
        btnPvE: "PvE Mode (AI)", 
        btnPvPSingle: "PvP (Single)", 
        btnPvPBO3: "PvP BO3 Series", 
        hintSound: "Tap to enable audio",
        titleDiff: "Difficulty", 
        diffEasy: "Easy", diffMedium: "Medium", diffHard: "Hard", diffMaster: "Master", 
        btnBack: "Back",
        titlePickSide: "Pick Side", 
        descPickSide: "Choose faction", 
        descPickSideLoser: "Loser picks side",
        sideFirst: "First(Black)", sideSecond: "Second(White)",
        draftTitle: "{icon} {name} (Draft)", 
        btnUndo: "Undo", btnExit: "Exit", 
        skillReady: "Cast", skillUsed: "(Used)", skillName: "Skill", skillNoTarget: "(No Target)",
        confirmExit: "Quit game? Progress lost.", 
        pveTag: "CPU: ", 
        names: { 1: "Autumn", 2: "Radiance" },
        titleSettings: "Settings", 
        lblMusicVol: "Music Volume", lblSfxVol: "SFX Volume", lblMusicTrack: "Background Music",
        trackOrigin: "Origin", trackOverture: "Overture (MP3)", 
        btnClose: "Close",
        skills: {
            double: { name: "Double Strike", desc: "Place 2 pieces." },
            voodoo: { name: "Voodoo", desc: "Corrupt cell, then move." },
            move_self: { name: "Teleport Self", desc: "Move self" },
            move_enemy: { name: "Teleport Enemy", desc: "Move enemy" },
            zone: { name: "Sanctuary", desc: "Claim 3x3 zone (6 turns)." },
            bomb: { name: "Time Bomb", desc: "-2 Mins to Opponent! (Lethal)" },
            god_hand: { name: "Hand of God", desc: "Move ANY 2 pieces. End turn." },
            chaos: { name: "Chaos Dice", desc: "Opponent's next 2 moves offset." },
            short_battle: { name: "Skirmish", desc: "Win by 4-in-a-row (6 turns)." },
            swap: { name: "Displacement", desc: "Swap friend/foe piece. Continue." }
        },
        toast: {
            skillUsed: "Depleted", casting: "Cast: ", 
            doubleStart: "Double: Place 1st", doubleNext: "Double: Place 2nd!",
            voodooPick: "Pick target", voodooDone: "Done. Move now!", 
            moveSrcSelf: "Pick YOURS", moveSrcEnemy: "Pick ENEMY",
            moveDest: "Pick dest", moveDone: "Done. Move now!", 
            zonePick: "Pick center", zoneDone: "Done. Move now!",
            bombStart: "Bomb! -2 Mins", 
            errInvalid: "Invalid", errZone: "Restricted Zone", undoPvP: "No undo in PvP!",
            godPick1: "God: Pick 1st", godDest1: "Pick 1st dest", godPick2: "God: Pick 2nd", godDest2: "Pick 2nd dest",
            chaosTrigger: "Chaos! Missed!", chaosLabel: "🎲 Chaos:", 
            shortBattleLabel: "⚔️ Skirmish:", shortBattleStart: "Skirmish! Connect 4!",
            swapPickSelf: "Swap: Pick YOURS", swapPickEnemy: "Swap: Pick ENEMY", swapDone: "Done. Move now!", 
            undoDone: "Undone", timeOut: "Time Out!"
        },
        end: { 
            win: "Wins!", lose: "Defeat", 
            grandWin: "👑 Grand Victory!", grandWinDesc: "{name} Wins!", 
            score: "Score", btnNext: "Next Round", btnMenu: "Menu", btnRestart: "Replay", btnQuitMatch: "Forfeit" 
        }
    }
};

let curLangKey = 'zh';
const LANG_ORDER = ['zh', 'zh-TW', 'en'];
function t(key, path=null) { if(path) return I18N[curLangKey][path][key]; return I18N[curLangKey][key]; }

function toggleLanguage() { 
    const idx = LANG_ORDER.indexOf(curLangKey); 
    curLangKey = LANG_ORDER[(idx + 1) % LANG_ORDER.length]; 
    document.querySelector('.lang-btn').innerText = I18N[curLangKey].langName; 
    updateStaticText(); 
    if(gameActive) updateDynamicUI(); 
}

function updateStaticText() {
    document.querySelectorAll('[data-i18n]').forEach(el => { 
        const key = el.getAttribute('data-i18n'); 
        el.innerHTML = t(key); 
    });
}

// ================= 全局变量 =================
const BOARD_SIZE = 15, EMPTY = 0, MAPLE = 1, SUN = 2, CORRODED = -1;
const ICONS = { [MAPLE]: '🍁', [SUN]: '☀️' };
const SKILL_IDS = ['double','voodoo','move_self','move_enemy','zone','bomb','god_hand','chaos','short_battle','swap'];

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

// ================= 界面控制 =================
const screens = { main: document.getElementById('mainMenu'), diff: document.getElementById('difficultyScreen'), turn: document.getElementById('turnSelectScreen'), draft: document.getElementById('skillSelectScreen'), game: document.getElementById('gameScreen'), settings: document.getElementById('settingsModal') };
function showScreen(n) { 
    if (n !== 'settings') {
        Object.values(screens).forEach(s => { if(s && s.id!=='settingsModal') s.classList.remove('active'); }); 
    }
    if (screens[n]) screens[n].classList.add('active'); 
}

function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('sliderMusic').value = SoundEngine.musicVolume * 100;
    document.getElementById('valMusic').innerText = Math.round(SoundEngine.musicVolume * 100) + '%';
    document.getElementById('sliderSfx').value = SoundEngine.sfxVolume * 100;
    document.getElementById('valSfx').innerText = Math.round(SoundEngine.sfxVolume * 100) + '%';
    updateTrackUI();
}
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }
function updateVolume(type, val) {
    const v = val / 100;
    if (type === 'music') { SoundEngine.setMusicVolume(v); document.getElementById('valMusic').innerText = val + '%'; } 
    else { SoundEngine.sfxVolume = v; document.getElementById('valSfx').innerText = val + '%'; }
}
function changeTrack(track) { 
    if (SoundEngine.currentTrack === 'bomb') return;
    SoundEngine.switchTrack(track); 
    updateTrackUI(); 
}
function updateTrackUI() {
    document.querySelectorAll('.music-opt').forEach(el => el.classList.remove('active'));
    const pref = document.getElementById('trackOverture').classList.contains('active') ? 'overture' : 'origin';
    if (SoundEngine.currentTrack === 'origin' || (SoundEngine.currentTrack === 'bomb' && pref === 'origin')) 
        document.getElementById('trackOrigin').classList.add('active');
    else 
        document.getElementById('trackOverture').classList.add('active');
}

// --- 导航与流程 ---
function goToMenu() { 
    gameActive=false; clearInterval(gameTicker); clearTimeout(aiTimer); 
    document.getElementById('winnerModal').style.display='none'; 
    showScreen('main'); 
}
function confirmExit() { if(confirm(t('confirmExit'))) goToMenu(); }

function showDifficultyScreen() { SoundEngine.playPlace(); showScreen('diff'); }
function startPvPFlow(subMode) { SoundEngine.playPlace(); isBO3 = (subMode === 'bo3'); p1Score = 0; p2Score = 0; chooser = 'p1'; updateScoreBoard(); enterTurnSelection('pvp', null); }

function enterTurnSelection(mode, diff) {
    SoundEngine.playPlace(); 
    document.getElementById('winnerModal').style.display = 'none'; showScreen('turn');
    gameMode = mode; aiDifficulty = diff;
    if (gameMode === 'pve') { isBO3 = false; }
    const tEl = document.getElementById('turnSelectTitle'), dEl = document.getElementById('turnSelectDesc');
    updateStaticText(); 
    if (isBO3 && (p1Score > 0 || p2Score > 0)) { tEl.innerText = t('titlePickSide'); dEl.innerText = `${t('descPickSideLoser')} (${chooser==='p1'?"P1":"P2"})`; } 
    else { tEl.innerText = t('titlePickSide'); dEl.innerText = t('descPickSide'); }
}

function goBackFromTurn() { SoundEngine.playPlace(); if (gameMode === 'pve') { showScreen('diff'); } else { goToMenu(); } }
function handleTurnChoice(c) { SoundEngine.playPlace(); if (gameMode === 'pve') { humanSide = (c === 1) ? MAPLE : SUN; enterDraftPhase(); } else { if (c === 1) { playerSides[MAPLE] = chooser; playerSides[SUN] = (chooser === 'p1' ? 'p2' : 'p1'); } else { playerSides[SUN] = chooser; playerSides[MAPLE] = (chooser === 'p1' ? 'p2' : 'p1'); } enterDraftPhase(); } }

function enterDraftPhase() { document.getElementById('winnerModal').style.display = 'none'; showScreen('draft'); if (gameMode === 'pve') draftTurn = SUN; else draftTurn = SUN; playerSkills = { [MAPLE]: null, [SUN]: null }; renderSkillGrid(); updateDraftTitle(); SoundEngine.init(); }
let draftTurn = SUN;
function renderSkillGrid() { const g = document.getElementById('skillGrid'); g.innerHTML = ''; SKILL_IDS.forEach(sid => { const sd = t(sid, 'skills'); const c = document.createElement('div'); c.className = 'skill-card'; c.innerHTML = `<div class="skill-title">${sd.name}</div><div class="skill-desc">${sd.desc}</div>`; c.onclick = () => pickSkill(sid); if (Object.values(playerSkills).includes(sid)) { c.classList.add('selected'); c.onclick = null; } g.appendChild(c); }); }
function updateDraftTitle() { const tEl = document.getElementById('draftTitle'); let pickerName = t('names')[draftTurn]; if (gameMode === 'pve') { const isAITurn = (humanSide === MAPLE && draftTurn === SUN) || (humanSide === SUN && draftTurn === MAPLE); if (isAITurn) pickerName += " (AI)"; else pickerName += " (You)"; if (isAITurn) setTimeout(() => { const avail = SKILL_IDS.filter(s => !Object.values(playerSkills).includes(s)); pickSkill(avail[Math.floor(Math.random()*avail.length)]); }, 800); } tEl.innerHTML = t('draftTitle').replace('{icon}', ICONS[draftTurn]).replace('{name}', pickerName); tEl.style.color = draftTurn === MAPLE ? '#d32f2f' : '#f9a825'; }
function pickSkill(id) { SoundEngine.playPlace(); playerSkills[draftTurn] = id; if (draftTurn === SUN) { draftTurn = MAPLE; renderSkillGrid(); updateDraftTitle(); } else initGame(); }

function initGame() {
    showScreen('game'); board = Array(BOARD_SIZE).fill(0).map(()=>Array(BOARD_SIZE).fill(EMPTY)); currentPlayer = MAPLE; gameActive = true; 
    historyStack = []; skillUsed = {[MAPLE]:false, [SUN]:false}; activeEffect = null; territoryZones = []; isDoubleMoveActive = false; chaosDebuff = {[MAPLE]:0, [SUN]:0}; shortBattleTurns = 0;
    timeRemaining = { [MAPLE]: 240, [SUN]: 240 }; selectedCell = null;
    
    bombTarget = null;
    SoundEngine.setCritical(false);
    
    const userPref = document.getElementById('trackOverture').classList.contains('active') ? 'overture' : 'origin';
    SoundEngine.switchTrack(userPref);

    clearInterval(gameTicker); clearTimeout(aiTimer); 
    updateStaticText(); updateDynamicUI();  

    gameTicker = setInterval(() => {
        if(!gameActive) return;
        timeRemaining[currentPlayer]--;
        
        // --- 危机状态同步 ---
        if (bombTarget !== null && currentPlayer === bombTarget) {
            if (timeRemaining[currentPlayer] < 30) SoundEngine.setCritical(true);
            else SoundEngine.setCritical(false);
        } else {
            SoundEngine.setCritical(false);
        }

        updateDynamicUI(); 
        if(timeRemaining[currentPlayer] <= 0) { 
            // 如果是被炸死，触发爆炸特效
            if (bombTarget === currentPlayer) triggerExplosion();
            else { showToast(t('timeOut', 'toast')); handleMatchEnd(currentPlayer === MAPLE ? SUN : MAPLE); }
        }
    }, 1000);

    document.getElementById('winnerModal').style.display = 'none'; 
    const dt = document.getElementById('diffTag'), sb = document.getElementById('scoreBoard');
    if(gameMode === 'pve') { dt.style.display = 'inline-block'; sb.style.display = 'none'; dt.innerText = t('pveTag') + t('diff' + aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)); } else { dt.style.display = 'none'; sb.style.display = isBO3 ? 'block' : 'none'; updateScoreBoard(); }
    renderBoard();
    if (gameMode === 'pve' && humanSide === SUN) { aiTimer = setTimeout(aiMove, 800); }
}

function updateScoreBoard() { document.getElementById('scoreBoard').innerText = `P1 (${p1Score}) : (${p2Score}) P2`; }
function renderBoard() { const b = document.getElementById('board'); b.innerHTML = ''; const stars = [[3,3],[3,11],[7,7],[11,3],[11,11]]; for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) { const cell = document.createElement('div'); cell.className = 'cell'; cell.id = `c-${r}-${c}`; cell.dataset.r=r; cell.dataset.c=c; cell.onclick=()=>handleCellClick(r,c); cell.onmouseenter=()=>handleCellHover(r,c); if(stars.some(s=>s[0]===r&&s[1]===c)) { cell.setAttribute('data-star','true'); const d=document.createElement('div'); d.className='dot'; cell.appendChild(d); } b.appendChild(cell); } }
function getCell(r, c) { return document.getElementById(`c-${r}-${c}`); }

// --- State Management ---
function saveState() { historyStack.push({ board: JSON.parse(JSON.stringify(board)), currentPlayer: currentPlayer, skillUsed: JSON.parse(JSON.stringify(skillUsed)), territoryZones: JSON.parse(JSON.stringify(territoryZones)), chaosDebuff: JSON.parse(JSON.stringify(chaosDebuff)), shortBattleTurns: shortBattleTurns, timeRemaining: JSON.parse(JSON.stringify(timeRemaining)), bombTarget: bombTarget }); }
function restoreState(state) { 
    board = state.board; currentPlayer = state.currentPlayer; skillUsed = state.skillUsed; territoryZones = state.territoryZones; chaosDebuff = state.chaosDebuff; shortBattleTurns = state.shortBattleTurns; timeRemaining = state.timeRemaining; bombTarget = state.bombTarget; 
    SoundEngine.setCritical(false);
    for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) { const cell = getCell(r,c); cell.className = 'cell'; cell.innerHTML = ''; if(cell.getAttribute('data-star')==='true') { const d=document.createElement('div'); d.className='dot'; cell.appendChild(d); } const val = board[r][c]; if (val === MAPLE || val === SUN) { const pc = document.createElement('span'); pc.className='piece'; pc.innerText=ICONS[val]; cell.appendChild(pc); } else if (val === CORRODED) { cell.className = 'cell corroded'; } } updateTerritoriesUI(); updateDynamicUI(); 
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
    if (isDoubleMoveActive) { 
        isDoubleMoveActive = false; showToast(t('doubleNext', 'toast')); SoundEngine.playSkill(); 
        const winLine = checkWin(r, c, currentPlayer);
        if (winLine) highlightWin(winLine, currentPlayer);
        return; 
    }
    checkWinAndSwitch(r, c, currentPlayer);
}

function placePiece(r, c, p, m=false, chaos=false) { if(!m) board[r][c]=p; else board[r][c]=p; const cell = getCell(r,c); if(cell) { const pc = document.createElement('span'); pc.className='piece'; pc.innerText=ICONS[p]; cell.appendChild(pc); SoundEngine.playPlace(); } }
function handleCellHover(r, c) { if (activeEffect === 'zone_pick') { document.querySelectorAll('.territory-preview').forEach(el => el.classList.remove('territory-preview')); for(let i=r-1; i<=r+1; i++) for(let j=c-1; j<=c+1; j++) if(isValid(i,j)) { const el=getCell(i,j); if(el) el.classList.add('territory-preview'); } } }

// --- 修正：CheckWin 返回 Line，HandleMatchEnd 延迟 ---
function checkWinAndSwitch(r, c, p) { 
    const winLine = checkWin(r, c, p);
    if (winLine) highlightWin(winLine, p); 
    else switchTurn(); 
}

function switchTurn() {
    territoryZones.forEach(z => { if(z.owner===currentPlayer) z.turns--; }); territoryZones = territoryZones.filter(z => z.turns > 0); updateTerritoriesUI();
    if (shortBattleTurns > 0) shortBattleTurns--;
    currentPlayer = currentPlayer === MAPLE ? SUN : MAPLE; 
    const userPref = document.getElementById('trackOverture').classList.contains('active') ? 'overture' : 'origin';
    if (bombTarget !== null && currentPlayer === bombTarget) { SoundEngine.switchTrack('bomb'); } else { SoundEngine.switchTrack(userPref); }
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
        if(timeRemaining[opp] <= 0) { 
            // 炸弹直接致死，也要走爆炸流程
            triggerExplosion();
            return;
        }
        updateDynamicUI();
    }
    else if (sid === 'god_hand') { activeEffect = 'god_pick_1'; b.classList.add('casting-move-src'); showToast(t('godPick1', 'toast')); }
    else if (sid === 'chaos') { const opp = currentPlayer === MAPLE ? SUN : MAPLE; chaosDebuff[opp] += 2; updateDynamicUI(); }
    else if (sid === 'short_battle') { shortBattleTurns = 6; showToast(t('shortBattleStart', 'toast')); updateDynamicUI(); }
    else if (sid === 'swap') { activeEffect = 'swap_pick_1'; b.classList.add('casting-move-src'); showToast(t('swapPickSelf', 'toast')); }
}

function handleSkillInteraction(r, c) {
    SoundEngine.playPlace(); const b = document.getElementById('board'); const cell = getCell(r, c); if(!cell) return;
    // ... Voodoo & Zone & God Hand Picker (无变动) ...
    if (activeEffect === 'voodoo_pick') { if (board[r][c] === EMPTY || board[r][c] === CORRODED) { SoundEngine.playError(); return; } board[r][c] = CORRODED; cell.innerHTML = ''; cell.className = 'cell corroded'; activeEffect = null; b.classList.remove('casting-voodoo'); showToast(t('voodooDone', 'toast')); } 
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
    else if (activeEffect === 'god_drop_2') { 
        if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } 
        const s2 = effectData.godSrc2; board[s2.r][s2.c] = EMPTY; const c2 = getCell(s2.r, s2.c); if(c2){c2.innerHTML=''; c2.style.opacity='1';} 
        placePiece(r, c, s2.val, true); activeEffect = null; b.classList.remove('casting-move-dest'); 
        const wl = checkWin(r, c, s2.val); 
        if (wl) highlightWin(wl, s2.val); else switchTurn(); 
    } 
    else if (activeEffect === 'swap_pick_1') { const p = board[r][c]; if (p!==currentPlayer) { SoundEngine.playError(); return; } effectData.swapSrc = {r, c, val: p}; activeEffect = 'swap_pick_2'; b.classList.remove('casting-move-src'); b.classList.add('casting-move-dest'); cell.style.opacity = '0.5'; showToast(t('swapPickEnemy', 'toast')); } 
    else if (activeEffect === 'swap_pick_2') { 
        const p = board[r][c]; const enemy = currentPlayer===MAPLE?SUN:MAPLE; if (p!==enemy) { SoundEngine.playError(); return; } 
        const s1 = effectData.swapSrc; const s2 = {r, c, val: p}; 
        const c1 = getCell(s1.r, s1.c); if(c1) c1.style.opacity = '1'; board[s1.r][s1.c] = s2.val; board[s2.r][s2.c] = s1.val; if(c1) { c1.innerHTML=''; const pc=document.createElement('span'); pc.className='piece'; pc.innerText=ICONS[s2.val]; c1.appendChild(pc); } const c2 = getCell(s2.r, s2.c); if(c2) { c2.innerHTML=''; const pc=document.createElement('span'); pc.className='piece'; pc.innerText=ICONS[s1.val]; c2.appendChild(pc); } 
        activeEffect = null; b.classList.remove('casting-move-dest'); 
        const wl1 = checkWin(s1.r, s1.c, s2.val); if(wl1) { highlightWin(wl1, s2.val); return; } 
        const wl2 = checkWin(s2.r, s2.c, s1.val); if(wl2) { highlightWin(wl2, s1.val); return; } 
        showToast(t('swapDone', 'toast')); 
    }
}

// --- 核心新增：高亮胜利连线 ---
function highlightWin(line, winner) {
    gameActive = false;
    SoundEngine.playWin();
    // 高亮连线
    line.forEach(pos => {
        const cell = getCell(pos.r, pos.c);
        if (cell) cell.classList.add('win-highlight');
    });
    // 延迟 1.5 秒后弹出窗口
    setTimeout(() => handleMatchEnd(winner), 1500);
}

// --- 核心新增：爆炸逻辑 ---
function triggerExplosion() {
    gameActive = false;
    SoundEngine.playExplosion();
    const overlay = document.getElementById('explosionOverlay');
    overlay.classList.add('explosion-anim');
    
    // 爆炸 2 秒后判负
    setTimeout(() => {
        overlay.classList.remove('explosion-anim');
        const loser = bombTarget;
        const winner = loser === MAPLE ? SUN : MAPLE;
        handleMatchEnd(winner);
    }, 2000);
}

function handleMatchEnd(winSide) {
    gameActive = false; clearInterval(bombInterval); clearInterval(gameTicker); clearTimeout(aiTimer); 
    const userPref = document.getElementById('trackOverture').classList.contains('active') ? 'overture' : 'origin';
    SoundEngine.switchTrack(userPref); 
    
    const cBtn = (t,f,p) => { const b=document.createElement('button'); b.className=p?'btn primary':'btn secondary'; b.innerText=t; b.onclick=f; return b; };
    const bc = document.getElementById('endGameButtons'); bc.innerHTML = '';
    let title = "";
    if (gameMode === 'pve' && winSide !== humanSide) { SoundEngine.playError(); title = `${ICONS[winSide]} ${t('lose', 'end')}`; } 
    else { title = `${ICONS[winSide]} ${t('names')[winSide]} ${t('win', 'end')}`; }
    
    if (isBO3) { 
        const winner = playerSides[winSide]; winner === 'p1' ? p1Score++ : p2Score++; updateScoreBoard(); chooser = (winner === 'p1') ? 'p2' : 'p1'; 
        if ((winner==='p1'?p1Score:p2Score) >= 2) { 
            SoundEngine.playGrandWin(); title = `${t('grandWin', 'end')}<br><span style="font-size:0.6em;color:#666">${t('grandWinDesc', 'end').replace('{name}', winner.toUpperCase())}</span>`; 
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
    const wt = document.getElementById('winnerText'); wt.innerHTML = title; wt.style.color = winSide === MAPLE ? '#d32f2f' : '#fbc02d';
    document.getElementById('winnerModal').style.display = 'flex';
}

function undoMove() {
    if (isBO3) { showToast(t('undoPvP', 'toast')); return; }
    if (historyStack.length === 0) return;
    if(selectedCell) { const c = getCell(selectedCell.r, selectedCell.c); if(c) c.classList.remove('selected-move'); selectedCell=null; }
    
    // 清除可能存在的胜利高亮
    document.querySelectorAll('.win-highlight').forEach(el => el.classList.remove('win-highlight'));
    
    const state = historyStack.pop();
    restoreState(state);
    
    if (bombTarget !== null && currentPlayer !== bombTarget && SoundEngine.currentTrack !== 'origin' && SoundEngine.currentTrack !== 'overture') {
        const userPref = document.getElementById('trackOverture').classList.contains('active') ? 'overture' : 'origin';
        SoundEngine.switchTrack(userPref);
    }

    if (gameMode === 'pve') { clearTimeout(aiTimer); if (historyStack.length > 0) { const state2 = historyStack.pop(); restoreState(state2); } }
    gameActive = true; document.getElementById('winnerModal').style.display='none'; showToast(t('undoDone', 'toast'));
}

// ================== 辅助函数 (完整展开) ==================

function getRandomMove() { 
    const e=[]; 
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if(board[r][c]===EMPTY && !isZoneRestricted(r,c,currentPlayer)) {
                e.push({r,c});
            }
        }
    }
    return e.length ? e[Math.floor(Math.random()*e.length)] : null; 
}

function getScoreMove(adv, mas=false) { 
    let max = -Infinity;
    let ms = []; 
    const ai = currentPlayer;
    const hum = currentPlayer === MAPLE ? SUN : MAPLE; 
    
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if(board[r][c]!==EMPTY || isZoneRestricted(r,c,ai) || !hasNeighbor(r,c)) continue; 
            
            let a = evalPt(r, c, ai);
            let d = evalPt(r, c, hum);
            let s = 0; 
            
            if (!adv) {
                s = a + d; 
            } else { 
                s = a * (mas ? 1.2 : 1) + d; 
                if(a >= 1e5) s = Infinity; 
                else if(d >= 1e5) s = 9e7; 
                else if(a >= 1e4) s += 5e4; 
                else if(d >= 1e4) s += 4e4; 
            } 
            
            s += Math.random() * 10; // 增加微小随机性防止死板
            
            if (s > max) {
                max = s;
                ms = [{r, c}];
            } else if (Math.abs(s - max) < 5) {
                ms.push({r, c});
            }
        }
    }
    return ms.length ? ms[Math.floor(Math.random()*ms.length)] : getRandomMove(); 
}

function evalPt(r, c, t) { 
    let s = 0; 
    const directions = [[1,0], [0,1], [1,1], [1,-1]];
    directions.forEach(d => {
        s += getLn(r, c, d[0], d[1], t);
    });
    return s; 
}

function getLn(r, c, dr, dc, t) { 
    let ct = 1;
    let es = 0; // empty sides
    
    // 正向延伸
    let i = 1; 
    while(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === t) {
        ct++; i++;
    } 
    if(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === EMPTY) es++; 
    
    // 反向延伸
    i = 1; 
    while(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === t) {
        ct++; i++;
    } 
    if(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === EMPTY) es++; 
    
    const winLen = shortBattleTurns > 0 ? 4 : 5; 
    
    if(ct >= winLen) return 1e5; 
    if(ct === winLen - 1) return es === 2 ? 1e4 : (es === 1 ? 1e3 : 0); 
    if(ct === winLen - 2) return es === 2 ? 1e3 : (es === 1 ? 100 : 0); 
    if(ct === winLen - 3) return es === 2 ? 100 : 0; 
    return 0; 
}

function hasNeighbor(r, c) { 
    for(let i=r-2; i<=r+2; i++) {
        for(let j=c-2; j<=c+2; j++) {
            if(isValid(i,j) && board[i][j]!==EMPTY) return true; 
        }
    }
    return false; 
}

function isValid(r, c) { 
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE; 
}

function isZoneRestricted(r, c, p) { 
    for(let z of territoryZones) {
        if (Math.abs(z.r - r) <= 1 && Math.abs(z.c - c) <= 1 && z.owner !== p) {
            return true; 
        }
    }
    return false; 
}

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

// --- 核心修改：CheckWin 返回 Line ---
function checkWin(r, c, p) { 
    const d = [[0,1], [1,0], [1,1], [1,-1]]; 
    const limit = shortBattleTurns > 0 ? 4 : 5; 
    
    for(let k of d) {
        let ct = 1; 
        let line = [{r,c}]; // 记录连线的点
        
        // 正向检查
        let i = r + k[0], j = c + k[1];
        while(isValid(i,j) && board[i][j] === p) { 
            line.push({r:i, c:j}); 
            i += k[0]; j += k[1]; ct++; 
        }
        
        // 反向检查
        i = r - k[0]; j = c - k[1];
        while(isValid(i,j) && board[i][j] === p) { 
            line.push({r:i, c:j}); 
            i -= k[0]; j -= k[1]; ct++; 
        }
        
        if(ct >= limit) return line; 
    } 
    return null; 
}

function startBombTimer() { 
    if(bombInterval) clearInterval(bombInterval); 
    bombInterval = setInterval(() => {
        if(!gameActive) return;
        if(currentPlayer !== bombOwner) {
            bombTime--;
            const m = Math.floor(bombTime/60).toString().padStart(2,'0');
            const s = (bombTime%60).toString().padStart(2,'0');
            document.getElementById('bombTimer').innerText=`${m}:${s}`;
            if(bombTime <= 0) handleMatchEnd(bombOwner);
        }
    }, 1000); 
}

function updateDynamicUI() {
    const turnTextEl = document.getElementById('turnText'); const newTurnText = t('names')[currentPlayer===MAPLE?1:2]; if (turnTextEl.innerText !== newTurnText) turnTextEl.innerText = newTurnText;
    const turnIconEl = document.getElementById('turnIcon'); const newTurnIcon = ICONS[currentPlayer]; if (turnIconEl.innerText !== newTurnIcon) turnIconEl.innerText = newTurnIcon;
    const statusBar = document.getElementById('statusBar'); const newClass = 'status-pill ' + (currentPlayer === MAPLE ? 'turn-maple' : 'turn-sun'); if (statusBar.className !== newClass) statusBar.className = newClass;
    const t1 = document.getElementById('timer1'); const t2 = document.getElementById('timer2'); const t1Text = `🍁 ${formatTime(timeRemaining[MAPLE])}`; const t2Text = `☀️ ${formatTime(timeRemaining[SUN])}`; if (t1.innerText !== t1Text) t1.innerText = t1Text; if (t2.innerText !== t2Text) t2.innerText = t2Text;
    
    // --- 核心逻辑：移除 C4 垃圾，回归纯粹的 Class 控制 ---
    const updateTimerVisual = (player, timerEl, time) => {
        timerEl.className = `timer-pill ${currentPlayer===player?'active':''}`;

        if (bombTarget === player) {
            // 被炸状态
            if (time < 30) {
                // <30s: 剧烈红黑闪烁 (旧版 timer-critical)
                timerEl.classList.add('timer-critical');
            } else {
                // >30s: 红色呼吸 (旧版 timer-bomb)
                timerEl.classList.add('timer-bomb');
            }
        } else if (time < 30) {
            // 没被炸，只是时间不够了：新版橙色预警
            timerEl.classList.add('timer-critical-normal');
        }
    };

    updateTimerVisual(MAPLE, t1, timeRemaining[MAPLE]);
    updateTimerVisual(SUN, t2, timeRemaining[SUN]);

    const cc = document.getElementById('chaosCounter'); const sbc = document.getElementById('shortBattleCounter');
    if (chaosDebuff[currentPlayer] > 0) { cc.style.display = 'block'; const ccText = `${t('chaosLabel', 'toast')} ${chaosDebuff[currentPlayer]}`; if (cc.innerText !== ccText) cc.innerText = ccText; } else { cc.style.display = 'none'; }
    if (shortBattleTurns > 0) { sbc.style.display = 'block'; const sbcText = `${t('shortBattleLabel', 'toast')} ${shortBattleTurns}`; if (sbc.innerText !== sbcText) sbc.innerText = sbcText; } else { sbc.style.display = 'none'; }

    const ms = playerSkills[currentPlayer]; const u = skillUsed[currentPlayer]; const btn = document.getElementById('skillBtn');
    if (!ms) { btn.disabled = true; if (btn.querySelector('span').innerText !== "---") btn.querySelector('span').innerText = "---"; if (btn.querySelector('small').innerText !== "") btn.querySelector('small').innerText = ""; return; }
    const so = t(ms, 'skills'); let myC=0, oppC=0; board.forEach(r=>r.forEach(c=>{ if(c===currentPlayer)myC++; else if(c!==0&&c!==-1)oppC++; })); let viable = true; if(ms==='move_self' && myC===0) viable=false; else if(ms==='move_enemy' && oppC===0) viable=false; else if((ms==='god_hand'||ms==='voodoo') && (myC+oppC)===0) viable=false; else if(ms==='swap' && (myC===0 || oppC===0)) viable=false;
    const span = btn.querySelector('span'); const small = btn.querySelector('small');
    if(u || !viable) { btn.disabled=true; const newSpan = (so?so.name:t('skillName')) + " " + (u?t('skillUsed'):t('skillNoTarget')); if (span.innerText !== newSpan) span.innerText = newSpan; if (small.innerText !== "") small.innerText = ""; } else { btn.disabled=false; const newSpan = so?so.name:t('skillName'); const newSmall = t('skillReady'); if (span.innerText !== newSpan) span.innerText = newSpan; if (small.innerText !== newSmall) small.innerText = newSmall; }
}

function formatTime(s) { if(s<0) s=0; const m=Math.floor(s/60).toString().padStart(2,'0'); const sec=(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function showToast(m){ const t=document.getElementById('toast'); t.innerText=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,3000); }