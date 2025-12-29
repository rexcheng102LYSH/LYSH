# Project Lysh 架构概览

## 架构演进

### 旧架构（Alpha 0.7.8.6 之前）
- 单体文件结构（game.js、audio.js、fx.js）
- 全局变量管理状态
- 功能耦合度高，难以扩展

### 新架构（Alpha 0.7.8.9+）
- **Host + Plugins 模式**：核心系统 + 可插拔模块
- **模块化文件结构**：按功能域拆分独立模块
- **集中式状态管理**：GameState 单一数据源
- **注册表模式**：统一的模块注册和管理机制

---

## 核心系统架构

### 1. 状态管理系统（gamestate.js）

**职责**：
- 集中管理所有游戏状态
- 提供状态快照和恢复功能（用于悔棋）
- 向后兼容旧全局变量

**关键接口**：
```javascript
GameState = {
    // 核心状态
    board: Cell[][]
    currentPlayer: Player
    gameActive: boolean
    
    // 方法
    resetGame(): void
    resetMatch(): void
    createSnapshot(): Snapshot
    restoreSnapshot(snapshot): void
}
```

---

### 2. 音频系统（js/audio/）

**架构模式**：Host + Plugins

```
AudioHost (audio_host.js)
├── Hub Plugin (audio_hub.js) - SoundEngine 主体
├── SFX Plugin (audio_sfx.js) - 合成音效 + DJ 逻辑
└── Assets Plugin (audio_assets.js) - MP3 资源管理
```

**工作流程**：
1. AudioHost 作为容器，管理所有音频插件
2. Hub Plugin 提供 `SoundEngine` 全局对象
3. 其他插件通过 `install(target)` 方法注入功能到 SoundEngine
4. 最终 `window.SoundEngine` 包含所有音频功能

**关键接口**：
```javascript
AudioHost = {
    modules: {}
    register(name, module): void
    bootstrap(): void
}

SoundEngine = {
    // BGM 控制
    init(): void
    toggle(): void
    switchTrack(trackName): void
    
    // 音效播放
    playNote(freq, duration, type): void
    playKick(): void
    playMiss(): void
    playCoinCollect(): void
    
    // DJ 系统
    startDJChallenge(): void
    djPlayerHit(): void
}
```

---

### 3. 视觉特效系统（js/fx/）

**架构模式**：Dispatcher + Modules

```
VisualFX (fx_host.js) - 调度器
├── Lines Module (lines.js) - 连珠线条特效
└── Winning Modules
    ├── Fireworks (winning/fireworks.js)
    ├── Golden (winning/golden.js)
    └── DJ (winning/dj.js)
```

**工作流程**：
1. VisualFX 管理全屏 Canvas 和渲染循环
2. 模块通过 `VisualFX.register(name, module)` 注册
3. 每帧调用 `renderFrame()` 分发到活跃模块
4. 模块实现 `start()`、`render()`、`reset()` 接口

**关键接口**：
```javascript
VisualFX = {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    modules: {}
    activeModule: Module
    
    // 核心方法
    init(): void
    register(name, module): void
    renderFrame(now): void
    
    // 特效控制
    startCelebration(type): void
    drawWinLine(cells, type): void
    clear(): void
}

// 模块接口
Module = {
    start(width, height): void
    render(ctx, width, height, now): void
    reset(): void
    handleClick?(x, y, event): void  // 可选
}
```

---

### 4. 游戏逻辑系统（js/game/）

**架构模式**：Host + Modules

```
GameHost (game_host.js) - 模块注册表
├── Core Module (game_core.js) - 核心流程
├── UI Module (game_ui.js) - UI 更新
├── Render Module (game_render.js) - 渲染
├── Skills Module (game_skills.js) - 技能流程
└── AI Module (game_ai.js) - AI 辅助
```

**职责划分**：
- **game_core.js**：回合管理、输入处理、胜负判定、计时器
- **game_ui.js**：UI 更新、设置面板、皮肤切换、提示消息
- **game_render.js**：棋盘渲染、棋子绘制
- **game_skills.js**：技能选择界面、技能激活流程
- **game_ai.js**：AI 评估函数、辅助工具

---

### 5. 技能系统（js/skills/）

**架构模式**：Registry + Plugins

```
SkillRegistry (registry.js) - 中央注册表
├── double.js - 双连
├── voodoo.js - 巫毒腐蚀
├── move_self.js - 移花接木
├── move_enemy.js - 乾坤大挪移
├── zone.js - 领地
├── bomb.js - 时间炸弹
├── god_hand.js - 上帝之手
├── chaos.js - 混沌干扰
├── short_battle.js - 短兵相接
└── swap.js - 交换
```

