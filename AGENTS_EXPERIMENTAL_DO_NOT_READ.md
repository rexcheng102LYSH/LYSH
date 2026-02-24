# [试验版本] Project Lysh - AI Interaction Rules (DO NOT READ)

警告：
- 本文件为试验版本，仅供人工对比与回顾。
- Agent 不应将本文件作为规则来源，不应在执行前读取本文件。
- Agent 只应读取 `AGENTS.md` 与 `AGENTS_CONTEXT.md`。

# Project Lysh - AI Interaction Rules (AGENTS.md)

Last updated: 2026-02-24  
Owner: Project Lead (Lysh)

## 0. Mandatory Pre-Read
- On the first response of each new user request, read `AGENTS.md` and `AGENTS_CONTEXT.md` before acting.
- If either file changes during the current session, re-read both files before continuing.
- Do not repeatedly re-read both files for every follow-up reply if no change happened.

NOTE FOR AI: `AGENTS.md` is for behavior/rules. `AGENTS_CONTEXT.md` is for architecture/source-of-truth context.

你好AI，我是项目负责人。这里是 Project Lysh（技能版五子棋）的核心开发规则。  
作为长期 Web 项目，请在生成或修改代码前，严格遵守以下规则。

## 1. Project Goals
- Core product: Web 技能版五子棋（长期发布导向，io / Steam 方向）。
- Core experience: 传统五子棋 + 技能系统 + 动态 UI + 视觉/音频反馈。
- Current phase: Alpha，当前主线版本标记为 `Alpha0.7.9.8`。
- Primary priority: 稳定性与一致性优先于激进迭代。

## 2. Version Semantics (Single Definition)
- Frontend display version: shown in `index.html` (e.g. `Alpha0.7.9.8`) for玩家可见版本。
- Backend protocol/runtime version: from `GET /api/status` field `version` (e.g. `1.1.0`) for联机能力协商。
- When discussing "current version", always specify which one (frontend display vs backend protocol).

## 3. Engineering Preferences
- Stack: Vanilla JS / HTML / CSS + Canvas + Socket.IO。
- Architecture: 模块化、单一职责、尽量新增而不是重构主干。
- State: `GameState` 是主状态源；改动时必须同步旧全局兼容。
- Compatibility: 保持前后端事件载荷与关键协议向后兼容。

## 4. Risk Tolerance
- 稳定性优先：优先修 bug、性能隐患、逻辑不一致。
- 保守改动：未经确认不改核心交互流程与胜负判定主干。
- 大改须沟通：涉及重构/迁移先沟通再执行。

## 5. Testing & Validation
- 优先本地手测（Live Server / Node 本地服务）。
- 每次改动后明确说明“要测什么”与可执行步骤。
- 如无法运行测试，必须明确说明并给出替代验证方案。

## 6. Output & Communication
- 中文沟通，简洁明确。
- 先说改动目的，再列改动点与文件路径。
- 有不确定点先提问，不带猜测落地高风险改动。

## 7. Forbidden Zones
- 严禁偷懒：禁止省略关键代码或跳过核对。
- 严禁擅自升级：未经明确要求不得改版本号。
- 严禁乱改：改代码前先说明意图与范围。
- PowerShell 仅用于只读检索/查看/测试/诊断；避免用重定向或 `Set-Content` / `Out-File` 写源码。
- 强制 UTF-8：所有文本/代码文件必须 UTF-8，显式读写，不依赖系统默认编码。
- 乱码污染扫描（关键文件改动后）：执行 `rg "\\?\\?\\?|\\x{FFFD}"`。

## 8. Doc Ownership & Maintenance
- Rule ownership: `AGENTS.md` 只放规则，不放易变架构细节。
- Context ownership: 架构、文件地图、协议流程放 `AGENTS_CONTEXT.md`。
- Update trigger: 任何涉及模块边界、联机协议、部署拓扑、版本语义的改动，都要同步更新对应文档。

---
AI，请确认你已理解上述规则，并在后续协助中严格执行。
