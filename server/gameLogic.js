// ============================================
// Project Lysh Server - Game Logic
// ============================================

const config = require('./config');

/**
 * 验证落子是否合法
 * @param {object} room - 房间对象
 * @param {string} socketId - 落子者的 Socket ID
 * @param {number} row - 行
 * @param {number} col - 列
 */
function isValidMove(room, socketId, row, col) {
    if (!room || !room.game) {
        return { valid: false, reason: 'game_not_started' };
    }
    
    const game = room.game;
    const size = config.board.size;
    
    // 检查坐标范围
    if (row < 0 || row >= size || col < 0 || col >= size) {
        return { valid: false, reason: 'out_of_bounds' };
    }
    
    // 检查位置是否为空
    if (game.board[row][col] !== 0) {
        return { valid: false, reason: 'cell_occupied' };
    }
    
    // 检查是否轮到该玩家
    const currentPlayer = room.players[game.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socketId) {
        return { valid: false, reason: 'not_your_turn' };
    }
    
    return { valid: true };
}

/**
 * 执行落子
 * @param {object} room - 房间对象
 * @param {number} row - 行
 * @param {number} col - 列
 */
function placePiece(room, row, col) {
    const game = room.game;
    const pieceValue = game.currentTurn === 'black' ? 1 : 2;
    
    // 更新棋盘
    game.board[row][col] = pieceValue;
    
    // 记录历史
    game.moveHistory.push({
        row,
        col,
        player: game.currentTurn,
        time: Date.now()
    });
    
    game.lastMoveTime = Date.now();
    
    return pieceValue;
}

/**
 * 检查胜负
 * @param {object} room - 房间对象
 * @param {number} row - 最后落子的行
 * @param {number} col - 最后落子的列
 */
function checkWin(room, row, col) {
    const game = room.game;
    const board = game.board;
    const piece = board[row][col];
    const size = config.board.size;
    
    if (piece === 0) return null;
    
    // 四个方向：水平、垂直、对角线、反对角线
    const directions = [
        { dr: 0, dc: 1 },   // 水平
        { dr: 1, dc: 0 },   // 垂直
        { dr: 1, dc: 1 },   // 对角线
        { dr: 1, dc: -1 }   // 反对角线
    ];
    
    for (const { dr, dc } of directions) {
        const line = [{ row, col }];
        
        // 正方向
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === piece) {
            line.push({ row: r, col: c });
            r += dr;
            c += dc;
        }
        
        // 反方向
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === piece) {
            line.unshift({ row: r, col: c });
            r -= dr;
            c -= dc;
        }
        
        // 检查是否五连
        if (line.length >= 5) {
            return {
                winner: piece === 1 ? 'black' : 'white',
                winLine: line.slice(0, 5)  // 只取前5个
            };
        }
    }
    
    return null;
}

/**
 * 切换回合
 * @param {object} room - 房间对象
 */
function switchTurn(room) {
    const game = room.game;
    game.currentTurn = game.currentTurn === 'black' ? 'white' : 'black';
    return game.currentTurn;
}

/**
 * 执行悔棋
 * @param {object} room - 房间对象
 */
function executeUndo(room) {
    const game = room.game;
    
    if (game.moveHistory.length === 0) {
        return { success: false, reason: 'no_moves' };
    }
    
    // 移除最后一步
    const lastMove = game.moveHistory.pop();
    game.board[lastMove.row][lastMove.col] = 0;
    
    // 切换回合到悔棋方
    game.currentTurn = lastMove.player;
    
    return {
        success: true,
        undoneMove: lastMove,
        currentTurn: game.currentTurn
    };
}

/**
 * 获取棋盘状态快照（用于重连）
 * @param {object} room - 房间对象
 */
function getBoardState(room) {
    if (!room || !room.game) return null;
    
    const game = room.game;
    
    return {
        board: game.board.map(row => [...row]),  // 深拷贝
        currentTurn: game.currentTurn,
        moveHistory: [...game.moveHistory],
        skillUsed: { ...game.skillUsed },
        undoUsed: { ...game.undoUsed },
        bombs: [...game.bombs],
        zones: [...game.zones],
        voodoo: [...game.voodoo]
    };
}

module.exports = {
    isValidMove,
    placePiece,
    checkWin,
    switchTurn,
    executeUndo,
    getBoardState
};
