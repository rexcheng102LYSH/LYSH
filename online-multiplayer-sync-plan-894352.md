# Lysh 联网全端同步执行计划（代码核验版）

更新时间：2026-02-27  
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

---

## 9. 2026-02-27 全端同步进度汇报与后续企划（Alpha0.7.9.94）

### 9.1 当前进度（已具备但仍需回归加固）
- 联机主链路已可跑通：房间 -> RPS -> 选边 -> 草稿 -> 开局 -> 结算。
- 草稿阶段已有 10 秒超时与服务端默认选技兜底。
- 联网计时与超时判负已接入，重连窗口已缩短为 10 秒。
- 已处理一批“状态同步类恶性问题”（包括部分技能后棋盘渲染错乱）。

### 9.2 已确认仍未达标的缺陷（本轮重点）
- 10 个技能尚未做到“规则 + 音效 + 视效 + UI 提示”全量复刻，存在不同程度缺失与 bug。
- 已明确样例缺陷：
  1. `voodoo`：特效缺失。
  2. `bomb`（时间炸弹）：BGM / 音效缺失。
  3. `chaos`（混乱骰子）：专属提示与音效缺失。
  4. `god_hand`（上帝之手）：不可用且报错。
- 联机模式存在大面积音频缺口：落子音效、技能释放音效、状态切换音效与本地模式不一致。
- 联机模式存在大面积视效缺口：落子特效未同步，部分棋子仅保留静态效果。
- 仍有较多稳定性与体验问题待收敛（此处不逐项展开，统一纳入全盘扫描）。

### 9.3 全盘扫描方案（确保“无遗漏同步”）
- 基线定义：以“当前前端本地可见体验”为黄金标准，联机必须逐项对齐。
- 扫描范围：
  1. 技能规则层（触发条件、目标选择、回合影响、结算时机）。
  2. 协议状态层（事件载荷、状态增量、重连快照、BO3 赛制字段）。
  3. UI 文案层（技能提示、回合提示、错误提示、结算提示）。
  4. 音频层（BGM、SFX、落子音、技能音、状态提示音）。
  5. 视效层（落子特效、技能特效、棋子特效、结算演出）。
- 输出物统一使用“差异矩阵”：
  - 字段模板：`功能ID | 本地实现证据 | 联机实现证据 | 缺失项 | 风险等级 | 修复批次 | 验收用例`。

### 9.4 后续热更新批次（第2轮继续深化）

#### Batch 2-A（P0）：10 技能语义与可用性对齐
- 目标：先保证“能用且判定正确”，消灭阻断对局的技能错误。
- 执行项：
  1. 为 10 个技能建立统一语义对照表（前端行为 + 服务端权威状态机）。
  2. 修复 `god_hand` 等硬错误，补齐技能目标选择和失败回滚。
  3. 补齐技能相关状态字段在 `room:skill_used / room:piece_placed / reconnect` 的一致性。
  4. 每技能补 1 组单测 + 1 组联机手测剧本。
- DoD：
  1. 10 技能均可成功释放且双方结果一致。
  2. 无“客户端显示存在/服务端状态不存在”或反向漂移。

#### Batch 2-B（P1）：音频全量同步
- 目标：联机听感与本地玩法一致。
- 执行项：
  1. 建立“本地事件 -> 联机事件 -> 音频触发点”映射表。
  2. 补齐时间炸弹、混乱骰子、落子音、技能释放音等缺失项。
  3. 修复 BGM 切换/恢复时机（技能结束、回合切换、结算切换）。
- DoD：
  1. 核心链路中音频触发率达到 100%（不丢触发、不重复播放）。

#### Batch 2-C（P1）：视效全量同步
- 目标：联机观感达到本地同等可读性与反馈强度。
- 执行项：
  1. 补齐所有棋子落子特效与技能特效触发。
  2. 统一“技能生效帧”与“状态落地帧”时序，避免只改数据不出效果。
  3. 校正冰火等特殊棋子的静态与动态效果一致性。
- DoD：
  1. 全皮肤/全技能落地时，双方客户端看到同等视觉反馈。

