// ================= 游戏状态管理 (Game State Management) =================
// [Alpha 0.7.8.2] 集中式状态管理系统
// 统一管理所有游戏状态，提供状态重置、快照、恢复等功能
// 为未来的存档/读档、回放、统计等功能打下基础

// 游戏常量
const BOARD_SIZE = 15, EMPTY = 0, MAPLE = 1, SUN = 2, CORRODED = -1;

// 技能 ID 列表
const SKILL_IDS = ['double','voodoo','move_self','move_enemy','zone','bomb','god_hand','chaos','short_battle','swap'];

// ================= 状态同步映射表 (State Sync Mapping) =================
// [Alpha 0.7.9.6] 使用Proxy实现自动同步，消除手动同步错误
// 定义GameState属性与全局变量的映射关系
const STATE_SYNC_MAP = {
    board: 'board',
    currentPlayer: 'currentPlayer',
    gameActive: 'gameActive',
    gameMode: 'gameMode',
    aiDifficulty: 'aiDifficulty',
    isBO3: 'isBO3',
    humanSide: 'humanSide',
    p1Score: 'p1Score',
    p2Score: 'p2Score',
    playerSides: 'playerSides',
    chooser: 'chooser',
    playerSkills: 'playerSkills',
    skillUsed: 'skillUsed',
    activeEffect: 'activeEffect',
    effectData: 'effectData',
    territoryZones: 'territoryZones',
    isDoubleMoveActive: 'isDoubleMoveActive',
    chaosDebuff: 'chaosDebuff',
    shortBattleTurns: 'shortBattleTurns',
    bombTarget: 'bombTarget',
    bombActive: 'bombActive',
    bombOwner: 'bombOwner',
    bombTime: 'bombTime',
    bombInterval: 'bombInterval',
    timeRemaining: 'timeRemaining',
    gameTicker: 'gameTicker',
    aiTimer: 'aiTimer',
    historyStack: 'historyStack',
    selectedCell: 'selectedCell',
    userMusicPref: 'userMusicPref',
    currentSkin: 'currentSkin',
    currentBoardSkin: 'currentBoardSkin',
    currentPieceTheme: 'currentPieceTheme',
    pieceEffectSettings: 'pieceEffectSettings',
    winEffect: 'winEffect',
    winCelebration: 'winCelebration',
    currentSeason: 'currentSeason',
    draftTurn: 'draftTurn',
    fpsLimit: 'fpsLimit',
    boardShakeEnabled: 'boardShakeEnabled',
    djIndicatorEnabled: 'djIndicatorEnabled',
    statusScrollMode: 'statusScrollMode',
    statusScrollOpen: 'statusScrollOpen',
    statusScrollAutoOpened: 'statusScrollAutoOpened',
    statusScrollLastCount: 'statusScrollLastCount',
    statusScrollLastKey: 'statusScrollLastKey',
    statusScrollRenderTimer: 'statusScrollRenderTimer',
    lastMove: 'lastMove',
    moveCount: 'moveCount'
};

// ================= 集中式状态管理 (State Management) =================
// [Alpha 0.7.8.0] 引入 GameState 对象，统一管理所有游戏状态
// 优点：
// 1. 清晰的命名空间，避免全局变量污染
// 2. 方便状态重置和快照
// 3. 易于调试和维护
// 4. 为未来的状态持久化（存档/读档）打下基础

