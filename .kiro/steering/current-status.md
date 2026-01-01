@ -1,288 +0,0 @@
# Project Lysh 当前状态总结

**更新时间**: 2024-12-29
**当前版本**: Alpha 0.7.8.9 - 模块化架构重构版

---

## 项目概况

Project Lysh 是一款基于原生 HTML5/CSS3/JavaScript 的现代化五子棋游戏，具备丰富的技能系统和视觉特效。项目目前处于 Alpha 阶段，核心功能已完成，正在进行架构优化和内容扩展。

---


## 技术栈

- **前端**: 原生 JavaScript (ES6+)、HTML5、CSS3
- **图形**: Canvas 2D API
- **音频**: Web Audio API + HTML5 Audio
- **架构**: Host + Plugins 模式、模块化设计
- **无构建工具**: 直接在浏览器运行

---

## 文件结构

### 前端文件结构

```
Project Lysh/
├── index.html              # 主入口
├── style.css               # 主样式表
├── pieces.css              # 棋子样式定义（立体/扁平/自然等）
├── gamestate.js            # 状态管理
├── ai.js                   # AI 入口
├── lang.js                 # 国际化
├── assets.js               # 资源定义
├── background.js           # 背景特效
│
├── js/
│   ├── audio/              # 音频系统
│   │   ├── audio_host.js
│   │   ├── audio_hub.js
│   │   ├── audio_sfx.js
│   │   └── audio_assets.js
│   │
│   ├── fx/                 # 视觉特效
│   │   ├── fx_host.js
│   │   ├── lines.js
│   │   └── winning/
│   │       ├── fireworks.js
│   │       ├── golden.js
│   │       └── dj.js
│   │
│   ├── game/               # 游戏逻辑
│   │   ├── game_host.js
│   │   ├── game_core.js
│   │   ├── game_ui.js
│   │   ├── game_render.js
│   │   ├── game_skills.js
│   │   └── game_ai.js
│   │
│   ├── network/            # 联网系统
│   │   ├── socket_client.js    # Socket.IO 客户端
│   │   ├── online_game.js      # 联网游戏逻辑
│   │   └── online_ui.js        # 联网 UI 组件
│   │
│   └── skills/             # 技能系统
│       ├── registry.js
│       ├── double.js
│       ├── voodoo.js
│       ├── move_self.js
│       ├── move_enemy.js
│       ├── zone.js
│       ├── bomb.js
│       ├── god_hand.js
│       ├── chaos.js
│       ├── short_battle.js
│       └── swap.js
│
├── images                # 图片资源
│ 
│   
├── [音频文件]              # bgm1-7.mp3, bgs1.mp3, shot.m4a
│
└── .kiro/
    ├── specs/              # 规划文档
    │   └── online-multiplayer/
    │       ├── requirements.md
    │       ├── design.md
    │       ├── tasks.md
    │       └── rules.md
    │
    └── steering/           # 开发指南
        ├── 《Project Lysh》for Rexon.md
        ├── AGENTS.md
        ├── AGENTS_CONTEXT.md
        ├── PROGRESS.md
        ├── product.md
        ├── tech.md
        ├── architecture.md
        └── current-status.md (本文件)
```

### 后端文件结构

```
server/
├── package.json            # Node.js 依赖配置
├── package-lock.json       # 依赖锁定文件
├── config.js               # 服务器配置（端口、超时、棋盘大小等）
├── index.js                # 服务器主入口（Express + Socket.IO）
├── socketHandlers.js       # Socket.IO 事件处理器（核心逻辑）
├── roomManager.js          # 房间管理器（房间创建、加入、清理）
├── gameLogic.js            # 游戏逻辑（落子、胜负判定、悔棋）
├── rpsLogic.js             # 猜拳逻辑（石头剪刀布、选边）
├── skillLogic.js           # 技能逻辑（技能验证、执行、效果处理）
└── node_modules/           # 依赖包目录（npm install 生成）
```

