// ============================================
// Project Lysh Server - Skill Logic
// ============================================

const config = require('./config');

/**
 * @typedef {'black' | 'white'} PlayerColor
 * @typedef {'double'|'voodoo'|'move_self'|'move_enemy'|'zone'|'bomb'|'god_hand'|'chaos'|'short_battle'|'swap'} KnownSkillId
 * @typedef {KnownSkillId | string} SkillId
 * @typedef {{ row: number, col: number }} CellPos
 * @typedef {{ id: string, nickname?: string }} RoomPlayer
 * @typedef {{ black: boolean, white: boolean }} UsageState
 * @typedef {{ row: number, col: number, player: PlayerColor, turnsLeft: number }} BombState
 * @typedef {{ row: number, col: number, player: PlayerColor }} ZoneState
 * @typedef {{ row: number, col: number, turnsLeft: number }} VoodooState
 * @typedef {{ row: number, col: number, player: PlayerColor, time?: number, skillId?: SkillId }} MoveRecord
 * @typedef {{
 *   board: number[][],
 *   currentTurn: PlayerColor,
 *   skillUsed: UsageState,
 *   moveHistory: MoveRecord[],
 *   activeEffect: string | null,
 *   bombs: BombState[],
 *   zones: ZoneState[],
 *   voodoo: VoodooState[],
 *   lastMoveTime: number
 * }} RoomGameState
 * @typedef {{
 *   players: {
 *     [role: string]: RoomPlayer | undefined,
 *     black?: RoomPlayer,
 *     white?: RoomPlayer
 *   },
 *   game?: RoomGameState
 * }} RoomState
 * @typedef {RoomState & { game: RoomGameState }} RoomWithGame
 * @typedef {{ pos: CellPos }} SingleTarget
 * @typedef {{ pos1: CellPos, pos2: CellPos }} DoubleTarget
 * @typedef {{ from: CellPos, to: CellPos }} MoveTarget
 * @typedef {{ own: CellPos, opponent: CellPos }} SwapTarget
 * @typedef {SingleTarget | DoubleTarget | MoveTarget | SwapTarget | Record<string, unknown>} SkillTargets
 * @typedef {{ valid: boolean, reason?: string }} SkillValidationResult
 * @typedef {{ row: number, col: number, value?: number, effect?: string, turnsLeft?: number, removed?: number }} SkillChange
 * @typedef {{ type: string, [key: string]: unknown }} SkillSpecialEffect
 * @typedef {{ skillId: SkillId, player: PlayerColor, changes: SkillChange[], specialEffect: SkillSpecialEffect | null }} ExecuteSkillResult
 * @typedef {{
 *   type: 'voodoo_expire',
 *   row: number,
 *   col: number
 * } | {
 *   type: 'bomb_explode',
 *   row: number,
 *   col: number,
 *   explosions: { row: number, col: number, was: number }[]
 * }} TurnEndEffect
 */

/**
 * Validate whether the player can use a skill now.
 * @param {RoomState | null | undefined} room
 * @param {string} socketId
 * @param {SkillId} skillId
 * @param {SkillTargets | undefined} targets
 * @returns {SkillValidationResult}
 */
function isValidSkill(room, socketId, skillId, targets) {
    if (!room || !room.game) {
        return { valid: false, reason: 'game_not_started' };
    }

    const game = room.game;

    const currentPlayer = room.players[game.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socketId) {
        return { valid: false, reason: 'not_your_turn' };
    }

    if (game.skillUsed[game.currentTurn]) {
        return { valid: false, reason: 'skill_already_used' };
    }

    const validation = validateSkillTargets(/** @type {RoomWithGame} */ (room), skillId, targets);
    if (!validation.valid) {
        return validation;
    }

    return { valid: true };
}

/**
 * Validate target payload based on skill type.
 * @param {RoomWithGame} room
 * @param {SkillId} skillId
 * @param {SkillTargets | undefined} targets
 * @returns {SkillValidationResult}
 */
