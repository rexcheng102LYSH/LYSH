// ================= Board Rendering =================
function renderBoard() {
    const b = document.getElementById('board');
    b.innerHTML = '';
    const stars = [[3,3],[3,11],[7,7],[11,3],[11,11]];
    for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell'; cell.id = `c-${r}-${c}`; cell.dataset.r=r; cell.dataset.c=c;
        cell.onclick=()=>handleCellClick(r,c);
        cell.onmouseenter=()=>handleCellHover(r,c);
        if(stars.some(s=>s[0]===r&&s[1]===c)) {
            cell.setAttribute('data-star','true');
            const d=document.createElement('div'); d.className='dot'; cell.appendChild(d);
        }
        b.appendChild(cell);
    }

    // Repaint pieces from board state after rebuilding the grid.
    const sourceBoard = (typeof GameState !== 'undefined' && Array.isArray(GameState.board))
        ? GameState.board
        : board;
    if (Array.isArray(sourceBoard)) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const rowData = sourceBoard[r];
                if (!Array.isArray(rowData)) continue;
                const val = rowData[c];
                const cell = getCell(r, c);
                if (!cell) continue;
                if (val === MAPLE || val === SUN) {
                    renderPieceInCell(cell, val);
                } else if (typeof CORRODED !== 'undefined' && val === CORRODED) {
                    cell.classList.add('corroded');
                }
            }
        }
    }

    // [Alpha 0.7.9.1] Re-apply board skin and FX hooks.
    if (typeof applyBoardSkin === 'function') applyBoardSkin();
    if (typeof VisualFX !== 'undefined') VisualFX.init();
}
function getCell(r, c) { return document.getElementById(`c-${r}-${c}`); }

function handleCellHover(r, c) {}


function placePiece(r, c, p, m=false, chaos=false) { 
    GameState.board[r][c] = p;
    board[r][c] = p; // 同步
    
    // [Alpha 0.7.9.0] 更新落子锁定状态
    GameState.lastMove = { r: r, c: c, player: p };
    GameState.moveCount++;
    lastMove = GameState.lastMove;
    moveCount = GameState.moveCount;
    
    const cell = getCell(r,c); 
    if(cell) { 
        renderPieceInCell(cell, p);
        
        // [Alpha 0.7.9.6] 根据皮肤分离音效和特效
        if (currentSkin === 'ice_fire') {
            // 冰/火主题：冰晶（先手）/ 火焰（后手）
            if (p === MAPLE) {
                // 冰晶音效
                if (typeof SoundEngine.playIceStone === 'function') {
                    SoundEngine.playIceStone();
                } else {
                    SoundEngine.playBlackStone();
                }
                // 冰晶特效（检查落子特效开关）
                // 统一调用方式：与黑白、自然特效保持一致
                if (isIceFireDropEffectEnabled()) {
                    createIceEffect(cell);
                }
            } else {
                // 火焰音效
                if (typeof SoundEngine.playFireStone === 'function') {
                    SoundEngine.playFireStone();
                } else {
                    SoundEngine.playWhiteStone();
                }
                // 火焰特效（检查落子特效开关）
                // 统一调用方式：与黑白、自然特效保持一致
                if (isIceFireDropEffectEnabled()) {
                    createFireEffect(cell);
                }
            }
        } else if (currentSkin === 'nature') {
            // 自然皮肤：落叶（先手）/ 太阳（后手）
            if (p === MAPLE) {
                SoundEngine.playMapleStone();
            } else {
                SoundEngine.playSunStone();
            }
            
            // [Alpha 0.7.9.3] 自然特效（落叶飘落/阳光光芒）
            // 统一调用方式：与黑白、冰火特效保持一致
            if (isNatureEffectEnabled()) {
                createNatureEffect(cell, p);
            }
        } else {
            // 黑白皮肤：黑子 / 白子
            if (p === MAPLE) {
                SoundEngine.playBlackStone();
            } else {
                SoundEngine.playWhiteStone();
            }
            
            // [Alpha 0.7.9.3] 添加冲击波纹特效（根据设置）
            if (isPieceRippleEnabled()) {
                createPieceRipple(cell, p);
            }
        }
        
        // [Alpha 0.7.9.3] 触发棋盘震动
        triggerBoardShake();
    } 
}

