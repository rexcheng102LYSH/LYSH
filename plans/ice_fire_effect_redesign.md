# 冰火棋子特效重设计计划

## 📋 项目概述

**目标**：重做冰火棋子的落子特效和静态动效，使其拥有截然不同的冰、火特色。

**原则**：
- 仅更改特效表现，不改变任何游戏逻辑
- 不造成任何bug
- 使用新引入的 anime.js 和 tailwindcss 增强特效
- 保持与现有代码风格一致

---

## 🎨 第一阶段：落子特效重设计

### 1.1 冰晶落子特效新设计

**设计理念**：突出"冰冻"的冷冽感和"结晶"的尖锐感

#### 特效组成：
1. **冰棱穿刺** (`ice-spike`)
   - 从中心向外射出尖锐的冰棱（三角形/菱形）
   - 使用 `clip-path` 创建三角形形状
   - 向外快速延伸，模拟冰棱穿刺效果
   - 颜色：冷蓝白渐变

2. **冰霜蔓延** (`ice-frost-spread`)
   - 不规则的霜冻形状从中心向外扩散
   - 使用多个不规则的多边形元素
   - 模拟地面结冰的效果
   - 颜色：半透明的冰蓝色

3. **冰晶崩裂** (`ice-shatter`)
   - 六角形冰晶碎片向四周飞散
   - 随机旋转角度
   - 带有拖尾效果
   - 颜色：亮白色到冰蓝色渐变

4. **寒气冲击** (`ice-chill-blast`)
   - 冷气向外冲击的波纹效果
   - 多层同心圆快速扩散
   - 模拟冷空气爆发的视觉效果
   - 颜色：淡蓝色半透明

#### 技术实现：
- 使用 CSS `clip-path` 创建尖锐的冰棱形状
- 使用 `transform: scale()` 和 `translate()` 实现向外延伸
- 使用 `anime.js` 实现更流畅的粒子动画
- 使用 CSS 变量传递动态参数

---

### 1.2 火焰落子特效新设计

**设计理念**：突出"燃烧"的热烈感和"动态"的摇曳感

#### 特效组成：
1. **火舌舔舐** (`fire-tongue`)
   - 向上舔舐的火焰形状（泪滴形/水滴形）
   - 使用 `border-radius` 创建火焰形状
   - 向上快速升起并消失
   - 颜色：橙黄到深红渐变

2. **火焰喷发** (`fire-eruption`)
   - 从中心喷发的大火焰
   - 多层火焰叠加
   - 向四周扩散
   - 颜色：明亮的橙黄色

3. **火星爆射** (`fire-spark`)
   - 火星向四周爆射
   - 圆形粒子
   - 带有发光效果
   - 颜色：亮黄色到橙红色

4. **热浪扭曲** (`heat-wave`)
   - 热浪向上扭曲的效果
   - 使用模糊滤镜
   - 向上飘散
   - 颜色：橙红色半透明

#### 技术实现：
- 使用 `border-radius` 创建火焰形状
- 使用 `transform: scale()` 和 `translateY()` 实现向上升起
- 使用 `anime.js` 实现更流畅的粒子动画
- 使用 CSS 变量传递动态参数

---

## 🎭 第二阶段：静态动效重设计

### 2.1 PNG冰棋子静态动效

**设计理念**：在PNG图片上叠加霜冻效果，营造冰晶质感

#### 动效组成：
1. **霜冻覆盖** (`frost-overlay`)
   - 在PNG图片上覆盖一层霜冻效果
   - 使用 `::before` 伪元素
   - 半透明的冰蓝色渐变
   - 呼吸动画（淡入淡出）

2. **冰晶闪烁** (`ice-sparkle`)
   - 在棋子周围随机闪烁的冰晶粒子
   - 使用多个小元素
   - 随机位置和大小
   - 闪烁动画

3. **寒气呼吸** (`cold-breath`)
   - 淡淡的冷气从棋子周围散发
   - 使用 `::after` 伪元素
   - 扩散动画
   - 半透明的冷色调

#### 技术实现：
- 使用伪元素叠加在PNG图片上
- 使用 `mix-blend-mode: screen` 混合模式
- 使用 CSS 动画实现呼吸和闪烁效果
- 确保不遮挡PNG图片的主体

---

### 2.2 PNG火棋子静态动效

**设计理念**：在PNG图片上叠加火焰效果，营造燃烧质感

