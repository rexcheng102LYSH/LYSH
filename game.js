// ================== I18N (语言包) ==================
const I18N = {
    'zh': {
        langName: "简", 
        gameTitle: "落叶 <span style='font-size:0.5em'>VS</span> 生辉", 
        subTitle: "Alpha 0.7.0",
        btnPvE: "电脑对战 (PvE)", 
        btnPvPSingle: "双人单局 (PvP)", 
        btnPvPBO3: "三番战 (PvP BO3)", 
        hintSound: "点击任意处开启沉浸式音效",
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
        trackOrigin: "原初", trackOverture: "序曲 (MP3)", trackBgm2: "古风 (MP3)",
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
    'zh-TW': { langName: "繁", gameTitle: "落葉 <span style='font-size:0.5em'>VS</span> 生輝", subTitle: "Alpha 0.7.0", btnPvE: "電腦對戰 (PvE)", btnPvPSingle: "雙人單局 (PvP)", btnPvPBO3: "三番戰 (PvP BO3)", hintSound: "點擊任意處開啟音效", titleDiff: "選擇難度", diffEasy: "簡單", diffMedium: "中等", diffHard: "困難", diffMaster: "大師", btnBack: "返回", titlePickSide: "猜先/選邊", descPickSide: "選擇身份", descPickSideLoser: "上一局失利者選邊", sideFirst: "先手(黑)", sideSecond: "後手(白)", draftTitle: "{icon} {name} (選技能)", btnUndo: "悔棋", btnExit: "退出", skillReady: "點擊釋放", skillUsed: "(已用)", skillName: "技能", skillNoTarget: "(缺目標)", confirmExit: "確定要退出嗎？棋局將丟失。", pveTag: "電腦: ", names: { 1: "落葉方", 2: "生輝方" }, titleSettings: "系統設置", lblMusicVol: "音樂音量", lblSfxVol: "音效音量", lblMusicTrack: "背景音樂", trackOrigin: "原初", trackOverture: "序曲 (MP3)", trackBgm2: "古風 (MP3)", btnClose: "關閉", skills: { double: { name: "雙連", desc: "本回合落兩子" }, voodoo: { name: "巫毒", desc: "腐蝕一格，繼續落子" }, move_self: { name: "移花接木", desc: "移己方一子，繼續落子" }, move_enemy: { name: "乾坤大挪移", desc: "移敵方一子，繼續落子" }, zone: { name: "領地", desc: "劃定3x3禁區(6回合)" }, bomb: { name: "時間炸彈", desc: "扣除對方2分鐘！(致死)" }, god_hand: { name: "上帝之手", desc: "移任意兩子，結束回合" }, chaos: { name: "混亂骰子", desc: "對手下兩步隨機偏移" }, short_battle: { name: "短兵戰", desc: "6回合內四子即勝" }, swap: { name: "置換反應", desc: "換敵我各一子，繼續落子" } }, toast: { skillUsed: "技能已用盡", casting: "釋放技能：", doubleStart: "雙連：請下第1子", doubleNext: "雙連：請下第2子！", voodooPick: "選擇腐蝕目標", voodooDone: "腐蝕完成，請落子", moveSrcSelf: "選擇己方棋子", moveSrcEnemy: "選擇敵方棋子", moveDest: "選擇新位置", moveDone: "移動完成，請落子", zonePick: "選擇領地中心", zoneDone: "領地生成，請落子", bombStart: "炸彈已啟動", errInvalid: "無效操作", errZone: "禁區無法落子", undoPvP: "競技模式無悔棋！", godPick1: "上帝之手：選擇第1顆棋子", godDest1: "選擇第1次落點", godPick2: "上帝之手：選擇第2顆棋子", godDest2: "選擇第2次落點", chaosTrigger: "混亂觸發！落點偏移", chaosLabel: "🎲 混亂:", shortBattleLabel: "⚔️ 短兵:", shortBattleStart: "短兵戰！四子即勝", swapPickSelf: "置換：選己方子", swapPickEnemy: "置換：選敵方子", swapDone: "置換完成，請落子", undoDone: "悔棋成功", timeOut: "時間耗盡！" }, end: { win: "獲勝！", lose: "挑戰失敗", grandWin: "👑 大勝利！", grandWinDesc: "{name} 贏得三番戰", score: "比分", btnNext: "下一局", btnMenu: "主菜單", btnRestart: "再來一局", btnQuitMatch: "退出比賽" } },
    'en': { langName: "En", gameTitle: "Autumn <span style='font-size:0.5em'>VS</span> Radiance", subTitle: "Alpha 0.7.0", btnPvE: "PvE Mode (AI)", btnPvPSingle: "PvP (Single)", btnPvPBO3: "PvP BO3 Series", hintSound: "Tap to enable audio", titleDiff: "Difficulty", diffEasy: "Easy", diffMedium: "Medium", diffHard: "Hard", diffMaster: "Master", btnBack: "Back", titlePickSide: "Pick Side", descPickSide: "Choose faction", descPickSideLoser: "Loser picks side", sideFirst: "First(Black)", sideSecond: "Second(White)", draftTitle: "{icon} {name} (Draft)", btnUndo: "Undo", btnExit: "Exit", skillReady: "Cast", skillUsed: "(Used)", skillName: "Skill", skillNoTarget: "(No Target)", confirmExit: "Quit game? Progress lost.", pveTag: "CPU: ", names: { 1: "Autumn", 2: "Radiance" }, titleSettings: "Settings", lblMusicVol: "Music Volume", lblSfxVol: "SFX Volume", lblMusicTrack: "Background Music", trackOrigin: "Origin", trackOverture: "Overture (MP3)", trackBgm2: "Ancient (MP3)", btnClose: "Close", skills: { double: { name: "Double Strike", desc: "Place 2 pieces." }, voodoo: { name: "Voodoo", desc: "Corrupt cell, then move." }, move_self: { name: "Teleport Self", desc: "Move self" }, move_enemy: { name: "Teleport Enemy", desc: "Move enemy" }, zone: { name: "Sanctuary", desc: "Claim 3x3 zone (6 turns)." }, bomb: { name: "Time Bomb", desc: "-2 Mins to Opponent! (Lethal)" }, god_hand: { name: "Hand of God", desc: "Move ANY 2 pieces. End turn." }, chaos: { name: "Chaos Dice", desc: "Opponent's next 2 moves offset." }, short_battle: { name: "Skirmish", desc: "Win by 4-in-a-row (6 turns)." }, swap: { name: "Displacement", desc: "Swap pieces" } }, toast: { skillUsed: "Depleted", casting: "Cast: ", doubleStart: "Double: Place 1st", doubleNext: "Double: 2nd!", voodooPick: "Pick target", voodooDone: "Done. Move now!", moveSrcSelf: "Pick YOURS", moveSrcEnemy: "Pick ENEMY", moveDest: "Pick dest", moveDone: "Done. Move now!", zonePick: "Pick center", zoneDone: "Done. Move now!", bombStart: "Bomb! -2 Mins", errInvalid: "Invalid", errZone: "Restricted Zone", undoPvP: "No undo in PvP!", godPick1: "God: Pick 1st", godDest1: "Dest 1", godPick2: "God: Pick 2nd", godDest2: "Dest 2", chaosTrigger: "Chaos! Missed!", chaosLabel: "🎲 Chaos:", shortBattleLabel: "⚔️ Skirmish:", shortBattleStart: "Skirmish Mode!", swapPickSelf: "Swap: Yours", swapPickEnemy: "Swap: Enemy", swapDone: "Done. Move now!", undoDone: "Undone", timeOut: "Time Out!" }, end: { win: "Wins!", lose: "Defeat", grandWin: "👑 Grand Victory!", grandWinDesc: "{name} Wins!", score: "Score", btnNext: "Next Round", btnMenu: "Menu", btnRestart: "Replay", btnQuitMatch: "Forfeit" } }
};

let curLangKey = 'zh';
const LANG_ORDER = ['zh', 'zh-TW', 'en'];
function t(key, path=null) { if(path) return I18N[curLangKey][path][key]; return I18N[curLangKey][key]; }
function toggleLanguage() { const idx = LANG_ORDER.indexOf(curLangKey); curLangKey = LANG_ORDER[(idx + 1) % LANG_ORDER.length]; document.querySelector('.lang-btn').innerText = I18N[curLangKey].langName; updateStaticText(); if(gameActive) updateDynamicUI(); }
function updateStaticText() { document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); el.innerHTML = t(key); }); }

