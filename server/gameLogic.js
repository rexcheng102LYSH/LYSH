// ============================================
// Project Lysh Server - Game Logic
// ============================================

const config = require('./config');

/**
 * @typedef {'black' | 'white'} PlayerColor
 * @typedef {{ row: number, col: number }} BoardPos
 * @typedef {{ id: string, nickname?: string, pieceStyle?: string, connected?: boolean }} RoomPlayer
 * @typedef {{ black: boolean, white: boolean }} UsageState
 * @typedef {{ row: number, col: number, player: PlayerColor, turnsLeft: number }} BombState
 * @typedef {{ row: number, col: number, player: PlayerColor, turnsLeft?: number }} ZoneState
 * @typedef {{ row: number, col: number, turnsLeft: number }} VoodooState
 * @typedef {{ row: number, col: number, player: PlayerColor, time?: number, skillId?: string }} MoveRecord
 * @typedef {{
 *   board: number[][],
 *   currentTurn: PlayerColor,
 *   moveHistory: MoveRecord[],
 *   skillUsed: UsageState,
 *   undoUsed: UsageState,
 *   bombs: BombState[],
 *   zones: ZoneState[],
 *   voodoo: VoodooState[],
 *   playerSkills?: Record<PlayerColor, string | null>,
 *   chaosDebuff?: Record<PlayerColor, number>,
 *   shortBattleTurns?: number,
 *   territoryZones?: ZoneState[],
 *   isDoubleMoveActive?: boolean,
 *   bombTarget?: PlayerColor | null,
 *   timeRemaining?: Record<PlayerColor, number>,
 *   turnStartedAt?: number,
 *   lastMoveTime?: number,
 *   activeEffect?: string | null
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
 * @typedef {{ valid: boolean, reason?: string, resolvedRow?: number, resolvedCol?: number, chaosApplied?: boolean }} ValidationResult
 * @typedef {{ winner: PlayerColor, winLine: BoardPos[] }} WinResult
 * @typedef {{ success: true, undoneMove: MoveRecord, currentTurn: PlayerColor } | { success: false, reason: string }} UndoResult
 * @typedef {{
 *   board: number[][],
 *   currentTurn: PlayerColor,
 *   moveHistory: MoveRecord[],
 *   skillUsed: UsageState,
 *   undoUsed: UsageState,
 *   bombs: BombState[],
 *   zones: ZoneState[],
 *   voodoo: VoodooState[],
 *   playerSkills: Record<PlayerColor, string | null>,
 *   chaosDebuff: Record<PlayerColor, number>,
 *   shortBattleTurns: number,
 *   territoryZones: ZoneState[],
 *   isDoubleMoveActive: boolean,
 *   bombTarget: PlayerColor | null,
 *   timeRemaining: Record<PlayerColor, number>,
 *   turnStartedAt: number
 * }} BoardStateSnapshot
 */

function isValidPos(row, col) {
    const size = config.board.size;
    return row >= 0 && row < size && col >= 0 && col < size;
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
 * @param {RoomGameState} game
 * @param {number} row
 * @param {number} col
 * @param {PlayerColor} playerColor
 * @returns {{ row: number, col: number, applied: boolean }}
 */
function resolveChaosMove(game, row, col, playerColor) {
    const debuff = game.chaosDebuff || { black: 0, white: 0 };
    if ((debuff[playerColor] || 0) <= 0) {
        return { row, col, applied: false };
    }

    /** @type {{row:number,col:number}[]} */
    const candidates = [];
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (!isValidPos(r, c)) continue;
            if (game.board[r][c] !== 0) continue;
            if (isZoneRestricted(game, r, c, playerColor)) continue;
            candidates.push({ row: r, col: c });
        }
    }

    if (candidates.length === 0) {
        return { row, col, applied: false };
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return {
        row: pick.row,
        col: pick.col,
        applied: pick.row !== row || pick.col !== col
    };
}

/**
 * Validate whether the incoming move is legal.
 * @param {RoomState | null | undefined} room
 * @param {string} socketId
 * @param {number} row
 * @param {number} col
 * @returns {ValidationResult}
 */
function isValidMove(room, socketId, row, col) {
    if (!room || !room.game) {
        return { valid: false, reason: 'game_not_started' };
    }

    const game = room.game;
    if (!isValidPos(row, col)) {
        return { valid: false, reason: 'out_of_bounds' };
    }

    const currentPlayer = room.players[game.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socketId) {
        return { valid: false, reason: 'not_your_turn' };
    }

    const resolved = resolveChaosMove(game, row, col, game.currentTurn);
    if (!isValidPos(resolved.row, resolved.col)) {
        return { valid: false, reason: 'resolved_out_of_bounds' };
    }
    if (game.board[resolved.row][resolved.col] !== 0) {
        return { valid: false, reason: 'cell_occupied' };
    }
    if (isZoneRestricted(game, resolved.row, resolved.col, game.currentTurn)) {
        return { valid: false, reason: 'zone_restricted' };
    }

    return {
        valid: true,
        resolvedRow: resolved.row,
        resolvedCol: resolved.col,
        chaosApplied: resolved.applied
    };
}

