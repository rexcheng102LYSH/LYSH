// ================= ????? =================
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
    // [Alpha 0.7.9.1] 应用棋盘皮肤
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
        
        // [Alpha 0.7.9.3] 棋子打击感革命 - 根据皮肤分离音效
        // 黑白皮肤：黑曜石/白玉音效
        // 自然皮肤：落叶沙沙/阳光光辉音效
        if (currentSkin === 'nature') {
            // 自然皮肤：落叶（先手）/ 太阳（后手）
            if (p === MAPLE) {
                SoundEngine.playMapleStone();
            } else {
                SoundEngine.playSunStone();
            }
            
            // [Alpha 0.7.9.3] 自然特效（落叶飘落/阳光光芒）
            if (typeof isNatureEffectEnabled === 'function' && isNatureEffectEnabled()) {
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
    } else {
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

