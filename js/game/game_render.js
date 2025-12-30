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
        SoundEngine.playPlace(); 
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
    if (currentSkin === 'classic') {
        pieceDiv.className = `piece skin-classic ${player===MAPLE?'p1':'p2'}`;
    } else {
        pieceDiv.className = 'piece skin-nature';
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