#### 动效组成：
1. **火焰光晕** (`fire-glow`)
   - 在PNG图片周围添加火焰光晕
   - 使用 `::before` 伪元素
   - 橙红色渐变
   - 脉动动画

2. **火星飘浮** (`floating-ember`)
   - 火星从棋子周围向上飘浮
   - 使用多个小元素
   - 随机位置和大小
   - 向上飘散动画

3. **热浪升腾** (`heat-rise`)
   - 热浪从棋子底部升腾
   - 使用 `::after` 伪元素
   - 向上扩散动画
   - 橙红色半透明

#### 技术实现：
- 使用伪元素叠加在PNG图片上
- 使用 `mix-blend-mode: screen` 混合模式
- 使用 CSS 动画实现脉动和飘浮效果
- 确保不遮挡PNG图片的主体

---

## 📝 详细实现步骤

### 步骤1：更新 game_render.js

#### 1.1 修改 `createIceEffect()` 函数
```javascript
function createIceEffect(cell) {
    // 1. 冰棱穿刺（8-12个尖锐冰棱）
    createIceSpikes(cell);
    
    // 2. 冰霜蔓延（不规则霜冻形状）
    createIceFrostSpread(cell);
    
    // 3. 冰晶崩裂（六角形冰晶碎片）
    createIceShatter(cell);
    
    // 4. 寒气冲击（冷气波纹）
    createIceChillBlast(cell);
}
```

#### 1.2 修改 `createFireEffect()` 函数
```javascript
function createFireEffect(cell) {
    // 1. 火舌舔舐（向上舔舐的火焰）
    createFireTongues(cell);
    
    // 2. 火焰喷发（中心喷发）
    createFireEruption(cell);
    
    // 3. 火星爆射（火星粒子）
    createFireSparks(cell);
    
    // 4. 热浪扭曲（热浪升腾）
    createHeatWave(cell);
}
```

---

### 步骤2：更新 pieces.css

#### 2.1 冰棋子静态动效样式
```css
/* 冰棋子容器 */
.piece.skin-ice-fire.p1 {
    background: transparent;
    box-shadow: none;
}

/* 霜冻覆盖层 */
.piece.skin-ice-fire.p1::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(200, 235, 255, 0.2) 0%,
        rgba(168, 216, 255, 0.15) 40%,
        rgba(136, 200, 240, 0.1) 70%,
        transparent 100%
    );
    mix-blend-mode: screen;
    animation: frostOverlayBreath 4s ease-in-out infinite;
}

/* 寒气呼吸层 */
.piece.skin-ice-fire.p1::after {
    content: '';
    position: absolute;
    top: -10%;
    left: -10%;
    right: -10%;
    bottom: -10%;
    border-radius: 50%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(224, 244, 255, 0.05) 40%,
        transparent 70%
    );
    filter: blur(8px);
    animation: coldBreathPulse 5s ease-in-out infinite;
}

/* 冰晶闪烁粒子 */
.ice-sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(
        circle,
        rgba(255, 255, 255, 1) 0%,
        rgba(224, 244, 255, 0.8) 40%,
        rgba(168, 216, 255, 0.5) 100%
    );
    border-radius: 50%;
    box-shadow:
        0 0 6px rgba(255, 255, 255, 0.8),
        0 0 12px rgba(168, 216, 255, 0.5);
    animation: sparkleTwinkle 2s ease-in-out infinite;
}
```

#### 2.2 火棋子静态动效样式
```css
/* 火棋子容器 */
.piece.skin-ice-fire.p2 {
    background: transparent;
    box-shadow: none;
}

/* 火焰光晕层 */
.piece.skin-ice-fire.p2::before {
    content: '';
    position: absolute;
    top: -10%;
    left: -10%;
    right: -10%;
    bottom: -10%;
    border-radius: 50%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(255, 200, 50, 0.25) 0%,
        rgba(255, 140, 0, 0.15) 40%,
        rgba(255, 100, 0, 0.1) 70%,
        transparent 100%
    );
    mix-blend-mode: screen;
    animation: fireGlowPulse 3s ease-in-out infinite;
}

/* 热浪升腾层 */
.piece.skin-ice-fire.p2::after {
    content: '';
    position: absolute;
    top: -20%;
    left: -20%;
    right: -20%;
    bottom: -20%;
    border-radius: 50%;
    background: radial-gradient(
        ellipse 100% 120% at 50% 80%,
        rgba(255, 150, 50, 0.15) 0%,
        rgba(255, 100, 0, 0.08) 40%,
        transparent 70%
    );
    filter: blur(10px);
    animation: heatRisePulse 4s ease-in-out infinite;
}

/* 火星飘浮粒子 */
.fire-ember {
    position: absolute;
    width: 3px;
    height: 3px;
    background: radial-gradient(
        circle,
        rgba(255, 255, 200, 1) 0%,
        rgba(255, 200, 50, 0.8) 40%,
        rgba(255, 140, 0, 0.5) 100%
    );
    border-radius: 50%;
    box-shadow:
        0 0 4px rgba(255, 200, 50, 0.8),
        0 0 8px rgba(255, 140, 0, 0.5);
    animation: emberFloat 3s ease-out infinite;
}
```

