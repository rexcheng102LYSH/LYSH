# Project Lysh 联网对战革命性更新计划

本计划通过全面扫描前端（js/game/、js/skills/、js/network/）和后端（server/）代码，列出所有前端已实现但联网对战未同步的功能缺口，并给出分阶段实施方案。

---

## 一、当前状态总览

### 后端已实现 ✅
| 功能 | 文件 | 状态 |
|------|------|------|
| 房间创建/加入/离开 | roomManager.js, socketHandlers.js | ✅ 完整 |
| 猜拳（石头剪刀布）决定先手 | rpsLogic.js | ✅ 完整 |
| 选边（黑/白） | rpsLogic.js | ✅ 完整 |
| 基础落子 + 验证 | gameLogic.js | ✅ 完整 |
| 五连珠胜利检测 | gameLogic.js | ✅ 完整 |
| 回合切换 | gameLogic.js | ✅ 完整 |
| 投降 | socketHandlers.js | ✅ 完整 |
| 悔棋请求/回应 | socketHandlers.js, gameLogic.js | ✅ 完整 |
| 再来一局 | socketHandlers.js | ✅ 完整 |
| 断线重连（框架） | socketHandlers.js, roomManager.js | ⚠️ 框架存在，恢复不完整 |
| 技能验证/执行（框架） | skillLogic.js | ⚠️ 框架存在，与前端不一致 |