function validateSkillTargets(room, skillId, targets) {
    const game = room.game;
    const board = game.board;
    const size = config.board.size;
    const currentTurn = game.currentTurn;
    const currentPiece = currentTurn === 'black' ? 1 : 2;
    const opponentPiece = currentTurn === 'black' ? 2 : 1;

    switch (skillId) {
        case 'double': {
            const target = /** @type {DoubleTarget | undefined} */ (targets);
            if (!target || !target.pos1 || !target.pos2) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isEmptyCell(board, target.pos1, size) || !isEmptyCell(board, target.pos2, size)) {
                return { valid: false, reason: 'cell_not_empty' };
            }
            break;
        }

        case 'voodoo': {
            const target = /** @type {SingleTarget | undefined} */ (targets);
            if (!target || !target.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (!isOpponentPiece(board, target.pos, opponentPiece, size)) {
                return { valid: false, reason: 'not_opponent_piece' };
            }
            break;
        }

        case 'move_self': {
            const target = /** @type {MoveTarget | undefined} */ (targets);
            if (!target || !target.from || !target.to) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isOwnPiece(board, target.from, currentPiece, size)) {
                return { valid: false, reason: 'not_own_piece' };
            }
            if (!isEmptyCell(board, target.to, size)) {
                return { valid: false, reason: 'target_not_empty' };
            }
            break;
        }

        case 'move_enemy': {
            const target = /** @type {MoveTarget | undefined} */ (targets);
            if (!target || !target.from || !target.to) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isOpponentPiece(board, target.from, opponentPiece, size)) {
                return { valid: false, reason: 'not_opponent_piece' };
            }
            if (!isEmptyCell(board, target.to, size)) {
                return { valid: false, reason: 'target_not_empty' };
            }
            break;
        }

        case 'zone':
        case 'bomb': {
            const target = /** @type {SingleTarget | undefined} */ (targets);
            if (!target || !target.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (!isEmptyCell(board, target.pos, size)) {
                return { valid: false, reason: 'cell_not_empty' };
            }
            break;
        }

        case 'god_hand': {
            const target = /** @type {SingleTarget | undefined} */ (targets);
            if (!target || !target.pos) {
                return { valid: false, reason: 'missing_target' };
            }
            if (isEmptyCell(board, target.pos, size)) {
                return { valid: false, reason: 'cell_empty' };
            }
            break;
        }

        case 'chaos':
        case 'short_battle':
            break;

        case 'swap': {
            const target = /** @type {SwapTarget | undefined} */ (targets);
            if (!target || !target.own || !target.opponent) {
                return { valid: false, reason: 'missing_targets' };
            }
            if (!isOwnPiece(board, target.own, currentPiece, size)) {
                return { valid: false, reason: 'not_own_piece' };
            }
            if (!isOpponentPiece(board, target.opponent, opponentPiece, size)) {
                return { valid: false, reason: 'not_opponent_piece' };
            }
            break;
        }

        default:
            return { valid: false, reason: 'unknown_skill' };
    }

    return { valid: true };
}

/**
 * Execute skill effects and mutate game state.
 * @param {RoomWithGame} room
 * @param {SkillId} skillId
 * @param {SkillTargets | undefined} targets
 * @returns {ExecuteSkillResult}
 */
