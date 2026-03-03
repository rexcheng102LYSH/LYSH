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
 * @typedef {{ row: number, col: number, player: PlayerColor, turnsLeft?: number }} ZoneState
 * @typedef {{
 *   board: number[][],
 *   currentTurn: PlayerColor,
 *   skillUsed: UsageState,
 *   moveHistory: Array<{row:number, col:number, player:PlayerColor, time?:number, skillId?:SkillId}>,
 *   playerSkills?: Record<PlayerColor, SkillId | null>,
 *   chaosDebuff?: Record<PlayerColor, number>,
 *   shortBattleTurns?: number,
 *   territoryZones?: ZoneState[],
 *   isDoubleMoveActive?: boolean,
 *   bombTarget?: PlayerColor | null,
 *   timeRemaining?: Record<PlayerColor, number>,
 *   lastMoveTime?: number
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
 * @typedef {{ from: CellPos, to: CellPos }} MoveTarget
 * @typedef {{ own: CellPos, opponent: CellPos }} SwapTarget
 * @typedef {{ moves: MoveTarget[] }} GodHandTarget
 * @typedef {SingleTarget | MoveTarget | SwapTarget | GodHandTarget | Record<string, unknown>} SkillTargets
 * @typedef {{ valid: boolean, reason?: string }} SkillValidationResult
 * @typedef {{ row: number, col: number, value?: number, effect?: string, was?: number }} SkillChange
 * @typedef {{ type: string, [key: string]: unknown }} SkillSpecialEffect
 * @typedef {{
 *   skillId: SkillId,
 *   player: PlayerColor,
 *   changes: SkillChange[],
 *   specialEffect: SkillSpecialEffect | null,
 *   switchTurn: boolean
 * }} ExecuteSkillResult
 */

function isValidPos(pos) {
    return !!pos
        && Number.isInteger(pos.row)
        && Number.isInteger(pos.col)
        && pos.row >= 0
        && pos.row < config.board.size
        && pos.col >= 0
        && pos.col < config.board.size;
}

/**
 * @param {RoomGameState} game
 * @param {number} row
 * @param {number} col
 * @param {PlayerColor} playerColor
 * @returns {boolean}
 */
function isZoneRestricted(game, row, col, playerColor) {
    const zones = game.territoryZones || [];
    for (const zone of zones) {
        if ((zone.turnsLeft || 0) <= 0) continue;
        if (zone.player === playerColor) continue;
        if (Math.abs(zone.row - row) <= 1 && Math.abs(zone.col - col) <= 1) {
            return true;
        }
    }
    return false;
}

/**
 * @param {number[][]} board
 * @param {CellPos} pos
 * @returns {number}
 */
function pieceAt(board, pos) {
    return board[pos.row][pos.col];
}

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
    const currentTurn = game.currentTurn;
    const currentPlayer = room.players[currentTurn];

    if (!currentPlayer || currentPlayer.id !== socketId) {
        return { valid: false, reason: 'not_your_turn' };
    }

    if (game.skillUsed[currentTurn]) {
        return { valid: false, reason: 'skill_already_used' };
    }

    const expectedSkill = game.playerSkills && game.playerSkills[currentTurn];
    if (expectedSkill && expectedSkill !== skillId) {
        return { valid: false, reason: 'skill_not_owned' };
    }

    return validateSkillTargets(/** @type {RoomWithGame} */ (room), skillId, targets);
}

/**
 * @param {RoomWithGame} room
 * @param {SkillId} skillId
 * @param {SkillTargets | undefined} targets
 * @returns {SkillValidationResult}
 */
function validateSkillTargets(room, skillId, targets) {
    const game = room.game;
    const board = game.board;
    const currentTurn = game.currentTurn;
    const ownPiece = currentTurn === 'black' ? 1 : 2;
    const enemyPiece = currentTurn === 'black' ? 2 : 1;

    if (skillId === 'double' || skillId === 'chaos' || skillId === 'short_battle' || skillId === 'bomb') {
        return { valid: true };
    }

    if (skillId === 'voodoo') {
        const target = /** @type {SingleTarget | undefined} */ (targets);
        if (!target || !isValidPos(target.pos)) return { valid: false, reason: 'missing_target' };
        const val = pieceAt(board, target.pos);
        if (val !== ownPiece && val !== enemyPiece) return { valid: false, reason: 'invalid_target_piece' };
        return { valid: true };
    }

    if (skillId === 'zone') {
        const target = /** @type {SingleTarget | undefined} */ (targets);
        if (!target || !isValidPos(target.pos)) return { valid: false, reason: 'missing_target' };
        return { valid: true };
    }

    if (skillId === 'move_self' || skillId === 'move_enemy') {
        const target = /** @type {MoveTarget | undefined} */ (targets);
        if (!target || !isValidPos(target.from) || !isValidPos(target.to)) {
            return { valid: false, reason: 'missing_targets' };
        }
        const fromVal = pieceAt(board, target.from);
        if (skillId === 'move_self' && fromVal !== ownPiece) return { valid: false, reason: 'not_own_piece' };
        if (skillId === 'move_enemy' && fromVal !== enemyPiece) return { valid: false, reason: 'not_enemy_piece' };
        if (pieceAt(board, target.to) !== 0) return { valid: false, reason: 'target_not_empty' };
        if (isZoneRestricted(game, target.to.row, target.to.col, currentTurn)) {
            return { valid: false, reason: 'zone_restricted' };
        }
        return { valid: true };
    }

    if (skillId === 'swap') {
        const target = /** @type {SwapTarget | undefined} */ (targets);
        if (!target || !isValidPos(target.own) || !isValidPos(target.opponent)) {
            return { valid: false, reason: 'missing_targets' };
        }
        if (pieceAt(board, target.own) !== ownPiece) return { valid: false, reason: 'not_own_piece' };
        if (pieceAt(board, target.opponent) !== enemyPiece) return { valid: false, reason: 'not_enemy_piece' };
        return { valid: true };
    }

    if (skillId === 'god_hand') {
        const target = /** @type {GodHandTarget | SingleTarget | undefined} */ (targets);
        // 兼容旧客户端：pos -> 移除一颗棋子
        if (target && 'pos' in target && isValidPos(target.pos)) {
            const val = pieceAt(board, target.pos);
            if (val !== 1 && val !== 2) return { valid: false, reason: 'invalid_target_piece' };
            return { valid: true };
        }
        if (!target || !('moves' in target) || !Array.isArray(target.moves) || target.moves.length !== 2) {
            return { valid: false, reason: 'missing_targets' };
        }
        const preview = board.map((row) => [...row]);
        for (const mv of target.moves) {
            if (!isValidPos(mv.from) || !isValidPos(mv.to)) return { valid: false, reason: 'invalid_move_path' };
            const val = preview[mv.from.row][mv.from.col];
            if (val !== 1 && val !== 2) return { valid: false, reason: 'source_not_piece' };
            if (preview[mv.to.row][mv.to.col] !== 0) return { valid: false, reason: 'target_not_empty' };
            if (isZoneRestricted(game, mv.to.row, mv.to.col, currentTurn)) {
                return { valid: false, reason: 'zone_restricted' };
            }
            preview[mv.from.row][mv.from.col] = 0;
            preview[mv.to.row][mv.to.col] = val;
        }
        return { valid: true };
    }

    return { valid: false, reason: 'unknown_skill' };
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
    const opponent = currentTurn === 'black' ? 'white' : 'black';

    /** @type {ExecuteSkillResult} */
    const result = {
        skillId,
        player: currentTurn,
        changes: [],
        specialEffect: null,
        switchTurn: false
    };

    if (skillId === 'double') {
        game.isDoubleMoveActive = true;
        result.specialEffect = { type: 'double_active' };
    } else if (skillId === 'voodoo') {
        const target = /** @type {SingleTarget} */ (targets);
        const prev = board[target.pos.row][target.pos.col];
        board[target.pos.row][target.pos.col] = -1;
        result.changes.push({
            row: target.pos.row,
            col: target.pos.col,
            value: -1,
            was: prev,
            effect: 'voodoo_corrode'
        });
    } else if (skillId === 'move_self' || skillId === 'move_enemy') {
        const target = /** @type {MoveTarget} */ (targets);
        const moving = board[target.from.row][target.from.col];
        board[target.from.row][target.from.col] = 0;
        board[target.to.row][target.to.col] = moving;
        result.changes.push({ row: target.from.row, col: target.from.col, value: 0, was: moving });
        result.changes.push({ row: target.to.row, col: target.to.col, value: moving, effect: 'moved_piece' });
        // Keep parity with local gameplay: move skill consumes skill usage but does not end turn.
        result.switchTurn = false;
    } else if (skillId === 'zone') {
        const target = /** @type {SingleTarget} */ (targets);
        game.territoryZones = game.territoryZones || [];
        game.territoryZones.push({
            row: target.pos.row,
            col: target.pos.col,
            player: currentTurn,
            turnsLeft: 6
        });
        result.specialEffect = {
            type: 'zone_created',
            center: target.pos,
            owner: currentTurn,
            turnsLeft: 6
        };
    } else if (skillId === 'bomb') {
        game.timeRemaining = game.timeRemaining || { black: 240, white: 240 };
        game.timeRemaining[opponent] = Math.max(0, (game.timeRemaining[opponent] || 0) - 150);
        game.bombTarget = opponent;
        result.specialEffect = {
            type: 'bomb_activated',
            target: opponent,
            timeRemaining: game.timeRemaining[opponent]
        };
    } else if (skillId === 'god_hand') {
        const target = /** @type {GodHandTarget | SingleTarget} */ (targets);
        // 兼容旧客户端：移除一颗棋子
        if (target && 'pos' in target) {
            const val = board[target.pos.row][target.pos.col];
            board[target.pos.row][target.pos.col] = 0;
            result.changes.push({ row: target.pos.row, col: target.pos.col, value: 0, was: val });
            result.switchTurn = true;
        } else {
            const moves = /** @type {GodHandTarget} */ (target).moves;
            for (const mv of moves) {
                const val = board[mv.from.row][mv.from.col];
                board[mv.from.row][mv.from.col] = 0;
                board[mv.to.row][mv.to.col] = val;
                result.changes.push({ row: mv.from.row, col: mv.from.col, value: 0, was: val });
                result.changes.push({ row: mv.to.row, col: mv.to.col, value: val, effect: 'god_hand_move' });
            }
            result.switchTurn = true;
        }
    } else if (skillId === 'chaos') {
        game.chaosDebuff = game.chaosDebuff || { black: 0, white: 0 };
        game.chaosDebuff[opponent] = (game.chaosDebuff[opponent] || 0) + 2;
        result.specialEffect = { type: 'chaos_applied', target: opponent, turns: game.chaosDebuff[opponent] };
    } else if (skillId === 'short_battle') {
        game.shortBattleTurns = 6;
        result.specialEffect = { type: 'short_battle_applied', turns: 6 };
    } else if (skillId === 'swap') {
        const target = /** @type {SwapTarget} */ (targets);
        const ownVal = board[target.own.row][target.own.col];
        const enemyVal = board[target.opponent.row][target.opponent.col];
        board[target.own.row][target.own.col] = enemyVal;
        board[target.opponent.row][target.opponent.col] = ownVal;
        result.changes.push({ row: target.own.row, col: target.own.col, value: enemyVal, was: ownVal });
        result.changes.push({ row: target.opponent.row, col: target.opponent.col, value: ownVal, was: enemyVal });
        // Keep parity with local gameplay: swap consumes skill usage but does not end turn.
        result.switchTurn = false;
    }

    game.skillUsed[currentTurn] = true;
    game.lastMoveTime = Date.now();
    return result;
}

/**
 * Kept for backward compatibility. New semantics do not rely on delayed effects.
 * @returns {Array<unknown>}
 */
function processTurnEndEffects() {
    return [];
}

module.exports = {
    isValidSkill,
    executeSkill,
    processTurnEndEffects
};
