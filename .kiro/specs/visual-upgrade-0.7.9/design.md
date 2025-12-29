# Design Document - 视觉革命升级

## Overview

本设计文档定义了 Project Lysh Alpha 0.7.9 版本的视觉升级方案。核心原则是**只改渲染，不动逻辑**，通过 CSS 和 Canvas 技术提升棋盘和棋子的视觉质感，同时保证零 Bug、零破坏现有游戏机制。

## Architecture

### 设计原则

1. **渲染与逻辑分离**：所有视觉改动仅在 `game_render.js` 和 `style.css` 中进行
2. **坐标系统不变**：保持现有的 15x15 网格坐标系统
3. **DOM 结构不变**：不修改 HTML 结构和元素 ID
4. **向后兼容**：提供开关可以回退到旧渲染
5. **渐进式实现**：分三个阶段，每个阶段独立可测试

### 三阶段实现策略

```
Phase 1: 棋盘视觉升级
├── 完整边框绘制
├── 木纹质感渲染
├── 立体阴影效果
└── 星位优化

Phase 2: 棋子质感升级
├── 径向渐变光照
├── 边缘高光
├── 材质纹理
└── 投影效果

Phase 3: 落子打击感
├── 落子动画
├── 波纹特效
├── 屏幕震动
└── 动态音效
```

## Components and Interfaces

### 1. 棋盘渲染系统（Phase 1）

**实现位置**：`style.css` + `game_render.js`

**核心改动**：

#### 1.1 完整边框
```css
.board {
    /* 现有样式保持不变 */
    border: 3px solid #2d2416; /* 新增：深棕色外框 */
    box-shadow: 
        inset 0 2px 8px rgba(0,0,0,0.15), /* 保留：内阴影 */
        0 4px 12px rgba(0,0,0,0.2); /* 新增：外阴影 */
}
```

#### 1.2 木纹质感
```css
.board {
    background: 
        /* 木纹纹理层 */
        repeating-linear-gradient(
            90deg,
            rgba(139, 90, 43, 0.03) 0px,
            rgba(139, 90, 43, 0.03) 2px,
            transparent 2px,
            transparent 4px
        ),
        /* 木纹变化层 */
        repeating-linear-gradient(
            0deg,
            rgba(160, 110, 60, 0.02) 0px,
            rgba(160, 110, 60, 0.02) 8px,
            transparent 8px,
            transparent 16px
        ),
        /* 基础木色渐变 */
        linear-gradient(
            135deg,
            #e8c384 0%,
            #d4a574 25%,
            #e8c384 50%,
            #d4a574 75%,
            #e8c384 100%
        );
}
```

#### 1.3 星位优化
```css
.cell[data-star="true"] .dot {
    width: 20%; /* 从 18% 增大 */
    height: 20%;
    background: radial-gradient(
        circle,
        #1a1410 0%,
        #2d2416 100%
    );
    box-shadow: 
        0 2px 4px rgba(0,0,0,0.3),
        inset 0 1px 1px rgba(255,255,255,0.1);
}
```

### 2. 棋子渲染系统（Phase 2）

**实现位置**：`style.css` + `game_render.js`

#### 2.1 黑子质感升级
```css
.piece.skin-classic.p1 {
    background: radial-gradient(
        circle at 35% 35%,
        #4a4a4a 0%,    /* 高光区 */
        #2a2a2a 30%,   /* 过渡区 */
        #1a1a1a 60%,   /* 主体区 */
        #0a0a0a 100%   /* 边缘暗部 */
    );
    box-shadow: 
        /* 外部投影 */
        0 6px 12px rgba(0,0,0,0.4),
        /* 内部高光 */
        inset 0 2px 4px rgba(255,255,255,0.15),
        /* 内部暗部 */
        inset 0 -4px 8px rgba(0,0,0,0.5);
}
```