#### Batch 2-D（P2）：稳定性收口与联机隔离
- 目标：消除“联机状态污染本地模式”等高危问题。
- 执行项：
  1. 强化退出房间、断线、强退后的状态清理。
  2. 强化“联机状态域”与“本地状态域”隔离，杜绝计时器/先后手串场。
  3. 修复“对手退出后另一方卡在联机界面”的分支兜底。
- DoD：
  1. 断线、强退、重连、回菜单后，本地双人与 PVE 均不继承联机状态。

#### Batch 2-E（P2）：体验优化与回归封板
- 目标：在功能完整基础上收敛体验缺陷，形成稳定可发版窗口。
- 执行项：
  1. 清理剩余高频 bug 与交互瑕疵。
  2. 完成 single / BO3 全回归并固化冒烟脚本。
  3. 更新文档与门禁，形成后续迭代基线。

### 9.5 验收矩阵（必须全部通过）
- 模式维度：本地双人、PVE、联机 single、联机 BO3。
- 技能维度：10 技能逐个验证“规则/音效/视效/UI/重连后一致性”。
- 异常维度：断线、强退、重连超时、再来一局、回菜单切模式。
- 一致性维度：双方棋盘状态、回合方、计时、技能状态、结算结果完全一致。

### 9.6 回滚与发布策略（继续沿用）
- 每个 Batch 独立发布，禁止跨批次捆绑未验证改动。
- 出现以下任一问题立即回滚：不可开局、回合错乱、状态漂移、重连失效、模式污染。
- 回滚仅保留文档与已验证改动，不保留未通过门禁的协议/逻辑改动。

### 9.7 下一窗口执行指令（全端同步专项）
1. 先做全盘扫描并生成“差异矩阵”（规则/协议/UI/音频/视效 5 维）。
2. 按 Batch 2-A -> 2-B -> 2-C -> 2-D 顺序推进，不跳批次。
3. 每完成一个技能修复，立即做“本地 vs 联机”双端对照手测并补充回归记录。
4. 每完成一个 Batch，更新本文件对应章节，确保窗口切换不丢上下文。

---

## 10. 2026-02-27 全端扫描结果（技能 / 渲染 / 音频）

### 10.1 扫描方法与证据来源
- 扫描方式：静态代码核验（本地前端实现 vs 联机前端实现 vs 服务端权威实现）。
- 核验文件：
  1. 本地技能与交互：`js/skills/*.js`, `js/game/game_skills.js`, `js/game/game_core.js`
  2. 联机前端：`js/network/online_game.js`, `js/network/online_ui.js`
  3. 联机后端：`server/skillLogic.js`, `server/gameLogic.js`, `server/socketHandlers.js`
  4. 渲染/音频基线：`js/game/game_render.js`, `js/audio/audio_hub.js`, `js/audio/audio_sfx.js`
- 自动化基线（已执行）：`npm.cmd --prefix server test`，当前 `23/23` 通过。
- 注意：本节是“代码证据级扫描结论”；个别“概率故障”需在下一批按复现场景进一步锁定。

### 10.2 技能层差异矩阵（10 技能）

