# Lysh 联网全端同步执行计划（代码核验版）

更新时间：2026-02-26  
执行基线：已对 `js/game/*`、`js/network/*`、`server/*` 做实代码核验

---

## 1. 版本事实（单一定义）

- 前端显示版本：`Alpha0.7.9.9`（`index.html`）
- 后端协议版本：`1.1.0`（`GET /api/status -> version`）
- 说明：本计划所有“版本”描述都必须区分前端显示版本与后端协议版本。

---

## 2. 已核验缺口（改造目标）

### 2.1 联机流程缺口（已确认）
- 旧流程：`RPS -> 选边 -> 直接 game_start`
- 目标流程：`RPS -> 选边 -> 技能草稿 -> game_start -> 计时对战`

### 2.2 技能语义不一致（已确认）
- 前端本地语义与后端旧 `skillLogic` 存在关键差异：
  - `bomb`：前端为扣时/炸弹目标，旧后端为棋盘炸弹
  - `voodoo`：前端为立即腐蚀，旧后端为延迟移除
  - `god_hand`：前端为双段移动，旧后端为移除单子
  - `chaos`：前端为落子偏移 debuff，旧后端为随机棋盘效果
  - `short_battle`：前端为 4 连胜条件，旧后端为其他效果

### 2.3 联网计时缺口（已确认）
- 旧联机无服务端权威计时与 `timeout` 判负。

### 2.4 重连缺口（已确认并已进入实现）
- `server:reconnect_success` 的前端恢复逻辑已接入，后续重点转向异常分支与 UI 细节完善。

### 2.5 BO3 缺口（已确认）
- 有房间规则字段，但无完整赛局推进与 `match_over` 终态。

---

## 3. 批次化热更新方案

## Batch 0（文档与门禁）
- 更新本文件为“核验版执行文档”。
- 统一 DoR / DoD：
  - DoR：接口、状态字段、回滚条件明确。
  - DoD：自动化测试通过 + 联机关键链路手测通过。

## Batch 1（P0：联机可玩链路）
- 后端：
  - `roomManager`：新增 `drafting` + 扩展 `room.game` 关键字段。
  - `socketHandlers`：接入草稿事件、计时同步、超时判负、状态增量广播。
  - `gameLogic`：落子验证支持领地限制、混沌偏移、4 连判定。
  - `skillLogic`：统一为前端语义。
- 前端：
  - `online_game`：接入草稿、计时、状态增量应用。
  - `game_skills`：联网分流为“发意图，不本地落地”。
  - `game_core`：联网落子支持技能目标收集，`startOnlineGame` 接收服务端初始化状态。
  - `online_ui`：新增草稿弹窗与状态更新。

## Batch 2（P1：重连与赛制）
- 重连：
  - 后端快照扩展，前端 `onReconnectSuccess` 完整恢复。
  - 重连增加 `oldSocketId` 身份匹配校验（防冒充）。
- BO3：
  - 结算累积分数，达到阈值发 `room:match_over`。
  - 未到终局则继续下一局流程（败者获得下一局选边权）。

## Batch 3（P2：体验与安全收口）
- 联网音效/状态卷轴一致性。
- `protocol_contract` 补充新事件校验。
- 兼容窗口内保留旧事件名与旧字段，不破坏旧客户端连接。

---

## 4. 协议变更（兼容窗口）

### 新增事件
- `client:draft_pick`：`{ skillId }`
- `room:draft_start`：`{ firstPicker, availableSkills, timeoutMs }`
- `room:draft_update`：`{ picked, currentPicker, remainMs }`
- `room:draft_complete`：`{ playerSkills }`
- `room:timer_sync`：`{ timeRemaining, currentTurn, ts }`
- `room:time_out`：`{ loser, winner }`
- `room:match_over`：`{ winner, winnerColor, scores }`