// [Alpha 0.7.9.3] 创建落子波纹特效（黑子墨晕 / 白子水波）
function createPieceRipple(cell, player) {
    const isBlack = (player === MAPLE);
    
    if (isBlack) {
        // 黑子：墨水喷溅效果
        createInkSplatter(cell);
    } else {
        // 白子：优雅白色涟漪
        createWhiteRipple(cell);
    }
}

// 黑子专属：墨水喷溅特效 - 真实墨迹感
function createInkSplatter(cell) {
    // 1. 中心墨点冲击
    const centerBlot = document.createElement('div');
    centerBlot.className = 'ink-center-blot';
    cell.appendChild(centerBlot);
    centerBlot.addEventListener('animationend', () => centerBlot.remove());
    
    // 2. 主要墨迹飞溅（8-12个不规则墨点，向外喷射）
    const mainSplashCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < mainSplashCount; i++) {
        const splash = document.createElement('div');
        splash.className = 'ink-splatter';
        
        // 随机飞溅方向（全方位）
        const angle = (i / mainSplashCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const distance = 18 + Math.random() * 30;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        splash.style.setProperty('--splat-x', endX + 'px');
        splash.style.setProperty('--splat-y', endY + 'px');
        
        // 随机大小（大小不一更真实）
        const size = 4 + Math.random() * 6;
        splash.style.setProperty('--splat-size', size + 'px');
        
        // 随机拉伸（墨迹不是完美圆形）
        const stretch = 0.6 + Math.random() * 0.8;
        splash.style.setProperty('--splat-stretch', stretch);
        
        // 随机旋转
        const rotation = Math.random() * 360;
        splash.style.setProperty('--splat-rotation', rotation + 'deg');
        
        // 随机延迟（喷溅有先后）
        splash.style.animationDelay = (Math.random() * 0.08) + 's';
        
        cell.appendChild(splash);
        splash.addEventListener('animationend', () => splash.remove());
    }
    
    // 3. 细小墨滴（更远更小的飞溅）
    const tinyDropCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < tinyDropCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'ink-tiny-drop';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 25;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        drop.style.setProperty('--drop-x', endX + 'px');
        drop.style.setProperty('--drop-y', endY + 'px');
        
        const size = 2 + Math.random() * 2.5;
        drop.style.setProperty('--drop-size', size + 'px');
        
        drop.style.animationDelay = (0.05 + Math.random() * 0.1) + 's';
        
        cell.appendChild(drop);
        drop.addEventListener('animationend', () => drop.remove());
    }
}

// 白子专属：优雅白色涟漪 - 回归白子本色
function createWhiteRipple(cell) {
    // 1. 两层同心圆波纹（简洁优雅）
    for (let i = 0; i < 2; i++) {
        const ring = document.createElement('div');
        ring.className = 'white-ring';
        ring.style.animationDelay = (i * 0.1) + 's';
        cell.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove());
    }
    
    // 2. 中心柔光
    const glow = document.createElement('div');
    glow.className = 'white-glow';
    cell.appendChild(glow);
    glow.addEventListener('animationend', () => glow.remove());
    
    // 3. 少量光点散落（3-4个）
    const sparkCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.className = 'white-spark';
        
        const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const distance = 12 + Math.random() * 15;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 8;
        spark.style.setProperty('--spark-x', endX + 'px');
        spark.style.setProperty('--spark-y', endY + 'px');
        
        spark.style.animationDelay = (Math.random() * 0.06) + 's';
        
        cell.appendChild(spark);
        spark.addEventListener('animationend', () => spark.remove());
    }
}

// [Alpha 0.7.9.3] 触发棋盘震动效果
function triggerBoardShake() {
    // 检查震动开关是否开启
    if (!GameState.boardShakeEnabled) return;
    
    const wrapper = document.querySelector('.board-wrapper');
    if (wrapper) {
        // 移除旧的震动类（如果有）
        wrapper.classList.remove('shake');
        // 强制重绘以重新触发动画
        void wrapper.offsetWidth;
        // 添加震动类
        wrapper.classList.add('shake');
        
        // 动画结束后移除类
        setTimeout(() => {
            wrapper.classList.remove('shake');
        }, 120);
    }
}