#### 2.3 冰晶落子特效样式
```css
/* 冰棱穿刺 */
.ice-spike {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 20px;
    background: linear-gradient(
        to top,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(224, 244, 255, 0.7) 50%,
        rgba(168, 216, 255, 0.4) 100%
    );
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    transform-origin: center bottom;
    animation: iceSpikeThrust 0.4s cubic-bezier(0.15, 0.8, 0.3, 1) forwards;
}

/* 冰霜蔓延 */
.ice-frost-spread {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(200, 235, 255, 0.4) 0%,
        rgba(168, 216, 255, 0.2) 40%,
        rgba(136, 200, 240, 0.1) 70%,
        transparent 100%
    );
    filter: blur(2px);
    animation: iceFrostSpread 0.6s ease-out forwards;
}

/* 冰晶崩裂 */
.ice-shatter {
    position: absolute;
    width: 10px;
    height: 10px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(224, 244, 255, 0.7) 50%,
        rgba(168, 216, 255, 0.5) 100%
    );
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: iceShatterFly 0.5s cubic-bezier(0.2, 0.8, 0.35, 1) forwards;
}

/* 寒气冲击 */
.ice-chill-blast {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(
        circle,
        rgba(200, 235, 255, 0.3) 0%,
        rgba(168, 216, 255, 0.2) 40%,
        rgba(136, 200, 240, 0.1) 70%,
        transparent 100%
    );
    filter: blur(3px);
    animation: iceChillBlast 0.5s ease-out forwards;
}
```

#### 2.4 火焰落子特效样式
```css
/* 火舌舔舐 */
.fire-tongue {
    position: absolute;
    bottom: 50%;
    left: 50%;
    width: 12px;
    height: 25px;
    background: linear-gradient(
        to top,
        rgba(255, 255, 200, 0.95) 0%,
        rgba(255, 220, 100, 0.85) 30%,
        rgba(255, 160, 50, 0.7) 60%,
        rgba(255, 100, 0, 0.4) 90%,
        transparent 100%
    );
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    transform-origin: bottom center;
    animation: fireTongueLick 0.45s cubic-bezier(0.15, 0.8, 0.3, 1) forwards;
}

/* 火焰喷发 */
.fire-eruption {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60px;
    height: 60px;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(255, 255, 200, 0.6) 0%,
        rgba(255, 220, 100, 0.5) 25%,
        rgba(255, 160, 50, 0.35) 50%,
        rgba(255, 100, 0, 0.2) 75%,
        transparent 100%
    );
    filter: blur(4px);
    animation: fireEruption 0.5s ease-out forwards;
}

/* 火星爆射 */
.fire-spark {
    position: absolute;
    width: 5px;
    height: 5px;
    background: radial-gradient(
        circle,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 150, 0.95) 25%,
        rgba(255, 200, 50, 0.85) 50%,
        rgba(255, 140, 0, 0.6) 75%,
        rgba(255, 80, 0, 0.3) 100%
    );
    border-radius: 50%;
    box-shadow:
        0 0 8px rgba(255, 200, 50, 1),
        0 0 16px rgba(255, 140, 0, 0.7);
    animation: fireSparkFly 0.6s cubic-bezier(0.15, 0.8, 0.3, 1) forwards;
}

/* 热浪扭曲 */
.heat-wave {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background: radial-gradient(
        ellipse 100% 120% at 50% 80%,
        rgba(255, 150, 50, 0.2) 0%,
        rgba(255, 100, 0, 0.12) 30%,
        rgba(255, 69, 0, 0.06) 60%,
        transparent 100%
    );
    filter: blur(5px);
    animation: heatWaveRise 0.7s ease-out forwards;
}
```