### 兼容增强字段
- `room:game_start`：增加 `playerSkills`, `timeRemaining`, `match`
- `room:piece_placed`：增加 `resolvedRow/resolvedCol`, `chaosApplied`, `state`
- `room:skill_used`：增加 `state`
- `room:game_over`：增加 `state`，BO3 时附带 `match`
- `server:reconnect_success`：增加 `match` 与扩展 `boardState`

---

## 5. 回滚策略

- 每批次单独发布。
- 任一批出现“无法开局/回合错乱/状态不同步”：
  - 立即回滚上一批稳定版本。
  - 保留文档修订，不保留未通过门禁的协议改动。

---

## 6. 测试矩阵

### 自动化（每批必跑）
- `npm.cmd --prefix server test`

### 手测（每批必跑）
1. 大厅/房号 -> 进房 -> RPS -> 选边 -> 草稿 -> 开局
2. 落子与技能（每个技能至少一次）
3. 计时同步与超时判负
4. 对局中断线 -> 重连恢复
5. BO3 完整赛局到终局
6. 悔棋/投降/再来一局回归

---

## 7. 当前执行状态（本轮）

- 已完成：
  - 后端 Batch1 主链路（草稿、计时、技能语义、状态增量）
  - 前端 Batch1 主链路（技能桥接、草稿事件、计时/重连状态接入）
  - Batch2 关键项（重连恢复、BO3 终局事件）
  - 协议校验新增 `client:draft_pick`
  - `server` 单测通过（21/21）
- 待持续迭代：
  - 联网 UI 精修（草稿交互细节与视觉）
  - 体验层细化（音效、特效、状态卷轴联机一致性）

---

## 8. 2026-02-27 第2轮热更新进度（窗口续接）

### 8.1 已完成（本窗口）
- 已定位并修复“技能触发后棋子模型消失但棋局数据仍在”的高优问题：
  - `js/game/game_render.js`：`renderBoard()` 重建网格后，新增按 `GameState.board` 回填现有棋子/腐蚀格的渲染逻辑。
  - `js/network/online_game.js`：`onSkillUsed/onSkillEffect/onUndoExecuted` 补齐 `GameState.board` 与旧全局 `board` 同步，避免“状态真源与旧变量漂移”。
- 已完成草稿阶段动态倒计时改造（10 秒动态变化）：
  - `js/network/online_ui.js`：新增本地倒计时 ticker（250ms 刷新标题）。
  - 草稿提示文案改为：
    1. `您是先/后手方，请您选择技能（10）`（玩家回合）
    2. `您是先/后手方，当前先/后手方正在选择技能（10）`（对手回合）
  - 计时显示已去掉“秒”字，仅保留阿拉伯数字。

### 8.2 本轮新增风险与待确认项
- `server/skillLogic.js` 由旧 541 行语义切到新 333 行语义后，存在“前端语义优先”与“后端历史语义”不一致窗口：
  1. `bomb`：棋盘炸弹延迟爆炸 -> 扣时炸弹目标。
  2. `voodoo`：延迟失效 -> 立即腐蚀。
  3. `god_hand`：单点移除 -> 兼容单点 + 双段移动。
  4. `chaos`：随机棋盘扰动 -> 对手落子偏移 debuff。
  5. `processTurnEndEffects`：旧版有真实回合末效果处理，新版为兼容空实现。
- 该差异会影响测试期对“技能是否符合历史体验”的预期，需要在第2轮热更新做“前后端统一语义基线”确认（不是单边参考）。

### 8.3 下一窗口执行指令（直接复制执行）
1. 先跑基础校验：
   - `node --check js/game/game_render.js`
   - `node --check js/network/online_game.js`
   - `node --check js/network/online_ui.js`
   - `npm.cmd --prefix server test`
2. 重点回归链路：
   - 联机房间 -> RPS -> 选边 -> 草稿双人选技 -> 自动进入对局
   - 任意技能释放后，棋盘已有棋子不丢失
   - 草稿倒计时从 10 动态递减到 0（无“秒”字）
3. 第2轮热更新任务：
   - 以“前端体验 + 后端可验证状态机”双基线统一 `skillLogic` 语义，补充对应单测与协议说明。
