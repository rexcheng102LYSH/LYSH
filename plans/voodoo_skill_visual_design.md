# 巫毒(Voodoo)技能视觉特效设计方案

## 一、设计理念

### 主题风格
巫毒技能的视觉特效应该营造一种**神秘诡异、充满诅咒气息**的氛围。设计灵感来源于：
- 巫毒教的紫色蜡烛与迷雾
- 诅咒娃娃的钉刺仪式
- 毒液的腐蚀与侵蚀效果
- 暗黑魔法的能量流动

### 色彩体系
| 阶段 | 主色 | 辅助色 | 效果 |
|------|------|--------|------|
| 激活阶段 | 深紫色 `#6B21A8` | 幽冥紫 `#A855F7` | 神秘、诡异、等待选择 |
| 腐蚀阶段 | 暗绿色 `#166534` | 毒液绿 `#22C55E` | 腐蚀、诅咒、死亡 |

### 设计原则
1. **视觉层次**：背景氛围 → 主体光效 → 粒子细节
2. **动画节奏**：激活时缓慢神秘，生效时快速冲击
3. **性能优化**：使用 CSS 动画为主，Anime.js 仅用于复杂粒子轨迹
4. **兼容性**：通过 `prefers-reduced-motion` 支持动效减弱

---

## 二、激活阶段 (Casting Voodoo)

### 2.1 效果描述
当玩家激活巫毒技能时，棋盘进入「诅咒准备」状态：
1. 棋盘整体笼罩一层**紫色迷雾**
2. 边缘出现**幽冥光晕**脉动
3. 可选的敌方棋子上浮现**诅咒标记**
4. 背景有**暗黑能量**缓慢流动

### 2.2 CSS 样式代码

