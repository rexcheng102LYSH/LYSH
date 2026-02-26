# Project Lysh 框架接入执行清单（产品价值优先版，供编程模型执行）

Last updated: 2026-02-26  
Applies to: Frontend display `Alpha0.7.9.8` / Backend protocol `1.1.0`

## 0. 使用说明（先看）

- 本文档是“执行清单 + 发布闸门”，不是技术脑暴清单。
- 每次开发只允许推进一个阶段，未通过本阶段退出条件不得进入下一阶段。
- 任何任务先保稳定，再追求效果；不为“接入框架”本身交付。

---

## 1. 产品目标与量化指标

## 1.1 本轮目标

- 提升玩家可感知质量：流畅度、稳定性、联机成功率。
- 提升团队可维护性：新增特效/动画不改核心判定链路。

## 1.2 KPI 与验收阈值

| 指标 | 基线来源 | 目标阈值 | 阻断线 |
|---|---|---|---|
| Online 完整对局成功率 | P0 基线手测 | >= 基线 + 2% | < 基线 |
| 高峰特效场景 FPS P50 | P0 基线录制 | >= 基线 + 10% | < 基线 - 5% |
| 致命报错数（window.error/unhandledrejection） | diagnostics | 0 回归 | 任意新增致命错误 |
| 新技能特效开发改动面 | PR 统计 | 仅改 adapter/特效层 | 触及 core 判定链 |

备注：若短期无法采集百分比，可先以固定场景的“通过/失败”次数统计代替。

---

## 2. 技术策略（产品经理视角）

## 2.1 项目真正缺口

- 真正缺的是“运行时治理层”，不是堆更多框架：
  - `FeatureFlags`
  - `MotionAdapter`
  - `FXBackendAdapter`
  - `Diagnostics + Performance Budget`

## 2.2 框架优先级（MoSCoW）

- Must:
  - `PixiJS`（仅 FX 层，承载性能与视觉上限）
- Should:
  - `GSAP`（只做复杂时间线编排）
- Keep and optimize:
  - `Anime.js`（轻量局部动画）
  - `Tailwind`（增量 UI + 设计令牌）
- Could:
  - `WebGPU`（实验层，默认关闭）
- Won't（当前阶段不做）:
  - Vue/React 全站迁移
  - Phaser 全量替换
  - WebGPU 主线依赖

---

## 3. 不可违反约束

- `GameState` 是状态真源，动画/渲染层禁止写回合、步数、胜负。
- Socket 事件名与 payload 语义向后兼容，禁止破坏旧客户端。
- 不改胜负判定主干，不改联机流程顺序。
- 新能力必须 feature flag 控制且默认 `OFF`。
- 任一新能力失败必须自动降级到旧链路（Canvas2D + safeAnime）。

---

## 4. 阶段路线图与退出条件

## P0 基线与治理地基（不新增外部框架）

### P0-T01 基线采集
- GOAL: 建立可重复对照，防止“主观优化”。
- FILES: `/plans/` 下新增基线记录文档。
- CHANGE:
  - 记录首屏、FPS、报错数、Online 完整链路成功率。
  - 固化当前关键脚本加载顺序。
- ACCEPTANCE:
  - 三次重复测试结果可复现，误差在可接受范围。
- ROLLBACK: 无（文档记录）。
- RISK_LEVEL: low
- PRODUCT_IMPACT: 为后续决策提供客观依据。

### P0-T02 FeatureFlags
- GOAL: 支持灰度、回滚和实验隔离。
- FILES: `/js/runtime/feature_flags.js`, `/index.html`
- CHANGE:
  - 新增默认关闭：
    - `motionAdapterEnabled`
    - `gsapEnabled`
    - `pixiFxEnabled`
    - `webglFxEnabled`
    - `webgpuFxEnabled`
- ACCEPTANCE:
  - 全关时行为与当前版本一致。
- ROLLBACK:
  - 移除 flags 引入。
- RISK_LEVEL: low
- PRODUCT_IMPACT: 秒级止损能力。

退出条件（P0 Exit）：
- 基线文档完成。
- FeatureFlags 全关回归通过。
- 无新增线上行为变化。

