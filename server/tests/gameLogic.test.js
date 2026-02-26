const gameLogic = require('../gameLogic');

function createEmptyBoard(size = 15) {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

function createRoom() {
    return {
        players: {
            host: { id: 'host-socket' },
            guest: { id: 'guest-socket' },
            black: { id: 'host-socket', nickname: 'host' },
            white: { id: 'guest-socket', nickname: 'guest' }
        },
        game: {
            board: createEmptyBoard(),
            currentTurn: 'black',
            moveHistory: [],
            skillUsed: { black: false, white: false },
            undoUsed: { black: false, white: false },
            bombs: [],
            zones: [],
            voodoo: []
        }
    };
}

describe('gameLogic', () => {
    it('rejects out-of-bounds moves', () => {
        const room = createRoom();
        const result = gameLogic.isValidMove(room, 'host-socket', -1, 3);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('out_of_bounds');
    });

    it('rejects move when not your turn', () => {
        const room = createRoom();
        const result = gameLogic.isValidMove(room, 'guest-socket', 7, 7);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('not_your_turn');
    });

    it('detects horizontal five-in-a-row', () => {
        const room = createRoom();
        for (let col = 2; col <= 6; col++) {
            room.game.board[4][col] = 1;
        }
        const result = gameLogic.checkWin(room, 4, 4);
        expect(result).not.toBeNull();
        expect(result.winner).toBe('black');
        expect(result.winLine).toHaveLength(5);
    });

    it('undoes the last move and restores turn', () => {
        const room = createRoom();
        gameLogic.placePiece(room, 5, 5);
        gameLogic.switchTurn(room);
        const undo = gameLogic.executeUndo(room);

        expect(undo.success).toBe(true);
        expect(room.game.board[5][5]).toBe(0);
        expect(room.game.currentTurn).toBe('black');
    });
});
