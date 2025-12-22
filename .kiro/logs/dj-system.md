# DJ 三階段系統文檔

## 系統概述

DJ 模式是技能五子棋的特殊勝利慶祝特效，將玩家的互動轉化為音樂體驗的一部分。

## 三階段設計

### 階段一：挑戰模式 (Challenge Phase)
**時長**：5-6 秒  
**目標**：玩家跟隨節奏擊鼓，完成 8 個完美判定

**音頻**：
- 挑戰旋律：C-D-E-G-E-D-C-G
- 背景節奏：Bass (偶數拍) + Hi-hat (奇數拍)
- 判定音效：Kick (成功) / Miss (失誤)

**視覺**：
- 5 個旋轉聚光燈
- 中央鼓（判定區）
- 擊中粒子爆發
- 屏幕閃白反饋

### 階段二：失敗模式 (Failure Phase)
**觸發條件**：錯過 1 個或以上節拍  
**效果**：黑暗吞噬，虛無狀態

**音頻**：
- 播放 `playDefeat()` 悲傷音樂
- 停止所有 DJ 音效

**視覺**：
- 黑暗透明度從 0 → 1.0
- 聚光燈和鼓消失
- 只保留勝利選單可見

### 階段三：勝利模式 (Victory Phase)
**觸發條件**：完美通過 8 個節拍  
**時長**：約 7 秒

**音頻**：
- 勝利進行曲（12 個音符）
- 自動擊鼓（每 0.6 秒，12 次）
- 高音閃亮點綴

**視覺**：
- 華麗漸變背景
- 聚光燈加速旋轉
- 勝利粒子噴泉（50 個）
- 金色 "PERFECT!" 文字
- 自動擊鼓動畫

## 技術實現

### 模塊分工

**audio.js (SoundEngine)**
- `startDJChallenge()` - 啟動挑戰
- `djScheduler()` - 節拍調度器
- `djPlayerHit()` - 玩家判定
- `startDJFailure()` - 失敗處理
- `startDJVictory()` - 勝利處理
- `playChallengemelody()` - 挑戰旋律
- `playVictoryMelody()` - 勝利旋律
- `playBackgroundBeat()` - 背景節奏

**fx.js (VisualFX)**
- `startCelebration('dj')` - 初始化 DJ 模式
- `handleDrumHit()` - 處理玩家點擊
- `renderDJChallenge()` - 渲染挑戰階段
- `renderDJFailure()` - 渲染失敗階段
- `renderDJVictory()` - 渲染勝利階段
- `onDJMiss()` - 錯過回調
- `onDJFail()` - 失敗回調
- `onDJVictory()` - 勝利回調
- `onDJAutoKick()` - 自動擊鼓回調

**game.js**
- `highlightWin()` - 觸發 DJ 模式
- 延遲調整：DJ 模式 10 秒，其他 2.5 秒

### 回調系統

audio.js 通過全局回調函數與 fx.js 通信：

```javascript
window.djMissCallback = () => VisualFX.onDJMiss();
window.djFailCallback = () => VisualFX.onDJFail();
window.djVictoryCallback = () => VisualFX.onDJVictory();
window.djAutoKickCallback = () => VisualFX.onDJAutoKick();
```

### 數據結構

**audio.js - djGame 對象**：
```javascript
djGame: {
    active: boolean,
    phase: 'idle' | 'challenge' | 'fail' | 'victory',
    startTime: number,
    beatDuration: 0.6,
    challengeBeats: Array<{time, hit, missed}>,
    totalBeats: 8,
    hitBeats: number,
    missedBeats: number,
    autoKickInterval: number
}
```

**fx.js - state.dj 對象**：
```javascript
dj: {
    phase: 'idle' | 'challenge' | 'fail' | 'victory',
    notes: Array,
    kickScale: number,
    bgFlash: number,
    spotlights: Array<{angle, speed, color}>,
    darknessAlpha: number,
    autoKickTimer: number,
    victoryParticles: Array<{x, y, vx, vy, life, color}>
}
```

## 判定系統

### 時間判定
- **判定窗口**：±150ms
- **節拍間隔**：0.6 秒（100 BPM）
- **總節拍數**：8 個

