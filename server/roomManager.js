// ============================================
// Project Lysh Server - Room Manager
// ============================================

const config = require('./config');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    
    // ========== 房间号生成 ==========
    
    /**
     * 生成 6 位纯数字房间号
     */
    generateRoomId() {
        let id;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            // 生成 100000 ~ 999999 的随机数
            id = String(Math.floor(100000 + Math.random() * 900000));
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw new Error('Failed to generate unique room ID');
            }
        } while (this.rooms.has(id));
        
        return id;
    }
    
    // ========== 房间操作 ==========
    
    /**
     * 创建房间
     * @param {string} hostSocketId - 房主的 Socket ID
     * @param {string} nickname - 房主昵称
     * @param {string} pieceStyle - 房主棋子样式
     * @param {string} matchMode - 对战模式 'single' | 'bo3'
     */
    createRoom(hostSocketId, nickname, pieceStyle = 'classic', matchMode = 'single') {
        const roomId = this.generateRoomId();
        
        const room = {
            id: roomId,
            status: 'waiting',  // waiting -> rps -> choosing_side -> playing -> finished
            
            players: {
                host: {
                    id: hostSocketId,
                    nickname: nickname || 'Player 1',
                    connected: true,
                    disconnectTime: null,
                    pieceStyle: pieceStyle
                },
                guest: null,
                black: null,  // 游戏开始后指向 host 或 guest
                white: null
            },
            
            // 猜拳系统
            rps: {
                hostChoice: null,
                guestChoice: null,
                winner: null,
                round: 1
            },
            
            // 游戏状态（开始后初始化）
            game: null,
            
            // BO3 模式
            match: {
                mode: matchMode,
                scores: { host: 0, guest: 0 },
                currentGame: 1
            },
            
            createdAt: Date.now(),
            settings: {
                timeLimit: 0,        // 每步时限（秒），0=无限
                skillsEnabled: true  // 是否启用技能
            }
        };
        
        this.rooms.set(roomId, room);
        console.log(`[Room] Created: ${roomId} by ${nickname}`);
        
        return room;
    }
    
    /**
     * 加入房间
     * @param {string} roomId - 房间号
     * @param {string} socketId - 加入者的 Socket ID
     * @param {string} nickname - 加入者昵称
     * @param {string} pieceStyle - 加入者棋子样式
     */
    joinRoom(roomId, socketId, nickname, pieceStyle = 'classic') {
        const room = this.rooms.get(roomId);
        
        if (!room) {
            return { success: false, reason: 'room_not_found' };
        }
        
        if (room.status !== 'waiting') {
            return { success: false, reason: 'room_not_available' };
        }
        
        if (room.players.guest !== null) {
            return { success: false, reason: 'room_full' };
        }
        
        // 加入房间
        room.players.guest = {
            id: socketId,
            nickname: nickname || 'Player 2',
            connected: true,
            disconnectTime: null,
            pieceStyle: pieceStyle
        };
        
        // 进入猜拳阶段
        room.status = 'rps';
        
        console.log(`[Room] ${roomId}: ${nickname} joined`);
        
        return { success: true, room };
    }
    
    /**
     * 离开房间
     * @param {string} socketId - 离开者的 Socket ID
     */
    leaveRoom(socketId) {
        for (const [roomId, room] of this.rooms) {
            // 检查是否是房主
            if (room.players.host && room.players.host.id === socketId) {
                console.log(`[Room] ${roomId}: Host left`);
                this.rooms.delete(roomId);
                return { roomId, role: 'host', room };
            }
            
            // 检查是否是加入者
            if (room.players.guest && room.players.guest.id === socketId) {
                console.log(`[Room] ${roomId}: Guest left`);
                
                // 如果游戏还没开始，只移除 guest
                if (room.status === 'waiting' || room.status === 'rps') {
                    room.players.guest = null;
                    room.status = 'waiting';
                    room.rps = { hostChoice: null, guestChoice: null, winner: null, round: 1 };
                    return { roomId, role: 'guest', room, gameInProgress: false };
                }
                
                // 游戏进行中，标记断线
                room.players.guest.connected = false;
                room.players.guest.disconnectTime = Date.now();
                return { roomId, role: 'guest', room, gameInProgress: true };
            }
        }
        
        return null;
    }
    
    /**
     * 获取房间
     * @param {string} roomId - 房间号
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    
    /**
     * 通过 Socket ID 查找房间
     * @param {string} socketId - Socket ID
     */
    getRoomBySocketId(socketId) {
        for (const [roomId, room] of this.rooms) {
            if (room.players.host && room.players.host.id === socketId) {
                return { room, role: 'host' };
            }
            if (room.players.guest && room.players.guest.id === socketId) {
                return { room, role: 'guest' };
            }
        }
        return null;
    }
    
    /**
     * 删除房间
     * @param {string} roomId - 房间号
     */
    deleteRoom(roomId) {
        const deleted = this.rooms.delete(roomId);
        if (deleted) {
            console.log(`[Room] Deleted: ${roomId}`);
        }
        return deleted;
    }
    
    // ========== 游戏状态 ==========
    
    /**
     * 初始化游戏状态
     * @param {string} roomId - 房间号
     */
    initGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        const size = config.board.size;
        
        room.game = {
            board: Array(size).fill(null).map(() => Array(size).fill(0)),
            currentTurn: 'black',
            moveHistory: [],
            startTime: Date.now(),
            lastMoveTime: Date.now(),
            
            // 技能状态
            skillUsed: { black: false, white: false },
            bombs: [],      // 时间炸弹
            zones: [],      // 领地
            voodoo: [],     // 巫毒腐蚀
            activeEffect: null,
            
            // 悔棋状态
            undoUsed: { black: false, white: false },
            undoPending: null
        };
        
        room.status = 'playing';
        
        console.log(`[Room] ${roomId}: Game started`);
        
        return room.game;
    }
    
    /**
     * 重置游戏（再来一局）
     * @param {string} roomId - 房间号
     */
    resetGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        // 重置猜拳
        room.rps = {
            hostChoice: null,
            guestChoice: null,
            winner: null,
            round: 1
        };
        
        // 清除黑白分配
        room.players.black = null;
        room.players.white = null;
        
        // 清除游戏状态
        room.game = null;
        
        // 回到猜拳阶段
        room.status = 'rps';
        
        console.log(`[Room] ${roomId}: Game reset`);
        
        return room;
    }
    
    // ========== 清理 ==========
    
    /**
     * 清理过期房间
     */
    cleanupRooms() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [roomId, room] of this.rooms) {
            let shouldDelete = false;
            
            // 等待状态超时
            if (room.status === 'waiting') {
                if (now - room.createdAt > config.room.maxWaitTime) {
                    shouldDelete = true;
                }
            }
            
            // 结束状态超时
            if (room.status === 'finished') {
                const lastActivity = room.game ? room.game.lastMoveTime : room.createdAt;
                if (now - lastActivity > config.room.maxIdleTime) {
                    shouldDelete = true;
                }
            }
            
            if (shouldDelete) {
                this.rooms.delete(roomId);
                cleaned++;
            }
        }
        
        return cleaned;
    }
    
    // ========== 统计 ==========
    
    /**
     * 获取房间数量
     */
    getRoomCount() {
        return this.rooms.size;
    }
    
    /**
     * 获取房间列表（调试用）
     */
    getRoomList() {
        const list = [];
        for (const [roomId, room] of this.rooms) {
            list.push({
                id: roomId,
                status: room.status,
                host: room.players.host ? room.players.host.nickname : null,
                guest: room.players.guest ? room.players.guest.nickname : null,
                createdAt: room.createdAt
            });
        }
        return list;
    }
}

module.exports = RoomManager;
