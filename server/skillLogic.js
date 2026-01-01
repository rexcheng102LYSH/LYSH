// ============================================
// Project Lysh Server - Skill Logic
// ============================================

const config = require('./config');

/**
 * 验证技能使用是否合法
 * @param {object} room - 房间对象
 * @param {string} socketId - 使用者的 Socket ID
 * @param {string} skillId - 技能 ID
 * @param {object} targets - 技能目标参数
 */
function isValidSkill(room, socketId, skillId, targets) {
    if (!room || !room.game) {
        return { valid: false, reason: 'game_not_started' };
    }
    
    const game = room.game;
    
    // 检查是否轮到该玩家
    const currentPlayer = room.players[game.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socketId) {
        return { valid: false, reason: 'not_your_turn' };
    }
    
    // 检查是否已使用过技能
    if (game.skillUsed[game.currentTurn]) {
        return { valid: false, reason: 'skill_already_used' };
    }
    
    // 根据技能类型验证目标
    const validation = validateSkillTargets(room, skillId, targets);
    if (!validation.valid) {
        return validation;
    }
    
    return { valid: true };
}

/**
 * 验证技能目标参数
 */
function validateSkillTargets(room, skillId, targets) {
    const game = room.game;
    const board = game.board;
    const size = config.board.size;
    const currentTurn = game.currentTurn;
    const currentPiece = currentTurn === 'black' ? 1 : 2;
    const opponentPiece = currentTurn === 'black' ? 2 : 1;
    
    switch (skillId) {
        case 'double':
            // 双连：需要两个空位置
            if (!targets || !targets.pos1 || !targets.pos2) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isEmptyCell(board, targets.pos1, size) || !isEmptyCell(board, targets.pos2, size)) {
                return { valid: false, reason: 'cell_not_empty' };
            }
            break;
            
        case 'voodoo':
            // 巫毒腐蚀：需要一个对方棋子位置
            if (!targets || !targets.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (!isOpponentPiece(board, targets.pos, opponentPiece, size)) {
                return { valid: false, reason: 'not_opponent_piece' };
            }
            break;
            
        case 'move_self':
            // 移花接木：需要己方棋子位置和目标空位
            if (!targets || !targets.from || !targets.to) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isOwnPiece(board, targets.from, currentPiece, size)) {
                return { valid: false, reason: 'not_own_piece' };
            }
            if (!isEmptyCell(board, targets.to, size)) {
                return { valid: false, reason: 'target_not_empty' };
            }
            break;
            
        case 'move_enemy':
            // 乾坤大挪移：需要对方棋子位置和目标空位
            if (!targets || !targets.from || !targets.to) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isOpponentPiece(board, targets.from, opponentPiece, size)) {
                return { valid: false, reason: 'not_opponent_piece' };
            }
            if (!isEmptyCell(board, targets.to, size)) {
                return { valid: false, reason: 'target_not_empty' };
            }
            break;
            
        case 'zone':
            // 领地：需要一个空位置
            if (!targets || !targets.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (!isEmptyCell(board, targets.pos, size)) {
                return { valid: false, reason: 'cell_not_empty' };
            }
            break;
            
        case 'bomb':
            // 时间炸弹：需要一个空位置
            if (!targets || !targets.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (!isEmptyCell(board, targets.pos, size)) {
                return { valid: false, reason: 'cell_not_empty' };
            }
            break;
            
        case 'god_hand':
            // 上帝之手：需要一个有棋子的位置
            if (!targets || !targets.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (isEmptyCell(board, targets.pos, size)) {
                return { valid: false, reason: 'cell_empty' };
            }
            break;
            
        case 'chaos':
            // 混沌干扰：无需目标，随机效果
            break;
            
        case 'short_battle':
            // 短兵相接：无需目标，限制落子范围
            break;
            
        case 'swap':
            // 交换：需要己方和对方各一个棋子
            if (!targets || !targets.own || !targets.opponent) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isOwnPiece(board, targets.own, currentPiece, size)) {
                return { valid: false, reason: 'not_own_piece' };
            }
            if (!isOpponentPiece(board, targets.opponent, opponentPiece, size)) {
                return { valid: false, reason: 'not_opponent_piece' };
            }
            break;
            
        default:
            return { valid: false, reason: 'unknown_skill' };
    }
    
    return { valid: true };
}

