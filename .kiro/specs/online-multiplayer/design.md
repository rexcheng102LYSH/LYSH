# 联网对战技术设计文档

## 架构概览

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│   玩家 A 浏览器  │ ◄─────────────────────────► │                 │
│   (前端 Client)  │                            │   Node.js 服务器 │
└─────────────────┘                            │   (Socket.IO)   │
                                               │                 │
┌─────────────────┐         WebSocket          │  ┌───────────┐  │
│   玩家 B 浏览器  │ ◄─────────────────────────► │  │ 房间管理器 │  │
│   (前端 Client)  │                            │  └───────────┘  │
└─────────────────┘                            │  ┌───────────┐  │
                                               │  │ 游戏逻辑  │  │
                                               │  └───────────┘  │
                                               └─────────────────┘
```

---

## 通信协议设计

### 事件命名规范
- 客户端 → 服务端：`client:xxx`
- 服务端 → 客户端：`server:xxx`
- 房间广播：`room:xxx`

### 核心事件列表

#### 房间管理

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `client:create_room` | C→S | `{ nickname }` | 创建房间 |
| `server:room_created` | S→C | `{ roomId, playerId }` | 房间创建成功 |
| `client:join_room` | C→S | `{ roomId, nickname }` | 加入房间 |
| `server:join_success` | S→C | `{ roomId, playerId, opponent }` | 加入成功 |
| `server:join_failed` | S→C | `{ reason }` | 加入失败 |
| `room:player_joined` | S→Room | `{ nickname, playerId }` | 通知房主有人加入 |
| `room:player_left` | S→Room | `{ playerId, reason }` | 玩家离开 |

#### 游戏流程

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `room:game_start` | S→Room | `{ blackPlayer, whitePlayer }` | 游戏开始 |
| `client:place_piece` | C→S | `{ row, col }` | 落子请求 |
| `room:piece_placed` | S→Room | `{ row, col, player }` | 落子广播 |
| `server:invalid_move` | S→C | `{ reason }` | 非法落子 |
| `room:game_over` | S→Room | `{ winner, winLine }` | 游戏结束 |
| `client:request_rematch` | C→S | `{}` | 请求再来一局 |
| `room:rematch_request` | S→Room | `{ fromPlayer }` | 再战请求广播 |
| `client:accept_rematch` | C→S | `{}` | 接受再战 |
| `room:rematch_start` | S→Room | `{ blackPlayer }` | 再战开始 |

#### 技能系统

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `client:use_skill` | C→S | `{ skillId, targets? }` | 使用技能 |
| `server:skill_invalid` | S→C | `{ reason }` | 技能使用无效 |
| `room:skill_used` | S→Room | `{ player, skillId, targets?, result }` | 技能使用广播 |
| `room:skill_effect` | S→Room | `{ effectType, data }` | 技能效果广播（如炸弹爆炸） |
| `room:board_updated` | S→Room | `{ changes: [{row, col, value}] }` | 棋盘变化广播 |

#### 投降与悔棋

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `client:surrender` | C→S | `{}` | 投降请求 |
| `room:player_surrendered` | S→Room | `{ player }` | 玩家投降广播 |
| `client:request_undo` | C→S | `{}` | 请求悔棋 |
| `room:undo_requested` | S→Room | `{ fromPlayer }` | 悔棋请求广播 |
| `client:respond_undo` | C→S | `{ accept: boolean }` | 回应悔棋请求 |
| `room:undo_response` | S→Room | `{ accepted, byPlayer }` | 悔棋回应广播 |
| `room:undo_executed` | S→Room | `{ boardState, lastMove }` | 悔棋执行广播 |

#### 猜拳选边系统

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `room:rps_start` | S→Room | `{ timeout }` | 猜拳开始 |
| `client:rps_choice` | C→S | `{ choice: 'rock'|'paper'|'scissors' }` | 提交猜拳选择 |
| `room:rps_result` | S→Room | `{ playerA, playerB, choiceA, choiceB, winner }` | 猜拳结果 |
| `room:rps_tie` | S→Room | `{}` | 平局，重新猜拳 |
| `room:choose_side` | S→C | `{ timeout }` | 通知胜者选边 |
| `client:side_choice` | C→S | `{ side: 'black'|'white' }` | 提交选边 |
| `room:sides_decided` | S→Room | `{ blackPlayer, whitePlayer }` | 选边完成 |

#### 连接管理

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `client:reconnect` | C→S | `{ roomId, playerId }` | 断线重连 |
| `server:reconnect_success` | S→C | `{ boardState, currentTurn, skillsUsed }` | 重连成功 |
| `server:reconnect_failed` | S→C | `{ reason }` | 重连失败 |
| `room:opponent_disconnected` | S→Room | `{ timeout }` | 对手断线 |
| `room:opponent_reconnected` | S→Room | `{}` | 对手重连 |

---

## 数据结构设计

### 房间对象 (Room)

```javascript
Room = {
    id: string,              // 6位纯数字房间号，如 "385621"
    status: 'waiting' | 'rps' | 'choosing_side' | 'playing' | 'finished',
    
    players: {
        host: {              // 房主（创建房间的人）
            id: string,      // Socket ID
            nickname: string,
            connected: boolean,
            disconnectTime: number | null,
            pieceStyle: string  // 棋子样式，如 'classic', 'nature'
        },
        guest: {             // 加入者
            id: string,
            nickname: string,
            connected: boolean,
            disconnectTime: number | null,
            pieceStyle: string
        },
        black: null,         // 游戏开始后指向 host 或 guest
        white: null
    },
    
    // 猜拳系统
    rps: {
        hostChoice: null,    // 'rock' | 'paper' | 'scissors'
        guestChoice: null,
        winner: null,        // 'host' | 'guest' | null
        round: 1             // 当前猜拳轮次（平局时递增）
    },
    
    game: {
        board: number[][],   // 0=空, 1=黑, 2=白, 3=领地黑, 4=领地白, 5=炸弹
        currentTurn: 'black' | 'white',
        moveHistory: Array<{ row, col, player, skillId? }>,
        startTime: number,
        lastMoveTime: number,
        
        // 技能相关状态
        skillUsed: { black: false, white: false },
        bombs: Array<{ row, col, player, turnsLeft }>,
        zones: Array<{ row, col, player }>,
        voodoo: Array<{ row, col, turnsLeft }>,
        activeEffect: string | null,
        
        // 悔棋相关
        undoUsed: { black: false, white: false },  // 每方只能悔棋一次
        undoPending: null    // 'black' | 'white' | null，谁在请求悔棋
    },
    
    // BO3 模式
    match: {
        mode: 'single' | 'bo3',
        scores: { host: 0, guest: 0 },
        currentGame: 1       // 当前第几局
    },
    
    createdAt: number,
    settings: {
        timeLimit: number,
        skillsEnabled: true
    }
}
```

### 客户端状态扩展

```javascript
// 新增到 GameState
GameState.online = {
    isOnline: false,         // 是否联网模式
    roomId: null,            // 当前房间号（6位数字）
    playerId: null,          // 本机 Socket ID
    role: null,              // 'host' | 'guest'
    myColor: null,           // 'black' | 'white'
    opponentNickname: null,  // 对手昵称
    opponentPieceStyle: null,// 对手棋子样式
    connectionStatus: 'disconnected' | 'connecting' | 'connected',
    socket: null,            // Socket.IO 实例
    
    // 技能状态
    mySkillUsed: false,
    opponentSkillUsed: false,
    
    // 悔棋状态
    myUndoUsed: false,       // 我方是否已用过悔棋
    opponentUndoUsed: false, // 对方是否已用过悔棋
    undoPending: false,      // 是否有悔棋请求待处理
    
    // 猜拳状态
    rpsPhase: false,         // 是否在猜拳阶段
    myRpsChoice: null,       // 我的猜拳选择
    iWonRps: false,          // 我是否赢了猜拳
    
    // BO3 状态
    matchMode: 'single',     // 'single' | 'bo3'
    scores: { me: 0, opponent: 0 },
    currentGame: 1
}
```

---

## 文件结构设计

### 后端 (新增)

```
server/
├── package.json           # Node.js 依赖配置
├── index.js               # 主入口，Express + Socket.IO 初始化
├── config.js              # 配置文件（端口、超时时间等）
├── roomManager.js         # 房间管理器
│   ├── createRoom()
│   ├── joinRoom()
│   ├── leaveRoom()
│   ├── getRoom()
│   └── cleanupRooms()     # 定时清理过期房间
├── gameLogic.js           # 游戏逻辑（服务端）
│   ├── isValidMove()
│   ├── checkWin()
│   └── getBoardState()
└── socketHandlers.js      # Socket 事件处理器
    ├── handleCreateRoom()
    ├── handleJoinRoom()
    ├── handlePlacePiece()
    └── handleDisconnect()