// [Alpha 0.7.9.0] 更新落子锁定标记显示
// 仅对当前回合玩家可见（落子方看不到自己刚下的棋子标记）
// PvE 模式下：只有玩家回合时才显示 AI 的落子标记
function updateLastMoveMarker() {
    // 先清除所有旧的锁定标记
    document.querySelectorAll('.last-move-marker').forEach(el => el.remove());
    
    // 检查是否需要显示锁定标记
    if (!GameState.lastMove || GameState.moveCount < 1) return;
    
    // 核心逻辑：只有当前玩家不是落子方时才显示
    // 即：显示给"需要看到对方落子位置"的那个人
    if (GameState.currentPlayer === GameState.lastMove.player) return;
    
    // PvE 模式额外检查：只有玩家回合时才显示锁定框
    // 因为 AI 不需要看锁定框，玩家也不需要在 AI 回合时看到任何锁定框
    if (GameState.gameMode === 'pve' && GameState.currentPlayer !== GameState.humanSide) {
        return;
    }
    
    const { r, c } = GameState.lastMove;
    const cell = getCell(r, c);
    if (!cell) return;
    
    // 创建锁定标记容器（包含4个L形角落）
    const marker = document.createElement('div');
    marker.className = 'last-move-marker';
    
    // 添加右上角和左下角的L形元素
    const topRight = document.createElement('div');
    topRight.className = 'last-move-corner top-right';
    marker.appendChild(topRight);
    
    const bottomLeft = document.createElement('div');
    bottomLeft.className = 'last-move-corner bottom-left';
    marker.appendChild(bottomLeft);
    
    cell.appendChild(marker);
}

function renderPieceInCell(cell, player) {
    const pieceDiv = document.createElement('div');
    
    // [Alpha 0.7.9.3] 获取动态落子动画类
    const dropAnimClass = (typeof getPieceDropAnimationClass === 'function') 
        ? getPieceDropAnimationClass() 
        : 'drop-fast';
    
    if (currentSkin === 'classic') {
        // [Alpha 0.7.9.3] 获取棋子质感类
        const textureClass = (typeof getPieceTextureClass === 'function')
            ? getPieceTextureClass()
            : 'texture-3d';
        
        pieceDiv.className = `piece skin-classic ${player===MAPLE?'p1':'p2'} ${textureClass} ${dropAnimClass}`;
    } else if (currentSkin === 'ice_fire') {
        // [Alpha 0.7.9.6] 冰/火主题棋子 - 使用PNG图片（参照自然风格）
        // 先手(MAPLE) = 冰晶棋子 (p1)
        // 后手(SUN) = 火焰棋子 (p2)
        const iceFireDropClass = getIceFireDropAnimationClass();
        const staticAnimClass = isIceFireStaticAnimEnabled() ? '' : 'no-static-anim';
        // [Alpha 0.7.9.6] 添加 p1/p2 类，使 CSS 选择器能正确匹配
        const playerClass = player === MAPLE ? 'p1' : 'p2';
        pieceDiv.className = `piece skin-ice-fire ${playerClass} ${iceFireDropClass} ${staticAnimClass}`.trim();
        
        // 使用PNG图片（参照自然风格的实现方式）
        const iconData = (player === MAPLE ? PIECE_ICONS.ice : PIECE_ICONS.fire);
        if (iconData && iconData.type === 'image') {
            const img = document.createElement('img');
            img.src = iconData.src;
            img.alt = iconData.alt;
            img.className = 'piece-img';
            pieceDiv.appendChild(img);
        }
        
        // [Alpha 0.7.9.6] 创建静态动效粒子（在棋子外运行，与PNG棋子融为一体）
        if (isIceFireStaticAnimEnabled()) {
            if (player === MAPLE) {
                // 冰晶棋子：创建冰晶闪烁粒子
                createIceSparkles(pieceDiv);
            } else {
                // 火焰棋子：创建火星飘浮粒子
                createFireEmbers(pieceDiv);
            }
        }
        
        // [Alpha 0.7.9.6] 落子动画结束后移除动画类，让静态动效生效
        pieceDiv.addEventListener('animationend', function onDropEnd(e) {
            // 只处理落子动画，不处理静态动效
            if (e.animationName.startsWith('drop')) {
                pieceDiv.classList.remove('drop-fast', 'drop-slow', 'drop-fast-bounce', 'drop-slow-bounce');
                pieceDiv.removeEventListener('animationend', onDropEnd);
            }
        });
    } else {
        // 自然皮肤 (nature)
        pieceDiv.className = `piece skin-nature ${dropAnimClass}`;
        const iconData = (player === MAPLE ? PIECE_ICONS.maple : PIECE_ICONS.sun);
        if (typeof iconData === 'string') {
            pieceDiv.innerHTML = iconData;
        } else if (iconData && iconData.type === 'image') {
            const img = document.createElement('img');
            img.src = iconData.src;
            img.alt = iconData.alt;
            img.className = 'piece-img'; 
            pieceDiv.appendChild(img);
        }
    }
    cell.appendChild(pieceDiv);
}