/**
 * 执行技能效果
 * @param {object} room - 房间对象
 * @param {string} skillId - 技能 ID
 * @param {object} targets - 技能目标参数
 */
function executeSkill(room, skillId, targets) {
    const game = room.game;
    const board = game.board;
    const currentTurn = game.currentTurn;
    const currentPiece = currentTurn === 'black' ? 1 : 2;
    const opponentPiece = currentTurn === 'black' ? 2 : 1;
    
    let result = {
        skillId,
        player: currentTurn,
        changes: [],
        specialEffect: null
    };
    
    switch (skillId) {
        case 'double':
            // 双连：放置两个棋子
            board[targets.pos1.row][targets.pos1.col] = currentPiece;
            board[targets.pos2.row][targets.pos2.col] = currentPiece;
            result.changes = [
                { row: targets.pos1.row, col: targets.pos1.col, value: currentPiece },
                { row: targets.pos2.row, col: targets.pos2.col, value: currentPiece }
            ];
            // 记录到历史
            game.moveHistory.push({ row: targets.pos1.row, col: targets.pos1.col, player: currentTurn, skillId });
            game.moveHistory.push({ row: targets.pos2.row, col: targets.pos2.col, player: currentTurn, skillId });
            break;
            
        case 'voodoo':
            // 巫毒腐蚀：标记棋子，3回合后消失
            game.voodoo.push({
                row: targets.pos.row,
                col: targets.pos.col,
                turnsLeft: 3
            });
            result.changes = [
                { row: targets.pos.row, col: targets.pos.col, effect: 'voodoo', turnsLeft: 3 }
            ];
            break;
            
        case 'move_self':
            // 移花接木：移动己方棋子
            board[targets.from.row][targets.from.col] = 0;
            board[targets.to.row][targets.to.col] = currentPiece;
            result.changes = [
                { row: targets.from.row, col: targets.from.col, value: 0 },
                { row: targets.to.row, col: targets.to.col, value: currentPiece }
            ];
            break;
            
        case 'move_enemy':
            // 乾坤大挪移：移动对方棋子
            board[targets.from.row][targets.from.col] = 0;
            board[targets.to.row][targets.to.col] = opponentPiece;
            result.changes = [
                { row: targets.from.row, col: targets.from.col, value: 0 },
                { row: targets.to.row, col: targets.to.col, value: opponentPiece }
            ];
            break;
            
        case 'zone':
            // 领地：放置领地标记（3=黑方领地，4=白方领地）
            const zoneValue = currentTurn === 'black' ? 3 : 4;
            board[targets.pos.row][targets.pos.col] = zoneValue;
            game.zones.push({
                row: targets.pos.row,
                col: targets.pos.col,
                player: currentTurn
            });
            result.changes = [
                { row: targets.pos.row, col: targets.pos.col, value: zoneValue, effect: 'zone' }
            ];
            break;
            
        case 'bomb':
            // 时间炸弹：放置炸弹，3回合后爆炸
            board[targets.pos.row][targets.pos.col] = 5;  // 5 = 炸弹
            game.bombs.push({
                row: targets.pos.row,
                col: targets.pos.col,
                player: currentTurn,
                turnsLeft: 3
            });
            result.changes = [
                { row: targets.pos.row, col: targets.pos.col, value: 5, effect: 'bomb', turnsLeft: 3 }
            ];
            break;
            
        case 'god_hand':
            // 上帝之手：移除任意棋子
            const removedValue = board[targets.pos.row][targets.pos.col];
            board[targets.pos.row][targets.pos.col] = 0;
            result.changes = [
                { row: targets.pos.row, col: targets.pos.col, value: 0, removed: removedValue }
            ];
            break;
            
        case 'chaos':
            // 混沌干扰：随机效果
            result.specialEffect = executeChaos(room);
            break;
            
        case 'short_battle':
            // 短兵相接：下一回合对方只能在最后落子点周围落子
            game.activeEffect = 'short_battle';
            result.specialEffect = {
                type: 'short_battle',
                center: game.moveHistory.length > 0 
                    ? game.moveHistory[game.moveHistory.length - 1]
                    : { row: 7, col: 7 }
            };
            break;
            
        case 'swap':
            // 交换：交换己方和对方的一个棋子
            board[targets.own.row][targets.own.col] = opponentPiece;
            board[targets.opponent.row][targets.opponent.col] = currentPiece;
            result.changes = [
                { row: targets.own.row, col: targets.own.col, value: opponentPiece },
                { row: targets.opponent.row, col: targets.opponent.col, value: currentPiece }
            ];
            break;
    }
    
    // 标记技能已使用
    game.skillUsed[currentTurn] = true;
    game.lastMoveTime = Date.now();
    
    return result;
}