```css
/* ========================================= */
/* [Voodoo Skill] 激活阶段 -诅咒氛围          */
/* Casting Voodoo - Cursed Atmosphere        */
/* ========================================= */

/* 棋盘诅咒覆盖层 */
.board.casting-voodoo {
    /* 紫色迷雾滤镜 */
    filter: brightness(0.85) saturate(1.2);
    
    /* 紫色光晕边框 */
    box-shadow: 
        /* 原有阴影保留 */
        inset 1px 1px 0 rgba(255,255,255,0.4),
        inset -1px -1px 0 rgba(0,0,0,0.1),
        1px 1px 0 var(--wood-side),
        2px 2px 0 var(--wood-side),
        3px 3px 0 var(--wood-side),
        4px 4px 0 var(--wood-side),
        5px 5px 0 var(--wood-side),
        6px 6px 0 var(--wood-side),
        7px 7px 5px rgba(0,0,0,0.3),
        15px 25px 40px rgba(0,0,0,0.25),
        /* 新增诅咒光晕 */
        0 0 30px rgba(139, 92, 246, 0.4),
        0 0 60px rgba(139, 92, 246, 0.2),
        inset 0 0 50px rgba(88, 28, 135, 0.3);
    
    /* 过渡动画 */
    transition: filter 0.5s ease, box-shadow 0.5s ease;
    
    /* 动画：诅咒脉动 */
    animation: voodooPulse 2s ease-in-out infinite;
}

/*诅咒脉动动画 */
@keyframes voodooPulse {
    0%, 100% {
        box-shadow: 
            inset 1px 1px 0 rgba(255,255,255,0.4),
            inset -1px -1px 0 rgba(0,0,0,0.1),
            1px 1px 0 var(--wood-side),
            2px 2px 0 var(--wood-side),
            3px 3px 0 var(--wood-side),
            4px 4px 0 var(--wood-side),
            5px 5px 0 var(--wood-side),
            6px 6px 0 var(--wood-side),
            7px 7px 5px rgba(0,0,0,0.3),
            15px 25px 40px rgba(0,0,0,0.25),
            0 0 30px rgba(139, 92, 246, 0.4),
            0 0 60px rgba(139, 92, 246, 0.2),
            inset 0 0 50px rgba(88, 28, 135, 0.3);
    }
    50% {
        box-shadow: 
            inset 1px 1px 0 rgba(255,255,255,0.4),
            inset -1px -1px 0 rgba(0,0,0,0.1),
            1px 1px 0 var(--wood-side),
            2px 2px 0 var(--wood-side),
            3px 3px 0 var(--wood-side),
            4px 4px 0 var(--wood-side),
            5px 5px 0 var(--wood-side),
            6px 6px 0 var(--wood-side),
            7px 7px 5px rgba(0,0,0,0.3),
            15px 25px 40px rgba(0,0,0,0.25),
            0 0 45px rgba(139, 92, 246, 0.6),
            0 0 90px rgba(139, 92, 246, 0.3),
            inset 0 0 70px rgba(88, 28, 135, 0.5);
    }
}

/* 迷雾覆盖层 - 使用伪元素 */
.board.casting-voodoo::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 100;
    
    /* 紫色迷雾渐变 */
    background: 
        /* 径向迷雾 */
        radial-gradient(ellipse 120% 80% at 50% 50%,
            rgba(88, 28, 135, 0.15) 0%,
            rgba(107, 33, 168, 0.1) 40%,
            transparent 70%
        ),
        /* 边缘暗角 */
        radial-gradient(ellipse 100% 100% at 50% 50%,
            transparent 30%,
            rgba(59, 7, 100, 0.2) 100%
        );
    
    /* 迷雾流动动画 */
    animation: voodooMist 4s ease-in-out infinite;
    border-radius: 4px;
}

/* 迷雾流动动画 */
@keyframes voodooMist {
    0%, 100% {
        opacity: 0.8;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.02);
    }
}

/* 可选棋子高亮 - 敌方棋子浮现诅咒标记 */
.board.casting-voodoo .cell:not(.corroded) .piece {
    /* 诅咒光环 */
    filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6));
    transition: filter 0.3s ease;
}

/* 悬停时的强化诅咒效果 */
.board.casting-voodoo .cell:not(.corroded):hover .piece {
    filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.9))
            drop-shadow(0 0 25px rgba(139, 92, 246, 0.5));
    transform: scale(1.05);
    cursor: pointer;
}

/* 诅咒符号 - 悬停时显示 */
.board.casting-voodoo .cell:not(.corroded):hover::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80%;
    height: 80%;
    transform: translate(-50%, -50%);
    
    /* 骷髅图案 - 使用 SVG data URI */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A855F7' stroke-width='1.5'%3E%3Ccircle cx='12' cy='10' r='7'/%3E%3Ccircle cx='9' cy='9'r='1.5' fill='%23A855F7'/%3E%3Ccircle cx='15' cy='9' r='1.5' fill='%23A855F7'/%3E%3Cpath d='M9 14h6'/%3E%3Cpath d='M10 14v3'/%3E%3Cpath d='M12 14v3'/%3E%3Cpath d='M14 14v3'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    
    z-index: 50;
    opacity: 0.7;
    animation: voodooSkullAppear 0.3s ease-out;
}

/* 骷髅出现动画 */
@keyframes voodooSkullAppear {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
    }
    to {
        opacity: 0.7;
        transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }
}

/* 移动端适配 */
@media (max-width: 600px) {
    .board.casting-voodoo {
        animation: voodooPulseMobile 2s ease-in-out infinite;
    }
    
    @keyframes voodooPulseMobile {
        0%, 100% {
            box-shadow: 
                inset 1px 1px 0 rgba(255,255,255,0.3),
                1px 1px 0 var(--wood-side),
                2px 2px 0 var(--wood-side),
                3px 3px 0 var(--wood-side),
                5px 5px 15px rgba(0,0,0,0.25),
                0 0 20px rgba(139, 92, 246, 0.3);
        }
        50% {
            box-shadow: 
                inset 1px 1px 0 rgba(255,255,255,0.3),
                1px 1px 0 var(--wood-side),
                2px 2px 0 var(--wood-side),
                3px 3px 0 var(--wood-side),
                5px 5px 15px rgba(0,0,0,0.25),
                0 0 35px rgba(139, 92, 246, 0.5);
        }
    }
    
    .board.casting-voodoo::after {
        display: none; /* 移动端简化迷雾 */
    }
}

/* 动效减弱支持 */
@media (prefers-reduced-motion: reduce) {
    .board.casting-voodoo,
    .board.casting-voodoo::after {
        animation: none;
    }
    
    .board.casting-voodoo .cell:not(.corroded):hover .piece {
        transform: none;
    }
}
```

### 2.3 Anime.js 粒子动画（可选增强）

如果需要更复杂的粒子效果，可以在 JS 中添加：