```

### 前端 (新增/修改)

```
js/
├── network/                    # 新增目录
│   ├── socket_client.js        # Socket.IO 客户端封装
│   │   ├── connect()
│   │   ├── disconnect()
│   │   ├── emit()
│   │   └── on()
│   ├── online_game.js          # 联网游戏逻辑
│   │   ├── createRoom()
│   │   ├── joinRoom()
│   │   ├── sendMove()
│   │   ├── handleOpponentMove()
│   │   └── handleGameOver()
│   └── online_ui.js            # 联网 UI 组件
│       ├── showRoomDialog()
│       ├── showWaitingScreen()
│       ├── updateConnectionStatus()
│       └── showDisconnectWarning()
│
├── game/
│   └── game_core.js            # 修改：添加联网模式分支
│       └── handleCellClick()   # 联网时调用 sendMove()
```

### HTML/CSS (修改)

```
index.html                      # 添加联网相关 UI 元素
├── #online-menu                # 联网菜单入口
├── #room-dialog                # 创建/加入房间弹窗
├── #waiting-screen             # 等待对手界面
└── #connection-status          # 连接状态指示器

style.css                       # 添加联网 UI 样式
├── .online-menu
├── .room-dialog
├── .waiting-screen
└── .connection-indicator
```

---

## 核心流程图

### 猜拳选边流程（单局/BO3第1局）

```
玩家A (房主)              服务器                  玩家B (加入者)
  │                        │                        │
  │                        │◄──client:join_room─────│
  │◄──room:player_joined───│──server:join_success──►│
  │                        │                        │
  │                        │ 进入猜拳阶段            │
  │◄────room:rps_start─────│─────room:rps_start────►│
  │    { timeout: 10 }     │                        │
  │                        │                        │
  │──client:rps_choice────►│                        │
  │   { choice: 'rock' }   │                        │
  │                        │◄──client:rps_choice────│
  │                        │   { choice: 'scissors'}│
  │                        │                        │
  │                        │ 判定结果：A 胜          │
  │◄────room:rps_result────│────room:rps_result────►│
  │  { winner: 'host' }    │                        │
  │                        │                        │
  │◄───room:choose_side────│                        │
  │   { timeout: 10 }      │ 通知 A 选边            │
  │                        │                        │
  │──client:side_choice───►│                        │
  │   { side: 'black' }    │                        │
  │                        │                        │
  │◄───room:sides_decided──│───room:sides_decided──►│
  │  { blackPlayer: A,     │                        │
  │    whitePlayer: B }    │                        │
  │                        │                        │
  │◄────room:game_start────│────room:game_start────►│
  │                        │                        │