// ================= 全局变量 & Canvas 引擎 =================
const BOARD_SIZE = 15, EMPTY = 0, MAPLE = 1, SUN = 2, CORRODED = -1;
// 皮肤定义
let currentSkin = 'nature'; // 'nature' (默认) | 'classic' (黑白棋)
const SKINS = {
    nature: { name: 'Nature', p1: '🍁', p2: '☀️', bg: '#e3c08d', line: '#5d4037' },
    classic: { name: 'Classic', p1: '⚫', p2: '⚪', bg: '#DCB35C', line: '#000000' } // Canvas 会自定义绘制，这里仅作备用
};

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
let userMusicPref = 'origin';

// Canvas 变量
let canvas, ctx, cellSize;
let winLineAnim = null; // 胜利连线动画数据

// ================= 界面控制 =================
const screens = { main: document.getElementById('mainMenu'), diff: document.getElementById('difficultyScreen'), turn: document.getElementById('turnSelectScreen'), draft: document.getElementById('skillSelectScreen'), game: document.getElementById('gameScreen'), settings: document.getElementById('settingsModal') };
function showScreen(n) { if (n !== 'settings') { Object.values(screens).forEach(s => { if(s && s.id!=='settingsModal') s.classList.remove('active'); }); } if (screens[n]) screens[n].classList.add('active'); }

function openSettings() { document.getElementById('settingsModal').style.display = 'flex'; document.getElementById('sliderMusic').value = SoundEngine.musicVolume * 100; document.getElementById('valMusic').innerText = Math.round(SoundEngine.musicVolume * 100) + '%'; document.getElementById('sliderSfx').value = SoundEngine.sfxVolume * 100; document.getElementById('valSfx').innerText = Math.round(SoundEngine.sfxVolume * 100) + '%'; updateTrackUI(); }
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }
function updateVolume(type, val) { const v = val / 100; if (type === 'music') { SoundEngine.setMusicVolume(v); document.getElementById('valMusic').innerText = val + '%'; } else { SoundEngine.sfxVolume = v; document.getElementById('valSfx').innerText = val + '%'; } }
function changeTrack(track) { if (SoundEngine.currentTrack === 'bomb') { userMusicPref = track; updateTrackUI(); return; } userMusicPref = track; SoundEngine.switchTrack(track); updateTrackUI(); }
function updateTrackUI() { document.querySelectorAll('.music-opt').forEach(el => el.classList.remove('active')); if (userMusicPref === 'origin') document.getElementById('trackOrigin').classList.add('active'); else if (userMusicPref === 'overture') document.getElementById('trackOverture').classList.add('active'); else if (userMusicPref === 'bgm2') document.getElementById('trackBgm2').classList.add('active'); }