```javascript
// 在 voodoo.js 的 activate 函数中添加
if (window.safeAnime) {
    // 创建诅咒粒子容器
    const particleContainer = document.createElement('div');
    particleContainer.id = 'voodooParticles';
    particleContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:99;overflow:hidden;';
    board.appendChild(particleContainer);
    
    // 创建浮动诅咒粒子
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'voodoo-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${4 + Math.random() * 4}px;
            height: ${4 + Math.random() * 4}px;
            background: radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;
        particleContainer.appendChild(particle);
        
        // Anime.js 控制粒子浮动
        safeAnime({
            targets: particle,
            translateY: [0, -30 - Math.random() * 20],
            translateX: [0, (Math.random() - 0.5) * 40],
            opacity: [0.8, 0],
            scale: [1, 0.3],
            duration: 2000 + Math.random() * 1000,
            easing: 'easeOutQuad',
            loop: true
        });
    }
}
```

---

## 三、腐蚀阶段 (Corroded Effect)

### 3.1 效果描述
当选中敌方棋子后，诅咒生效：
1. 棋子格变为**暗绿色腐蚀坑洞**
2. 格子中心出现**骷髅标志**
3. 边缘有**毒液溢出**效果
4. 原棋子变为**灰暗模糊**状态

### 3.2 CSS 样式代码