```

### 猜拳平局处理

```
玩家A                    服务器                    玩家B
  │                        │                        │
  │──client:rps_choice────►│◄──client:rps_choice────│
  │   { choice: 'rock' }   │   { choice: 'rock' }   │
  │                        │                        │
  │                        │ 判定结果：平局          │
  │◄──────room:rps_tie─────│──────room:rps_tie─────►│
  │                        │                        │
  │◄────room:rps_start─────│─────room:rps_start────►│
  │    { round: 2 }        │ 重新猜拳               │
  │                        │                        │
```

### 创建房间并开始游戏

```
玩家A                    服务器                    玩家B
  │                        │                        │
  │──client:create_room───►│                        │
  │                        │ 生成房间号 A3F8K2       │
  │◄─server:room_created───│                        │
  │                        │                        │
  │   (分享房间号给玩家B)    │                        │
  │                        │                        │
  │                        │◄──client:join_room─────│
  │                        │ 验证房间存在            │
  │◄──room:player_joined───│──server:join_success──►│
  │                        │                        │
  │                        │ 随机分配黑白            │
  │◄────room:game_start────│────room:game_start────►│
  │                        │                        │
```

### 落子同步

```
玩家A (黑方)              服务器                  玩家B (白方)
  │                        │                        │
  │──client:place_piece───►│                        │
  │     { row:7, col:7 }   │ 验证合法性              │
  │                        │ 更新棋盘                │
  │                        │ 检查胜负                │
  │◄───room:piece_placed───│───room:piece_placed───►│
  │  { row:7, col:7,       │                        │
  │    player:'black' }    │                        │
  │                        │                        │
  │                        │◄──client:place_piece───│
  │                        │     { row:7, col:8 }   │
  │◄───room:piece_placed───│───room:piece_placed───►│
  │                        │                        │
