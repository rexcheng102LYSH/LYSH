# 項目結構

## 根目錄文件

```
├── index.html          # 主 HTML 入口，UI 結構
├── style.css           # 完整樣式系統
├── game.js             # 核心遊戲邏輯（15x15 棋盤、勝負判定、回合流程）
├── ai.js               # AI 對手，4 種難度級別
├── audio.js            # 音效引擎（Web Audio API + MP3）
├── background.js       # 四季背景特效（Canvas）
├── fx.js               # 視覺特效引擎（連珠線、煙花、DJ）
├── lang.js             # 國際化系統（繁中、簡中、英文）
├── assets.js           # SVG/圖像資源定義
├── *.mp3               # 背景音樂和環境音效
└── images/             # PNG 資源（楓葉、太陽圖標）
```

## 代碼組織原則

### 全局狀態管理
- 遊戲狀態存儲在 `game.js` 的全局變量中
- 每個模塊暴露一個全局對象（例如 `window.SoundEngine`）
- 通過顯式函數調用進行狀態同步

### 模塊職責

**game.js**（核心邏輯）
- 棋盤狀態（`board` 數組，15x15 網格）
- 回合管理（`currentPlayer`、`switchTurn()`）
- 勝負判定（`checkWin()`、`highlightWin()`）
- 技能系統（`activateSkill()`、`handleSkillInteraction()`）
- UI 更新（`updateDynamicUI()`、`renderBoard()`）

**ai.js**（AI 對手）
- 根據難度計算落子位置
- 威脅檢測和防守
- 技能使用邏輯

**audio.js**（音效系統）
- `SoundEngine` 對象及其方法：
  - `playNote()` - 基於振盪器的合成
  - `playNoise()` - 白噪聲生成
  - `playKick()`、`playMiss()` - DJ 遊戲音效
  - `startBGM()`、`stopBGM()` - 音樂控制
  - `startRhythmGame()` - DJ 模式調度器

**background.js**（視覺背景）
- `BackgroundEngine` 對象
- 四季特效：春雨、夏陽、秋葉、冬雪
- 基於 Canvas 的粒子系統
- 音頻集成（環境音效）

**fx.js**（視覺特效）
- `VisualFX` 對象
- 連珠線特效（默認、閃電、金黃、未來）
- 慶祝特效（煙花、DJ 節奏遊戲）
- 全屏 Canvas 覆蓋層

**lang.js**（國際化）
- `I18N` 對象，包含翻譯字典
- `t(key, path)` - 翻譯函數
- `toggleLanguage()` - 語言切換器

### 命名規範

- **常量**：UPPER_SNAKE_CASE（`BOARD_SIZE`、`EMPTY`、`MAPLE`、`SUN`）
- **全局變量**：camelCase（`currentPlayer`、`gameActive`、`playerSkills`）
- **函數**：camelCase（`handleCellClick`、`activateSkill`、`checkWin`）
- **DOM ID**：kebab-case（`main-menu`、`game-screen`、`skill-btn`）
- **CSS 類**：kebab-case（`.glass-panel`、`.skill-card`、`.timer-pill`）

### 事件流程

1. 用戶點擊格子 → `handleCellClick(r, c)`
2. 驗證落子 → 檢查禁區、混沌干擾
3. 放置棋子 → `placePiece(r, c, player)`
4. 檢查勝負 → `checkWin(r, c, player)`
5. 如果獲勝 → `highlightWin(line, winner)` → `handleMatchEnd(winner)`
6. 否則 → `switchTurn()` → 如果是 PvE 則 AI 落子

### Canvas 層級

- **背景 Canvas**（`#bgCanvas`）：四季特效，最低 z-index
- **遊戲棋盤**（DOM）：HTML 網格，CSS 樣式
- **特效 Canvas**（`#fxCanvas`）：全屏覆蓋層，最高 z-index，pointer-events: none

## 關鍵設計模式

- **單例模塊**：每個引擎都是單一全局對象
- **狀態機**：遊戲流程通過屏幕切換（主菜單 → 難度選擇 → 選邊 → 選技能 → 遊戲）
- **觀察者模式**：DOM 事件監聽器觸發狀態變化
- **工廠模式**：粒子創建函數（雨滴、雪花、樹葉）
