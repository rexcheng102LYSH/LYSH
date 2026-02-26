const rpsLogic = require('../rpsLogic');

function createRoom() {
    return {
        status: 'rps',
        rps: {
            hostChoice: null,
            guestChoice: null,
            winner: null,
            round: 1
        },
        players: {
            host: { id: 'host', nickname: 'Host' },
            guest: { id: 'guest', nickname: 'Guest' },
            black: null,
            white: null
        }
    };
}

describe('rpsLogic', () => {
    it('rejects invalid choice', () => {
        const room = createRoom();
        const result = rpsLogic.submitChoice(room, 'host', 'invalid');
        expect(result.success).toBe(false);
        expect(result.reason).toBe('invalid_choice');
    });

    it('resets round after tie', () => {
        const room = createRoom();
        rpsLogic.submitChoice(room, 'host', 'rock');
        rpsLogic.submitChoice(room, 'guest', 'rock');
        const result = rpsLogic.determineWinner(room);

        expect(result.result).toBe('tie');
        const nextRound = rpsLogic.resetRPS(room);
        expect(nextRound).toBe(2);
        expect(room.rps.hostChoice).toBeNull();
        expect(room.rps.guestChoice).toBeNull();
    });

    it('assigns black/white after winner side choice', () => {
        const room = createRoom();
        rpsLogic.submitChoice(room, 'host', 'rock');
        rpsLogic.submitChoice(room, 'guest', 'scissors');
        const decided = rpsLogic.determineWinner(room);
        expect(decided.winner).toBe('host');

        const side = rpsLogic.submitSideChoice(room, 'black');
        expect(side.success).toBe(true);
        expect(room.players.black.nickname).toBe('Host');
        expect(room.players.white.nickname).toBe('Guest');
        expect(room.status).toBe('playing');
    });
});