### 前端已实现但联网缺失 ❌
| 功能 | 前端文件 | 严重程度 |
|------|----------|----------|
| 技能选择/草稿阶段 | game_skills.js | 🔴 关键缺失 |
| 技能激活联网桥接 | game_skills.js → online_game.js | 🔴 关键缺失 |
| 回合计时系统 | game_core.js (gameTicker) | 🔴 关键缺失 |
| 技能效果视觉渲染 | online_game.js (onSkillUsed) | 🟡 体验缺失 |
| 混沌干扰落子偏移 | game_core.js (chaosDebuff) | 🔴 逻辑缺失 |
| 短兵相接4连规则 | game_core.js (checkWin) | 🔴 逻辑缺失 |
| 领地落子限制 | game_core.js (isZoneRestricted) | 🔴 逻辑缺失 |
| 炸弹/巫毒/上帝之手前后端不一致 | skills/*.js vs skillLogic.js | 🔴 严重不一致 |
| BO3 三局两胜 | game_core.js | 🟡 功能缺失 |
| 重连状态恢复 | online_game.js (TODO) | 🟡 功能缺失 |
| 联网音效同步 | game_render.js (placePiece) | 🟢 体验优化 |
| 联网UI适配（技能按钮等） | game_ui.js | 🟡 UI缺失 |
| 落子锁定标记 | game_render.js (updateLastMoveMarker) | 🟢 体验优化 |

---

## 二、核心问题深度分析

### 问题1：技能系统前后端严重不一致 🔴

前端和后端对同一技能的实现完全不同，这是最大的阻碍：

| 技能 | 前端实现 | 后端实现 | 差异 |
|------|----------|----------|------|
| **bomb（炸弹）** | 减少对手150秒时间，倒计时归零则爆炸（特殊计时器） | 放置在棋盘上，3回合后3×3爆炸清除棋子 | **完全不同的机制** |
| **voodoo（巫毒）** | 立即腐蚀一颗棋子（board值变为CORRODED=-1） | 标记棋子，3回合后棋子消失 | **时机和效果不同** |
| **god_hand（上帝之手）** | 移动任意两颗棋子到新位置（pick1→drop1→pick2→drop2） | 移除一颗任意棋子 | **完全不同的功能** |
| **zone（领地）** | 创建3×3禁区，限制对方6回合 | 在棋盘上放置领地标记值（3或4） | **效果表达不同** |
| **chaos（混沌）** | 给对手2回合落子随机偏移（chaosDebuff） | 随机效果：交换棋子/移除棋子/添加棋子 | **完全不同的机制** |
| **short_battle** | 6回合内4连即胜（修改checkWin判定） | 限制落子范围到最后落子点附近 | **完全不同的机制** |
| **double（双连）** | 连续落两子（isDoubleMoveActive） | 一次放两颗棋子 | 语义相同，实现不同 |
| **swap（交换）** | 交互式pick己方→pick敌方 | 直接指定两个位置 | 语义相同，接口不同 |
| **move_self/move_enemy** | 交互式pick源→pick目标 | 直接指定from和to | 语义相同，接口不同 |

**结论：必须统一前后端技能逻辑，以前端为准（前端是用户体验的直接来源）。**

### 问题2：技能选择阶段完全缺失 🔴

前端有完整的「技能草稿」流程：
- `enterDraftPhase()` → 显示技能选择界面
- SUN先选 → MAPLE后选 → 两人各选一个不重复的技能
- AI模式下AI自动选

后端没有任何草稿阶段处理：
- `roomManager.initGame()` 不初始化玩家技能
- `socketHandlers.js` 没有 `client:draft_pick` 事件
- 直接从选边跳到游戏开始

### 问题3：计时系统缺失 🔴

前端本地游戏有完整的倒计时：
- 每人240秒（`timeRemaining`），每秒递减
- 超时判负
- 炸弹技能减少对方时间
- 炸弹倒计时BGM切换

后端没有任何计时逻辑：
- 不追踪每人剩余时间
- 不处理超时
- 联网模式 `startOnlineGame()` 不启动本地计时器

### 问题4：联网模式入口跳过了关键流程 🔴

`startOnlineGame()` 当前流程：
```
选边 → 直接开始游戏（跳过技能选择、跳过计时器初始化）
```

正确流程应该是：
```
选边 → 技能选择草稿 → 初始化游戏（含计时器）→ 开始对战
```

---

## 三、分阶段实施方案

### 第一阶段：统一技能逻辑（最高优先级）

> 目标：以前端技能逻辑为准，重写后端 `skillLogic.js`，使两端一致。

#### Step 1.1 重写 `server/skillLogic.js` 技能执行逻辑
- **bomb**：改为减少对手时间150秒，而非放置炸弹
- **voodoo**：改为立即腐蚀（board值设为-1），而非3回合延迟
- **god_hand**：改为分4步交互（pick1→drop1→pick2→drop2），每步都要验证
- **chaos**：改为给对手添加2回合chaosDebuff（落子偏移），而非随机棋盘效果
- **short_battle**：改为6回合内4连即胜（修改checkWin），而非限制落子范围
- **zone**：改为创建3×3禁区6回合（在room.game中维护zones数组），落子时验证
- **double**：改为设置isDoubleMoveActive标记，下一次落子不切换回合
- **move_self/move_enemy/swap**：保持交互式（多步事件），后端维护中间状态

#### Step 1.2 修改后端 `room.game` 数据结构
```javascript
room.game = {
    // ... 现有字段 ...
    playerSkills: { black: null, white: null },  // 新增：玩家选择的技能
    chaosDebuff: { black: 0, white: 0 },         // 新增：混沌干扰回合数
    shortBattleTurns: 0,                          // 新增：短兵相接剩余回合
    territoryZones: [],                           // 新增：领地列表 [{r,c,owner,turns}]
    isDoubleMoveActive: false,                    // 新增：双连激活标记
    bombTarget: null,                             // 新增：炸弹目标玩家
    timeRemaining: { black: 240, white: 240 },    // 新增：每人剩余时间
    activeSkillEffect: null,                      // 新增：多步技能中间状态
    effectData: {},                               // 新增：多步技能临时数据
};
```

#### Step 1.3 修改后端 `gameLogic.js`
- `isValidMove()` 增加领地限制检查
- `isValidMove()` 增加混沌干扰偏移处理（服务端计算偏移坐标）
- `checkWin()` 支持短兵相接模式（limit=4）
- `switchTurn()` 递减领地回合、短兵相接回合、混沌debuff回合
- 增加 `processDoubleMoveLogic()` 处理双连的不切换回合逻辑

#### Step 1.4 修改后端 `socketHandlers.js`
- `client:place_piece` 增加混沌偏移、领地限制、双连不切换
- `client:use_skill` 支持多步技能（god_hand需要4个交互步骤）
- 新增 `client:skill_step` 事件处理多步技能的中间步骤

**涉及文件：**
- `server/skillLogic.js` — 重写
- `server/gameLogic.js` — 修改
- `server/roomManager.js` — 修改 `initGame()`
- `server/socketHandlers.js` — 修改

---

### 第二阶段：技能选择草稿系统

> 目标：实现联网对战的技能选择流程，与前端本地草稿阶段对齐。

#### Step 2.1 后端新增草稿阶段

在 `socketHandlers.js` 中新增：
- `client:draft_pick` — 玩家选择技能
- `server:draft_start` — 通知双方进入技能选择
- `server:draft_update` — 广播技能选择状态
- `server:draft_complete` — 技能选择完成，进入游戏

在 `roomManager.js` 中：
- 新增 `room.status = 'drafting'` 阶段（在 `choosing_side` 之后、`playing` 之前）
- 新增 `room.draft = { currentPicker, picks: {} }` 状态

草稿流程：
1. 选边完成后 → `room.status = 'drafting'`
2. 白方（后手）先选技能 → 服务端验证 → 广播
3. 黑方（先手）再选技能（不能重复） → 服务端验证 → 广播
4. 双方都选完 → `initGame()` 并写入 `playerSkills` → 广播 `game_start`

#### Step 2.2 前端联网草稿UI

在 `online_game.js` 中：
- 监听 `server:draft_start` → 显示技能选择界面
- 监听 `server:draft_update` → 更新技能选择状态
- 监听 `server:draft_complete` → 关闭选择界面，进入游戏
- `sendDraftPick(skillId)` → 发送技能选择

在 `online_ui.js` 中：
- 新增 `showDraftModal()` — 联网技能选择弹窗（复用现有 `renderSkillGrid()` 逻辑）
- 新增 `updateDraftState()` — 更新对手选择状态

修改 `game_core.js` 中的 `startOnlineGame()`：
- 不再直接显示游戏界面
- 等待草稿完成后再初始化

**涉及文件：**
- `server/socketHandlers.js` — 新增草稿事件
- `server/roomManager.js` — 新增草稿阶段
- `js/network/online_game.js` — 新增草稿事件处理
- `js/network/online_ui.js` — 新增草稿UI
- `js/game/game_core.js` — 修改 `startOnlineGame()`

---

### 第三阶段：回合计时系统

> 目标：实现联网对战的双方计时、超时判负、炸弹时间扣除。

#### Step 3.1 后端计时器

在 `roomManager.js` 或新文件 `server/timerLogic.js` 中：
- 维护 `room.game.timeRemaining = { black: 240, white: 240 }`
- 每秒递减当前回合方的时间
- 超时 → 广播 `room:time_out`，当前方判负
- 落子/技能时记录时间消耗，防止客户端篡改

在 `socketHandlers.js` 中：
- `room:game_start` 时启动服务端计时器
- `client:place_piece` 时重置当前方计时
- 广播 `room:timer_sync` 定期同步时间

#### Step 3.2 炸弹技能时间扣除

- 炸弹技能执行时：`room.game.timeRemaining[opponent] -= 150`
- 如果时间<=0：立即触发爆炸判负
- 广播 `room:bomb_activated` 含 `bombTarget` 和新的时间

#### Step 3.3 前端计时器同步

在 `online_game.js` 中：
- 监听 `room:timer_sync` 校准本地时间
- 监听 `room:time_out` 处理超时
- 监听 `room:bomb_activated` 更新炸弹UI和音效
- 本地也运行倒计时（用于UI流畅显示），但以服务端为准

在 `game_core.js` 的 `startOnlineGame()` 中：
- 启动本地计时器 `setInterval` 更新UI
- 收到服务端同步时校准

**涉及文件：**
- `server/timerLogic.js` — 新建
- `server/socketHandlers.js` — 修改
- `server/roomManager.js` — 修改 `initGame()`
- `js/network/online_game.js` — 新增计时事件
- `js/game/game_core.js` — 修改 `startOnlineGame()`

---

### 第四阶段：技能激活联网桥接

> 目标：让前端的技能按钮在联网模式下正确工作。

#### Step 4.1 前端技能激活分流

修改 `game_skills.js` 的 `activateSkill()`：
```javascript
// 联网模式下，不本地执行技能，而是发送给服务器
if (GameState.online && GameState.online.isOnline) {
    const sid = GameState.playerSkills[GameState.currentPlayer];
    // 对于简单技能（double, chaos, short_battle, bomb），直接发送
    // 对于交互式技能（需要选目标），进入本地选择模式，选完后发送
    OnlineGame.activateOnlineSkill(sid);
    return;
}
```

#### Step 4.2 交互式技能的联网处理

对于需要用户点击棋盘选择目标的技能（god_hand, move_self, move_enemy, swap, voodoo, zone）：
1. 前端进入选择模式（复用现有 `activeEffect` 机制）
2. 用户完成所有选择后，收集目标参数
3. 通过 `OnlineGame.sendSkill(skillId, targets)` 一次性发送给服务器
4. 服务器验证并执行 → 广播结果

在 `online_game.js` 中新增：
- `activateOnlineSkill(skillId)` — 启动联网技能流程
- `onSkillTargetsCollected(skillId, targets)` — 目标收集完成后发送

#### Step 4.3 联网模式 handleCellClick 增加技能交互

修改 `handleOnlineCellClick()`：
- 如果当前有 `activeEffect`（技能选择中），调用 `handleSkillInteraction` 收集目标
- 收集完成后走联网发送流程，而非本地执行

#### Step 4.4 技能效果接收方渲染

修改 `online_game.js` 的 `onSkillUsed()`：
- 根据 `skillId` 触发对应的前端视觉效果
- 播放技能音效 `SoundEngine.playSkill()`
- 渲染领地UI、腐蚀效果等
- 更新技能状态卷轴

**涉及文件：**
- `js/game/game_skills.js` — 修改 `activateSkill()`
- `js/game/game_core.js` — 修改 `handleOnlineCellClick()`
- `js/network/online_game.js` — 新增技能激活/接收
- `js/network/online_ui.js` — 可能新增技能效果UI

---

### 第五阶段：联网UI完善

> 目标：让联网对战的UI体验与本地对战一致。

#### Step 5.1 技能按钮联网适配

修改 `game_ui.js` 的 `updateDynamicUI()`：
- 联网模式下，技能按钮根据 `OnlineGame.mySkillUsed` 显示状态
- 只有轮到自己时才能点击
- 显示自己选的技能名称和图标

#### Step 5.2 技能状态卷轴联网适配

修改 `game_ui.js` 的 `updateSkillScroll()`：
- 联网模式下从服务端同步的状态读取：
  - chaosDebuff 混沌干扰剩余回合
  - shortBattleTurns 短兵相接剩余回合
  - territoryZones 领地信息

#### Step 5.3 计时器UI联网适配

- 联网模式下的计时器显示双方时间
- 炸弹技能激活后显示炸弹图标
- 时间紧迫时计时器变红 + 音效切换

#### Step 5.4 对手信息面板

在 `online_ui.js` 中：
- 显示对手昵称、颜色
- 显示对手技能（已使用/未使用）
- 显示双方悔棋使用状态

#### Step 5.5 联网操作按钮

- 技能按钮（联网版）
- 投降按钮
- 悔棋按钮（联网悔棋需对方同意）
- 返回/离开按钮

**涉及文件：**
- `js/game/game_ui.js` — 修改
- `js/network/online_ui.js` — 新增
- `index.html` — 可能新增联网专用UI元素
- `style.css` — 可能新增联网UI样式

---

### 第六阶段：重连系统完善

> 目标：断线重连后完整恢复游戏状态。

#### Step 6.1 后端完善重连数据

修改 `gameLogic.js` 的 `getBoardState()`，返回完整状态：
```javascript
return {
    board, currentTurn, moveHistory,
    playerSkills,           // 双方技能
    skillUsed,              // 技能使用状态
    undoUsed,               // 悔棋使用状态
    timeRemaining,          // 双方剩余时间
    chaosDebuff,            // 混沌干扰状态
    shortBattleTurns,       // 短兵相接状态
    territoryZones,         // 领地列表
    bombTarget,             // 炸弹目标
    isDoubleMoveActive,     // 双连激活
    lastMove,               // 最后落子
};
```

#### Step 6.2 前端重连恢复

实现 `online_game.js` 的 `onReconnectSuccess()`：
- 恢复 `GameState` 所有字段
- 重新渲染棋盘（含领地、腐蚀等特殊格子）
- 恢复计时器
- 恢复技能按钮状态
- 恢复技能效果UI

#### Step 6.3 断线保护

- 后端：断线时暂停对方计时器
- 前端：显示"对手断线，等待重连"倒计时
- 超时未重连 → 断线方判负

**涉及文件：**
- `server/gameLogic.js` — 修改 `getBoardState()`
- `server/socketHandlers.js` — 修改重连处理
- `js/network/online_game.js` — 实现重连恢复

---

### 第七阶段：BO3 三局两胜

> 目标：联网对战支持 BO3 模式。

#### Step 7.1 后端 BO3 逻辑

修改 `roomManager.js`：
- `room.match.scores` 追踪局数
- `resetGame()` 保留比分，只重置棋盘
- 达到2胜时广播 `room:match_over`

修改 `socketHandlers.js`：
- `room:game_over` 后检查是否BO3，是则进入下一局流程
- 输家获得下局选边权

#### Step 7.2 前端 BO3 UI

- 显示当前比分
- 局间过渡画面
- 最终胜利庆祝

**涉及文件：**
- `server/roomManager.js` — 修改
- `server/socketHandlers.js` — 修改
- `js/network/online_game.js` — 新增BO3处理
- `js/network/online_ui.js` — 新增BO3 UI

---

### 第八阶段：音效与特效同步

> 目标：联网对战与本地对战音效体验一致。

#### Step 8.1 落子音效同步

修改 `online_game.js` 的 `onPiecePlaced()` / `handleOnlineOpponentMove()`：
- 根据当前皮肤（classic/nature/ice_fire）播放对应音效
- 触发对应落子特效（墨晕/涟漪/冰火粒子）
- 触发棋盘震动

#### Step 8.2 技能音效

- 技能激活时播放 `SoundEngine.playSkill()`
- 炸弹激活时切换BGM到炸弹音乐
- 混沌偏移时播放 `SoundEngine.playChaos()`

#### Step 8.3 胜利特效完善

修改 `onGameOver()`：
- 赢家：触发选中的庆祝特效（fireworks/golden/DJ）
- 输家：播放 `playDefeat()`
- 投降：只显示结果，不放特效
- 断线超时：显示对应提示

**涉及文件：**
- `js/network/online_game.js` — 修改
- `js/game/game_core.js` — 可能微调

---

### 第九阶段：安全与防作弊

> 目标：确保联网对战的公平性。

#### Step 9.1 服务端权威

- **所有游戏逻辑都在服务端执行**，客户端只负责发送意图和渲染结果
- 落子验证（含领地、混沌偏移）全在服务端
- 技能验证（目标合法性）全在服务端
- 胜负判定全在服务端
- 计时由服务端管控

#### Step 9.2 防篡改

- 客户端不直接修改 board 数据，只根据服务端广播渲染
- 技能使用状态由服务端维护
- 回合判定由服务端维护

#### Step 9.3 重连身份验证

- 重连时验证 roomId + 角色匹配
- 防止冒充重连

**涉及文件：**
- `server/socketHandlers.js` — 加强验证
- `server/gameLogic.js` — 增加完整性检查
- `js/network/online_game.js` — 调整为服务端权威模式

---

## 四、Socket 事件清单（新增/修改）

### 新增事件

| 方向 | 事件名 | 用途 |
|------|--------|------|
| C→S | `client:draft_pick` | 技能选择 |
| S→C | `server:draft_start` | 进入技能选择阶段 |
| S→C | `server:draft_update` | 技能选择状态更新 |
| S→C | `server:draft_complete` | 技能选择完成 |
| C→S | `client:skill_step` | 多步技能的中间步骤 |
| S→C | `room:skill_step_ack` | 多步技能步骤确认 |
| S→C | `room:timer_sync` | 计时器同步 |
| S→C | `room:time_out` | 超时判负 |
| S→C | `room:bomb_activated` | 炸弹技能激活 |
| S→C | `room:chaos_offset` | 混沌偏移通知 |
| S→C | `room:match_over` | BO3比赛结束 |

### 修改事件

| 事件 | 修改内容 |
|------|----------|
| `room:game_start` | 增加 `playerSkills`、`timeRemaining` |
| `room:piece_placed` | 增加混沌偏移信息、双连状态 |
| `room:skill_used` | 增加完整技能效果数据 |
| `room:game_over` | 增加更多结束原因（timeout、bomb_explode） |
| `server:reconnect_success` | 增加完整游戏状态快照 |

---

## 五、文件修改清单汇总

### 后端（server/）
| 文件 | 操作 | 阶段 |
|------|------|------|
| `skillLogic.js` | **重写** — 统一技能逻辑 | 1 |
| `gameLogic.js` | **大幅修改** — 增加领地/混沌/短兵/双连/计时 | 1, 3 |
| `roomManager.js` | **修改** — 增加草稿阶段、扩展game结构 | 1, 2 |
| `socketHandlers.js` | **大幅修改** — 新增10+事件处理 | 1-7 |
| `timerLogic.js` | **新建** — 回合计时管理 | 3 |
| `config.js` | **修改** — 增加计时配置 | 3 |

### 前端网络层（js/network/）
| 文件 | 操作 | 阶段 |
|------|------|------|
| `online_game.js` | **大幅修改** — 新增草稿/技能/计时/BO3/重连 | 2-7 |
| `online_ui.js` | **大幅修改** — 新增草稿UI/技能UI/计时UI/BO3 UI | 2, 5, 7 |

### 前端游戏层（js/game/）
| 文件 | 操作 | 阶段 |
|------|------|------|
| `game_core.js` | **修改** — `startOnlineGame()`、`handleOnlineCellClick()` | 2, 4 |
| `game_skills.js` | **修改** — `activateSkill()` 联网分支 | 4 |
| `game_ui.js` | **修改** — 联网模式UI适配 | 5 |
| `game_render.js` | 微调 — 联网模式落子特效 | 8 |

### 其他
| 文件 | 操作 | 阶段 |
|------|------|------|
| `index.html` | **修改** — 新增联网UI元素 | 5 |
| `style.css` | **修改** — 新增联网UI样式 | 5 |

---

## 六、实施优先级与工作量估计

| 阶段 | 优先级 | 预估工作量 | 依赖 |
|------|--------|-----------|------|
| 1. 统一技能逻辑 | 🔴 P0 | 大（重写skillLogic + 修改gameLogic） | 无 |
| 2. 技能选择草稿 | 🔴 P0 | 中（新增事件 + UI） | 阶段1 |
| 3. 回合计时系统 | 🔴 P0 | 中（新建timerLogic + 前后端同步） | 阶段1 |
| 4. 技能激活桥接 | 🔴 P0 | 大（交互式技能复杂） | 阶段1, 2 |
| 5. 联网UI完善 | 🟡 P1 | 中（UI适配） | 阶段2, 3, 4 |
| 6. 重连完善 | 🟡 P1 | 中（状态恢复） | 阶段1-5 |
| 7. BO3模式 | 🟢 P2 | 小（逻辑简单） | 阶段1-5 |
| 8. 音效特效同步 | 🟢 P2 | 小（调用现有系统） | 阶段4 |
| 9. 安全防作弊 | 🟡 P1 | 小（贯穿各阶段） | 贯穿 |

---

## 七、建议实施顺序

```
阶段1（统一技能逻辑）
  ↓
阶段2（技能选择草稿）+ 阶段3（回合计时）  ← 可并行
  ↓
阶段4（技能激活桥接）
  ↓
阶段5（联网UI完善）+ 阶段8（音效特效）  ← 可并行
  ↓
阶段6（重连完善）
  ↓
阶段7（BO3模式）
```

阶段9（安全防作弊）贯穿所有阶段，每个阶段都要考虑。

---

## 八、测试验证要点

每个阶段完成后需要手动测试的关键路径：

1. **阶段1后**：两个浏览器tab创建/加入房间 → 使用技能 → 验证效果一致
2. **阶段2后**：双方轮流选技能 → 验证不能选重复 → 选完自动开始
3. **阶段3后**：对战中观察计时器同步 → 等待超时 → 验证判负
4. **阶段4后**：联网模式点击技能按钮 → 多步技能完整交互 → 效果广播
5. **阶段5后**：UI显示完整（技能按钮/状态卷轴/计时器/对手信息）
6. **阶段6后**：游戏中关闭tab → 重新打开 → 验证状态恢复
7. **阶段7后**：BO3模式 → 打完3局 → 验证比分和过渡