---

## 🔧 关键动画定义

### 冰晶动画
```css
@keyframes frostOverlayBreath {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
}

@keyframes coldBreathPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
}

@keyframes sparkleTwinkle {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
}

@keyframes iceSpikeThrust {
    0% { transform: translate(-50%, -50%) rotate(var(--spike-angle)) scale(0.2); opacity: 0; }
    30% { transform: translate(-50%, -50%) rotate(var(--spike-angle)) scale(1.3); opacity: 1; }
    100% { transform: translate(-50%, -50%) rotate(var(--spike-angle)) scale(1); opacity: 0; }
}

@keyframes iceFrostSpread {
    0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
    40% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

@keyframes iceShatterFly {
    0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) translate(var(--shatter-x), var(--shatter-y)) rotate(var(--shatter-rotation)) scale(0.3); opacity: 0; }
}

@keyframes iceChillBlast {
    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
    30% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}
```

### 火焰动画
```css
@keyframes fireGlowPulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
}

@keyframes heatRisePulse {
    0%, 100% { opacity: 0.3; transform: translateY(0); }
    50% { opacity: 0.6; transform: translateY(-10px); }
}

@keyframes emberFloat {
    0% { opacity: 0; transform: translateY(0) scale(0.5); }
    20% { opacity: 1; transform: translateY(-8px) scale(1); }
    100% { opacity: 0; transform: translateY(-25px) scale(0.3); }
}

@keyframes fireTongueLick {
    0% { transform: translate(-50%, 0) scaleX(0.2) scaleY(0.2); opacity: 0; }
    30% { transform: translate(-50%, calc(var(--tongue-y) * 0.4)) scaleX(1.2) scaleY(1.3); opacity: 1; }
    100% { transform: translate(-50%, var(--tongue-y)) scaleX(0.8) scaleY(0.6); opacity: 0; }
}

@keyframes fireEruption {
    0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
    40% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.9; }
    100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}

@keyframes fireSparkFly {
    0% { transform: translate(-50%, -50%) translate(0, 0) scale(0.3); opacity: 1; }
    100% { transform: translate(-50%, -50%) translate(var(--spark-x), var(--spark-y)) scale(0.4); opacity: 0; }
}

@keyframes heatWaveRise {
    0% { transform: translate(-50%, -50%) scale(0.3) translateY(0); opacity: 0; }
    40% { transform: translate(-50%, -50%) scale(1.2) translateY(-8px); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(1.8) translateY(-25px); opacity: 0; }
}
```

---

## 📊 特效对比

### 当前问题
- 冰火特效结构相似，只是颜色不同
- 静态动效使用CSS渐变背景，与PNG图片不兼容

### 新设计优势
- **冰晶特效**：尖锐的冰棱、不规则的霜冻、六角形冰晶
- **火焰特效**：舔舐的火舌、喷发的火焰、爆射的火星
- **静态动效**：使用伪元素叠加在PNG上，不遮挡主体
- **视觉区分**：冰火特效完全不同，各有特色

---

## ✅ 验证清单

- [ ] 落子特效开关正常工作
- [ ] 静态动效开关正常工作
- [ ] 移动端特效简化正常
- [ ] 落子动画期间静态动效暂停
- [ ] 不影响游戏逻辑
- [ ] 不造成任何bug
- [ ] 与现有代码风格一致
- [ ] UTF-8编码正确

---

## 📝 注意事项

1. **保持兼容性**：
   - 保留 `isIceFireDropEffectEnabled()` 和 `isIceFireStaticAnimEnabled()` 检查
   - 保留移动端适配逻辑
   - 保留落子动画期间暂停静态动效的逻辑

2. **性能优化**：
   - 使用 `animationend` 事件自动清理DOM元素
   - 移动端简化特效
   - 使用 GPU 加速（`will-change`）

3. **代码风格**：
   - 使用中文注释
   - 保持与现有代码一致的命名风格
   - 遵循项目编码规范

---

## 🎯 执行顺序

1. ✅ 分析现有代码结构
2. ⏳ 设计新的特效方案
3. ⏳ 更新 game_render.js 中的特效函数
4. ⏳ 更新 pieces.css 中的样式
5. ⏳ 测试验证

---

*计划创建时间：2026-02-05*
*计划版本：v1.0*
