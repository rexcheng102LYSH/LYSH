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
            playerSkills: { black: 'double', white: 'bomb' },
            chaosDebuff: { black: 0, white: 0 },
            shortBattleTurns: 0,
            territoryZones: [],
            isDoubleMoveActive: false,
            bombTarget: null,
            timeRemaining: { black: 240, white: 240 },
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

    it('executes double skill and enables double-move state', () => {
        const room = createRoom();
        const result = skillLogic.executeSkill(room, 'double', {});

        expect(result.skillId).toBe('double');
        expect(room.game.isDoubleMoveActive).toBe(true);
        expect(room.game.skillUsed.black).toBe(true);
        expect(result.switchTurn).toBe(false);
    });

    it('applies bomb skill by reducing opponent time', () => {
        const room = createRoom();
        room.game.currentTurn = 'white';
        room.game.playerSkills.white = 'bomb';
        const result = skillLogic.executeSkill(room, 'bomb', {});
        expect(result.specialEffect.type).toBe('bomb_activated');
        expect(room.game.timeRemaining.black).toBe(90);
        expect(room.game.bombTarget).toBe('black');
    });
});