// 皮肤切换逻辑
function toggleSkin() {
    SoundEngine.playPlace();
    currentSkin = currentSkin === 'nature' ? 'classic' : 'nature';
    
    // 更新皮肤按钮图标 (可选)
    const btn = document.querySelector('.skin-btn');
    btn.innerText = currentSkin === 'nature' ? '🍁' : '⚫';
    
    if (gameActive) render();
}

// --- 导航与流程 ---
function goToMenu() { gameActive=false; clearInterval(gameTicker); clearTimeout(aiTimer); document.getElementById('winnerModal').style.display='none'; showScreen('main'); }
function confirmExit() { if(confirm(t('confirmExit'))) goToMenu(); }
function showDifficultyScreen() { SoundEngine.playPlace(); showScreen('diff'); }
function startPvPFlow(subMode) { SoundEngine.playPlace(); isBO3 = (subMode === 'bo3'); p1Score = 0; p2Score = 0; chooser = 'p1'; updateScoreBoard(); enterTurnSelection('pvp', null); }

function enterTurnSelection(mode, diff) { SoundEngine.playPlace(); document.getElementById('winnerModal').style.display = 'none'; showScreen('turn'); gameMode = mode; aiDifficulty = diff; if (gameMode === 'pve') { isBO3 = false; } const tEl = document.getElementById('turnSelectTitle'), dEl = document.getElementById('turnSelectDesc'); updateStaticText(); if (isBO3 && (p1Score > 0 || p2Score > 0)) { tEl.innerText = t('titlePickSide'); dEl.innerText = `${t('descPickSideLoser')} (${chooser==='p1'?"P1":"P2"})`; } else { tEl.innerText = t('titlePickSide'); dEl.innerText = t('descPickSide'); } }
function goBackFromTurn() { SoundEngine.playPlace(); if (gameMode === 'pve') { showScreen('diff'); } else { goToMenu(); } }
function handleTurnChoice(c) { SoundEngine.playPlace(); if (gameMode === 'pve') { humanSide = (c === 1) ? MAPLE : SUN; enterDraftPhase(); } else { if (c === 1) { playerSides[MAPLE] = chooser; playerSides[SUN] = (chooser === 'p1' ? 'p2' : 'p1'); } else { playerSides[SUN] = chooser; playerSides[MAPLE] = (chooser === 'p1' ? 'p2' : 'p1'); } enterDraftPhase(); } }

function enterDraftPhase() { document.getElementById('winnerModal').style.display = 'none'; showScreen('draft'); if (gameMode === 'pve') draftTurn = SUN; else draftTurn = SUN; playerSkills = { [MAPLE]: null, [SUN]: null }; renderSkillGrid(); updateDraftTitle(); SoundEngine.init(); }
let draftTurn = SUN;
function renderSkillGrid() { const g = document.getElementById('skillGrid'); g.innerHTML = ''; SKILL_IDS.forEach(sid => { const sd = t(sid, 'skills'); const c = document.createElement('div'); c.className = 'skill-card'; c.innerHTML = `<div class="skill-title">${sd.name}</div><div class="skill-desc">${sd.desc}</div>`; c.onclick = () => pickSkill(sid); if (Object.values(playerSkills).includes(sid)) { c.classList.add('selected'); c.onclick = null; } g.appendChild(c); }); }
function updateDraftTitle() { const tEl = document.getElementById('draftTitle'); let pickerName = t('names')[draftTurn]; if (gameMode === 'pve') { const isAITurn = (humanSide === MAPLE && draftTurn === SUN) || (humanSide === SUN && draftTurn === MAPLE); if (isAITurn) pickerName += " (AI)"; else pickerName += " (You)"; if (isAITurn) setTimeout(() => { const avail = SKILL_IDS.filter(s => !Object.values(playerSkills).includes(s)); pickSkill(avail[Math.floor(Math.random()*avail.length)]); }, 800); } 
    // 图标根据皮肤动态变化
    const icon = currentSkin === 'nature' ? ICONS[draftTurn] : (draftTurn===MAPLE?'⚫':'⚪');
    tEl.innerHTML = t('draftTitle').replace('{icon}', icon).replace('{name}', pickerName); 
    tEl.style.color = draftTurn === MAPLE ? '#d32f2f' : '#f9a825'; 
}
function pickSkill(id) { SoundEngine.playPlace(); playerSkills[draftTurn] = id; if (draftTurn === SUN) { draftTurn = MAPLE; renderSkillGrid(); updateDraftTitle(); } else initGame(); }

// ================= 核心游戏循环 (Canvas 重构版) =================