// [Alpha 0.7.9.6] 使用Proxy包装，实现自动同步到全局变量
const _GameStateRaw = {
    // === 核心游戏状态 ===
    board: [],
    currentPlayer: MAPLE,
    gameActive: false,
    
    // === 模式与配置 ===
    gameMode: 'pvp',        // 'pvp' | 'pve'
    aiDifficulty: 'medium', // 'easy' | 'medium' | 'hard' | 'master'
    isBO3: false,
    humanSide: MAPLE,
    
    // === 计分系统 ===
    p1Score: 0,
    p2Score: 0,
    playerSides: { [MAPLE]: 'p1', [SUN]: 'p2' },
    chooser: 'p1',
    
    // === 技能系统 ===
    playerSkills: { [MAPLE]: null, [SUN]: null },
    skillUsed: { [MAPLE]: false, [SUN]: false },
    activeEffect: null,
    effectData: {},
    isDoubleMoveActive: false,
    
    // === 技能效果状态 ===
    territoryZones: [],
    chaosDebuff: { [MAPLE]: 0, [SUN]: 0 },
    shortBattleTurns: 0,
    bombTarget: null,
    bombActive: false,
    bombOwner: null,
    bombTime: 150,
    
    // === 计时系统 ===
    timeRemaining: { [MAPLE]: 240, [SUN]: 240 },
    gameTicker: null,
    aiTimer: null,
    bombInterval: null,
    
    // === 历史记录（悔棋） ===
    historyStack: [],
    
    // === UI 交互状态 ===
    selectedCell: null,
    draftTurn: SUN,
    
    // === [Alpha 0.7.9.0] 落子锁定系统 ===
    lastMove: null,  // { r, c, player } 记录最后一颗落子的位置和玩家
    moveCount: 0,    // 落子计数，用于判断是否显示锁定标记（从第2颗开始显示）
    
    // === [联网对战] 在线状态 ===
    online: {
        isOnline: false,         // 是否联网模式
        roomId: null,            // 当前房间号
        myColor: null,           // 'black' | 'white'
        opponentNickname: null,  // 对手昵称
        opponentPieceStyle: null // 对手棋子样式
    },
    
    // === 用户偏好设置 ===
    userMusicPref: 'origin',
    currentSkin: 'classic',
    currentBoardSkin: 'classic_wood',  // [Alpha 0.7.9.0] 棋盘皮肤
    currentPieceTheme: 'classic',      // [Alpha 0.7.9.6] 棋子主题: 'classic' | 'nature' | 'ice_fire' | 'holy_evil'
    
    // [Alpha 0.7.9.3] 棋子特效设置（每款棋子独立保存）
    // [Alpha 0.7.9.6] 扩展支持冰火、圣邪主题
    pieceEffectSettings: {
        classic: {
            texture: '3d',             // 棋子质感: '3d'(立体) | 'flat'(扁平)，默认立体
            rippleEnabled: false,      // 波纹气场，默认关
            bounceEnabled: false,      // 棋子回弹，默认关
            dropStyle: 'fast'          // 落子速度: 'fast'(快) | 'slow'(慢)，默认快
        },
        nature: {
            effectEnabled: false,      // 自然特效（落叶/光芒），默认关
            bounceEnabled: false,      // 棋子回弹，默认关
            dropStyle: 'fast'          // 落子速度: 'fast'(快) | 'slow'(慢)，默认快
        },
        // [Alpha 0.7.9.6] 冰/火主题特效设置
        ice_fire: {
            dropStyle: 'fast',         // 落子速度: 'fast'(快) | 'slow'(慢)，默认快
            bounceEnabled: false,      // 棋子回弹，默认关
            staticAnimEnabled: true,   // 静态动效（冰晶闪烁/火焰摇曳），默认开
            dropEffectEnabled: true    // 落子特效（粒子波纹），默认开
        },
        // [Alpha 0.7.9.6] 神圣/邪恶主题特效设置
        holy_evil: {
            intensity: 'medium'        // 特效强度: 'off' | 'low' | 'medium' | 'high'
        }
    },
    winEffect: 'default',
    winCelebration: 'default',
    currentSeason: 'spring',
    fpsLimit: '60',  // '60' | 'unlimited' - 默认 60 帧保护低配设备
    boardShakeEnabled: false,  // [Alpha 0.7.9.3] 棋盘震动开关，默认关闭
    djIndicatorEnabled: false, // [Alpha 0.7.9.3] DJ提示器开关，默认关闭
    statusScrollMode: 'auto', // 'auto' | 'manual'
    statusScrollOpen: false,
    statusScrollAutoOpened: false,
    statusScrollLastCount: 0,
    statusScrollLastKey: '',
    statusScrollRenderTimer: null,
    
    // === 状态管理方法 ===
    
    // 重置游戏状态（开始新局）
    resetGame: function() {
        this.board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
        this.currentPlayer = MAPLE;
        this.gameActive = true;
        this.historyStack = [];
        this.skillUsed = { [MAPLE]: false, [SUN]: false };
        this.activeEffect = null;
        this.effectData = {};
        this.territoryZones = [];
        this.isDoubleMoveActive = false;
        this.chaosDebuff = { [MAPLE]: 0, [SUN]: 0 };
        this.shortBattleTurns = 0;
        this.timeRemaining = { [MAPLE]: 240, [SUN]: 240 };
        this.selectedCell = null;
        this.bombTarget = null;
        this.bombActive = false;
        this.bombOwner = null;
        this.bombTime = 150;
        
        // [Alpha 0.7.9.0] 重置落子锁定状态
        this.lastMove = null;
        this.moveCount = 0;
        
        // 清理计时器
        if (this.gameTicker) clearInterval(this.gameTicker);
        if (this.aiTimer) clearTimeout(this.aiTimer);
        if (this.bombInterval) clearInterval(this.bombInterval);
        this.gameTicker = null;
        this.aiTimer = null;
        this.bombInterval = null;
    },
    
    // 重置比赛状态（BO3 新赛季）
    resetMatch: function() {
        this.p1Score = 0;
        this.p2Score = 0;
        this.chooser = 'p1';
        this.isBO3 = false;
    },
    
    // 创建状态快照（用于悔棋）
    createSnapshot: function() {
        return {
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer,
            skillUsed: JSON.parse(JSON.stringify(this.skillUsed)),
            territoryZones: JSON.parse(JSON.stringify(this.territoryZones)),
            chaosDebuff: JSON.parse(JSON.stringify(this.chaosDebuff)),
            shortBattleTurns: this.shortBattleTurns,
            timeRemaining: JSON.parse(JSON.stringify(this.timeRemaining)),
            bombTarget: this.bombTarget,
            activeEffect: this.activeEffect,
            effectData: JSON.parse(JSON.stringify(this.effectData)),
            isDoubleMoveActive: this.isDoubleMoveActive,
            bombActive: this.bombActive,
            bombOwner: this.bombOwner,
            bombTime: this.bombTime,
            selectedCell: this.selectedCell ? { r: this.selectedCell.r, c: this.selectedCell.c } : null,
            // [Alpha 0.7.9.0] 落子锁定状态
            lastMove: this.lastMove ? { r: this.lastMove.r, c: this.lastMove.c, player: this.lastMove.player } : null,
            moveCount: this.moveCount
        };
    },
    
    // 恢复状态快照
    restoreSnapshot: function(snapshot) {
        this.board = snapshot.board;
        this.currentPlayer = snapshot.currentPlayer;
        this.skillUsed = snapshot.skillUsed;
        this.territoryZones = snapshot.territoryZones;
        this.chaosDebuff = snapshot.chaosDebuff;
        this.shortBattleTurns = snapshot.shortBattleTurns;
        this.timeRemaining = snapshot.timeRemaining;
        this.bombTarget = snapshot.bombTarget;
        this.activeEffect = snapshot.activeEffect || null;
        this.effectData = snapshot.effectData || {};
        this.isDoubleMoveActive = snapshot.isDoubleMoveActive || false;
        this.bombActive = snapshot.bombActive || false;
        this.bombOwner = snapshot.bombOwner || null;
        this.bombTime = snapshot.bombTime != null ? snapshot.bombTime : 150;
        this.selectedCell = snapshot.selectedCell ? { r: snapshot.selectedCell.r, c: snapshot.selectedCell.c } : null;
        // [Alpha 0.7.9.0] 恢复落子锁定状态
        this.lastMove = snapshot.lastMove ? { r: snapshot.lastMove.r, c: snapshot.lastMove.c, player: snapshot.lastMove.player } : null;
        this.moveCount = snapshot.moveCount != null ? snapshot.moveCount : 0;
    }
};