### 判定邏輯
```javascript
const timeDiff = Math.abs(currentTime - beat.time);
if (timeDiff < 0.15) {
    // 完美擊中
    beat.hit = true;
    playKick();
} else {
    // 失誤
    playMiss();
}
```

### 自動錯過檢測
```javascript
if (currentTime > beat.time + 0.15 && !beat.hit) {
    beat.missed = true;
    missedBeats++;
}
```

## 音樂設計

### 挑戰旋律
```javascript
// C-D-E-G-E-D-C-G (8 個音符)
const melody = [
    {freq: 523.25, time: 0.0, duration: 0.4}, // C5
    {freq: 587.33, time: 0.6, duration: 0.4}, // D5
    {freq: 659.25, time: 1.2, duration: 0.4}, // E5
    {freq: 783.99, time: 1.8, duration: 0.4}, // G5
    {freq: 659.25, time: 2.4, duration: 0.4}, // E5
    {freq: 587.33, time: 3.0, duration: 0.4}, // D5
    {freq: 523.25, time: 3.6, duration: 0.4}, // C5
    {freq: 783.99, time: 4.2, duration: 0.6}  // G5
];
```

### 勝利旋律
```javascript
// C-E-G-C(高)-G-E-C-C(高)-B-A-G-C(高) (12 個音符)
const victoryMelody = [
    {freq: 523.25, time: 0.0, duration: 0.3},   // C5
    {freq: 659.25, time: 0.4, duration: 0.3},   // E5
    {freq: 783.99, time: 0.8, duration: 0.3},   // G5
    {freq: 1046.50, time: 1.2, duration: 0.5},  // C6
    // ... 更多音符
];
```

## 視覺效果

### 聚光燈系統
- 數量：5 個
- 旋轉速度：±0.02 rad/frame
- 顏色：隨機 HSL
- 勝利階段：速度 ×2

### 粒子系統
- 擊中粒子：20 個/次
- 勝利粒子：50 個噴泉
- 重力：0.2
- 生命週期：1.0 → 0（衰減 0.02/frame）

### 鼓動畫
- 彈性縮放：0.8 → 1.3 → 1.0
- 回彈速度：0.2
- 基礎半徑：40px

## 性能優化

### 音頻優化
- 使用 Web Audio API 的調度器
- 提前 100ms 調度音符
- 避免阻塞主線程

### 視覺優化
- 使用 requestAnimationFrame
- 粒子數量控制在 100 以內
- Canvas 清屏優化

### 內存管理
- 及時清理過期粒子
- 停止時清理所有定時器
- 重置狀態對象

## 調試技巧

### 音頻調試
```javascript
// 在 djScheduler 中添加日誌
console.log('Beat:', index, 'Time:', beat.time, 'Hit:', beat.hit);
```

### 視覺調試
```javascript
// 在 renderDJChallenge 中顯示判定區
ctx.strokeStyle = 'red';
ctx.strokeRect(drumX - 60, drumY - 60, 120, 120);
```

### 判定調試
```javascript
// 在 djPlayerHit 中顯示時間差
console.log('Time diff:', timeDiff, 'Hit:', success);
```

## 常見問題

**Q: 判定不準確？**
A: 檢查 `ctx.currentTime` 與 `beat.time` 的同步，確保音頻上下文已啟動。

**Q: 視覺卡頓？**
A: 減少粒子數量，優化 Canvas 繪製，使用 `ctx.save()`/`ctx.restore()`。

**Q: 音樂不同步？**
A: 確保使用 `ctx.currentTime` 而非 `Date.now()`，Web Audio API 有自己的時間軸。

## 未來擴展

1. **難度選項**
   - 簡單：6 拍，0.8 秒間隔
   - 困難：10 拍，0.4 秒間隔

2. **視覺提示**
   - 節拍倒計時圓環
   - 音符飛行軌跡

3. **更多旋律**
   - 根據勝利方式選擇不同旋律
   - 季節主題旋律

4. **連擊獎勵**
   - 連續完美擊中的視覺獎勵
   - 更華麗的粒子效果

---

**版本**：Alpha 0.7.8.0  
**最後更新**：2024-12-22  
**維護者**：Kiro AI + Rexon