| 技能 | 本地前端基线（证据） | 联机当前实现（证据） | 缺口结论 | 风险级别 | 修复批次 |
| --- | --- | --- | --- | --- | --- |
| `double` | 本地激活后双动状态 + 提示音效（`js/skills/double.js`, `js/game/game_core.js:515-520`） | 服务端开启 `isDoubleMoveActive`，联机可走通（`server/skillLogic.js:233-236`, `server/socketHandlers.js:698-703`） | 规则主干基本对齐；缺专属提示音/提示文案复刻 | 中 | 2-A / 2-C |
| `voodoo` | 本地有施法态 `casting-voodoo` + 腐蚀格视觉（`js/skills/voodoo.js`, `css/skills/voodoo.css`） | 联机只做目标采集+状态落地（`js/network/online_game.js:992-997`, `server/skillLogic.js:236-246`） | 腐蚀结果可落地，但施法氛围层与完成反馈缺失 | 高 | 2-B / 2-C |
| `move_self` | 本地“移动后继续本回合落子”（无 `switchTurn`，`js/skills/move_self.js:53`） | 服务端执行后 `result.switchTurn=true`（`server/skillLogic.js:247-255`） | **规则语义不一致**：联机提前换手，破坏本地玩法 | 严重 | 2-A（P0） |
| `move_enemy` | 本地“移动后继续本回合落子”（`js/skills/move_enemy.js:53`） | 服务端执行后 `result.switchTurn=true`（`server/skillLogic.js:247-255`） | **规则语义不一致**：与本地回合模型冲突 | 严重 | 2-A（P0） |
| `zone` | 本地施法态 `casting-territory` + 领地 UI（`js/skills/zone.js`, `js/game/game_ui.js:389-399`） | 服务端生成 `territoryZones`，前端可更新（`server/skillLogic.js:255-269`, `js/network/online_game.js:372-381`） | 状态主干对齐；施法过程视觉与提示弱化 | 中 | 2-B |
| `bomb` | 本地有 `bombStart` 提示 + 回合切换触发炸弹 BGM + 临界音频（`js/skills/bomb.js`, `js/game/game_core.js:552-555, 362-365`） | 服务端扣时并发 `room:bomb_activated`（`server/socketHandlers.js:785-795`）；前端无对应监听且无音频桥接（`js/network/online_game.js`） | **时间炸弹音频链路断裂**（BGM/临界/爆炸反馈缺失） | 严重 | 2-C（P0） |
| `god_hand` | 本地双段移动 + 施法态引导（`js/skills/god_hand.js`） | 联机有 `moves` 两段提交（`js/network/online_game.js:1038-1059`）+ 服务端校验执行（`server/skillLogic.js:182-206,279-297`） | 规则接近；但缺少本地同级可视引导（源/落点高亮、阶段感），易被误判“不可用” | 高 | 2-A / 2-B |
| `chaos` | 本地触发后落点偏移音效分支（`playChaos / playChaosLucky`，`js/game/game_core.js:491-508`） | 联机仅 `chaosApplied` 文案，缺幸运分支与音效（`js/network/online_game.js:482-484`） | **混乱骰子专属反馈缺失** | 高 | 2-C |
| `short_battle` | 本地 4 连胜窗口 + 状态卷轴（`js/skills/short_battle.js`, `js/game/game_core.js:740`, `js/game/game_ui.js:537-543`） | 服务端 4 连判定已支持（`server/gameLogic.js:213-239`） | 规则主干对齐；缺专属触发反馈 | 中 | 2-A / 2-C |
| `swap` | 本地交换后通常仍可继续落子（无 `switchTurn`，`js/skills/swap.js:50`） | 服务端执行后 `result.switchTurn=true`（`server/skillLogic.js:305-314`） | **规则语义不一致**：联机提前换手 | 严重 | 2-A（P0） |

### 10.3 渲染层差异矩阵

| ID | 本地前端能力（证据） | 联机现状（证据） | 缺口结论 | 风险 |
| --- | --- | --- | --- | --- |
| R-01 | 本地落子通过 `placePiece()` 触发全套渲染链（棋子动画+皮肤特效+棋盘震动，`js/game/game_render.js:48-119`） | 联机落子走 `handleOnlineOpponentMove()`，仅 `renderPieceInCell + playPlace`（`js/game/game_core.js:944-963`, `js/network/online_game.js:453-471`） | 落子特效大面积缺失（你反馈“静态在，落子特效没同步”与此一致） | 严重 |
| R-02 | 本地技能施法过程有分阶段可视引导（`casting-*` 类、半透明源点、hover 提示） | 联机 pending 仅文字提示，不加 `casting-*` 与源点态（`js/network/online_game.js:961-1060`） | 技能可用性与可读性下降，易误操作/误判 bug | 高 |
| R-03 | 本地胜负特效链包含连珠线与庆祝流程（`js/game/game_core.js:569-614`） | 联机 `onGameOver` 只在“自己获胜”时绘线庆祝（`js/network/online_game.js:525-527`） | 败方缺关键结算视觉反馈，双端观感不一致 | 高 |
| R-04 | 本地按落子单元触发增量渲染 | 联机技能后常 `renderBoard()` 全量重建（`js/network/online_game.js:617-619, 666-668`） | 大操作后缺少技能定向演出，且有潜在动画错位风险 | 中 |