#### 2.2 白子质感升级
```css
.piece.skin-classic.p2 {
    background: radial-gradient(
        circle at 35% 35%,
        #ffffff 0%,    /* 高光区 */
        #f5f5f5 20%,   /* 珍珠光泽 */
        #e8e8e8 50%,   /* 主体区 */
        #d0d0d0 80%,   /* 过渡区 */
        #b8b8b8 100%   /* 边缘暗部 */
    );
    box-shadow: 
        /* 外部投影 */
        0 6px 12px rgba(0,0,0,0.25),
        /* 内部高光 */
        inset 0 3px 6px rgba(255,255,255,0.8),
        /* 内部暗部 */
        inset 0 -3px 6px rgba(0,0,0,0.15);
}
```

#### 2.3 棋子投影
```css
.piece::after {
    content: '';
    position: absolute;
    bottom: -8%;
    left: 10%;
    width: 80%;
    height: 20%;
    background: radial-gradient(
        ellipse,
        rgba(0,0,0,0.4) 0%,
        transparent 70%
    );
    z-index: -1;
    filter: blur(3px);
}
```

### 3. 落子打击感系统（Phase 3）

**实现位置**：`game_render.js` + `js/fx/` 新模块

#### 3.1 落子动画
```javascript
// 在 placePiece() 函数中添加
function placePiece(r, c, p, m=false, chaos=false) {
    // ... 现有逻辑保持不变 ...
    
    const cell = getCell(r,c);
    if(cell) {
        renderPieceInCell(cell, p);
        
        // 新增：落子动画
        if (GameState.visualUpgrade.dropAnimation) {
            triggerDropAnimation(cell);
        }
        
        // 新增：波纹特效
        if (GameState.visualUpgrade.rippleEffect) {
            triggerRippleEffect(r, c);
        }
        
        // 新增：屏幕震动
        if (GameState.visualUpgrade.screenShake) {
            triggerScreenShake(0.5, 100);
        }
        
        SoundEngine.playPlace();
    }
}
```

#### 3.2 落子动画实现
```javascript
function triggerDropAnimation(cell) {
    const piece = cell.querySelector('.piece');
    if (!piece) return;
    
    // 设置初始状态
    piece.style.transform = 'translateY(-50px) scale(0.8)';
    piece.style.opacity = '0';
    
    // 触发动画
    requestAnimationFrame(() => {
        piece.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        piece.style.transform = 'translateY(0) scale(1)';
        piece.style.opacity = '1';
    });
}
```