/**
 * 执行混沌干扰的随机效果
 */
function executeChaos(room) {
    const effects = ['shuffle', 'remove_random', 'add_random'];
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    const game = room.game;
    const board = game.board;
    const size = config.board.size;
    
    switch (effect) {
        case 'shuffle':
            // 随机交换两个棋子
            const pieces = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (board[r][c] === 1 || board[r][c] === 2) {
                        pieces.push({ row: r, col: c, value: board[r][c] });
                    }
                }
            }
            if (pieces.length >= 2) {
                const i = Math.floor(Math.random() * pieces.length);
                let j = Math.floor(Math.random() * pieces.length);
                while (j === i) j = Math.floor(Math.random() * pieces.length);
                
                const temp = board[pieces[i].row][pieces[i].col];
                board[pieces[i].row][pieces[i].col] = board[pieces[j].row][pieces[j].col];
                board[pieces[j].row][pieces[j].col] = temp;
                
                return {
                    type: 'shuffle',
                    pos1: pieces[i],
                    pos2: pieces[j]
                };
            }
            break;
            
        case 'remove_random':
            // 随机移除一个棋子
            const removable = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (board[r][c] === 1 || board[r][c] === 2) {
                        removable.push({ row: r, col: c });
                    }
                }
            }
            if (removable.length > 0) {
                const target = removable[Math.floor(Math.random() * removable.length)];
                const removed = board[target.row][target.col];
                board[target.row][target.col] = 0;
                return {
                    type: 'remove_random',
                    pos: target,
                    removed
                };
            }
            break;
            
        case 'add_random':
            // 随机添加一个棋子
            const empty = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (board[r][c] === 0) {
                        empty.push({ row: r, col: c });
                    }
                }
            }
            if (empty.length > 0) {
                const target = empty[Math.floor(Math.random() * empty.length)];
                const piece = Math.random() < 0.5 ? 1 : 2;
                board[target.row][target.col] = piece;
                return {
                    type: 'add_random',
                    pos: target,
                    piece
                };
            }
            break;
    }
    
    return { type: 'none' };
}

/**
 * 处理回合结束时的技能效果（炸弹倒计时、巫毒腐蚀等）
 */
function processTurnEndEffects(room) {
    const game = room.game;
    const board = game.board;
    const effects = [];
    
    // 处理巫毒腐蚀
    game.voodoo = game.voodoo.filter(v => {
        v.turnsLeft--;
        if (v.turnsLeft <= 0) {
            // 棋子消失
            board[v.row][v.col] = 0;
            effects.push({
                type: 'voodoo_expire',
                row: v.row,
                col: v.col
            });
            return false;
        }
        return true;
    });
    
    // 处理时间炸弹
    game.bombs = game.bombs.filter(b => {
        b.turnsLeft--;
        if (b.turnsLeft <= 0) {
            // 炸弹爆炸，清除周围 3x3 区域
            const explosions = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = b.row + dr;
                    const c = b.col + dc;
                    if (r >= 0 && r < config.board.size && c >= 0 && c < config.board.size) {
                        if (board[r][c] !== 0) {
                            explosions.push({ row: r, col: c, was: board[r][c] });
                            board[r][c] = 0;
                        }
                    }
                }
            }
            effects.push({
                type: 'bomb_explode',
                row: b.row,
                col: b.col,
                explosions
            });
            return false;
        }
        return true;
    });
    
    // 清除短兵相接效果
    if (game.activeEffect === 'short_battle') {
        game.activeEffect = null;
    }
    
    return effects;
}

// ========== 辅助函数 ==========

function isEmptyCell(board, pos, size) {
    if (!pos || pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
        return false;
    }
    return board[pos.row][pos.col] === 0;
}

function isOwnPiece(board, pos, ownPiece, size) {
    if (!pos || pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
        return false;
    }
    return board[pos.row][pos.col] === ownPiece;
}

function isOpponentPiece(board, pos, opponentPiece, size) {
    if (!pos || pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
        return false;
    }
    return board[pos.row][pos.col] === opponentPiece;
}

module.exports = {
    isValidSkill,
    executeSkill,
    processTurnEndEffects
};
