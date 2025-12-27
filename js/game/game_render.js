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
    const cell = getCell(r,c); 
    if(cell) { 
        renderPieceInCell(cell, p); 
        SoundEngine.playPlace(); 
    } 
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

