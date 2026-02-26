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
 * @typedef {{ row: number, col: number, player: PlayerColor }} ZoneState
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
 * @typedef {{ valid: boolean, reason?: string }} ValidationResult
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
 *   voodoo: VoodooState[]
 * }} BoardStateSnapshot
 */

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
    const size = config.board.size;

    if (row < 0 || row >= size || col < 0 || col >= size) {
        return { valid: false, reason: 'out_of_bounds' };
    }

    if (game.board[row][col] !== 0) {
        return { valid: false, reason: 'cell_occupied' };
    }

    const currentPlayer = room.players[game.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socketId) {
        return { valid: false, reason: 'not_your_turn' };
    }

    return { valid: true };
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
 * Check whether a move creates a five-in-a-row.
 * @param {RoomWithGame} room
 * @param {number} row
 * @param {number} col
 * @returns {WinResult | null}
 */
function checkWin(room, row, col) {
    const game = room.game;
    const board = game.board;
    const piece = board[row][col];
    const size = config.board.size;

    if (piece === 0) return null;

    const directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 }
    ];

    for (const { dr, dc } of directions) {
        const line = [{ row, col }];

        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === piece) {
            line.push({ row: r, col: c });
            r += dr;
            c += dc;
        }

        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === piece) {
            line.unshift({ row: r, col: c });
            r -= dr;
            c -= dc;
        }

        if (line.length >= 5) {
            return {
                winner: piece === 1 ? 'black' : 'white',
                winLine: line.slice(0, 5)
            };
        }
    }

    return null;
}

/**
 * Switch current turn to the other side.
 * @param {RoomWithGame} room
 * @returns {PlayerColor}
 */
function switchTurn(room) {
    const game = room.game;
    game.currentTurn = game.currentTurn === 'black' ? 'white' : 'black';
    return game.currentTurn;
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
