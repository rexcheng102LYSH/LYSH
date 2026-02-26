const RoomManager = require('../roomManager');

describe('roomManager', () => {
    it('creates lobby room with expected defaults', () => {
        const manager = new RoomManager();
        const room = manager.createLobbyRoom('host-1', 'HostPlayer');

        expect(room.id).toHaveLength(4);
        expect(room.status).toBe('waiting');
        expect(room.isLobbyRoom).toBe(true);
        expect(room.match.mode).toBe('single');
        expect(room.settings.enabledSkills).toEqual([]);
        expect(room.settings.hasPassword).toBe(false);
    });

    it('joins lobby room with password validation', () => {
        const manager = new RoomManager();
        const room = manager.createLobbyRoom('host-1', 'HostPlayer', {
            rule: 'bo3',
            enabledSkills: ['double', 'bomb'],
            hasPassword: true,
            password: '1234'
        });

        const wrong = manager.joinLobbyRoom(room.id, 'guest-1', 'GuestPlayer', '0000');
        expect(wrong.success).toBe(false);

        const ok = manager.joinLobbyRoom(room.id, 'guest-1', 'GuestPlayer', '1234');
        expect(ok.success).toBe(true);
        expect(ok.room.status).toBe('rps');
        expect(ok.room.players.guest.nickname).toBe('GuestPlayer');
    });

    it('returns only waiting lobby rooms in list', () => {
        const manager = new RoomManager();
        const waitingRoom = manager.createLobbyRoom('host-1', 'HostA');
        const activeRoom = manager.createLobbyRoom('host-2', 'HostB');
        manager.joinLobbyRoom(activeRoom.id, 'guest-2', 'GuestB');

        const list = manager.getLobbyRooms();
        expect(list.some((item) => item.roomId === waitingRoom.id)).toBe(true);
        expect(list.some((item) => item.roomId === activeRoom.id)).toBe(false);
    });

    it('finds room by socket id for host and guest', () => {
        const manager = new RoomManager();
        const room = manager.createLobbyRoom('host-1', 'HostA');
        manager.joinLobbyRoom(room.id, 'guest-1', 'GuestA');

        const hostFound = manager.getRoomBySocketId('host-1');
        const guestFound = manager.getRoomBySocketId('guest-1');

        expect(hostFound).not.toBeNull();
        expect(guestFound).not.toBeNull();
        expect(hostFound.role).toBe('host');
        expect(guestFound.role).toBe('guest');
    });

    it('removes room when host leaves', () => {
        const manager = new RoomManager();
        const room = manager.createLobbyRoom('host-1', 'HostA');

        const leave = manager.leaveRoom('host-1');

        expect(leave.role).toBe('host');
        expect(manager.getRoom(room.id)).toBeUndefined();
    });
});