```css
/* ========================================= */
/* [Voodoo Skill] 腐蚀阶段 -诅咒生效          */
/* Corroded Cell - Curse Effect              */
/* ========================================= */

/* 腐蚀格子基础样式 - 替换原有简陋样式 */
.cell.corroded {
    /* 深暗绿色腐蚀背景 */
    background: 
        /* 毒液光泽 */
        radial-gradient(ellipse 80% 60% at 30% 30%,
            rgba(34, 197, 94, 0.15) 0%,
            transparent 50%
        ),
        /* 腐蚀坑洞 */
        radial-gradient(circle at 50% 50%,
            #0f2417 0%,
            #1a3a1f 40%,
            #2d3436 70%,
            #1a1a1a 100%
        ) !important;
    
    /* 立体坑洞效果 */
    box-shadow: 
        /* 内凹陷 */
        inset 0 2px 8px rgba(0, 0, 0, 0.8),
        inset 0 -2px 4px rgba(34, 197, 94, 0.2),
        /* 外发光 - 毒液 */
        0 0 15px rgba(34, 197, 94, 0.3),
        0 0 30px rgba(22, 101, 52, 0.2) !important;
    
    /* 圆角 */
    border-radius: 6px;
    
    /* 层级提升 */
    z-index: 5 !important;
    
    /* 入场动画 */
    animation: corrodedAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 腐蚀出现动画 */
@keyframes corrodedAppear {
    0% {
        transform: scale(0.3);
        opacity: 0;
        filter: brightness(2);
    }
    50% {
        transform: scale(1.1);
        opacity: 0.8;
        filter: brightness(1.3);
    }
    100% {
        transform: scale(1);
        opacity: 1;
        filter: brightness(1);
    }
}

/* 骷髅标志 - 使用 ::after 伪元素 */
.cell.corroded::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 70%;
    height: 70%;
    transform: translate(-50%, -50%);
    
    /* 骷髅 SVG */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3C!-- 骷髅主体 --%3E%3Ccircle cx='12' cy='9' r='7' fill='%232d3436' stroke='%234a5568' stroke-width='0.5'/%3E%3C!-- 左眼窝 --%3E%3Cellipse cx='9' cy='8' rx='2' ry='2.5' fill='%23000'/%3E%3C!-- 右眼窝 --%3E%3Cellipse cx='15' cy='8' rx='2' ry='2.5' fill='%23000'/%3E%3C!-- 鼻腔 --%3E%3Cpath d='M11 11L12 13L13 11' fill='%23000' stroke='%23000' stroke-width='0.5'/%3E%3C!-- 牙齿 --%3E%3Crect x='8' y='14' width='2' height='3' fill='%234a5568' rx='0.5'/%3E%3Crect x='11' y='14' width='2' height='3' fill='%234a5568' rx='0.5'/%3E%3Crect x='14' y='14' width='2' height='3' fill='%234a5568' rx='0.5'/%3E%3C!-- 眼窝绿光 --%3E%3Ccircle cx='9' cy='8' r='0.8' fill='%2322c55e' opacity='0.8'%3E%3Canimate attributeName='opacity' values='0.4;0.9;0.4' dur='2s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='15' cy='8' r='0.8' fill='%2322c55e' opacity='0.8'%3E%3Canimate attributeName='opacity' values='0.4;0.9;0.4' dur='2s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    
    z-index: 2;
    opacity: 0.9;
    
    /* 骷髅出现动画 */
    animation: skullAppear 0.4s ease-out 0.3s both;
}

/* 骷髅出现动画 */
@keyframes skullAppear {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5) rotate(-20deg);
    }
    to {
        opacity: 0.9;
        transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }
}

/* 毒液溢出效果 - 边缘伪元素 */
.cell.corroded::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 8px;
    
    /* 毒液滴落效果 */
    background: 
        /* 顶部毒液 */
        radial-gradient(ellipse 40% 20% at 20% 0%,
            rgba(34, 197, 94, 0.4) 0%,
            transparent 100%
        ),
        radial-gradient(ellipse 30% 15% at 70% 0%,
            rgba(34, 197, 94, 0.3) 0%,
            transparent 100%
        ),
        /* 底部毒液 */
        radial-gradient(ellipse 35% 18% at 30% 100%,
            rgba(22, 101, 52, 0.4) 0%,
            transparent 100%
        ),
        radial-gradient(ellipse 25% 12% at 80% 100%,
            rgba(22, 101, 52, 0.3) 0%,
            transparent 100%
        );
    
    z-index: 1;
    pointer-events: none;
    
    /* 毒液流动动画 */
    animation: poisonDrip 3s ease-in-out infinite;
}

/* 毒液滴落动画 */
@keyframes poisonDrip {
    0%, 100% {
        opacity: 0.7;
        transform: translateY(0);
    }
    50% {
        opacity: 1;
        transform: translateY(1px);
    }
}

/* 被腐蚀的棋子样式 */
.cell.corroded .piece {
    /* 灰暗模糊 */
    opacity: 0.25 !important;
    filter: grayscale(1) blur(1.5px) brightness(0.5) !important;
    
    /* 缩小并下沉 */
    transform: scale(0.7) translateY(5%);
    
    /* 过渡动画 */
    transition: all 0.5s ease;
    
    /* 层级降低 */
    z-index: 1 !important;
}

/* 腐蚀格子周围的毒气扩散 */
.cell.corroded {
    position: relative;
}

.cell.corroded .corroded-aura {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    background: radial-gradient(circle,
        rgba(34, 197, 94, 0.2) 0%,
        rgba(22, 101, 52, 0.1) 40%,
        transparent 70%
    );
    pointer-events: none;
    z-index: 0;
    animation: corrodedAuraPulse 2.5s ease-in-out infinite;
}

@keyframes corrodedAuraPulse {
    0%, 100% {
        transform: scale(1);
        opacity: 0.5;
    }
    50% {
        transform: scale(1.15);
        opacity: 0.8;
    }
}

/* 移动端适配 */
@media (max-width: 600px) {
    .cell.corroded {
        box-shadow: 
            inset 0 1px 4px rgba(0, 0, 0, 0.7),
            inset 0 -1px 2px rgba(34, 197, 94, 0.2),
            0 0 10px rgba(34, 197, 94, 0.25) !important;
    }
    
    .cell.corroded::before {
        display: none; /* 移动端简化毒液效果 */
    }
    
    .cell.corroded::after {
        width: 60%;
        height: 60%;
    }
    
    .cell.corroded .piece {
        opacity: 0.2 !important;
        transform: scale(0.6) translateY(3%);
    }
}

/* 动效减弱支持 */
@media (prefers-reduced-motion: reduce) {
    .cell.corroded,
    .cell.corroded::before,
    .cell.corroded::after,
    .cell.corroded .corroded-aura {
        animation: none;
    }
    
    .cell.corroded .piece {
        transition: none;
    }
}
```

### 3.3 Anime.js 增强动画（可选）

如果需要更丰富的粒子消散效果：