// [Alpha 0.7.9.6] 获取冰/火主题的落子动画类名
function getIceFireDropAnimationClass() {
    const settings = GameState.pieceEffectSettings.ice_fire;
    const style = settings.dropStyle || 'fast';
    const bounce = settings.bounceEnabled || false;
    
    let result;
    if (style === 'fast') {
        result = bounce ? 'drop-fast-bounce' : 'drop-fast';
    } else {
        result = bounce ? 'drop-slow-bounce' : 'drop-slow';
    }
    return result;
}

// [Alpha 0.7.9.6] 检查冰/火静态动效是否启用
function isIceFireStaticAnimEnabled() {
    const settings = GameState.pieceEffectSettings.ice_fire;
    return settings.staticAnimEnabled !== false; // 默认开启
}

// [Alpha 0.7.9.6] 检查冰/火落子特效是否启用
function isIceFireDropEffectEnabled() {
    const settings = GameState.pieceEffectSettings.ice_fire;
    return settings.dropEffectEnabled !== false; // 默认开启
}

if (window.GameHost && typeof window.GameHost.register === 'function') {
    window.GameHost.register('render', { init: function() {} });
}

// [Alpha 0.7.9.3] 创建自然特效（落叶飘落/阳光光芒）
function createNatureEffect(cell, player) {
    if (player === MAPLE) {
        // 落叶特效：飘落的小枫叶
        createFallingLeaves(cell);
    } else {
        // 太阳特效：金色光芒扩散
        createSunGlow(cell);
    }
}

// 创建落叶飘落特效
function createFallingLeaves(cell) {
    const leafCount = 6 + Math.floor(Math.random() * 3); // 6-8片叶子
    const colors = ['#C41E3A', '#DC143C', '#B22222', '#CD5C5C', '#E25822', '#D2691E', '#FF6347'];
    
    for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'nature-leaf';
        
        // 随机颜色
        leaf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 随机大小（更大更明显）
        const size = 8 + Math.random() * 6; // 8-14px
        leaf.style.width = size + 'px';
        leaf.style.height = (size * 0.7) + 'px';
        
        // 随机起始位置（从棋子上方散开）
        const angle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.5;
        const startRadius = 5 + Math.random() * 10;
        const offsetX = Math.cos(angle) * startRadius;
        const offsetY = -15 - Math.random() * 20;
        leaf.style.setProperty('--start-x', offsetX + 'px');
        leaf.style.setProperty('--start-y', offsetY + 'px');
        
        // 随机飘落方向（更大的飘散范围）
        const endX = (Math.random() - 0.5) * 60;
        const endY = 25 + Math.random() * 20;
        leaf.style.setProperty('--end-x', endX + 'px');
        leaf.style.setProperty('--end-y', endY + 'px');
        
        // 随机旋转
        const rotation = 180 + Math.random() * 540;
        leaf.style.setProperty('--rotation', rotation + 'deg');
        
        // 随机延迟（更紧凑）
        leaf.style.animationDelay = (i * 0.05) + 's';
        
        cell.appendChild(leaf);
        
        // 动画结束后移除
        leaf.addEventListener('animationend', () => {
            leaf.remove();
        });
    }
    
    // 添加落叶尘土效果
    const dust = document.createElement('div');
    dust.className = 'nature-leaf-dust';
    cell.appendChild(dust);
    dust.addEventListener('animationend', () => {
        dust.remove();
    });
}