/**
 * Apply a piece placement and append move history.
 * @param {RoomWithGame} room
 * @param {number} row
 * @param {number} col
 * @returns {number}
 */
function placePiece(room, row, col) {
    const game = room.game;
    const pieceValue = game.currentTurn === 'black' ? 1 : 2;

    game.board[row][col] = pieceValue;
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
 * Check whether a move creates a line.
 * @param {RoomWithGame} room
 * @param {number} row
 * @param {number} col
 * @returns {WinResult | null}
 */
function checkWin(room, row, col) {
    const game = room.game;
    const board = game.board;
    const piece = board[row][col];

    if (piece !== 1 && piece !== 2) return null;

    const directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 }
    ];

    const limit = (game.shortBattleTurns || 0) > 0 ? 4 : 5;

    for (const { dr, dc } of directions) {
        const line = [{ row, col }];

        let r = row + dr;
        let c = col + dc;
        while (isValidPos(r, c) && board[r][c] === piece) {
            line.push({ row: r, col: c });
            r += dr;
            c += dc;
        }

        r = row - dr;
        c = col - dc;
        while (isValidPos(r, c) && board[r][c] === piece) {
            line.unshift({ row: r, col: c });
            r -= dr;
            c -= dc;
        }

        if (line.length >= limit) {
            return {
                winner: piece === 1 ? 'black' : 'white',
                winLine: line.slice(0, limit)
            };
        }
    }

    return null;
}

/**
 * Tick turn-bound status and switch current turn.
 * @param {RoomWithGame} room
 * @returns {PlayerColor}
 */
function switchTurn(room) {
    const game = room.game;

    // 领地状态递减
    game.territoryZones = (game.territoryZones || [])
        .map((zone) => ({ ...zone, turnsLeft: (zone.turnsLeft || 0) - 1 }))
        .filter((zone) => (zone.turnsLeft || 0) > 0);

    // 短兵状态递减
    if ((game.shortBattleTurns || 0) > 0) {
        game.shortBattleTurns = Math.max(0, (game.shortBattleTurns || 0) - 1);
    }

    game.currentTurn = game.currentTurn === 'black' ? 'white' : 'black';
    game.turnStartedAt = Date.now();
    return game.currentTurn;
}

/**
 * Consume one chaos debuff stack for current player.
 * @param {RoomWithGame} room
 * @returns {number}
 */
function consumeChaosDebuff(room) {
    const game = room.game;
    const key = game.currentTurn;
    const debuff = game.chaosDebuff || { black: 0, white: 0 };
    const next = Math.max(0, (debuff[key] || 0) - 1);
    debuff[key] = next;
    game.chaosDebuff = debuff;
    return next;
}

/**
 * Undo one move.
 * @param {RoomWithGame} room
 * @returns {UndoResult}
 */
function executeUndo(room) {
    const game = room.game;

    if (game.moveHistory.length === 0) {
        return { success: false, reason: 'no_moves' };
    }

    const lastMove = game.moveHistory.pop();
    game.board[lastMove.row][lastMove.col] = 0;
    game.currentTurn = lastMove.player;
    game.turnStartedAt = Date.now();

    return {
        success: true,
        undoneMove: lastMove,
        currentTurn: game.currentTurn
    };
}

/**
 * Snapshot board state for reconnect flow.
 * @param {RoomState | null | undefined} room
 * @returns {BoardStateSnapshot | null}
 */
function getBoardState(room) {
    if (!room || !room.game) return null;

    const game = room.game;

    return {
        board: game.board.map((row) => [...row]),
        currentTurn: game.currentTurn,
        moveHistory: [...game.moveHistory],
        skillUsed: { ...game.skillUsed },
        undoUsed: { ...game.undoUsed },
        bombs: [...(game.bombs || [])],
        zones: [...(game.zones || [])],
        voodoo: [...(game.voodoo || [])],
        playerSkills: { ...(game.playerSkills || { black: null, white: null }) },
        chaosDebuff: { ...(game.chaosDebuff || { black: 0, white: 0 }) },
        shortBattleTurns: game.shortBattleTurns || 0,
        territoryZones: [...(game.territoryZones || [])],
        isDoubleMoveActive: !!game.isDoubleMoveActive,
        bombTarget: game.bombTarget || null,
        timeRemaining: {
            ...(game.timeRemaining || { black: 240, white: 240 })
        },
        turnStartedAt: game.turnStartedAt || Date.now()
    };
}

module.exports = {
    isValidMove,
    placePiece,
    checkWin,
    switchTurn,
    consumeChaosDebuff,
    executeUndo,
    getBoardState,
    isZoneRestricted
};