```

### 断线重连

```
玩家A                    服务器                    玩家B
  │                        │                        │
  │ ──── 网络断开 ────      │                        │
  │                        │ 检测到断线              │
  │                        │───room:opponent_───────►│
  │                        │   disconnected         │
  │                        │   { timeout: 30 }      │
  │                        │                        │
  │ ──── 网络恢复 ────      │                        │
  │──client:reconnect─────►│                        │
  │  { roomId, playerId }  │ 验证身份               │
  │◄─server:reconnect_────│                        │
  │   success              │                        │
  │  { boardState }        │───room:opponent_──────►│
  │                        │   reconnected          │
  │                        │                        │
```

### 投降流程

```
玩家A                    服务器                    玩家B
  │                        │                        │
  │ 点击【投降】按钮        │                        │
  │ 弹窗确认"是否投降？"    │                        │
  │ 选择【是】              │                        │
  │                        │                        │
  │──client:surrender─────►│                        │
  │                        │ 记录 A 投降            │
  │                        │ 判定 B 获胜            │
  │◄─room:player_surrendered─│─room:player_surrendered─►│
  │  { player: 'A' }       │                        │
  │                        │                        │
  │◄────room:game_over─────│─────room:game_over────►│
  │  { winner: 'B',        │                        │
  │    reason: 'surrender'}│                        │
```

### 悔棋请求流程

```
玩家A                    服务器                    玩家B
  │                        │                        │
  │ 点击【悔棋】按钮        │                        │
  │──client:request_undo──►│                        │
  │                        │ 检查 A 是否已用过悔棋   │
  │                        │ 设置 undoPending = A   │
  │                        │───room:undo_requested─►│
  │                        │   { fromPlayer: 'A' }  │
  │                        │                        │
  │                        │ B 看到悔棋请求弹窗      │
  │                        │ B 选择【同意】或【拒绝】│
  │                        │                        │
  │                        │◄─client:respond_undo───│
  │                        │   { accept: true }     │
  │                        │                        │
  │◄───room:undo_response──│───room:undo_response──►│
  │  { accepted: true }    │                        │
  │                        │                        │
  │                        │ 执行悔棋，回退一步      │
  │                        │ 标记 A 已用悔棋         │
  │◄───room:undo_executed──│───room:undo_executed──►│
  │  { boardState,         │                        │
  │    lastMove }          │                        │
```

---

## 服务端核心代码框架

### index.js (主入口)

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const RoomManager = require('./roomManager');
const setupSocketHandlers = require('./socketHandlers');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST']
    }
});

const roomManager = new RoomManager();

// 设置 Socket 事件处理
setupSocketHandlers(io, roomManager);

// 定时清理过期房间
setInterval(() => {
    roomManager.cleanupRooms();
}, config.cleanupInterval);

httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
```

### roomManager.js (房间管理)

