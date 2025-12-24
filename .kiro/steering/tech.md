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

- **模块模式**：全局命名空间对象（例如 `SoundEngine`、`BackgroundEngine`、`VisualFX`、`I18N`）
- **事件驱动**：DOM 事件监听器处理用户交互
- **状态管理**：全局游戏状态变量，手动同步

## 文件结构

- `index.html` - 主入口文件，UI 结构
- `style.css` - 所有样式、动画、响应式设计
- `game.js` - 核心游戏逻辑、棋盘状态、回合管理
- `ai.js` - AI 对手逻辑，包含难度级别
- `audio.js` - 音效引擎，程序化合成
- `background.js` - 四季背景特效引擎
- `fx.js` - 视觉特效（连珠线、烟花、DJ 游戏）
- `lang.js` - 国际化系统，语言切换
- `assets.js` - SVG 图标和图像资源定义

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
- 无需编译或构建步骤

**部署**：
- 将所有文件上传到静态托管服务（GitHub Pages、Netlify、Vercel）
- 确保 `.mp3` 和 `.png` 文件的 MIME 类型正确