function initGame() {
    showScreen('game');
    initCanvas(); // 初始化 Canvas
    
    board = Array(BOARD_SIZE).fill(0).map(()=>Array(BOARD_SIZE).fill(EMPTY)); 
    currentPlayer = MAPLE; gameActive = true; 
    historyStack = []; skillUsed = {[MAPLE]:false, [SUN]:false}; 
    activeEffect = null; territoryZones = []; isDoubleMoveActive = false; 
    chaosDebuff = {[MAPLE]:0, [SUN]:0}; shortBattleTurns = 0;
    timeRemaining = { [MAPLE]: 240, [SUN]: 240 }; 
    selectedCell = null; bombTarget = null; winLineAnim = null;
    
    SoundEngine.setCritical(false);
    SoundEngine.switchTrack(userMusicPref);

    clearInterval(gameTicker); clearTimeout(aiTimer); 
    updateStaticText(); updateDynamicUI(); render(); // 初始渲染

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
    if(gameMode === 'pve') { dt.style.display = 'inline-block'; sb.style.display = 'none'; dt.innerText = t('pveTag') + t('diff' + aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)); } 
    else { dt.style.display = 'none'; sb.style.display = isBO3 ? 'block' : 'none'; updateScoreBoard(); }
    
    if (gameMode === 'pve' && humanSide === SUN) { aiTimer = setTimeout(aiMove, 800); }
}

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 响应式 + 高分屏适配
    const container = document.querySelector('.board-container');
    const size = Math.min(container.clientWidth, container.clientHeight);
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    ctx.scale(dpr, dpr);
    cellSize = size / BOARD_SIZE;

    // 事件监听 (解决手机点击问题)
    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const c = Math.floor(x / cellSize);
        const r = Math.floor(y / cellSize);
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            handleCellClick(r, c);
        }
    };
    
    // 解决手机上的触摸延迟和抖动
    canvas.addEventListener('touchstart', function(e){
         if (e.target == canvas) e.preventDefault(); 
    }, {passive: false});
}

// === 渲染引擎 (核心) ===
function render() {
    if (!ctx) return;
    
    // 1. 清空画布
    const width = canvas.width / (window.devicePixelRatio||1);
    ctx.clearRect(0, 0, width, width);

    // 2. 绘制棋盘背景与网格
    const skin = currentSkin === 'nature' ? SKINS.nature : SKINS.classic;
    
    // 背景
    if (currentSkin === 'classic') {
        // 经典皮肤：平滑的木纹色/金色
        ctx.fillStyle = '#DCB35C';
        ctx.fillRect(0, 0, width, width);
    } else {
        // 自然皮肤：淡雅纸色 (保持原有风格但更精致)
        ctx.fillStyle = '#e3c08d';
        ctx.fillRect(0, 0, width, width);
    }

    // 网格线
    ctx.lineWidth = 1;
    ctx.strokeStyle = skin.line;
    ctx.beginPath();
    for(let i=0; i<BOARD_SIZE; i++) {
        const pos = i * cellSize + cellSize/2;
        // 横线
        ctx.moveTo(cellSize/2, pos); ctx.lineTo(width - cellSize/2, pos);
        // 竖线
        ctx.moveTo(pos, cellSize/2); ctx.lineTo(pos, width - cellSize/2);
    }
    ctx.stroke();

    // 星位 (天元 + 4角)
    const stars = [[3,3],[3,11],[7,7],[11,3],[11,11]];
    ctx.fillStyle = skin.line;
    stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s[1]*cellSize + cellSize/2, s[0]*cellSize + cellSize/2, 3, 0, Math.PI*2);
        ctx.fill();
    });

    // 3. 绘制特殊区域 (领地/腐蚀/选中)
    drawZones();

    // 4. 绘制棋子
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            const val = board[r][c];
            if (val !== EMPTY) {
                drawPiece(r, c, val);
            }
        }
    }

    // 5. 绘制胜利高亮 (如果有)
    if (winLineAnim) {
        drawWinLine();
    }
}

function drawZones() {
    // 领地 (Zone)
    territoryZones.forEach(z => {
        const x = (z.c - 1) * cellSize;
        const y = (z.r - 1) * cellSize;
        ctx.fillStyle = 'rgba(211, 47, 47, 0.15)';
        ctx.fillRect(x, y, cellSize*3, cellSize*3);
        ctx.strokeStyle = 'rgba(211, 47, 47, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellSize*3, cellSize*3);
    });

    // 选中框 (Selected)
    if (selectedCell) {
        const x = selectedCell.c * cellSize;
        const y = selectedCell.r * cellSize;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10; ctx.shadowColor = '#FFD700';
        ctx.strokeRect(x+2, y+2, cellSize-4, cellSize-4);
        ctx.shadowBlur = 0; // Reset
    }
}

