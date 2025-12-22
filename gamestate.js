// ================= 遊戲狀態管理 (Game State Management) =================
// [Alpha 0.7.8.0] 集中式狀態管理系統
// 統一管理所有遊戲狀態，提供狀態重置、快照、恢復等功能
// 為未來的存檔/讀檔、回放、統計等功能打下基礎

// 遊戲常量
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
    
    // === 用戶偏好設置 ===
    userMusicPref: 'origin',
    currentSkin: 'classic',
    winEffect: 'default',
    winCelebration: 'default',
    currentSeason: 'spring',
    fpsLimit: '60',  // '60' | 'unlimited' - 默認 60 幀保護低配設備
    
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
            bombTarget: this.bombTarget
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
let winEffect = GameState.winEffect;
let winCelebration = GameState.winCelebration;
let currentSeason = GameState.currentSeason;
let draftTurn = GameState.draftTurn;
let fpsLimit = GameState.fpsLimit;