**工作流程**：
1. 每个技能文件调用 `SkillRegistry.registerSkill(id, definition)`
2. 技能定义包含 `activate()` 函数和可选的 `effects` 对象
3. 游戏逻辑通过 `SkillRegistry.getSkill(id)` 获取技能
4. 效果处理通过 `SkillRegistry.getEffect(name)` 获取

**技能接口**：
```javascript
SkillDefinition = {
    id: string
    name: { zh: string, en: string }
    desc: { zh: string, en: string }
    activate(player): void
    effects?: {
        [effectName: string]: (data) => void
    }
}
```

---

## 数据流

### 游戏启动流程
```
1. index.html 加载所有脚本（按依赖顺序）
2. DOMContentLoaded 触发
3. BackgroundEngine.init()
4. FrameRateController.start()
5. VisualFX.init()
6. 用户点击 → SoundEngine.init()（解锁 AudioContext）
```

### 落子流程
```
1. 用户点击棋盘 → handleCellClick()
2. 检查游戏状态和合法性
3. 更新 GameState.board
4. 创建快照 → historyStack.push()
5. 渲染棋子 → renderBoard()
6. 播放音效 → SoundEngine.playNote()
7. 检查胜负 → checkWin()
8. 切换玩家 → switchPlayer()
9. 更新 UI → updateDynamicUI()
10. AI 回合 → aiMove()（如果是 PvE）
```

### 技能激活流程
```
1. 用户点击技能按钮 → activateSkill()
2. 获取技能定义 → SkillRegistry.getSkill(id)
3. 调用 skill.activate(player)
4. 设置 GameState.activeEffect
5. 等待用户操作（如选择目标）
6. 执行技能效果
7. 标记技能已使用 → skillUsed[player] = true
8. 更新 UI → updateDynamicUI()
```

### 特效渲染流程
```
1. FrameRateController 每帧调用 VisualFX.renderFrame()
2. VisualFX 清空 Canvas
3. 渲染连珠线条 → lines.render()
4. 渲染活跃特效 → activeModule.render()
5. 更新 FPS 计数器
```

---

## 扩展指南

### 新增技能
1. 在 `js/skills/` 创建新文件（如 `new_skill.js`）
2. 定义技能对象并调用 `SkillRegistry.registerSkill()`
3. 在 `index.html` 添加 `<script>` 标签
4. 在 `gamestate.js` 的 `SKILL_IDS` 数组添加 ID
5. 在 `lang.js` 添加多语言文本

### 新增特效
1. 在 `js/fx/winning/` 创建新文件（如 `new_effect.js`）
2. 实现 `start()`、`render()`、`reset()` 方法
3. 调用 `VisualFX.register('new_effect', module)`
4. 在 `index.html` 添加 `<script>` 标签
5. 在设置面板添加选项

### 新增音效
1. 在 `js/audio/audio_sfx.js` 添加新函数
2. 通过 `install(target)` 方法注入到 SoundEngine
3. 在需要的地方调用 `SoundEngine.newSound()`

---

## 性能优化策略

### 1. 帧率控制
- FrameRateController 支持 60FPS 限制或无限制
- 默认 60FPS 保护低配设备
- 用户可在设置中切换

### 2. Canvas 优化
- `desynchronized: true` 降低渲染延迟
- 每帧重置绘图状态避免污染
- 使用 `save()` / `restore()` 隔离模块

### 3. 内存管理
- 对象池技术管理粒子特效（待实现）
- 避免频繁创建/销毁对象
- 及时清理不再使用的资源

### 4. 模块化加载
- 按需初始化模块
- 延迟加载非关键资源
- 减少启动时间

---

## 向后兼容

### 全局变量映射
为确保旧代码无需修改，保留以下全局变量：
```javascript
// 这些变量现在指向 GameState 的属性
let board = GameState.board
let currentPlayer = GameState.currentPlayer
let gameMode = GameState.gameMode
// ... 等等
```

### 函数签名保持不变
所有公开的函数接口保持向后兼容，内部实现可以重构。

---

## 未来规划

### 短期（Alpha 0.7.9 - 0.8.x）
- 实现对象池技术
- 批量导入皮肤资源
- 强化技能特效

### 中期（Alpha 0.9.x）
- 实现皮肤系统
- UI 微交互动画
- 性能深度优化

### 长期（Beta 1.0+）
- WebSocket 联网对战
- 后端服务架构
- Steam SDK 集成
