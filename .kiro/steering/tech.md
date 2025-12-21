# 技術棧

## 核心技術

- **前端框架**：原生 JavaScript (ES6+)、HTML5、CSS3
- **圖形渲染**：HTML5 Canvas API 用於背景和視覺特效
- **音頻系統**：Web Audio API 用於程序化聲音合成、HTML5 Audio 用於 MP3 播放
- **無構建系統**：直接在瀏覽器中執行，無需打包工具或編譯

## 關鍵庫與 API

- **Web Audio API**：實時聲音合成（振盪器、增益節點、濾波器）
- **Canvas 2D Context**：粒子系統、天氣效果、煙花、節奏遊戲視覺效果
- **RequestAnimationFrame**：流暢的 60fps 動畫

## 架構模式

- **模塊模式**：全局命名空間對象（例如 `SoundEngine`、`BackgroundEngine`、`VisualFX`、`I18N`）
- **事件驅動**：DOM 事件監聽器處理用戶交互
- **狀態管理**：全局遊戲狀態變量，手動同步

## 文件結構

- `index.html` - 主入口文件，UI 結構
- `style.css` - 所有樣式、動畫、響應式設計
- `game.js` - 核心遊戲邏輯、棋盤狀態、回合管理
- `ai.js` - AI 對手邏輯，包含難度級別
- `audio.js` - 音效引擎，程序化合成
- `background.js` - 四季背景特效引擎
- `fx.js` - 視覺特效（連珠線、煙花、DJ 遊戲）
- `lang.js` - 國際化系統，語言切換
- `assets.js` - SVG 圖標和圖像資源定義

## 常用命令

**開發環境**：
```bash
# 本地啟動服務器（任意 HTTP 服務器）
python -m http.server 8000
# 或者
npx serve
```

**測試**：
- 在現代瀏覽器中打開 `index.html`（Chrome、Firefox、Safari、Edge）
- 無需編譯或構建步驟

**部署**：
- 將所有文件上傳到靜態託管服務（GitHub Pages、Netlify、Vercel）
- 確保 `.mp3` 和 `.png` 文件的 MIME 類型正確