## P1 优化现有 Tailwind + Anime.js

### P1-T01 Tailwind 治理
- GOAL: 提升一致性与复用，不污染旧 CSS。
- FILES: `/tailwind.config.js`, `/tailwind.input.css`, `/style.css`, `/index.html`
- CHANGE:
  - 保持 `preflight: false`。
  - 新 UI 使用命名域隔离（如 `tw-` 或容器隔离）。
  - 统一设计令牌（CSS 变量）供 Tailwind 与传统 CSS 共用。
- ACCEPTANCE:
  - `npm run tailwind:build` 通过，旧页面无回归。
- ROLLBACK:
  - 回退新增 Tailwind 使用点。
- RISK_LEVEL: low
- PRODUCT_IMPACT: 降低样式碎片化和维护成本。

### P1-T02 MotionAdapter（统一 Anime.js 入口）
- GOAL: 动画去重、可取消、无残留。
- FILES: `/js/runtime/motion_adapter.js`, `/index.html`, `/js/game/game_render.js`
- CHANGE:
  - 统一 `play/cancel/cancelAll` API。
  - 同 key 动画去重，场景切换自动清理。
  - 禁止业务层直接 `anime(...)`。
- ACCEPTANCE:
  - 高频点击、切屏、重开局无叠加和残留。
- ROLLBACK:
  - 关闭 `motionAdapterEnabled`。
- RISK_LEVEL: low
- PRODUCT_IMPACT: 提升体感流畅度与稳定性。

退出条件（P1 Exit）：
- Tailwind 与 Anime 治理完成。
- UI/动画回归通过。
- 无 GameState 同步异常。

## P2 PixiJS 接入（仅 FX 层）

### P2-T01 FXBackendAdapter
- GOAL: 解耦渲染实现与业务。
- FILES: `/js/fx/fx_host.js`, `/js/fx/backends/canvas2d_backend.js`, `/js/fx/backends/pixi_backend.js`
- CHANGE:
  - 抽象 `init/render/resize/dispose`。
  - 默认 Canvas2D，开关开才切 Pixi。
- ACCEPTANCE:
  - 开关关闭时行为等同当前版本。
- ROLLBACK:
  - 固定 Canvas2DBackend。
- RISK_LEVEL: medium
- PRODUCT_IMPACT: 提升后续特效扩展效率。

### P2-T02 WebGL2 优先降级链
- GOAL: 兼容优先，性能第二。
- FILES: `/js/fx/backends/pixi_backend.js`, `/js/runtime/feature_flags.js`
- CHANGE:
  - 渲染链：`WebGPU(实验) -> WebGL2 -> Canvas2D`。
  - init 失败/context lost 自动降级并记录 diagnostics。
- ACCEPTANCE:
  - 不支持 WebGL 设备仍可正常游戏。
- ROLLBACK:
  - 关闭 `pixiFxEnabled/webglFxEnabled/webgpuFxEnabled`。
- RISK_LEVEL: medium
- PRODUCT_IMPACT: 在不牺牲覆盖率前提下提升视觉表现。

退出条件（P2 Exit）：
- FX 层切换稳定。
- 中低端设备回退链路验证通过。
- FPS 指标达到 1.2 节目标。

## P3 GSAP 接入（仅复杂编排）

### P3-T01 GSAP 插件化
- GOAL: 提升复杂演出可控性，不与 Anime 冲突。
- FILES: `/js/runtime/motion_adapter.js`, `/index.html` 或 `/js/vendor/*`
- CHANGE:
  - GSAP 仅在 `gsapEnabled=true` 懒加载。
  - 仅复杂 timeline 使用 GSAP，局部动画保留 Anime。
  - 同一 DOM 属性同一时刻只允许单库写入。
- ACCEPTANCE:
  - 无双库写入冲突；关闭开关可一键回退。
- ROLLBACK:
  - 关闭 `gsapEnabled`。
- RISK_LEVEL: medium-low
- PRODUCT_IMPACT: 关键演出稳定且可维护。

退出条件（P3 Exit）：
- 至少 1 个复杂演出场景稳定上线。
- 动画冲突问题为 0。

## P4 联机与部署收口（必须过）