### 10.4 音频层差异矩阵

| ID | 本地前端能力（证据） | 联机现状（证据） | 缺口结论 | 风险 |
| --- | --- | --- | --- | --- |
| A-01 | 本地落子按皮肤播放差异音效（黑白/自然/冰火，`js/game/game_render.js:63-109`） | 联机统一 `playPlace`（`js/game/game_core.js:962`） | “每种棋子独特落子音”联机丢失 | 严重 |
| A-02 | 本地炸弹回合 BGM 与临界节奏（`switchTrack('bomb')`, `setCritical`） | 联机未调用对应音频逻辑（`js/network/online_game.js` 无 `SoundEngine` 调用） | 时间炸弹 BGM 与临界反馈缺失 | 严重 |
| A-03 | 本地技能释放/混乱触发有专属音效（`playSkill`, `playChaos*`） | 联机技能/混乱仅提示文案（`js/network/online_game.js:622-626, 482-484`） | 技能释放听觉反馈缺失 | 高 |
| A-04 | 本地结算含胜/负/爆炸等音频（`playWinEffect`, `playDefeat`, `playExplosion`） | 联机结算无对应音频桥（`js/network/online_game.js:493-539`） | 胜负反馈断层 | 高 |
| A-05 | 后端发 `room:bomb_activated` | 前端未注册该事件（`server/socketHandlers.js:785-795`, `js/network/online_game.js`） | 事件孤岛，无法驱动炸弹专属音视效 | 高 |

### 10.5 结构性根因（本轮扫描结论）
- 根因 1：联机渲染路径与本地渲染路径分叉，未复用 `placePiece` 这条“音视效主干”。
- 根因 2：服务端技能语义存在局部漂移（`move_self/move_enemy/swap` 的回合推进与本地不一致）。
- 根因 3：联机前端缺少“事件 -> 音频/视效”桥接层，导致协议到状态但不到体验。
- 根因 4：自动化测试覆盖偏窄，未覆盖“10 技能语义一致性 + 音视效一致性 + 断线恢复一致性”。

---

## 11. 第2轮热更新执行计划（扫描结果驱动版）

### 11.1 Batch 2-A（P0）规则语义统一（先做）
- 目标：先清除“会改变胜负/回合结果”的硬差异。
- 任务：
  1. 修正 `move_self/move_enemy/swap` 的回合推进策略，与本地语义保持一致。
  2. 为 10 技能建立“语义契约表”（触发条件、目标合法性、是否换手、是否仍需落子、胜负检查时机）。
  3. 统一 `server:skill_invalid` 错误码到前端提示映射，降低“可用但看起来不可用”的误判。
  4. 将 `god_hand` 相关失败分支补充可见提示（目标非法、路径非法、领地限制等）。
- DoD：
  1. 10 技能规则与本地基线一致。
  2. 双端操作同一剧本，棋盘状态与回合推进一致。

### 11.2 Batch 2-B（P1）渲染链路统一
- 目标：联机落子/技能触发与本地观感一致。
- 任务：
  1. 建立联机落子渲染桥，复用本地落子特效主干（保留服务端权威状态，不回退到本地判定）。
  2. 联机技能交互补齐 `casting-*` 视觉态、源点半透明、阶段提示。
  3. 技能变更应用改为“按 change 增量演出”，避免全量 `renderBoard()` 吞掉特效语义。
  4. 结算特效补齐：双方都能看到连珠线，胜方再叠加庆祝特效。
- DoD：
  1. 三套皮肤（classic/nature/ice_fire）在联机下都有落子动态特效。
  2. 10 技能施法阶段可视引导与本地一致。

### 11.3 Batch 2-C（P1）音频桥接与炸弹链路修复
- 目标：恢复联机关键声效，优先修复炸弹与技能反馈。
- 任务：
  1. 建立 `online_audio_bridge`（事件到音频映射）：`piece_placed`, `skill_used`, `game_over`, `timer_sync`, `bomb_activated`。
  2. 接入炸弹链路：`room:bomb_activated` 监听 + `switchTrack('bomb')` + `setCritical` 策略。
  3. 补齐混乱骰子、技能释放、结算音效（胜利/失败/爆炸）。
  4. 联机落子音效按皮肤差异化（不再固定 `playPlace`）。