function executeSkill(room, skillId, targets) {
    const game = room.game;
    const board = game.board;
    const currentTurn = game.currentTurn;
    const currentPiece = currentTurn === 'black' ? 1 : 2;
    const opponentPiece = currentTurn === 'black' ? 2 : 1;

    /** @type {ExecuteSkillResult} */
    let result = {
        skillId,
        player: currentTurn,
        changes: [],
        specialEffect: null
    };

    switch (skillId) {
        case 'double': {
            const target = /** @type {DoubleTarget} */ (targets);
            board[target.pos1.row][target.pos1.col] = currentPiece;
            board[target.pos2.row][target.pos2.col] = currentPiece;
            result.changes = [
                { row: target.pos1.row, col: target.pos1.col, value: currentPiece },
                { row: target.pos2.row, col: target.pos2.col, value: currentPiece }
            ];
            game.moveHistory.push({ row: target.pos1.row, col: target.pos1.col, player: currentTurn, skillId });
            game.moveHistory.push({ row: target.pos2.row, col: target.pos2.col, player: currentTurn, skillId });
            break;
        }

        case 'voodoo': {
            const target = /** @type {SingleTarget} */ (targets);
            game.voodoo.push({
                row: target.pos.row,
                col: target.pos.col,
                turnsLeft: 3
            });
            result.changes = [
                { row: target.pos.row, col: target.pos.col, effect: 'voodoo', turnsLeft: 3 }
            ];
            break;
        }

        case 'move_self': {
            const target = /** @type {MoveTarget} */ (targets);
            board[target.from.row][target.from.col] = 0;
            board[target.to.row][target.to.col] = currentPiece;
            result.changes = [
                { row: target.from.row, col: target.from.col, value: 0 },
                { row: target.to.row, col: target.to.col, value: currentPiece }
            ];
            break;
        }

        case 'move_enemy': {
            const target = /** @type {MoveTarget} */ (targets);
            board[target.from.row][target.from.col] = 0;
            board[target.to.row][target.to.col] = opponentPiece;
            result.changes = [
                { row: target.from.row, col: target.from.col, value: 0 },
                { row: target.to.row, col: target.to.col, value: opponentPiece }
            ];
            break;
        }

        case 'zone': {
            const target = /** @type {SingleTarget} */ (targets);
            const zoneValue = currentTurn === 'black' ? 3 : 4;
            board[target.pos.row][target.pos.col] = zoneValue;
            game.zones.push({
                row: target.pos.row,
                col: target.pos.col,
                player: currentTurn
            });
            result.changes = [
                { row: target.pos.row, col: target.pos.col, value: zoneValue, effect: 'zone' }
            ];
            break;
        }

        case 'bomb': {
            const target = /** @type {SingleTarget} */ (targets);
            board[target.pos.row][target.pos.col] = 5;
            game.bombs.push({
                row: target.pos.row,
                col: target.pos.col,
                player: currentTurn,
                turnsLeft: 3
            });
            result.changes = [
                { row: target.pos.row, col: target.pos.col, value: 5, effect: 'bomb', turnsLeft: 3 }
            ];
            break;
        }

        case 'god_hand': {
            const target = /** @type {SingleTarget} */ (targets);
            const removedValue = board[target.pos.row][target.pos.col];
            board[target.pos.row][target.pos.col] = 0;
            result.changes = [
                { row: target.pos.row, col: target.pos.col, value: 0, removed: removedValue }
            ];
            break;
        }

        case 'chaos':
            result.specialEffect = executeChaos(room);
            break;

        case 'short_battle':
            game.activeEffect = 'short_battle';
            result.specialEffect = {
                type: 'short_battle',
                center: game.moveHistory.length > 0
                    ? game.moveHistory[game.moveHistory.length - 1]
                    : { row: 7, col: 7 }
            };
            break;

        case 'swap': {
            const target = /** @type {SwapTarget} */ (targets);
            board[target.own.row][target.own.col] = opponentPiece;
            board[target.opponent.row][target.opponent.col] = currentPiece;
            result.changes = [
                { row: target.own.row, col: target.own.col, value: opponentPiece },
                { row: target.opponent.row, col: target.opponent.col, value: currentPiece }
            ];
            break;
        }
    }

    game.skillUsed[currentTurn] = true;
    game.lastMoveTime = Date.now();

    return result;
}

/**
 * Execute random chaos effect.
 * @param {RoomWithGame} room
 * @returns {SkillSpecialEffect}
 */
function executeChaos(room) {
    const effects = ['shuffle', 'remove_random', 'add_random'];
    const effect = effects[Math.floor(Math.random() * effects.length)];

    const game = room.game;
    const board = game.board;
    const size = config.board.size;

    switch (effect) {
        case 'shuffle': {
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
        }

        case 'remove_random': {
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
        }

        case 'add_random': {
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
    }

    return { type: 'none' };
}

/**
 * Process delayed skill effects at turn end.
 * @param {RoomWithGame} room
 * @returns {TurnEndEffect[]}
 */
function processTurnEndEffects(room) {
    const game = room.game;
    const board = game.board;
    /** @type {TurnEndEffect[]} */
    const effects = [];

    game.voodoo = game.voodoo.filter((v) => {
        v.turnsLeft--;
        if (v.turnsLeft <= 0) {
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

    game.bombs = game.bombs.filter((b) => {
        b.turnsLeft--;
        if (b.turnsLeft <= 0) {
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

    if (game.activeEffect === 'short_battle') {
        game.activeEffect = null;
    }

    return effects;
}

/**
 * @param {number[][]} board
 * @param {CellPos | undefined} pos
 * @param {number} size
 * @returns {boolean}
 */
function isEmptyCell(board, pos, size) {
    if (!pos || pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
        return false;
    }
    return board[pos.row][pos.col] === 0;
}

/**
 * @param {number[][]} board
 * @param {CellPos | undefined} pos
 * @param {number} ownPiece
 * @param {number} size
 * @returns {boolean}
 */
function isOwnPiece(board, pos, ownPiece, size) {
    if (!pos || pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
        return false;
    }
    return board[pos.row][pos.col] === ownPiece;
}

/**
 * @param {number[][]} board
 * @param {CellPos | undefined} pos
 * @param {number} opponentPiece
 * @param {number} size
 * @returns {boolean}
 */
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
