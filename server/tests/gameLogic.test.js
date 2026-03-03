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
            historyStack: [],
            skillUsed: { black: false, white: false },
            undoUsed: { black: false, white: false },
            playerSkills: { black: null, white: null },
            chaosDebuff: { black: 0, white: 0 },
            shortBattleTurns: 0,
            territoryZones: [],
            isDoubleMoveActive: false,
            bombTarget: null,
            timeRemaining: { black: 240, white: 240 },
            turnStartedAt: Date.now(),
            lastMoveTime: Date.now(),
            bombs: [],
            zones: [],
            voodoo: [],
            effectData: {},
            activeEffect: null,
            undoPending: null
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

    it('restores full snapshot state when undo uses history stack', () => {
        const room = createRoom();
        room.game.playerSkills = { black: 'bomb', white: 'chaos' };
        room.game.shortBattleTurns = 3;
        room.game.territoryZones = [{ row: 7, col: 7, player: 'black', turnsLeft: 2 }];
        room.game.isDoubleMoveActive = true;
        room.game.bombTarget = 'white';
        room.game.timeRemaining = { black: 120, white: 90 };
        room.game.turnStartedAt = Date.now() - 5000;
        room.game.lastMoveTime = Date.now() - 1000;

        gameLogic.pushHistorySnapshot(room);

        room.game.board[1][1] = 1;
        room.game.moveHistory.push({ row: 1, col: 1, player: 'black', time: Date.now() });
        room.game.currentTurn = 'white';
        room.game.skillUsed.black = true;
        room.game.chaosDebuff.white = 2;
        room.game.shortBattleTurns = 0;
        room.game.territoryZones = [];
        room.game.isDoubleMoveActive = false;
        room.game.bombTarget = null;
        room.game.timeRemaining.white = 12;

        const undo = gameLogic.executeUndo(room);

        expect(undo.success).toBe(true);
        expect(undo.boardState).toBeTruthy();
        expect(room.game.board[1][1]).toBe(0);
        expect(room.game.currentTurn).toBe('black');
        expect(room.game.moveHistory).toHaveLength(0);
        expect(room.game.skillUsed.black).toBe(false);
        expect(room.game.chaosDebuff.white).toBe(0);
        expect(room.game.shortBattleTurns).toBe(3);
        expect(room.game.territoryZones).toHaveLength(1);
        expect(room.game.isDoubleMoveActive).toBe(true);
        expect(room.game.bombTarget).toBe('white');
        expect(room.game.timeRemaining.white).toBe(90);
    });
});
