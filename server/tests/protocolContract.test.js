const { validateClientPayload } = require('../protocol_contract');

describe('protocol_contract', () => {
    it('rejects invalid create_room payload', () => {
        const result = validateClientPayload('client:create_room', { nickname: '' });
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('invalid_nickname');
    });

    it('accepts valid join_room payload', () => {
        const result = validateClientPayload('client:join_room', {
            roomId: '1234',
            nickname: 'Rexon',
            pieceStyle: 'classic'
        });
        expect(result.valid).toBe(true);
    });

    it('rejects invalid place_piece payload', () => {
        const result = validateClientPayload('client:place_piece', {
            row: '7',
            col: 8
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('invalid_position');
    });

    it('keeps unknown events backward-compatible', () => {
        const result = validateClientPayload('client:unknown_event', { any: 'data' });
        expect(result.valid).toBe(true);
    });

    it('accepts lobby_join payload with null password for backward compatibility', () => {
        const result = validateClientPayload('client:lobby_join', {
            roomId: '1234',
            nickname: 'Guest',
            password: null
        });
        expect(result.valid).toBe(true);
    });

    it('still rejects lobby_join payload with non-string password', () => {
        const result = validateClientPayload('client:lobby_join', {
            roomId: '1234',
            nickname: 'Guest',
            password: 1234
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('invalid_password');
    });
});
