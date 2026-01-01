// ================= 游戏状态管理 (Game State Management) =================
// [Alpha 0.7.8.2] 集中式状态管理系统
// 统一管理所有游戏状态，提供状态重置、快照、恢复等功能
// 为未来的存档/读档、回放、统计等功能打下基础

// 游戏常量
const BOARD_SIZE = 15, EMPTY = 0, MAPLE = 1, SUN = 2, CORRODED = -1;

// 技能 ID 列表
const SKILL_IDS = ['double','voodoo','move_self','move_enemy','zone','bomb','god_hand','chaos','short_battle','swap'];

// ================= 集中式狀態管理 (State Management) =================
// [Alpha 0.7.8.0] 引入 GameState 對象，統一管理所有遊戲狀態
// 優點：
// 1. 清晰的命名空間，避免全局變量污染
// 2. 方便狀態重置和快照
// 3. 易於調試和維護
// 4. 為未來的狀態持久化（存檔/讀檔）打下基礎

const GameState = {
    // === 核心遊戲狀態 ===
    board: [],
    currentPlayer: MAPLE,
    gameActive: false,
    
    // === 模式與配置 ===
    gameMode: 'pvp',        // 'pvp' | 'pve'
    aiDifficulty: 'medium', // 'easy' | 'medium' | 'hard' | 'master'
    isBO3: false,
    humanSide: MAPLE,
    
    // === 計分系統 ===
    p1Score: 0,
    p2Score: 0,
    playerSides: { [MAPLE]: 'p1', [SUN]: 'p2' },
    chooser: 'p1',
    
    // === 技能系統 ===
    playerSkills: { [MAPLE]: null, [SUN]: null },
    skillUsed: { [MAPLE]: false, [SUN]: false },
    activeEffect: null,
    effectData: {},
    isDoubleMoveActive: false,
    
    // === 技能效果狀態 ===
    territoryZones: [],
    chaosDebuff: { [MAPLE]: 0, [SUN]: 0 },
    shortBattleTurns: 0,
    bombTarget: null,
    bombActive: false,
    bombOwner: null,
    bombTime: 150,
    
    // === 計時系統 ===
    timeRemaining: { [MAPLE]: 240, [SUN]: 240 },
    gameTicker: null,
    aiTimer: null,
    bombInterval: null,
    
    // === 歷史記錄（悔棋） ===
    historyStack: [],
    
    // === UI 交互狀態 ===
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
    
    // === 用戶偏好設置 ===
    userMusicPref: 'origin',
    currentSkin: 'classic',
    currentBoardSkin: 'classic_wood',  // [Alpha 0.7.9.0] 棋盘皮肤
    
    // [Alpha 0.7.9.3] 棋子特效设置（每款棋子独立保存）
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
        }
    },
    winEffect: 'default',
    winCelebration: 'default',
    currentSeason: 'spring',
    fpsLimit: '60',  // '60' | 'unlimited' - 默認 60 幀保護低配設備
    boardShakeEnabled: false,  // [Alpha 0.7.9.3] 棋盘震动开关，默认关闭
    djIndicatorEnabled: false, // [Alpha 0.7.9.3] DJ提示器开关，默认关闭
    statusScrollMode: 'auto', // 'auto' | 'manual'
    statusScrollOpen: false,
    statusScrollAutoOpened: false,
    statusScrollLastCount: 0,
    statusScrollLastKey: '',
    statusScrollRenderTimer: null,
    
    // === 狀態管理方法 ===
    
    // 重置遊戲狀態（開始新局）
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
        
        // 清理計時器
        if (this.gameTicker) clearInterval(this.gameTicker);
        if (this.aiTimer) clearTimeout(this.aiTimer);
        if (this.bombInterval) clearInterval(this.bombInterval);
        this.gameTicker = null;
        this.aiTimer = null;
        this.bombInterval = null;
    },
    
    // 重置比賽狀態（BO3 新賽季）
    resetMatch: function() {
        this.p1Score = 0;
        this.p2Score = 0;
        this.chooser = 'p1';
        this.isBO3 = false;
    },
    
    // 創建狀態快照（用於悔棋）
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
    
    // 恢復狀態快照
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

// === 向後兼容層：保留舊的全局變量引用 ===
// 這些變量現在指向 GameState 的屬性，確保現有代碼無需修改即可運行
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