#### 3.3 波纹特效
```javascript
function triggerRippleEffect(r, c) {
    // 创建波纹特效模块
    const ripple = {
        x: 0, // 将在 start() 中计算
        y: 0,
        radius: 0,
        maxRadius: 60,
        alpha: 1,
        active: true
    };
    
    // 注册到 VisualFX 系统
    VisualFX.register('ripple', {
        start: function() {
            // 计算棋盘坐标到屏幕坐标
            const cell = getCell(r, c);
            const rect = cell.getBoundingClientRect();
            ripple.x = rect.left + rect.width / 2;
            ripple.y = rect.top + rect.height / 2;
        },
        render: function(ctx, w, h, now) {
            if (!ripple.active) return;
            
            // 绘制波纹
            ctx.save();
            ctx.strokeStyle = `rgba(45, 52, 54, ${ripple.alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            // 更新状态
            ripple.radius += 2;
            ripple.alpha -= 0.02;
            
            if (ripple.radius >= ripple.maxRadius) {
                ripple.active = false;
            }
        },
        reset: function() {
            ripple.active = false;
        }
    });
}
```

#### 3.4 屏幕震动
```javascript
function triggerScreenShake(intensity, duration) {
    const board = document.querySelector('.board-wrapper');
    if (!board) return;
    
    const originalTransform = board.style.transform;
    const startTime = Date.now();
    
    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
            board.style.transform = originalTransform;
            return;
        }
        
        const progress = elapsed / duration;
        const currentIntensity = intensity * (1 - progress);
        
        const x = (Math.random() - 0.5) * currentIntensity * 10;
        const y = (Math.random() - 0.5) * currentIntensity * 10;
        
        board.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(shake);
    }
    
    shake();
}
```

## Data Models

### 视觉升级配置
```javascript
// 在 GameState 中添加
GameState.visualUpgrade = {
    // Phase 1: 棋盘升级
    enhancedBoard: true,
    
    // Phase 2: 棋子升级
    enhancedPieces: true,
    
    // Phase 3: 打击感
    dropAnimation: true,
    rippleEffect: true,
    screenShake: true,
    dynamicSound: true,
    
    // 性能选项
    lowPerformanceMode: false
};
```

## Error Handling

### 安全措施

1. **坐标系统保护**
```javascript
// 在所有渲染函数开始前验证
function validateCoordinates(r, c) {
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
        console.error(`Invalid coordinates: (${r}, ${c})`);
        return false;
    }
    return true;
}
```

2. **DOM 元素检查**
```javascript
// 在操作 DOM 前检查元素存在
function safeGetCell(r, c) {
    const cell = document.getElementById(`c-${r}-${c}`);
    if (!cell) {
        console.warn(`Cell not found: (${r}, ${c})`);
    }
    return cell;
}
```

3. **特效降级**
```javascript
// 检测浏览器支持
function checkBrowserSupport() {
    const canvas = document.createElement('canvas');
    const hasCanvas = !!canvas.getContext;
    const hasTransform = 'transform' in document.body.style;
    
    if (!hasCanvas || !hasTransform) {
        GameState.visualUpgrade.lowPerformanceMode = true;
        console.warn('Browser does not support all features, enabling low performance mode');
    }
}
```

## Testing Strategy

### 测试步骤

#### Phase 1 测试（棋盘升级）
1. 启动游戏，检查棋盘是否有完整边框
2. 观察棋盘是否有木纹质感
3. 检查星位标记是否清晰
4. 点击任意位置，确认坐标映射正确
5. 测试所有技能，确认无影响

#### Phase 2 测试（棋子升级）
1. 落子黑白棋子，检查立体感
2. 观察棋子是否有光影效果
3. 检查棋子投影是否自然
4. 测试悔棋功能，确认棋子正确移除
5. 测试技能（如移花接木），确认棋子移动正常

#### Phase 3 测试（打击感）
1. 落子观察是否有落下动画
2. 检查是否有波纹扩散
3. 感受是否有轻微震动
4. 测试快速连续落子，确认性能
5. 测试 AI 落子，确认动画流畅

### 回退测试
1. 在设置面板关闭各阶段开关
2. 确认游戏恢复到旧渲染
3. 重新开启，确认升级生效
4. 测试多次开关，确认稳定性

## Implementation Notes

### 关键注意事项

1. **不要修改这些文件**：
   - `game_core.js`（核心逻辑）
   - `game_skills.js`（技能逻辑）
   - `gamestate.js`（状态管理）
   - `ai.js`（AI 逻辑）

2. **只修改这些文件**：
   - `game_render.js`（渲染逻辑）
   - `style.css`（样式）
   - 新增：`js/fx/ripple.js`（波纹特效模块）

3. **保持不变的关键点**：
   - 15x15 网格坐标系统
   - `handleCellClick(r, c)` 函数签名
   - `.cell` 元素的 `data-r` 和 `data-c` 属性
   - `GameState.board` 数组结构

4. **性能优化**：
   - 使用 CSS `transform` 而非 `top/left`
   - 使用 `requestAnimationFrame` 控制动画
   - 避免频繁的 `querySelector`
   - 缓存 DOM 元素引用

## Rollback Plan

### 回退策略

如果出现任何问题，可以通过以下方式回退：

1. **CSS 回退**：
```css
/* 在 style.css 顶部添加 */
.board.legacy-mode {
    /* 恢复旧样式 */
    border: none;
    background-color: var(--board-wood);
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.15);
}
```

2. **JavaScript 回退**：
```javascript
// 在 game_render.js 添加开关
if (!GameState.visualUpgrade.enhancedBoard) {
    // 使用旧渲染逻辑
    renderBoardLegacy();
    return;
}
```

3. **完全回退**：
   - 从 Git 恢复 `game_render.js` 和 `style.css`
   - 删除新增的特效模块文件

## Next Steps

1. 创建 `tasks.md` 实现计划
2. Phase 1 实现和测试
3. Phase 2 实现和测试
4. Phase 3 实现和测试
5. 性能优化和浏览器兼容性测试
6. 用户反馈收集和迭代
