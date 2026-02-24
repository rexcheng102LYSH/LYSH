# Project Lysh - AI Interaction Rules (AGENTS.md)

## 0. Mandatory Pre-Read
- Before every response (actions, Q&A, casual chat, brainstorming), read `AGENTS.md` and `AGENTS_CONTEXT.md` first.
- If either file changed, re-read both files before continuing.

NOTE FOR AI: Also read `AGENTS_CONTEXT.md` for the file map and logic overview.

你好AI，我是项目负责人。这里是 Project Lysh（技能版五子棋）的核心开发规则。  
作为长期 Web 项目，请在生成或修改代码前，严格遵守以下规则。

## 1. 项目目标 (Project Goals)
- **核心定义**：本项目是基于 Web (HTML/CSS/JS) 的“技能版五子棋”，目标为长期可发布（io 网站 / Steam 方向）。
- **核心体验**：传统五子棋 + 技能系统 + 动态 UI + 视觉/音频反馈。
- **用户画像**：喜欢策略博弈与高反馈表现的玩家。
- **当前阶段**：Alpha（当前主线版本已到 `Alpha0.7.9.8`），优先保证稳定与一致性。

## 2. 技术偏好 (Tech Stack & Preferences)

### 前端技术栈 (Frontend Stack)
- **核心语言**：Vanilla JavaScript, HTML5, CSS3
- **模块化架构**：按功能拆分（`audio` / `fx` / `game` / `network` / `skills`）
- **图形渲染**：Canvas API（`bgCanvas` + `fxCanvas`）
- **动画控制**：`requestAnimationFrame` + 统一帧率控制器
- **实时通信**：Socket.IO client（联网对战）
- **新增 UI 框架**：Tailwind CSS（本地静态构建 `tailwind.generated.css`）+ Anime.js（CDN，带降级包装）

### 后端技术栈 (Backend Stack)
- **运行环境**：Node.js
- **Web 框架**：Express.js
- **实时通信**：Socket.IO server
- **部署形态（当前）**：单服务托管前后端（`server/index.js` 同时静态托管前端 + WebSocket）

### 部署与运维 (Deploy & Ops)
- **Zeabur**：使用项目根目录 `Dockerfile` + `zeabur.yaml`，健康检查 `GET /api/status`
- **本地启动**：可用 `server/start.bat` / `server/stop.bat` / `server/restart.bat`
- **辅助工具**：存在独立 `git-stash/` 子项目用于 stash 可视化管理（与游戏主逻辑解耦）

### 开发工具 (Development Tools)
- **本地开发**：VS Code Live Server / Node 本地服务
- **编码规范**：必须 UTF-8，保证中英文与符号安全

### 架构设计原则
- **模块化**：单一职责，尽量按模块追加，不随意改核心主干
- **状态集中管理**：`GameState` 为主状态源，旧全局变量需同步兼容
- **兼容优先**：新增能力尽量“新增函数/末尾追加”，避免破坏既有流程

### 当前关键架构补充（仅增量认知）
- **全局运行时兜底**：`index.html` 已包含 `error / unhandledrejection` 监听与 `fatalErrorOverlay` 回退层，改启动链路时需保持可用。
- **皮肤二级调参链路**：`js/game/game_ui.js` 中经典/自然/冰火皮肤支持长按进入二级参数面板（long-press）。
- **开发者入口链路**：`LYSH` 开发者区域、DJ 指示器开关与键盘 `L` 快捷入口属于在用测试控制面。
- **大厅建房扩展参数**：建房包含规则预设、技能子集与可选 4 位密码，需保持前后端事件载荷兼容。
- **房间号兼容策略**：后端当前规范为 4 位，前端保留 4-6 位输入兼容；避免单边修改。

## 3. 代码风格 (Code Style)
- **完整性**：输出代码时严禁省略（禁止 `// ... rest of code` / `// ... previous code`）。
- **结构与命名**：优先保持现有命名与结构（如 `GameState`, `updateDynamicUI`）。
- **注释**：关键逻辑保留中文注释；修改处添加简短注释说明原因。

## 4. 风险偏好 (Risk Tolerance)
- **稳定性优先**：优先修 bug、性能隐患、逻辑不一致。
- **保守改动**：未经确认不要修改主交互流程和核心判定。
- **状态同步**：涉及 `GameState` 的改动必须考虑旧全局兼容。
- **新增功能原则**：尽量新增而非重构，特别避免直接改动胜负判定主干。
- **大改须沟通**：涉及大规模重构/迁移，先沟通再执行。

## 5. 测试/验证 (Testing Strategy)
- **环境**：优先本地手测（Live Server / 本地 Node）。
- **验证指引**：每次改动后说明“要测什么”。
- **手测优先**：给出可执行步骤（进房、选技能、落子、悔棋、再来一局等）。
- **无法测试**：若无法运行测试，必须明确说明并给出替代验证方案。

## 6. 输出习惯 (Output Habits)
- **操作指引**：说明修改了哪个文件、哪一部分。
- **表达顺序**：先说改动目的，再列改动点与路径。
- **语言**：中文输出，简洁明确；有疑问先问。

## 7. 语言与沟通 (Language & Communication)
- **语言**：中文沟通。
- **风格**：清晰、直接、通俗，照顾非专业程序员理解成本。

## 8. 禁区 (Forbidden Zones)
- **严禁偷懒**：大任务必须完整搬运与核对，不得遗漏有效旧代码。
- **严禁擅自升级**：不得擅自改游戏版本号，除非负责人明确要求。
- **严禁乱改**：任何代码改动前，应先说明改动意图与范围。
- **PowerShell可用范围**：允许只读操作（检索、查看、测试、诊断）。
- **PowerShell禁用范围**：禁止直接写入/覆盖代码文件（如 `>`、`>>`、`Set-Content`、`Out-File`）。
- **【强制】UTF-8 编码 (Enforce UTF-8)**：
  - **规则**：任何文本/代码文件必须为 `UTF-8`。
  - **防乱码机制**：禁止依赖系统默认编码（如 Windows GBK/CP1252）写入代码。
  - **Emoji 处理**：涉及 Emoji 或中文时，直接使用原始字符，不做脚本转码。

---
AI，请确认你已理解上述规则，并在后续协助中严格执行。