```javascript
// 在 voodoo.js 的 effects 函数中添加
if (window.safeAnime) {
    // 创建腐蚀粒子
    const cellRect = cell.getBoundingClientRect();
    const boardRect = document.getElementById('board').getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'corroded-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${3 + Math.random() * 4}px;
            height: ${3 + Math.random() * 4}px;
            background: radial-gradient(circle, rgba(34,197,94,0.9) 0%, rgba(22,101,52,0.5) 100%);
            border-radius: 50%;
            left: ${cell.offsetLeft + cell.offsetWidth / 2}px;
            top: ${cell.offsetTop + cell.offsetHeight / 2}px;
            pointer-events: none;
            z-index: 10;
        `;
        document.getElementById('board').appendChild(particle);
        
        // 粒子消散动画
        const angle = (Math.PI * 2 / 8) * i;
        const distance = 30 + Math.random() * 20;
        
        safeAnime({
            targets: particle,
            translateX: Math.cos(angle) * distance,
            translateY: Math.sin(angle) * distance,
            opacity: [1, 0],
            scale: [1, 0.2],
            duration: 600,
            easing: 'easeOutExpo',
            complete: () => particle.remove()
        });
    }
}
```

---

## 四、实现位置指引

### 4.1 需要修改的文件

| 文件 | 修改位置 | 修改内容 |
|------|----------|----------|
| `style.css` | 约第 285-287 行 | 替换原有的 `.cell.corroded` 样式 |
| `style.css` | 新增区块 | 添加 `.board.casting-voodoo` 相关样式 |
| `pieces.css` | 文件末尾 | 可选：添加腐蚀粒子动画辅助类 |

### 4.2 style.css 修改详情

#### 位置 1：替换现有腐蚀样式（第 285-287 行）

**现有代码：**
```css
.cell.corroded { background: var(--corrode-color) !important; z-index: 1; box-shadow: inset 0 0 10px #000; border-radius: 4px; }
.cell.corroded::after { content: '☠️'; position: absolute; font-size: 1.2rem; color: #7f8c8d; z-index: 2; opacity: 0.8; }
.cell.corroded .piece { opacity: 0.3; filter: grayscale(1) blur(1px); }
```

**替换为：** 上述「腐蚀阶段」完整 CSS 代码

#### 位置 2：新增激活阶段样式

在 `style.css` 的 `.cell` 相关样式区域之后（约第 290 行附近），添加上述「激活阶段」完整 CSS 代码

### 4.3 可选：pieces.css 追加

如果需要将腐蚀特效与棋子特效系统统一管理，可以在 `pieces.css` 文件末尾追加腐蚀粒子相关样式。

---

## 五、视觉效果预览

### 5.1 激活阶段效果
```
┌─────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← 紫色迷雾覆盖
│░░┌───────────────────────┐░░│
│░░│ ●○●○●○●○●○●○●○●○●○● │░░│  ← 棋子带紫色光晕
│░░│ ○●○●○●○●○●○●○●○●○●○ │░░│
│░░│ ●○●○●○●○●○●○●○●○●○● │░░│  ← 悬停时显示骷髅
│░░│ ○●○●○●○●○●○●○●○●○●○ │░░│
│░░└───────────────────────┘░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← 紫色脉动边框
└─────────────────────────────┘
```

### 5.2 腐蚀阶段效果
```
┌─────────────────────────────┐
│     ○●○●○●○●○●○●○●○●○●     │
│●○●○●┌─────┐●○●○●○●○●○●○●○●│
│○●○●○│☠️   │○●○●○●○●○●○●○●○│  ← 骷髅标志
│●○●○●│腐蚀坑│●○●○●○●○●○●○●○●│  ← 暗绿腐蚀坑
│○●○●│☠️   │○●○●○●○●○●○●○●○│  ← 毒液溢出
│●○●○●└─────┘●○●○●○●○●○●○●○●│
│     ○●○●○●○●○●○●○●○●○●     │
└─────────────────────────────┘
```

---

## 六、技术要点总结

### 6.1 CSS 技术栈
- **多图层渐变**：`radial-gradient` + `linear-gradient` 叠加
- **伪元素动画**：`::before` / `::after` 实现装饰层
- **SVG Data URI**：内联骷髅图标，无需外部资源
- **CSS 变量**：复用项目现有颜色变量
- **响应式适配**：移动端简化效果保证性能

### 6.2 动画技术栈
- **CSS Keyframes**：主要动画实现方式
- **Anime.js**：可选的复杂粒子轨迹控制
- **安全包装器**：`window.safeAnime()` 降级处理

### 6.3 兼容性保障
- **渐进增强**：核心效果纯 CSS 实现
- **降级处理**：Anime.js 加载失败时跳过粒子效果
- **动效减弱**：`prefers-reduced-motion` 媒体查询支持
- **移动端优化**：简化阴影和动画数量

---

## 七、后续扩展建议

1. **音效配合**：激活时播放低沉的咒语声，腐蚀时播放毒液滋滋声
2. **连锁反应**：多个腐蚀格子相邻时产生毒液蔓延效果
3. **解除诅咒**：未来可添加净化技能，解除腐蚀状态
4. **主题适配**：为不同棋盘皮肤定制腐蚀效果配色

---

*设计方案版本：v1.0*
*创建时间：2024-02-18*
*适用版本：Alpha 0.7.9.6+*