// 创建阳光光芒特效
function createSunGlow(cell) {
    // 核心闪光
    const flash = document.createElement('div');
    flash.className = 'nature-sun-flash';
    cell.appendChild(flash);
    flash.addEventListener('animationend', () => {
        flash.remove();
    });
    
    // 主光晕（更大更亮）
    const glow = document.createElement('div');
    glow.className = 'nature-sun-glow';
    cell.appendChild(glow);
    glow.addEventListener('animationend', () => {
        glow.remove();
    });
    
    // 外层光环
    const ring = document.createElement('div');
    ring.className = 'nature-sun-ring';
    cell.appendChild(ring);
    ring.addEventListener('animationend', () => {
        ring.remove();
    });
    
    // 光芒射线（更多更亮）
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
        const ray = document.createElement('div');
        ray.className = 'nature-sun-ray';
        ray.style.setProperty('--ray-angle', (i * 45) + 'deg');
        ray.style.animationDelay = (i * 0.03) + 's';
        cell.appendChild(ray);
        
        ray.addEventListener('animationend', () => {
            ray.remove();
        });
    }
    
    // 金色粒子
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'nature-sun-particle';
        const angle = (i / particleCount) * Math.PI * 2;
        particle.style.setProperty('--particle-angle', (i * 60) + 'deg');
        particle.style.animationDelay = (i * 0.04) + 's';
        cell.appendChild(particle);
        
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}



// =========================================
// [Alpha 0.7.9.6] 冰火落子特效系统 v2 - Premium
// Ice & Fire Drop Effect System - Complete Redesign
// 冰系「极寒碎裂」 / 火系「烈焰轰击」
// =========================================

// [Alpha 0.7.9.6] 冰系落子特效 -「极寒碎裂」
// 层次：冰爆核心闪光 + 霜冻冲击波 + 冰晶碎片飞射(anime.js) + 寒气雾扩散
// @param {HTMLElement} cell - 落子的格子元素
function createIceEffect(cell) {
    // 1. 冰爆核心闪光 - 中心冰蓝白光瞬间绽放
    const flash = document.createElement('div');
    flash.className = 'ice-d-flash';
    cell.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());

    // 2. 霜冻冲击波 - 2层冰蓝色环形波纹依次扩散
    for (let i = 0; i < 2; i++) {
        const ring = document.createElement('div');
        ring.className = 'ice-d-ring';
        ring.style.animationDelay = (i * 0.12) + 's';
        cell.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove());
    }

    // 3. 冰晶碎片飞射 - 三级混合碎片，每颗独立随机轨迹
    // 先构建配置数组，再 Fisher-Yates 洗牌，确保大中小均匀混合在各方向
    const cfgs = [];
    for (let i = 0; i < 12; i++) cfgs.push({ cls: 'ice-d-shard',   minS: 5,   range: 5 });
    for (let i = 0; i < 14; i++) cfgs.push({ cls: 'ice-d-shard-m', minS: 3.3, range: 3.4 });
    for (let i = 0; i < 14; i++) cfgs.push({ cls: 'ice-d-shard-s', minS: 1.7, range: 1.6 });
    // Fisher-Yates 洗牌
    for (let i = cfgs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = cfgs[i]; cfgs[i] = cfgs[j]; cfgs[j] = tmp;
    }

    const shards = [];
    const motion = []; // 每颗碎片的独立运动参数
    for (let i = 0; i < cfgs.length; i++) {
        const c = cfgs[i];
        const s = document.createElement('div');
        s.className = c.cls;
        const sz = c.minS + Math.random() * c.range;
        s.style.width = sz + 'px';
        s.style.height = sz + 'px';
        cell.appendChild(s);
        shards.push(s);
        // 每颗碎片完全独立的随机角度、距离、旋转、延迟
        const angle = Math.random() * Math.PI * 2;
        const dist  = 18 + Math.random() * 48;
        motion.push({
            tx: Math.cos(angle) * dist,
            ty: Math.sin(angle) * dist,
            rot: (Math.random() - 0.3) * 520,
            del: Math.random() * 110
        });
    }

    if (typeof window.safeAnime === 'function') {
        window.safeAnime({
            targets: shards,
            translateX: (_, i) => motion[i].tx,
            translateY: (_, i) => motion[i].ty,
            rotate: (_, i) => motion[i].rot,
            scale: [
                { value: [0.1, 1.1], duration: 140, easing: 'easeOutQuad' },
                { value: 0, duration: 420, easing: 'easeInQuad' }
            ],
            opacity: [
                { value: [0, 1], duration: 80, easing: 'easeOutQuad' },
                { value: 0, duration: 480, easing: 'easeInCubic' }
            ],
            delay: (_, i) => motion[i].del,
            duration: 560,
            easing: 'easeOutExpo',
            complete: () => shards.forEach(s => s.remove()),
        });
    } else {
        setTimeout(() => shards.forEach(s => s.remove()), 620);
    }

    // 4. 寒气雾扩散 - 淡蓝色雾气从中心弥散
    const mist = document.createElement('div');
    mist.className = 'ice-d-mist';
    cell.appendChild(mist);
    mist.addEventListener('animationend', () => mist.remove());
}


