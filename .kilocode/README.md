# Kilo Code 代码库索引配置说明

## 📌 什么是代码库索引？

代码库索引是 Kilo Code 的一项智能功能，它会扫描你的整个项目代码，建立知识库，让 AI 更深入地理解你的代码结构。

## ✅ 对你的五子棋项目的好处

### 1. 提升代码理解能力
- 知道 [`GameState`](../gamestate.js) 在哪里定义、在哪里被修改
- 理解模块之间的依赖关系（[`game_core.js`](../js/game/game_core.js) 调用了 [`game_render.js`](../js/game/game_render.js) 的哪些函数）
- 理解技能系统架构（[`skills/`](../js/skills/) 目录下的文件关系）

### 2. 提供更精准的建议
- 快速定位相关的代码片段
- 给出更符合你项目架构的建议
- 减少理解代码的时间，提高协作效率

### 3. 智能搜索能力
- 可以跨文件查找函数、变量的定义和使用位置
- 快速跳转到相关代码
- 理解游戏的主流程和状态流转

## 🚀 启用索引

索引已经自动启用！配置文件位于 [`.kilocode/mcp.json`](mcp.json)

## ⚙️ 配置说明

### 包含的文件类型
- ✅ JavaScript 文件 (`.js`)
- ✅ HTML 文件 (`.html`)
- ✅ CSS 文件 (`.css`)
- ✅ JSON 配置文件 (`.json`)
- ✅ Markdown 文档 (`.md`)

### 排除的目录和文件
- ❌ `backup/` - 备份文件不需要索引
- ❌ `save/` - 存档文件不需要索引
- ❌ `.git/` - Git 历史不需要索引
- ❌ `.kiro/` - 日志文件不需要索引
- ❌ `.history/` - 编辑器历史不需要索引
- ❌ `node_modules/` - 依赖包不需要索引
- ❌ 媒体文件 (`.mp3`, `.m4a`, `.png`, `.jpg`, `.jpeg`)
- ❌ 密钥文件 (`.keystore`)

### 优先索引文件
这些文件会被优先索引，因为它们是项目的核心：
- [`AGENTS.md`](../AGENTS.md) - AI 交互规则
- [`AGENTS_CONTEXT.md`](../AGENTS_CONTEXT.md) - 文件映射和逻辑概览
- [`gamestate.js`](../gamestate.js) - 游戏状态（单一真理源）
- [`index.html`](../index.html) - 主入口文件
- [`js/game/game_core.js`](../js/game/game_core.js) - 核心流程
- [`js/game/game_ui.js`](../js/game/game_ui.js) - UI 更新
- [`js/game/game_render.js`](../js/game/game_render.js) - 棋盘渲染
- [`js/game/game_skills.js`](../js/game/game_skills.js) - 技能系统
- [`js/skills/registry.js`](../js/skills/registry.js) - 技能注册表
- [`server/index.js`](../server/index.js) - 服务器入口
- [`server/gameLogic.js`](../server/gameLogic.js) - 游戏逻辑

## 📊 项目上下文提示

索引配置包含项目特定的上下文提示：

```json
{
  "projectType": "web-game",
  "mainLanguage": "javascript",
  "frameworks": ["vanilla-js", "socket.io", "express"],
  "architecture": "modular-es6",
  "keyPatterns": {
    "gameState": "gamestate.js",
    "audio": "js/audio/",
    "effects": "js/fx/",
    "skills": "js/skills/",
    "network": "js/network/",
    "backend": "server/"
  }
}
```

这些提示帮助 Kilo Code 理解：
- 这是一个 Web 游戏项目
- 使用原生 JavaScript（无框架）
- 使用 Socket.IO 和 Express
- 采用 ES6 模块化架构
- 各个模块的职责划分

## 🔧 更新策略

- **自动更新**：已启用
- **防抖延迟**：1000 毫秒（停止编辑 1 秒后才更新索引）
- **增量更新**：只更新修改过的文件，速度快

## ⚠️ 注意事项

1. **首次索引时间**：根据项目大小，可能需要 2-5 分钟
2. **增量更新**：之后修改代码会自动更新索引，很快
3. **隐私安全**：索引数据只用于当前对话，不会外泄
4. **可随时关闭**：如果觉得慢，可以在 Kilo Code 界面中禁用

## 🎯 如何验证索引是否工作？

在 Kilo Code 对话中，你可以尝试：
- "帮我找到 GameState 对象的所有修改位置"
- "show me the skill activation flow"
- "找出所有调用 handleCellClick 的地方"

如果 Kilo Code 能够快速准确地回答这些问题，说明索引工作正常！

## 📝 手动重新索引

如果需要手动触发索引重新扫描：
1. 在 Kilo Code 对话界面找到"索引"按钮
2. 点击"重新索引"或类似选项
3. 等待索引完成

---

**配置创建时间**：2026-01-31
**项目版本**：Alpha 0.7.8.9