```javascript
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    
    generateRoomId() {
        // 生成 6 位纯数字房间号
        let id;
        do {
            id = String(Math.floor(100000 + Math.random() * 900000));
        } while (this.rooms.has(id));
        return id;
    }
    
    createRoom(hostSocketId, nickname) {
        const roomId = this.generateRoomId();
        const room = {
            id: roomId,
            status: 'waiting',
            players: {
                black: { id: hostSocketId, nickname, connected: true },
                white: null
            },
            game: null,
            createdAt: Date.now()
        };
        this.rooms.set(roomId, room);
        return room;
    }
    
    joinRoom(roomId, socketId, nickname) {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, reason: 'room_not_found' };
        if (room.status !== 'waiting') return { success: false, reason: 'room_full' };
        
        room.players.white = { id: socketId, nickname, connected: true };
        room.status = 'playing';
        room.game = this.initGame();
        
        return { success: true, room };
    }
    
    initGame() {
        return {
            board: Array(15).fill(null).map(() => Array(15).fill(0)),
            currentTurn: 'black',
            moveHistory: [],
            startTime: Date.now()
        };
    }
    
    // ... 更多方法
}
```

---

## 前端集成方案

### 与现有代码的集成点

#### 1. handleCellClick() 修改

```javascript
// game_core.js 中的修改
function handleCellClick(row, col) {
    // 联网模式分支
    if (GameState.online.isOnline) {
        // 检查是否轮到自己
        if (!isMyTurn()) {
            showToast('等待对手落子');
            return;
        }
        // 发送落子请求到服务器
        OnlineGame.sendMove(row, col);
        return;
    }
    
    // 原有本地逻辑保持不变
    // ...
}
```

#### 2. 接收对手落子

```javascript
// online_game.js
function handleOpponentMove(data) {
    const { row, col, player } = data;
    
    // 更新棋盘状态
    GameState.board[row][col] = player === 'black' ? 1 : 2;
    
    // 渲染棋子（复用现有函数）
    renderBoard();
    
    // 播放音效
    SoundEngine.playNote(440, 0.1, 'sine');
    
    // 切换回合
    GameState.currentPlayer = GameState.online.myColor;
    updateDynamicUI();
}
```

#### 3. UI 入口

```html
<!-- index.html 主菜单添加 -->
<button id="btn-online" onclick="OnlineUI.showRoomDialog()">
    🌐 联网对战
</button>
```

---

## 部署方案

### 开发阶段
1. 本地运行 Node.js 服务器 (`localhost:3000`)
2. 前端连接 `http://localhost:3000`
3. 使用 ngrok 暴露给朋友测试

### 生产部署选项

| 平台 | 优点 | 缺点 | 费用 |
|------|------|------|------|
| Render | 简单，支持 WebSocket | 免费版有冷启动 | 免费 / $7/月 |
| Railway | 部署快，界面友好 | 免费额度有限 | $5/月起 |
| Fly.io | 全球边缘节点 | 配置稍复杂 | 免费 / 按量 |
| 阿里云轻量 | 国内访问快 | 需要备案 | ¥30/月起 |

### 推荐方案
- **初期测试**：Render 免费版
- **正式上线**：Railway 或阿里云轻量服务器

---

## 安全考虑

### 服务端验证
1. **落子合法性**：检查坐标范围、位置是否为空、是否轮到该玩家
2. **身份验证**：通过 Socket ID 验证玩家身份
3. **房间权限**：只有房间内玩家可以操作

### 防作弊
1. 服务端维护权威棋盘状态
2. 客户端只能发送落子请求，不能直接修改状态
3. 胜负判定在服务端完成

### 防滥用
1. 房间创建频率限制
2. 房间自动过期清理
3. 连接数限制

---

## 测试计划

### 单元测试
- 房间创建/加入/销毁
- 落子合法性验证
- 胜负判定逻辑

### 集成测试
- 完整对局流程
- 断线重连流程
- 并发房间测试

### 手动测试清单
- [ ] 创建房间，获得房间号
- [ ] 另一浏览器加入房间
- [ ] 双方轮流落子，同步正常
- [ ] 五连后正确判定胜负
- [ ] 断开网络，30秒内重连成功
- [ ] 超时未重连，判定为认输
- [ ] 主动认输功能
- [ ] 再来一局功能