### P4-T01 协议兼容
- GOAL: 新渲染能力不影响联机协议。
- FILES: `/js/network/*`, `/server/index.js`（仅必要时）
- CHANGE:
  - 仅新增可选字段，不破坏既有语义。
  - 必要时 `/api/status` 增加能力标识字段。
- ACCEPTANCE:
  - 老客户端可连，新客户端可读但不强依赖新字段。
- ROLLBACK:
  - 移除新增可选字段。
- RISK_LEVEL: low
- PRODUCT_IMPACT: 保证线上兼容性。

### P4-T02 Docker/Zeabur 验证
- GOAL: 杜绝“本地好、线上坏”。
- FILES: `/Dockerfile`, `/zeabur.yaml`, `/docs/ZEABUR_DEPLOY_GUIDE.md`（仅必要时）
- CHANGE:
  - 新资源优先本地静态。
  - 容器内完整跑通 health + online 核心路径。
- ACCEPTANCE:
  - `/api/status` 正常，创建/加入/对局链路正常。
- ROLLBACK:
  - 回退构建和资源引入变更。
- RISK_LEVEL: low
- PRODUCT_IMPACT: 发布稳定可控。

退出条件（P4 Exit）：
- 协议兼容、容器发布、联机链路全部通过。

---

## 5. 编程模型任务输出模板（强制）

```text
TASK_ID:
GOAL:
FILES:
CHANGE:
DEPENDENCY:
ACCEPTANCE:
TEST_CASES:
ROLLBACK:
RISK_LEVEL:
PRODUCT_IMPACT:
```

说明：
- `DEPENDENCY`：本任务依赖的上游任务 ID。
- `TEST_CASES`：必须列出自动测试和手测路径。

---

## 6. 测试矩阵（每阶段都要跑）

## 6.1 自动检查
- `npm run tailwind:build`
- `npm run verify`
- `npm --prefix server test`

## 6.2 手测矩阵
- 单机 PvE：开局 -> 连续落子 -> 技能 -> 结算 -> 重开
- 本地 PvP：三番战完整流程
- Online：创建房间 -> 加入 -> 猜拳 -> 选边 -> 对局 -> 悔棋 -> 再来一局
- 页面切换：主菜单/设置/皮肤/在线弹窗反复切换无残留动画
- 失败回退：强制关闭特效开关后功能不受影响

## 6.3 性能预算
- 新增脚本首屏增量建议 <= 30KB（gzip）/阶段
- 对局高峰长任务（>50ms）数量不高于基线
- 内存异常增长（持续上涨不回落）视为阻断问题

---

## 7. 风险台账（持续更新）

| 风险ID | 描述 | 触发信号 | 缓解措施 | 级别 |
|---|---|---|---|---|
| R1 | 动画冲突导致状态错位 | 同元素属性被双库写入 | MotionAdapter 单写入规则 + cancelAll | 高 |
| R2 | WebGL 兼容问题导致黑屏 | init 失败/context lost | 自动降级 Canvas2D + 记录 diagnostics | 高 |
| R3 | 协议字段变更导致旧端异常 | 老客户端 join/play 失败 | 仅新增可选字段 + 回归测试 | 高 |
| R4 | Docker 环境资源加载异常 | 线上 404/health 失败 | 容器内端到端验证 + 本地静态优先 | 中 |
| R5 | Tailwind 污染旧样式 | 旧页面布局错乱 | preflight 关闭 + 命名域隔离 | 中 |

---

## 8. 发布与回滚 Runbook

## 8.1 发布前闸门
- 本阶段退出条件全部通过
- 自动检查通过
- 手测矩阵通过
- 风险台账无未处理高风险

## 8.2 回滚顺序
1. 关闭 feature flags（首选，最快）
2. 停用新脚本引入（`index.html`）
3. 回退 adapter 调用点
4. 回退本阶段代码提交

目标：10 分钟内恢复到“现网同等行为”。

---

## 9. 文档维护要求

- 每完成一个阶段，必须同步更新：
  - 本文档阶段状态与 KPI 结果
  - `AGENTS_CONTEXT.md`（仅架构边界/协议/部署变化）
- 未更新文档视为阶段未完成。
