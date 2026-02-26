const skillLogic = require('../skillLogic');

function createEmptyBoard(size = 15) {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

function createRoom() {
    return {
        players: {
            black: { id: 'black-socket', nickname: 'Black' },
            white: { id: 'white-socket', nickname: 'White' }
        },
        game: {
            board: createEmptyBoard(),
            currentTurn: 'black',
            skillUsed: { black: false, white: false },
            moveHistory: [],
            activeEffect: null,
            bombs: [],
            zones: [],
            voodoo: [],
            lastMoveTime: 0
        }
    };
}

describe('skillLogic', () => {
    it('rejects skill usage when not your turn', () => {
        const room = createRoom();
        const result = skillLogic.isValidSkill(room, 'white-socket', 'double', {
            pos1: { row: 7, col: 7 },
            pos2: { row: 7, col: 8 }
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('not_your_turn');
    });

    it('executes double skill and writes two pieces', () => {
        const room = createRoom();
        const result = skillLogic.executeSkill(room, 'double', {
            pos1: { row: 3, col: 3 },
            pos2: { row: 3, col: 4 }
        });

        expect(result.skillId).toBe('double');
        expect(room.game.board[3][3]).toBe(1);
        expect(room.game.board[3][4]).toBe(1);
        expect(room.game.skillUsed.black).toBe(true);
        expect(room.game.moveHistory).toHaveLength(2);
    });

    it('applies end-turn effects for voodoo and bomb', () => {
        const room = createRoom();
        room.game.board[6][6] = 2;
        room.game.board[8][8] = 5;
        room.game.board[8][9] = 1;
        room.game.voodoo.push({ row: 6, col: 6, turnsLeft: 1 });
        room.game.bombs.push({ row: 8, col: 8, turnsLeft: 1, player: 'black' });

        const effects = skillLogic.processTurnEndEffects(room);

        expect(effects.some((e) => e.type === 'voodoo_expire')).toBe(true);
        expect(effects.some((e) => e.type === 'bomb_explode')).toBe(true);
        expect(room.game.board[6][6]).toBe(0);
        expect(room.game.board[8][8]).toBe(0);
        expect(room.game.board[8][9]).toBe(0);
        expect(room.game.voodoo).toHaveLength(0);
        expect(room.game.bombs).toHaveLength(0);
    });
});