// [Alpha 0.7.9.6] 火系落子特效 -「陨星坠岩」
// 物理模型：小行星垂直砸入岩浆 → 冲击闪光 → 冲击波 → 岩浆皇冠隆起 →
//           Worthington反冲柱 → 熔岩飞溅 → 热浪涌动
// @param {HTMLElement} cell - 落子的格子元素
function createFireEffect(cell) {
    // 1. 白热冲击闪光 - 撞击瞬间极亮核心爆发
    const flash = document.createElement('div');
    flash.className = 'fire-d-flash';
    cell.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());

    // 2. 冲击波环 - 2层猛烈向外扩散
    for (let i = 0; i < 2; i++) {
        const ring = document.createElement('div');
        ring.className = 'fire-d-ring';
        ring.style.animationDelay = (i * 0.08) + 's';
        cell.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove());
    }

    // 3. 岩浆皇冠 - 撞击瞬间液面被挤开向上隆起的环形「水冢」(CSS动画)
    const crown = document.createElement('div');
    crown.className = 'fire-d-crown';
    cell.appendChild(crown);
    crown.addEventListener('animationend', () => crown.remove());

    // 4. Worthington反冲柱 - 撞击后中心垂直反弹的岩浆柱
    // 使用 margin-left 居中，避免 anime.js 覆盖 transform 导致偏移
    const jet = document.createElement('div');
    jet.className = 'fire-d-jet';
    cell.appendChild(jet);
    if (typeof window.safeAnime === 'function') {
        window.safeAnime({
            targets: jet,
            scaleY: [
                { value: [0, 2.8], duration: 130, easing: 'easeOutQuart' },
                { value: 0, duration: 430, easing: 'easeInCubic' }
            ],
            scaleX: [
                { value: [0.6, 1.1], duration: 100, easing: 'easeOutQuad' },
                { value: 0.2, duration: 460, easing: 'easeInQuad' }
            ],
            opacity: [
                { value: [0, 1], duration: 50, easing: 'linear' },
                { value: 0, duration: 510, easing: 'easeInQuad' }
            ],
            delay: 40,
            duration: 560,
            easing: 'easeOutCubic',
            complete: () => jet.remove(),
        });
    } else {
        setTimeout(() => jet.remove(), 620);
    }

    // 5. 熔岩飞溅 - 岩浆液滴从撞击皇冠边缘向外+上方喷射
    const splashCnt = 14;
    const splashes = [];
    const sData = [];
    for (let i = 0; i < splashCnt; i++) {
        const sp = document.createElement('div');
        sp.className = 'fire-d-splash';
        const sz = 2 + Math.random() * 3.5;
        sp.style.width = sz + 'px';
        sp.style.height = sz + 'px';
        cell.appendChild(sp);
        splashes.push(sp);
        // 每颗液滴独立随机轨迹
        const angle = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 42;
        sData.push({
            tx: Math.cos(angle) * dist,
            // 偏向上方：Y轴整体向上偏移，模拟重力反弹喷射
            ty: Math.sin(angle) * dist * 0.5 - (10 + Math.random() * 20),
            del: Math.random() * 70
        });
    }
    if (typeof window.safeAnime === 'function') {
        window.safeAnime({
            targets: splashes,
            translateX: (_, i) => sData[i].tx,
            translateY: (_, i) => sData[i].ty,
            scale: [
                { value: [0.2, 1.2], duration: 150, easing: 'easeOutQuad' },
                { value: 0, duration: 460, easing: 'easeInQuad' }
            ],
            opacity: [
                { value: [0, 1], duration: 90, easing: 'easeOutQuad' },
                { value: 0, duration: 520, easing: 'easeInCubic' }
            ],
            delay: (_, i) => 30 + sData[i].del,
            duration: 610,
            easing: 'easeOutExpo',
            complete: () => splashes.forEach(s => s.remove()),
        });
    } else {
        setTimeout(() => splashes.forEach(s => s.remove()), 700);
    }

    // 6. 热浪涌动 - 暖色光晕从中心扩散
    const surge = document.createElement('div');
    surge.className = 'fire-d-surge';
    cell.appendChild(surge);
    surge.addEventListener('animationend', () => surge.remove());
}