---

## 后端架构（Alpha 0.7.9.4+）

### 技术栈
- **运行时**: Node.js (v14+)
- **Web 框架**: Express.js
- **实时通信**: Socket.IO
- **依赖管理**: npm

### 核心模块职责

#### 1. 服务器主入口（index.js）
**职责**：
- 创建 Express 应用和 HTTP 服务器
- 初始化 Socket.IO 服务器
- 设置 CORS 跨域配置
- 创建房间管理器实例
- 启动定时清理任务
- 提供健康检查接口

**关键接口**：
```javascript
GET /                    # 健康检查，返回服务器状态
GET /rooms              # 获取所有房间列表（调试用）
```

#### 2. 房间管理器（roomManager.js）
**职责**：
- 房间创建与销毁
- 玩家加入与离开
- 房间状态管理
- 游戏初始化
- 过期房间清理

**关键方法**：
```javascript
createRoom(hostSocketId, nickname, pieceStyle, matchMode)
  → 创建新房间，返回 6 位纯数字房间号

joinRoom(roomId, socketId, nickname, pieceStyle)
  → 加入房间，验证房间状态和容量

leaveRoom(socketId)
  → 玩家离开，处理房主/加入者的不同逻辑

getRoomBySocketId(socketId)
  → 通过 Socket ID 查找房间和玩家角色

initGame(roomId)
  → 初始化游戏状态（棋盘、技能、历史记录）

resetGame(roomId)
  → 重置游戏（再来一局），回到猜拳阶段

cleanupRooms()
  → 清理超时房间（等待超时、空闲超时）
```
---

## 已实现的技能

1. **双连（Double）**: 连续落两子
2. **巫毒腐蚀（Voodoo）**: 腐蚀对方棋子
3. **移花接木（Move Self）**: 移动己方棋子
4. **乾坤大挪移（Move Enemy）**: 移动对方棋子
5. **领地（Zone）**: 创建禁区
6. **时间炸弹（Bomb）**: 定时炸弹
7. **上帝之手（God Hand）**: 移除对方棋子
8. **混沌干扰（Chaos）**: 干扰对方判断
9. **短兵相接（Short Battle）**: 限制落子范围
10. **交换（Swap）**: 交换双方棋子

---

## 开发环境

### 推荐工具
- **编辑器**: VS Code
- **本地服务器**: VS Code Live Server 或 `python -m http.server 8000`
- **浏览器**: Chrome/Edge（主要测试）、Safari（兼容性测试）
- **版本控制**: Git

### 测试流程
1. 启动本地服务器
2. 在浏览器中打开 `index.html`
3. 点击任意处解锁音频
4. 测试各项功能
5. 检查浏览器控制台是否有错误

### 调试技巧
- 右上角 FPS 计数器监控性能
- 浏览器控制台查看 `GameState`、`SoundEngine`、`VisualFX` 对象
- 全局错误捕获会弹窗显示致命错误
- 使用 `AudioHost.modules`、`VisualFX.modules`、`SkillRegistry.skills` 检查模块状态

---

## 团队协作

### 与 AI 助手协作
- 阅读 `AGENTS.md` 了解开发规则
- 阅读 `AGENTS_CONTEXT.md` 了解架构细节
- 阅读 `architecture.md` 了解系统设计
- 参考 `PROGRESS.md` 了解历史变更

### 版本管理
- 严格遵守版本号规则
- 未经允许不得擅自升级版本号
- 每次更新需同步更新 `PROGRESS.md`

### 代码规范
- 保持现有命名习惯
- 关键逻辑添加中文注释
- 输出完整代码，禁止使用 `// ... rest of code`
- UTF-8 编码，避免乱码

---

## 联系信息

- **项目负责人**: Rexon（澳门学生开发者）
- **当前 AI 助手**: Kiro
- **项目仓库**: （待添加）

---

**文档维护**: 请在每次重大更新后同步更新本文档