- DoD：
  1. 用户已报告缺失项（时间炸弹 BGM、混乱骰子音效、落子差异音）全部恢复。
  2. 不出现重复播放、错时播放、断线后持续播放。

### 11.4 Batch 2-D（P1/P2）状态与协议健壮化
- 目标：把“可玩”提升到“稳定一致可迭代”。
- 任务：
  1. 重连快照补齐 `lastMove/moveCount` 等界面依赖字段，恢复后不丢 UI 状态。
  2. 悔棋语义补齐：避免仅撤最后一步而不回滚技能副状态。
  3. 清理协议漂移：未使用事件要么删除，要么恢复端到端链路（如 `room:skill_effect` / `processTurnEndEffects`）。
  4. 输入校验继续收紧（保持兼容窗口）。
- DoD：
  1. 重连、悔棋、再来一局后状态不漂移。
  2. 协议中不存在“服务端发出但前端无监听”的孤儿事件。

### 11.5 Batch 2-E（P2）测试门禁升级与封板
- 目标：把扫描结论转成可持续的质量门禁。
- 自动化新增：
  1. `server/tests/skillLogic.test.js`：扩展 10 技能语义（含换手语义）。
  2. `server/tests/gameLogic.test.js`：补混沌偏移、短兵 4 连、领地限制边界。
  3. `server/tests/roomManager.test.js`：断线/重连窗口、BO3 轮转。
  4. `server/tests/protocolContract.test.js`：新增事件与兼容字段校验。
- 手测新增：
  1. 10 技能逐项“本地 vs 联机”对照录表（规则/渲染/音频/UI）。
  2. 皮肤矩阵（classic/nature/ice_fire）落子音视效回归。
  3. 断线重连、强退回菜单、模式切换污染回归。

### 11.6 执行顺序与发布纪律
1. 固定顺序：`2-A -> 2-B -> 2-C -> 2-D -> 2-E`，严禁跳批次。
2. 每批只解决同类问题，避免混合大改导致回归定位困难。
3. 每批通过门禁后再发布；失败立即回滚到上一批稳定版本。

### 11.7 下一窗口可直接执行（第2轮热更新）
1. 先修 `move_self/move_enemy/swap` 的联机换手语义（P0）。
2. 再补 `room:bomb_activated` 前端监听与炸弹音频链路（P0）。
3. 然后打通联机落子渲染桥，恢复三套皮肤落子特效与差异音（P1）。
4. 最后补齐技能施法态视觉（`casting-*`）与 10 技能对照回归表（P1）。

---

## 12. 2026-03-03 文档同步与ID显示优化（本轮）

### 12.1 本轮已完成
- 文档同步：
  1. `AGENTS_CONTEXT.md` 增补“悔棋请求弹窗 ID 高亮规则”与“在线 ID 显示规范”。
  2. 本计划文档新增本节，记录本轮 UI 规范与落地状态。
- 前端优化：
  1. `js/network/online_ui.js`：悔棋请求弹窗改为结构化渲染，`requesterName` 使用 `.player-id` 样式高亮。
  2. `style.css`：新增 `.player-id` 绿色强调样式，统一适配 `游客XXXX` 与未来账号 ID。

### 12.2 规范定义（后续执行统一遵守）
- 规范 1：凡是“玩家 ID/昵称作为身份标识”在联机提示文案中出现，默认使用 `.player-id` 绿色高亮显示。
- 规范 2：游客态（`游客XXXX`）与账号态（未来用户 ID）使用同一渲染策略，不做分叉样式。
- 规范 3：优先使用结构化渲染（DOM 节点拼接）而不是直接拼接 HTML 文本，避免文案注入风险。

### 12.3 下一步衔接（不改范围）
1. 将 `.player-id` 规则扩展到其他联机身份提示位（等待房间、结算提示、系统广播）。
2. 为“ID 显示一致性”补一条手测用例（游客 vs 未来账号态），纳入 Batch 2-E 回归清单。
