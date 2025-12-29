# 技术栈

## 核心技术

- **前端框架**：原生 JavaScript (ES6+)、HTML5、CSS3
- **图形渲染**：HTML5 Canvas API 用于背景和视觉特效
- **音频系统**：Web Audio API 用于程序化声音合成、HTML5 Audio 用于 MP3 播放
- **无构建系统**：直接在浏览器中执行，无需打包工具或编译

## 关键库与 API

- **Web Audio API**：实时声音合成（振荡器、增益节点、滤波器）
- **Canvas 2D Context**：粒子系统、天气效果、烟花、节奏游戏视觉效果
- **RequestAnimationFrame**：流畅的 60fps 动画

## 架构模式

- **Host + Plugins 模式**：核心系统（AudioHost、VisualFX、GameHost）+ 可插拔模块
- **模块注册表**：SkillRegistry、AudioHost.modules、VisualFX.modules 统一管理
- **集中式状态管理**：GameState 对象作为单一数据源
- **事件驱动**：DOM 事件监听器处理用户交互

## 文件结构（Alpha 0.7.8.9+）

### 核心入口
- `index.html` - 主入口文件，UI 结构，脚本加载顺序
- `style.css` - 所有样式、动画、响应式设计
- `gamestate.js` - 集中式状态管理系统
- `ai.js` - AI 对手逻辑入口

### 音频系统（js/audio/）
- `audio_host.js` - AudioHost 核心（Host + Plugins 架构）
- `audio_hub.js` - SoundEngine 主体（BGM 控制、DJ 状态容器）
- `audio_sfx.js` - 合成音效 + DJ 音频逻辑（Plugin）
- `audio_assets.js` - MP3 资源管理（Plugin）

### 视觉特效系统（js/fx/）
- `fx_host.js` - VisualFX 调度器（Canvas 管理 + 模块路由）
- `lines.js` - 连珠线条特效
- `winning/fireworks.js` - 烟花特效插件
- `winning/golden.js` - 流金特效插件
- `winning/dj.js` - DJ 节奏游戏插件

### 游戏逻辑系统（js/game/）
- `game_host.js` - GameHost 模块注册表
- `game_core.js` - 核心流程（回合、胜负、计时器、输入）
- `game_ui.js` - UI 更新、设置、皮肤、提示
- `game_render.js` - 棋盘 + 棋子渲染
- `game_skills.js` - 技能选择 + 激活流程
- `game_ai.js` - AI 评估辅助函数

### 技能系统（js/skills/）
- `registry.js` - SkillRegistry 中央注册表
- `double.js` - 双连技能
- `voodoo.js` - 巫毒腐蚀技能
- `move_self.js` - 移花接木技能
- `move_enemy.js` - 乾坤大挪移技能
- `zone.js` - 领地技能
- `bomb.js` - 时间炸弹技能
- `god_hand.js` - 上帝之手技能
- `chaos.js` - 混沌干扰技能
- `short_battle.js` - 短兵相接技能
- `swap.js` - 交换技能

### 其他模块
- `lang.js` - 国际化系统（i18n）
- `assets.js` - SVG 图标和图像资源定义
- `background.js` - 四季背景特效引擎

### 资源文件
- `images/` - PNG 图片资源（sun.png、maple.png、gold.png）
- `bgm1.mp3 ~ bgm7.mp3` - 背景音乐
- `bgs1.mp3` - 环境音效
- `shot.m4a` - 枪响音效

## 架构设计原则

### 1. 模块化与可扩展性
- **新增技能**：在 `js/skills/` 创建新文件，调用 `SkillRegistry.registerSkill()`
- **新增特效**：在 `js/fx/winning/` 创建插件，调用 `VisualFX.register()`
- **新增音效**：在 `audio_sfx.js` 或 `audio_assets.js` 添加函数，通过 `install()` 注入

### 2. 状态管理
- **单一数据源**：GameState 对象集中管理所有游戏状态
- **快照与恢复**：支持 `createSnapshot()` 和 `restoreSnapshot()` 用于悔棋
- **向后兼容**：保留旧全局变量引用，指向 GameState 属性

### 3. 性能优化
- **帧率控制**：FrameRateController 支持 60FPS 限制或无限制
- **Canvas 优化**：desynchronized 模式降低延迟
- **对象池**：粒子特效使用对象池避免频繁 GC

## 常用命令

**开发环境**：
```bash
# 本地启动服务器（任意 HTTP 服务器）
python -m http.server 8000
# 或者
npx serve
```

**测试**：
- 在现代浏览器中打开 `index.html`（Chrome、Firefox、Safari、Edge）
- 使用 VS Code Live Server 进行实时预览
- 无需编译或构建步骤

**部署**：
- 将所有文件上传到静态托管服务（GitHub Pages、Netlify、Vercel）
- 确保 `.mp3`、`.m4a` 和 `.png` 文件的 MIME 类型正确
- 注意：Safari 需要用户交互才能播放音频（已通过 `onclick="SoundEngine.init()"` 处理）

## 调试技巧

- **FPS 计数器**：右上角显示实时帧率
- **全局错误捕获**：致命错误会弹窗显示错误来源和堆栈
- **浏览器控制台**：查看 `GameState`、`SoundEngine`、`VisualFX` 对象状态
- **模块检查**：`AudioHost.modules`、`VisualFX.modules`、`SkillRegistry.skills`