// ================= Proxy 自动同步系统 =================
// [Alpha 0.7.9.6] 使用Proxy实现自动同步，消除手动同步错误
// 原理：拦截GameState的set操作，自动同步到对应的全局变量

// 创建Proxy包装器
const GameState = new Proxy(_GameStateRaw, {
    // 拦截属性设置操作
    set: function(target, prop, value) {
        // 设置原始值
        target[prop] = value;
        
        // 查找对应的全局变量名
        const globalVarName = STATE_SYNC_MAP[prop];
        
        // 如果存在映射关系，自动同步到全局变量
        if (globalVarName) {
            window[globalVarName] = value;
        }
        
        // 返回true表示设置成功
        return true;
    },
    
    // 拦截属性获取操作（可选，用于调试）
    get: function(target, prop) {
        return target[prop];
    },
    
    // 拦截属性删除操作
    deleteProperty: function(target, prop) {
        // 删除原始值
        delete target[prop];
        
        // 删除对应的全局变量
        const globalVarName = STATE_SYNC_MAP[prop];
        if (globalVarName) {
            delete window[globalVarName];
        }
        
        // 返回true表示删除成功
        return true;
    }
});

// === 向后兼容层：保留旧的全局变量引用 ===
// [Alpha 0.7.9.6] 现在这些变量由Proxy自动同步，无需手动同步
// 这些变量现在指向 GameState 的属性，确保现有代码无需修改即可运行
let board = GameState.board;
let currentPlayer = GameState.currentPlayer;
let gameMode = GameState.gameMode;
let aiDifficulty = GameState.aiDifficulty;
let gameActive = GameState.gameActive;
let isBO3 = GameState.isBO3;
let p1Score = GameState.p1Score;
let p2Score = GameState.p2Score;
let playerSides = GameState.playerSides;
let chooser = GameState.chooser;
let humanSide = GameState.humanSide;
let playerSkills = GameState.playerSkills;
let skillUsed = GameState.skillUsed;
let activeEffect = GameState.activeEffect;
let effectData = GameState.effectData;
let territoryZones = GameState.territoryZones;
let isDoubleMoveActive = GameState.isDoubleMoveActive;
let chaosDebuff = GameState.chaosDebuff;
let shortBattleTurns = GameState.shortBattleTurns;
let bombActive = GameState.bombActive;
let bombOwner = GameState.bombOwner;
let bombTime = GameState.bombTime;
let bombInterval = GameState.bombInterval;
let timeRemaining = GameState.timeRemaining;
let gameTicker = GameState.gameTicker;
let aiTimer = GameState.aiTimer;
let historyStack = GameState.historyStack;
let selectedCell = GameState.selectedCell;
let bombTarget = GameState.bombTarget;
let userMusicPref = GameState.userMusicPref;
let currentSkin = GameState.currentSkin;
let currentBoardSkin = GameState.currentBoardSkin;  // [Alpha 0.7.9.0] 棋盘皮肤
let currentPieceTheme = GameState.currentPieceTheme;  // [Alpha 0.7.9.6] 棋子主题
let pieceEffectSettings = GameState.pieceEffectSettings;  // [Alpha 0.7.9.3] 棋子特效设置
let winEffect = GameState.winEffect;
let winCelebration = GameState.winCelebration;
let currentSeason = GameState.currentSeason;
let draftTurn = GameState.draftTurn;
let fpsLimit = GameState.fpsLimit;
let boardShakeEnabled = GameState.boardShakeEnabled;  // [Alpha 0.7.9.3] 棋盘震动开关
let djIndicatorEnabled = GameState.djIndicatorEnabled; // [Alpha 0.7.9.3] DJ提示器开关
let statusScrollMode = GameState.statusScrollMode;
let statusScrollOpen = GameState.statusScrollOpen;
let statusScrollAutoOpened = GameState.statusScrollAutoOpened;
let statusScrollLastCount = GameState.statusScrollLastCount;
let statusScrollLastKey = GameState.statusScrollLastKey;
let statusScrollRenderTimer = GameState.statusScrollRenderTimer;

// [Alpha 0.7.9.0] 落子锁定系统
let lastMove = GameState.lastMove;
let moveCount = GameState.moveCount;