// =========================================
// [Alpha 0.7.9.6] 冰火棋子静态动效系统 v2
// Ice & Fire Static Animation System - Premium Redesign
// 全新美学：极寒冰华 / 炽焰余烬
// =========================================

// [Alpha 0.7.9.6] 冰系静态动效 -「冰华之冠」
// 层次：底层寒光脉冲(CSS) + 中层冰晶轨道 + 顶层霜尘微粒 + 寒雾
// @param {HTMLElement} pieceDiv - 棋子容器元素
function createIceSparkles(pieceDiv) {
    // 1. 冰晶轨道层（6颗冰晶围绕棋子缓慢公转）
    const orbitContainer = document.createElement('div');
    orbitContainer.className = 'ice-s-orbit';
    const crystalCount = 6;
    for (let i = 0; i < crystalCount; i++) {
        const crystal = document.createElement('div');
        crystal.className = 'ice-s-crystal';
        const angle = (Math.PI * 2 * i) / crystalCount;
        const r = 14;
        crystal.style.left = `calc(50% + ${(Math.cos(angle) * r).toFixed(1)}px)`;
        crystal.style.top = `calc(50% + ${(Math.sin(angle) * r).toFixed(1)}px)`;
        crystal.style.animationDelay = `${(i * 0.42).toFixed(2)}s`;
        orbitContainer.appendChild(crystal);
    }
    pieceDiv.appendChild(orbitContainer);

    // 2. 霜尘微粒层（8颗微粒随机位置闪烁漂浮）
    for (let i = 0; i < 8; i++) {
        const dust = document.createElement('div');
        dust.className = 'ice-s-dust';
        const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
        const r = 10 + Math.random() * 6;
        dust.style.left = `calc(50% + ${(Math.cos(angle) * r).toFixed(1)}px)`;
        dust.style.top = `calc(50% + ${(Math.sin(angle) * r).toFixed(1)}px)`;
        dust.style.setProperty('--delay', `${(Math.random() * 4).toFixed(2)}s`);
        dust.style.setProperty('--drift-x', `${((Math.random() - 0.5) * 4).toFixed(2)}px`);
        dust.style.setProperty('--drift-y', `${(-1 - Math.random() * 3).toFixed(2)}px`);
        pieceDiv.appendChild(dust);
    }

    // 3. 寒雾底层（棋子下方溢出的冷气）
    const mist = document.createElement('div');
    mist.className = 'ice-s-mist';
    pieceDiv.appendChild(mist);

    // anime.js 驱动入场动画（仅入场，不改主循环动画系统）
    if (typeof window.safeAnime === 'function' && !pieceDiv.classList.contains('no-static-anim')) {
        window.safeAnime({
            targets: pieceDiv.querySelectorAll('.ice-s-crystal'),
            opacity: [0, 1],
            scale: [0.2, 1],
            delay: (_, i) => 300 + i * 80,
            duration: 700,
            easing: 'easeOutBack',
        });
        window.safeAnime({
            targets: pieceDiv.querySelectorAll('.ice-s-dust'),
            opacity: [0, 0.85],
            scale: [0.4, 1],
            delay: (_, i) => 450 + i * 55,
            duration: 850,
            easing: 'easeOutCubic',
        });
        window.safeAnime({
            targets: pieceDiv.querySelector('.ice-s-mist'),
            opacity: [0, 0.6],
            scaleX: [0.5, 1],
            delay: 500,
            duration: 900,
            easing: 'easeOutQuad',
        });
    }
}