function drawPiece(r, c, type) {
    const cx = c * cellSize + cellSize/2;
    const cy = r * cellSize + cellSize/2;
    const radius = cellSize * 0.42;

    if (type === CORRODED) {
        // 腐蚀效果
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#555'; ctx.font = `${cellSize*0.5}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('☠️', cx, cy);
        return;
    }

    if (currentSkin === 'nature') {
        // --- 自然皮肤 (Emoji 高清渲染) ---
        const text = type === MAPLE ? '🍁' : '☀️';
        ctx.font = `${cellSize*0.75}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 添加一点阴影让它浮起来
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
        ctx.fillText(text, cx, cy + cellSize*0.05);
        ctx.shadowColor = 'transparent';
    } 
    else {
        // --- 经典皮肤 (黑白棋 纯代码渲染) ---
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI*2);

        if (type === MAPLE) { // 黑子 (P1)
            // 逼真的黑曜石质感
            const grad = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, radius*0.1, cx, cy, radius);
            grad.addColorStop(0, '#666'); // 高光点
            grad.addColorStop(0.3, '#333');
            grad.addColorStop(1, '#000');
            ctx.fillStyle = grad;
            
            // 投影
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
            ctx.fill();
        } else { // 白子 (P2)
            // 逼真的羊脂玉质感
            const grad = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, radius*0.1, cx, cy, radius);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.9, '#e0e0e0');
            grad.addColorStop(1, '#ccc');
            ctx.fillStyle = grad;
            
            // 投影
            ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
            ctx.fill();
        }
        ctx.shadowColor = 'transparent'; // Reset
    }
}

function drawWinLine() {
    if (!winLineAnim) return;
    const { line, color } = winLineAnim;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = color; // 胜利色
    
    // 发光效果
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    ctx.beginPath();
    // 连接棋子中心
    const start = line[0];
    ctx.moveTo(start.c * cellSize + cellSize/2, start.r * cellSize + cellSize/2);
    
    for (let i = 1; i < line.length; i++) {
        const p = line[i];
        ctx.lineTo(p.c * cellSize + cellSize/2, p.r * cellSize + cellSize/2);
    }
    ctx.stroke();
    
    // Reset
    ctx.shadowBlur = 0;
}


// ================= 逻辑控制 (适配 Canvas) =================

function updateScoreBoard() { document.getElementById('scoreBoard').innerText = `P1 (${p1Score}) : (${p2Score}) P2`; }

// State Management
function saveState() { historyStack.push({ board: JSON.parse(JSON.stringify(board)), currentPlayer: currentPlayer, skillUsed: JSON.parse(JSON.stringify(skillUsed)), territoryZones: JSON.parse(JSON.stringify(territoryZones)), chaosDebuff: JSON.parse(JSON.stringify(chaosDebuff)), shortBattleTurns: shortBattleTurns, timeRemaining: JSON.parse(JSON.stringify(timeRemaining)), bombTarget: bombTarget }); }
function restoreState(state) { 
    board = state.board; currentPlayer = state.currentPlayer; skillUsed = state.skillUsed; territoryZones = state.territoryZones; chaosDebuff = state.chaosDebuff; shortBattleTurns = state.shortBattleTurns; timeRemaining = state.timeRemaining; bombTarget = state.bombTarget; 
    SoundEngine.setCritical(false);
    
    // 悔棋清除胜利线
    winLineAnim = null;
    
    render(); // 核心：重绘 Canvas
    updateDynamicUI(); 
}

function handleCellClick(r, c, bypassConfirm = false) {
    if (!gameActive) return;
    if (activeEffect) { handleSkillInteraction(r, c); return; }
    if (board[r][c] !== EMPTY) { SoundEngine.playError(); return; }
    if (isZoneRestricted(r, c, currentPlayer)) { showToast(t('errZone', 'toast')); SoundEngine.playError(); return; }
    
    if (!bypassConfirm && !isDoubleMoveActive) { 
        if (!selectedCell || selectedCell.r !== r || selectedCell.c !== c) { 
            selectedCell = {r, c}; 
            SoundEngine.playPlace(); 
            render(); // 选中重绘
            return; 
        } else { 
            selectedCell = null; 
            render(); // 取消选中重绘
            // 继续执行落子...
        } 
    }
    
    if (!isDoubleMoveActive) saveState();
    
    let wasChaosed = false;
    if (chaosDebuff[currentPlayer] > 0) { 
        let candidates = []; 
        for (let i = r-1; i <= r+1; i++) for (let j = c-1; j <= c+1; j++) 
            if (isValid(i, j) && board[i][j] === EMPTY && !isZoneRestricted(i, j, currentPlayer)) candidates.push({r: i, c: j}); 
        if (candidates.length > 0) { 
            const pick = candidates[Math.floor(Math.random() * candidates.length)]; 
            r = pick.r; c = pick.c; wasChaosed = true; 
        } 
        SoundEngine.playChaos(); showToast(t('chaosTrigger', 'toast')); chaosDebuff[currentPlayer]--; 
    }
    
    placePiece(r, c, currentPlayer, false, wasChaosed);
    
    if (isDoubleMoveActive) { 
        isDoubleMoveActive = false; showToast(t('doubleNext', 'toast')); SoundEngine.playSkill(); 
        const winLine = checkWin(r, c, currentPlayer);
        if (winLine) highlightWin(winLine, currentPlayer);
        return; 
    }
    checkWinAndSwitch(r, c, currentPlayer);
}

function placePiece(r, c, p, m=false, chaos=false) { 
    board[r][c] = p; 
    selectedCell = null; // 落子后清除选中框
    SoundEngine.playPlace(); 
    render(); // 核心：落子后重绘
}

// 技能交互 (适配 Canvas)
function handleSkillInteraction(r, c) {
    SoundEngine.playPlace(); 
    // ... Voodoo & Zone & God Hand Picker ...
    // 大部分逻辑不变，只是最后调用 render() 而不是操作 DOM
    if (activeEffect === 'voodoo_pick') { 
        if (board[r][c] === EMPTY || board[r][c] === CORRODED) { SoundEngine.playError(); return; } 
        board[r][c] = CORRODED; activeEffect = null; showToast(t('voodooDone', 'toast')); render();
    } 
    else if (activeEffect === 'move_pick') { 
        const p = board[r][c]; 
        if ((effectData.mode==='self' && p!==currentPlayer) || (effectData.mode==='enemy' && (p===EMPTY||p===currentPlayer))) { SoundEngine.playError(); return; } 
        effectData.src = {r, c, val: p}; activeEffect = 'move_drop'; selectedCell = {r,c}; // 高亮源
        showToast(t('moveDest', 'toast')); render();
    } 
    else if (activeEffect === 'move_drop') { 
        if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; } 
        const src = effectData.src; board[src.r][src.c] = EMPTY; 
        placePiece(r, c, src.val, true); activeEffect = null; selectedCell = null;
        const winLine = checkWin(r, c, src.val);
        if (winLine) highlightWin(winLine, src.val); else showToast(t('moveDone', 'toast')); 
    }
    else if (activeEffect === 'zone_pick') {
        territoryZones.push({r, c, owner: currentPlayer, turns: 6}); 
        activeEffect = null; showToast(t('zoneDone', 'toast')); render();
    }
    // ... God Hand / Swap 逻辑类似，每次数据变动后 render() ...
    // 为了节省篇幅，God Hand 和 Swap 的逻辑省略，原理同上：修改 board 数组后调用 render()
    else if (activeEffect === 'god_pick_1') { 
        const p = board[r][c]; if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; } 
        effectData.godSrc1 = {r, c, val: p}; activeEffect = 'god_drop_1'; selectedCell = {r,c}; 
        showToast(t('godDest1', 'toast')); render(); 
    }
    else if (activeEffect === 'god_drop_1') {
        if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; }
        const s1 = effectData.godSrc1; board[s1.r][s1.c] = EMPTY; 
        placePiece(r, c, s1.val, true); 
        const wl = checkWin(r, c, s1.val); if (wl) { highlightWin(wl, s1.val); return; }
        activeEffect = 'god_pick_2'; selectedCell = null; showToast(t('godPick2', 'toast')); render();
    }
    else if (activeEffect === 'god_pick_2') {
        const p = board[r][c]; if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; }
        effectData.godSrc2 = {r, c, val: p}; activeEffect = 'god_drop_2'; selectedCell = {r,c};
        showToast(t('godDest2', 'toast')); render();
    }
    else if (activeEffect === 'god_drop_2') {
        if (board[r][c]!==EMPTY || isZoneRestricted(r,c,currentPlayer)) { SoundEngine.playError(); return; }
        const s2 = effectData.godSrc2; board[s2.r][s2.c] = EMPTY;
        placePiece(r, c, s2.val, true); activeEffect = null; selectedCell = null;
        const wl = checkWin(r, c, s2.val); if (wl) highlightWin(wl, s2.val); else switchTurn();
    }
    else if (activeEffect === 'swap_pick_1') {
        const p = board[r][c]; if (p!==currentPlayer) { SoundEngine.playError(); return; }
        effectData.swapSrc = {r, c, val: p}; activeEffect = 'swap_pick_2'; selectedCell = {r,c};
        showToast(t('swapPickEnemy', 'toast')); render();
    }
    else if (activeEffect === 'swap_pick_2') {
        const p = board[r][c]; const enemy = currentPlayer===MAPLE?SUN:MAPLE; if (p!==enemy) { SoundEngine.playError(); return; }
        const s1 = effectData.swapSrc; const s2 = {r, c, val: p};
        board[s1.r][s1.c] = s2.val; board[s2.r][s2.c] = s1.val;
        activeEffect = null; selectedCell = null; render();
        const wl1 = checkWin(s1.r, s1.c, s2.val); if(wl1) { highlightWin(wl1, s2.val); return; }
        const wl2 = checkWin(s2.r, s2.c, s1.val); if(wl2) { highlightWin(wl2, s1.val); return; }
        showToast(t('swapDone', 'toast'));
    }
}

// 核心：高亮胜利连线 (Canvas 版)
function highlightWin(line, winner) {
    gameActive = false;
    SoundEngine.playWin();
    
    // 触发 Canvas 动画
    winLineAnim = { line, color: '#00e676' };
    render(); // 重绘以显示连线

    // 延迟 1.5 秒后弹出窗口
    setTimeout(() => handleMatchEnd(winner), 1500);
}

// CheckWin, AI, Timer, UI Updates (保留原逻辑，不依赖 DOM Board)
function checkWinAndSwitch(r, c, p) { const winLine = checkWin(r, c, p); if (winLine) highlightWin(winLine, p); else switchTurn(); }

function switchTurn() {
    territoryZones.forEach(z => { if(z.owner===currentPlayer) z.turns--; }); territoryZones = territoryZones.filter(z => z.turns > 0); 
    // updateTerritoriesUI 也不再需要，render() 会自动画出 zones
    if (shortBattleTurns > 0) shortBattleTurns--;
    currentPlayer = currentPlayer === MAPLE ? SUN : MAPLE; 
    
    if (bombTarget !== null && currentPlayer === bombTarget) { SoundEngine.switchTrack('bomb'); } 
    else { SoundEngine.switchTrack(userMusicPref); }
    
    updateDynamicUI(); render(); // 每次换手重绘
    clearTimeout(aiTimer);
    if (gameMode === 'pve' && currentPlayer !== humanSide && gameActive) { aiTimer = setTimeout(aiMove, 600); }
}

function updateDynamicUI() {
    const turnTextEl = document.getElementById('turnText'); const newTurnText = t('names')[currentPlayer===MAPLE?1:2]; if (turnTextEl.innerText !== newTurnText) turnTextEl.innerText = newTurnText;
    const turnIconEl = document.getElementById('turnIcon'); 
    // 图标根据皮肤变化
    const icon = currentSkin === 'nature' ? ICONS[currentPlayer] : (currentPlayer===MAPLE?'⚫':'⚪');
    if (turnIconEl.innerText !== icon) turnIconEl.innerText = icon;
    
    const statusBar = document.getElementById('statusBar'); const newClass = 'status-pill ' + (currentPlayer === MAPLE ? 'turn-maple' : 'turn-sun'); if (statusBar.className !== newClass) statusBar.className = newClass;
    const t1 = document.getElementById('timer1'); const t2 = document.getElementById('timer2'); const t1Text = `🍁 ${formatTime(timeRemaining[MAPLE])}`; const t2Text = `☀️ ${formatTime(timeRemaining[SUN])}`; if (t1.innerText !== t1Text) t1.innerText = t1Text; if (t2.innerText !== t2Text) t2.innerText = t2Text;
    
    const updateTimerVisual = (player, timerEl, time) => {
        timerEl.className = `timer-pill ${currentPlayer===player?'active':''}`;
        if (bombTarget === player) {
            if (time < 30) timerEl.classList.add('timer-critical'); else timerEl.classList.add('timer-bomb');
        } else if (time < 30) { timerEl.classList.add('timer-critical-normal'); }
    };
    updateTimerVisual(MAPLE, t1, timeRemaining[MAPLE]); updateTimerVisual(SUN, t2, timeRemaining[SUN]);

    const cc = document.getElementById('chaosCounter'); const sbc = document.getElementById('shortBattleCounter');
    if (chaosDebuff[currentPlayer] > 0) { cc.style.display = 'block'; const ccText = `${t('chaosLabel', 'toast')} ${chaosDebuff[currentPlayer]}`; if (cc.innerText !== ccText) cc.innerText = ccText; } else { cc.style.display = 'none'; }
    if (shortBattleTurns > 0) { sbc.style.display = 'block'; const sbcText = `${t('shortBattleLabel', 'toast')} ${shortBattleTurns}`; if (sbc.innerText !== sbcText) sbc.innerText = sbcText; } else { sbc.style.display = 'none'; }

    const ms = playerSkills[currentPlayer]; const u = skillUsed[currentPlayer]; const btn = document.getElementById('skillBtn');
    if (!ms) { btn.disabled = true; if (btn.querySelector('span').innerText !== "---") btn.querySelector('span').innerText = "---"; if (btn.querySelector('small').innerText !== "") btn.querySelector('small').innerText = ""; return; }
    const so = t(ms, 'skills'); let myC=0, oppC=0; board.forEach(r=>r.forEach(c=>{ if(c===currentPlayer)myC++; else if(c!==0&&c!==-1)oppC++; })); let viable = true; if(ms==='move_self' && myC===0) viable=false; else if(ms==='move_enemy' && oppC===0) viable=false; else if((ms==='god_hand'||ms==='voodoo') && (myC+oppC)===0) viable=false; else if(ms==='swap' && (myC===0 || oppC===0)) viable=false;
    const span = btn.querySelector('span'); const small = btn.querySelector('small');
    if(u || !viable) { btn.disabled=true; const newSpan = (so?so.name:t('skillName')) + " " + (u?t('skillUsed'):t('skillNoTarget')); if (span.innerText !== newSpan) span.innerText = newSpan; if (small.innerText !== "") small.innerText = ""; } else { btn.disabled=false; const newSpan = so?so.name:t('skillName'); const newSmall = t('skillReady'); if (span.innerText !== newSpan) span.innerText = newSpan; if (small.innerText !== newSmall) small.innerText = newSmall; }
}

// 辅助函数 (保持不变)
function formatTime(s) { if(s<0) s=0; const m=Math.floor(s/60).toString().padStart(2,'0'); const sec=(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function showToast(m){ const t=document.getElementById('toast'); t.innerText=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,3000); }
function getRandomMove() { const e=[]; for(let r=0; r<BOARD_SIZE; r++) { for(let c=0; c<BOARD_SIZE; c++) { if(board[r][c]===EMPTY && !isZoneRestricted(r,c,currentPlayer)) { e.push({r,c}); } } } return e.length ? e[Math.floor(Math.random()*e.length)] : null; }
function getScoreMove(adv, mas=false) { let max = -Infinity; let ms = []; const ai = currentPlayer; const hum = currentPlayer === MAPLE ? SUN : MAPLE; for(let r=0; r<BOARD_SIZE; r++) { for(let c=0; c<BOARD_SIZE; c++) { if(board[r][c]!==EMPTY || isZoneRestricted(r,c,ai) || !hasNeighbor(r,c)) continue; let a = evalPt(r, c, ai); let d = evalPt(r, c, hum); let s = 0; if (!adv) { s = a + d; } else { s = a * (mas ? 1.2 : 1) + d; if(a >= 1e5) s = Infinity; else if(d >= 1e5) s = 9e7; else if(a >= 1e4) s += 5e4; else if(d >= 1e4) s += 4e4; } s += Math.random() * 10; if (s > max) { max = s; ms = [{r, c}]; } else if (Math.abs(s - max) < 5) { ms.push({r, c}); } } } return ms.length ? ms[Math.floor(Math.random()*ms.length)] : getRandomMove(); }
function evalPt(r, c, t) { let s = 0; const directions = [[1,0], [0,1], [1,1], [1,-1]]; directions.forEach(d => { s += getLn(r, c, d[0], d[1], t); }); return s; }
function getLn(r, c, dr, dc, t) { let ct = 1; let es = 0; let i = 1; while(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === t) { ct++; i++; } if(isValid(r + dr*i, c + dc*i) && board[r + dr*i][c + dc*i] === EMPTY) es++; i = 1; while(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === t) { ct++; i++; } if(isValid(r - dr*i, c - dc*i) && board[r - dr*i][c - dc*i] === EMPTY) es++; const winLen = shortBattleTurns > 0 ? 4 : 5; if(ct >= winLen) return 1e5; if(ct === winLen - 1) return es === 2 ? 1e4 : (es === 1 ? 1e3 : 0); if(ct === winLen - 2) return es === 2 ? 1e3 : (es === 1 ? 100 : 0); if(ct === winLen - 3) return es === 2 ? 100 : 0; return 0; }
function hasNeighbor(r, c) { for(let i=r-2; i<=r+2; i++) { for(let j=c-2; j<=c+2; j++) { if(isValid(i,j) && board[i][j]!==EMPTY) return true; } } return false; }
function isValid(r, c) { return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE; }
function isZoneRestricted(r, c, p) { for(let z of territoryZones) { if (Math.abs(z.r - r) <= 1 && Math.abs(z.c - c) <= 1 && z.owner !== p) { return true; } } return false; }
function checkWin(r, c, p) { const d = [[0,1], [1,0], [1,1], [1,-1]]; const limit = shortBattleTurns > 0 ? 4 : 5; for(let k of d) { let ct = 1; let line = [{r,c}]; let i = r + k[0], j = c + k[1]; while(isValid(i,j) && board[i][j] === p) { line.push({r:i, c:j}); i += k[0]; j += k[1]; ct++; } i = r - k[0]; j = c - k[1]; while(isValid(i,j) && board[i][j] === p) { line.push({r:i, c:j}); i -= k[0]; j -= k[1]; ct++; } if(ct >= limit) return line; } return null; }
function startBombTimer() { if(bombInterval) clearInterval(bombInterval); bombInterval = setInterval(() => { if(!gameActive) return; if(currentPlayer !== bombOwner) { bombTime--; const m = Math.floor(bombTime/60).toString().padStart(2,'0'); const s = (bombTime%60).toString().padStart(2,'0'); document.getElementById('bombTimer').innerText=`${m}:${s}`; if(bombTime <= 0) handleMatchEnd(bombOwner); } }, 1000); }
function triggerExplosion() { gameActive = false; SoundEngine.playExplosion(); const overlay = document.getElementById('explosionOverlay'); overlay.classList.add('explosion-anim'); setTimeout(() => { overlay.classList.remove('explosion-anim'); const loser = bombTarget; const winner = loser === MAPLE ? SUN : MAPLE; handleMatchEnd(winner); }, 2000); }
function handleMatchEnd(winSide) { gameActive = false; clearInterval(bombInterval); clearInterval(gameTicker); clearTimeout(aiTimer); SoundEngine.switchTrack(userMusicPref); const cBtn = (t,f,p) => { const b=document.createElement('button'); b.className=p?'btn primary':'btn secondary'; b.innerText=t; b.onclick=f; return b; }; const bc = document.getElementById('endGameButtons'); bc.innerHTML = ''; let title = ""; if (gameMode === 'pve' && winSide !== humanSide) { SoundEngine.playError(); title = `${ICONS[winSide]} ${t('lose', 'end')}`; } else { title = `${ICONS[winSide]} ${t('names')[winSide]} ${t('win', 'end')}`; } if (isBO3) { const winner = playerSides[winSide]; winner === 'p1' ? p1Score++ : p2Score++; updateScoreBoard(); chooser = (winner === 'p1') ? 'p2' : 'p1'; if ((winner==='p1'?p1Score:p2Score) >= 2) { SoundEngine.playGrandWin(); title = `${t('grandWin', 'end')}<br><span style="font-size:0.6em;color:#666">${t('grandWinDesc', 'end').replace('{name}', winner.toUpperCase())}</span>`; bc.appendChild(cBtn(t('btnMenu', 'end'), goToMenu, true)); } else { bc.appendChild(cBtn(t('btnNext', 'end'), () => enterTurnSelection('pvp', null), true)); bc.appendChild(cBtn(t('btnQuitMatch', 'end'), goToMenu, false)); } } else { const restartAction = (gameMode==='pve')?()=>enterTurnSelection('pve',aiDifficulty):()=>enterTurnSelection('pvp-single',null); bc.appendChild(cBtn(t('btnRestart', 'end'), restartAction, true)); bc.appendChild(cBtn(t('btnMenu', 'end'), goToMenu, false)); } const wt = document.getElementById('winnerText'); wt.innerHTML = title; wt.style.color = winSide === MAPLE ? '#d32f2f' : '#fbc02d'; document.getElementById('winnerModal').style.display = 'flex'; }
function undoMove() { if (isBO3) { showToast(t('undoPvP', 'toast')); return; } if (historyStack.length === 0) return; if(selectedCell) { selectedCell=null; } winLineAnim = null; const state = historyStack.pop(); restoreState(state); if (bombTarget !== null && currentPlayer !== bombTarget) { SoundEngine.switchTrack(userMusicPref); } if (gameMode === 'pve') { clearTimeout(aiTimer); if (historyStack.length > 0) { const state2 = historyStack.pop(); restoreState(state2); } } gameActive = true; document.getElementById('winnerModal').style.display='none'; showToast(t('undoDone', 'toast')); }