// [Alpha 0.7.9.6] 火系静态动效 -「炽焰余烬」
// 层次：底层焰冠脉冲(CSS) + 中层上升火星 + 热浪扰动 + 炽光火花
// @param {HTMLElement} pieceDiv - 棋子容器元素
function createFireEmbers(pieceDiv) {
    // 1. 上升火星层（10颗火星持续上浮消散）
    for (let i = 0; i < 10; i++) {
        const ember = document.createElement('div');
        ember.className = 'fire-s-ember';
        const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.4;
        const r = 9 + Math.random() * 7;
        ember.style.left = `calc(50% + ${(Math.cos(angle) * r).toFixed(1)}px)`;
        ember.style.top = `calc(50% + ${(Math.sin(angle) * r).toFixed(1)}px)`;
        ember.style.setProperty('--delay', `${(Math.random() * 3).toFixed(2)}s`);
        ember.style.setProperty('--rise', `${(3 + Math.random() * 5).toFixed(2)}px`);
        ember.style.setProperty('--sway', `${((Math.random() - 0.5) * 4).toFixed(2)}px`);
        const size = 1.5 + Math.random() * 2.5;
        ember.style.width = `${size.toFixed(1)}px`;
        ember.style.height = `${size.toFixed(1)}px`;
        pieceDiv.appendChild(ember);
    }

    // 2. 热浪扰动层（棋子周围空气扭曲感）
    const haze = document.createElement('div');
    haze.className = 'fire-s-haze';
    pieceDiv.appendChild(haze);

    // 3. 炽光闪烁层（5颗随机位置亮白火花，密度削弱至80%）
    for (let i = 0; i < 5; i++) {
        const spark = document.createElement('div');
        spark.className = 'fire-s-spark';
        const angle = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 8;
        spark.style.left = `calc(50% + ${(Math.cos(angle) * r).toFixed(1)}px)`;
        spark.style.top = `calc(50% + ${(Math.sin(angle) * r).toFixed(1)}px)`;
        spark.style.setProperty('--delay', `${(Math.random() * 2.5).toFixed(2)}s`);
        pieceDiv.appendChild(spark);
    }

    // anime.js 驱动入场动画（仅入场，不改主循环动画系统）
    if (typeof window.safeAnime === 'function' && !pieceDiv.classList.contains('no-static-anim')) {
        window.safeAnime({
            targets: pieceDiv.querySelectorAll('.fire-s-ember'),
            opacity: [0, 1],
            scale: [0.3, 1],
            delay: (_, i) => 280 + i * 48,
            duration: 650,
            easing: 'easeOutBack',
        });
        window.safeAnime({
            targets: pieceDiv.querySelectorAll('.fire-s-spark'),
            opacity: [0, 0.9],
            scale: [0.2, 1],
            delay: (_, i) => 380 + i * 65,
            duration: 750,
            easing: 'easeOutCubic',
        });
    }
}
