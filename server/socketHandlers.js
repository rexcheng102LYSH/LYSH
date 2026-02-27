// ============================================
// Project Lysh Server - Socket Event Handlers
// ============================================

const config = require('./config');
const gameLogic = require('./gameLogic');
const rpsLogic = require('./rpsLogic');
const skillLogic = require('./skillLogic');
const { validateClientPayload } = require('./protocol_contract');

/**
 * @typedef {{ __traceId?: string, __clientTs?: number }} TracePayload
 * @typedef {'double'|'voodoo'|'move_self'|'move_enemy'|'zone'|'bomb'|'god_hand'|'chaos'|'short_battle'|'swap'} KnownSkillId
 * @typedef {{ row: number, col: number }} SkillPos
 * @typedef {{ pos1: SkillPos, pos2: SkillPos }} DoubleSkillTargets
 * @typedef {{ pos: SkillPos }} SingleSkillTargets
 * @typedef {{ from: SkillPos, to: SkillPos }} MoveSkillTargets
 * @typedef {{ own: SkillPos, opponent: SkillPos }} SwapSkillTargets
 * @typedef {DoubleSkillTargets | SingleSkillTargets | MoveSkillTargets | SwapSkillTargets | Record<string, unknown>} SkillTargets
 * @typedef {{ nickname: string, pieceStyle?: string, matchMode?: 'single'|'bo3'|string } & TracePayload} CreateRoomPayload
 * @typedef {{ roomId: string, nickname: string, pieceStyle?: string } & TracePayload} JoinRoomPayload
 * @typedef {{ choice: 'rock'|'paper'|'scissors' } & TracePayload} RpsChoicePayload
 * @typedef {{ side: 'black'|'white' } & TracePayload} SideChoicePayload
 * @typedef {{ row: number, col: number } & TracePayload} PlacePiecePayload
 * @typedef {{ skillId: KnownSkillId | string, targets?: SkillTargets } & TracePayload} UseSkillPayload
 * @typedef {{ skillId: KnownSkillId | string } & TracePayload} DraftPickPayload
 * @typedef {{ accept: boolean } & TracePayload} RespondUndoPayload
 * @typedef {{ nickname: string, rule?: 'single'|'bo3'|string, enabledSkills?: string[], hasPassword?: boolean, password?: string } & TracePayload} LobbyCreatePayload
 * @typedef {{ roomId: string, nickname: string, password?: string } & TracePayload} LobbyJoinPayload
 * @typedef {{ roomId: string, oldSocketId: string } & TracePayload} ReconnectPayload
 * @typedef {{ roomId: string, playerId: string, role: 'host'|'guest' }} RoomCreatedPayload
 * @typedef {{ roomId: string, playerId: string, role: 'guest', opponent: { nickname: string, pieceStyle?: string } }} JoinSuccessPayload
 * @typedef {{ nickname: string, pieceStyle?: string, playerId: string }} PlayerJoinedPayload
 * @typedef {{ timeout: number, round: number }} RpsStartPayload
 * @typedef {{ row: number, col: number, player: 'black'|'white', pieceValue: number, nextTurn?: 'black'|'white' }} PiecePlacedPayload
 * @typedef {{ winner: 'black'|'white', winLine?: {row:number, col:number}[], reason: string }} GameOverPayload
 * @typedef {{ effects: unknown[] }} SkillEffectPayload
 * @typedef {{ player: 'black'|'white', skillId: string, targets?: SkillTargets, changes: unknown[], specialEffect: unknown, skillUsed: Record<string, boolean> }} SkillUsedPayload
 * @typedef {{ currentTurn: 'black'|'white' }} TurnChangedPayload
 * @typedef {{ roomId: string, role: string, boardState: unknown, status: string, match?: unknown, myColor?: 'black'|'white'|null, opponent?: { nickname?: string, pieceStyle?: string } }} ReconnectSuccessPayload
 * @typedef {{ blackPlayer: string, whitePlayer: string }} GameStartPayload
 * @typedef {{ blackPlayer: string, whitePlayer: string, blackSocketId: string, whiteSocketId: string }} SidesDecidedPayload
 */

/**
 * @param {TracePayload | null | undefined} data
 * @returns {string | null}
 */
function extractTraceId(data) {
    return data && typeof data.__traceId === 'string' ? data.__traceId : null;
}

/**
 * @param {'warn'|'error'|'info'} level
 * @param {string} eventName
 * @param {{id?: string}|null|undefined} socket
 * @param {string} message
 * @param {Record<string, unknown> | null | undefined} extra
 */
function logSocketEvent(level, eventName, socket, message, extra) {
    const record = {
        at: new Date().toISOString(),
        level,
        layer: 'socket',
        event: eventName,
        socketId: socket && socket.id ? socket.id : null,
        message,
        extra: extra || null
    };
    const line = `[SocketDiag] ${JSON.stringify(record)}`;
    if (level === 'error') {
        console.error(line);
    } else {
        console.log(line);
    }
}

/**
 * @param {{ id?: string, emit: (eventName: string, payload: Record<string, unknown>) => void }} socket
 * @param {string} eventName
 * @param {TracePayload | undefined} data
 * @returns {boolean}
 */
function validateIncoming(socket, eventName, data) {
    const validation = validateClientPayload(eventName, data);
    if (!validation.valid) {
        const traceId = extractTraceId(data);
        logSocketEvent('warn', eventName, socket, 'invalid_payload', {
            reason: validation.reason || 'invalid_payload',
            traceId
        });
        socket.emit('server:error', {
            action: eventName,
            message: validation.reason || 'invalid_payload',
            traceId
        });
        return false;
    }
    return true;
}

const DEFAULT_SKILLS = Object.freeze([
    'double', 'voodoo', 'move_self', 'move_enemy', 'zone',
    'bomb', 'god_hand', 'chaos', 'short_battle', 'swap'
]);
const DRAFT_PICK_TIMEOUT_MS = 10000;

/**
 * @param {import('./roomManager')} roomManager
 * @param {string} roomId
 * @returns {string[]}
 */
function resolveDraftSkillPool(roomManager, roomId) {
    const room = roomManager.getRoom(roomId);
    if (!room) return [...DEFAULT_SKILLS];
    const configured = room.settings && Array.isArray(room.settings.enabledSkills)
        ? room.settings.enabledSkills.filter(Boolean)
        : [];
    if (configured.length >= 2) return configured;
    return [...DEFAULT_SKILLS];
}

/**
 * @param {import('socket.io').Server} io
 * @param {any} room
 */
function emitTimerSync(io, room) {
    if (!room || !room.game) return;
    io.to(room.id).emit('room:timer_sync', {
        timeRemaining: room.game.timeRemaining,
        currentTurn: room.game.currentTurn,
        ts: Date.now()
    });
}

/**
 * @param {any} room
 */
function stopRoomTimer(room) {
    if (!room || !room.game || !room.game.timerId) return;
    clearInterval(room.game.timerId);
    room.game.timerId = null;
    room.game.timerRunning = false;
}

/**
 * @param {import('socket.io').Server} io
 * @param {any} room
 * @param {(room:any, winnerColor:'black'|'white', reason:string, winLine?:Array<{row:number,col:number}>)=>void} onGameOver
 */
function startRoomTimer(io, room, onGameOver) {
    if (!room || !room.game) return;
    stopRoomTimer(room);
    room.game.timerRunning = true;
    room.game.turnStartedAt = Date.now();
    room.game.timerId = setInterval(() => {
        if (!room.game || room.status !== 'playing') {
            stopRoomTimer(room);
            return;
        }
        const turn = room.game.currentTurn;
        room.game.timeRemaining[turn] = Math.max(0, (room.game.timeRemaining[turn] || 0) - 1);
        room.game.lastMoveTime = Date.now();
        emitTimerSync(io, room);
        if (room.game.timeRemaining[turn] <= 0) {
            const winner = turn === 'black' ? 'white' : 'black';
            io.to(room.id).emit('room:time_out', { loser: turn, winner });
            onGameOver(room, winner, 'timeout');
        }
    }, 1000);
}

/**
 * @param {any} room
 * @returns {Record<string, unknown>}
 */
function buildStateDelta(room) {
    if (!room || !room.game) return {};
    return {
        currentTurn: room.game.currentTurn,
        skillUsed: room.game.skillUsed,
        playerSkills: room.game.playerSkills,
        chaosDebuff: room.game.chaosDebuff,
        shortBattleTurns: room.game.shortBattleTurns,
        territoryZones: room.game.territoryZones,
        isDoubleMoveActive: !!room.game.isDoubleMoveActive,
        bombTarget: room.game.bombTarget,
        timeRemaining: room.game.timeRemaining
    };
}

/**
 * @param {any} room
 */
function clearDraftPickTimer(room) {
    if (!room || !room.draft || !room.draft.timerId) return;
    clearTimeout(room.draft.timerId);
    room.draft.timerId = null;
}

/**
 * @param {any} room
 * @returns {string}
 */
function resolveDefaultDraftSkill(room) {
    const pool = room && room.draft && Array.isArray(room.draft.availableSkills)
        ? room.draft.availableSkills
        : [...DEFAULT_SKILLS];
    const used = new Set(Object.values((room && room.draft && room.draft.picks) || {}).filter(Boolean));
    const remain = pool.filter((sid) => !used.has(sid));
    return remain[0] || DEFAULT_SKILLS.find((sid) => !used.has(sid)) || DEFAULT_SKILLS[0];
}

/**
 * @param {import('socket.io').Server} io
 * @param {any} room
 */
function emitDraftUpdate(io, room) {
    if (!room || !room.draft) return;
    const elapsed = Date.now() - (room.draft.startedAt || Date.now());
    const timeoutMs = Number(room.draft.timeoutMs || DRAFT_PICK_TIMEOUT_MS);
    const remainMs = room.draft.currentPicker
        ? Math.max(0, timeoutMs - elapsed)
        : 0;
    io.to(room.id).emit('room:draft_update', {
        picked: { ...room.draft.picks },
        currentPicker: room.draft.currentPicker || null,
        remainMs
    });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('./roomManager')} roomManager
 * @param {any} room
 * @param {(room:any, winnerColor:'black'|'white', reason:string, winLine?:Array<{row:number,col:number}>)=>void} onGameOver
 */
function startGameFromDraft(io, roomManager, room, onGameOver) {
    if (!room || room.status !== 'drafting' || !room.draft) return;
    clearDraftPickTimer(room);

    const blackPlayer = room.players.black ? room.players.black.nickname : 'Black';
    const whitePlayer = room.players.white ? room.players.white.nickname : 'White';
    roomManager.initGame(room.id);

    const latest = roomManager.getRoom(room.id);
    if (!latest || !latest.game) return;

    io.to(latest.id).emit('room:draft_complete', {
        playerSkills: latest.game.playerSkills
    });
    io.to(latest.id).emit('room:game_start', {
        blackPlayer,
        whitePlayer,
        playerSkills: latest.game.playerSkills,
        timeRemaining: latest.game.timeRemaining,
        match: latest.match || null
    });
    emitTimerSync(io, latest);
    startRoomTimer(io, latest, onGameOver);
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('./roomManager')} roomManager
 * @param {string} roomId
 * @param {(room:any, winnerColor:'black'|'white', reason:string, winLine?:Array<{row:number,col:number}>)=>void} onGameOver
 */
function setupDraftTurnTimeout(io, roomManager, roomId, onGameOver) {
    const room = roomManager.getRoom(roomId);
    if (!room || room.status !== 'drafting' || !room.draft) return;

    clearDraftPickTimer(room);
    room.draft.startedAt = Date.now();

    const timeoutMs = Number(room.draft.timeoutMs || DRAFT_PICK_TIMEOUT_MS);
    room.draft.timerId = setTimeout(() => {
        const latest = roomManager.getRoom(roomId);
        if (!latest || latest.status !== 'drafting' || !latest.draft) return;

        const picker = latest.draft.currentPicker;
        if (!picker) return;

        if (!latest.draft.picks[picker]) {
            latest.draft.picks[picker] = resolveDefaultDraftSkill(latest);
        }

        if (latest.draft.picks.black && latest.draft.picks.white) {
            latest.draft.currentPicker = null;
            emitDraftUpdate(io, latest);
            startGameFromDraft(io, roomManager, latest, onGameOver);
            return;
        }

        latest.draft.currentPicker = picker === 'white' ? 'black' : 'white';
        latest.draft.startedAt = Date.now();
        emitDraftUpdate(io, latest);
        setupDraftTurnTimeout(io, roomManager, latest.id, onGameOver);
    }, timeoutMs);
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('./roomManager')} roomManager
 * @param {string} roomId
 * @param {(room:any, winnerColor:'black'|'white', reason:string, winLine?:Array<{row:number,col:number}>)=>void} onGameOver
 */
function startDraftPhase(io, roomManager, roomId, onGameOver) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const skillPool = resolveDraftSkillPool(roomManager, roomId);
    room.status = 'drafting';
    room.draft = {
        availableSkills: skillPool,
        picks: { black: null, white: null },
        currentPicker: 'white',
        startedAt: Date.now(),
        timeoutMs: DRAFT_PICK_TIMEOUT_MS,
        timerId: null
    };

    io.to(room.id).emit('room:draft_start', {
        firstPicker: room.draft.currentPicker,
        availableSkills: skillPool,
        timeoutMs: room.draft.timeoutMs
    });
    emitDraftUpdate(io, room);
    setupDraftTurnTimeout(io, roomManager, room.id, onGameOver);
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('./roomManager')} roomManager
 */
function setupSocketHandlers(io, roomManager) {
    /**
     * @param {any} room
     * @param {'black'|'white'} winnerColor
     * @param {string} reason
     * @param {Array<{row:number,col:number}>=} winLine
     */
    function finalizeGame(room, winnerColor, reason, winLine) {
        if (!room || !room.game) return;
        stopRoomTimer(room);
        room.status = 'finished';

        let matchPayload = null;
        if (room.match && room.match.mode === 'bo3') {
            const hostIsBlack = !!(room.players.black && room.players.host && room.players.black.id === room.players.host.id);
            const winnerRole = hostIsBlack
                ? (winnerColor === 'black' ? 'host' : 'guest')
                : (winnerColor === 'black' ? 'guest' : 'host');
            const loserRole = winnerRole === 'host' ? 'guest' : 'host';
            room.match.scores[winnerRole] = (room.match.scores[winnerRole] || 0) + 1;
            room.match.currentGame = (room.match.currentGame || 1) + 1;
            const hostScore = room.match.scores.host || 0;
            const guestScore = room.match.scores.guest || 0;
            const isOver = hostScore >= 2 || guestScore >= 2;
            matchPayload = {
                mode: room.match.mode,
                scores: { ...room.match.scores },
                currentGame: room.match.currentGame,
                over: isOver
            };
            if (isOver) {
                io.to(room.id).emit('room:match_over', {
                    winner: hostScore >= 2 ? 'host' : 'guest',
                    winnerColor,
                    scores: { ...room.match.scores }
                });
            } else {
                // BO3 未结束：由本局败者获得下一局选边权
                setTimeout(() => {
                    const latest = roomManager.getRoom(room.id);
                    if (!latest || latest.status !== 'finished') return;
                    latest.status = 'choosing_side';
                    latest.rps = latest.rps || { hostChoice: null, guestChoice: null, winner: null, round: 1 };
                    latest.rps.winner = loserRole;
                    const chooserSocketId = latest.players[loserRole] ? latest.players[loserRole].id : null;
                    if (chooserSocketId) {
                        io.to(chooserSocketId).emit('room:choose_side', {
                            timeout: config.rps.sideChoiceTimeout,
                            reason: 'bo3_next_round'
                        });
                        setupSideChoiceTimeout(io, roomManager, latest.id, chooserSocketId, finalizeGame);
                    }
                }, 1500);
            }
        }

        /** @type {GameOverPayload & Record<string, unknown>} */
        const payload = {
            winner: winnerColor,
            reason
        };
        if (winLine) payload.winLine = winLine;
        if (matchPayload) payload.match = matchPayload;
        payload.state = buildStateDelta(room);
        io.to(room.id).emit('room:game_over', payload);
    }

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);
        
        // ========== 房间管理 ==========
        
        // 创建房间
        socket.on('client:create_room', (data) => {
            /** @type {CreateRoomPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:create_room', payload)) return;
            const { nickname, pieceStyle, matchMode } = payload;
            const traceId = extractTraceId(payload);
            
            try {
                const room = roomManager.createRoom(
                    socket.id,
                    nickname,
                    pieceStyle || 'classic',
                    matchMode || 'single'
                );
                
                // 加入 Socket.IO 房间
                socket.join(room.id);
                
                /** @type {RoomCreatedPayload} */
                const roomCreatedPayload = {
                    roomId: room.id,
                    playerId: socket.id,
                    role: 'host'
                };
                socket.emit('server:room_created', roomCreatedPayload);
                
            } catch (error) {
                logSocketEvent('error', 'client:create_room', socket, 'create_room_failed', {
                    traceId,
                    error: error && error.message ? error.message : String(error)
                });
                socket.emit('server:error', {
                    action: 'create_room',
                    message: error.message,
                    traceId
                });
            }
        });
        
        // 加入房间
        socket.on('client:join_room', (data) => {
            /** @type {JoinRoomPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:join_room', payload)) return;
            const { roomId, nickname, pieceStyle } = payload;
            
            const result = roomManager.joinRoom(
                roomId,
                socket.id,
                nickname,
                pieceStyle || 'classic'
            );
            
            if (!result.success) {
                socket.emit('server:join_failed', {
                    reason: ('reason' in result) ? result.reason : 'join_failed'
                });
                return;
            }
            
            const room = result.room;
            
            // 加入 Socket.IO 房间
            socket.join(roomId);
            
            // 通知加入者
            /** @type {JoinSuccessPayload} */
            const joinSuccessPayload = {
                roomId: room.id,
                playerId: socket.id,
                role: 'guest',
                opponent: {
                    nickname: room.players.host.nickname,
                    pieceStyle: room.players.host.pieceStyle
                }
            };
            socket.emit('server:join_success', joinSuccessPayload);
            
            // 通知房主
            /** @type {PlayerJoinedPayload} */
            const playerJoinedPayload = {
                nickname: room.players.guest.nickname,
                pieceStyle: room.players.guest.pieceStyle,
                playerId: socket.id
            };
            socket.to(roomId).emit('room:player_joined', playerJoinedPayload);
            
            // 开始猜拳
            /** @type {RpsStartPayload} */
            const rpsStartPayload = {
                timeout: config.rps.timeout,
                round: 1
            };
            io.to(roomId).emit('room:rps_start', rpsStartPayload);
            
            // 设置猜拳超时
            setupRPSTimeout(io, roomManager, roomId, finalizeGame);
        });
        
        // ========== 猜拳系统 ==========
        
        // 提交猜拳选择
        socket.on('client:rps_choice', (data) => {
            /** @type {RpsChoicePayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:rps_choice', payload)) return;
            const { choice } = payload;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) {
                socket.emit('server:error', { message: 'room_not_found' });
                return;
            }
            
            const { room, role } = found;
            
            if (room.status !== 'rps') {
                socket.emit('server:error', { message: 'not_in_rps_phase' });
                return;
            }
            
            const result = rpsLogic.submitChoice(room, role, choice);
            if (!result.success) {
                socket.emit('server:error', { message: result.reason });
                return;
            }
            
            // 通知对方已选择（不透露具体选项）
            socket.to(room.id).emit('room:opponent_chose', {});
            
            // 检查是否双方都已选择
            if (rpsLogic.bothChosen(room)) {
                handleRPSResult(io, roomManager, room, finalizeGame);
            }
        });
        
        // 提交选边
        socket.on('client:side_choice', (data) => {
            /** @type {SideChoicePayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:side_choice', payload)) return;
            const { side } = payload;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room, role } = found;

            if (room.status !== 'choosing_side') {
                socket.emit('server:error', { message: 'not_in_side_choice_phase' });
                return;
            }
            
            // 验证是否是猜拳胜者
            if (room.rps.winner !== role) {
                socket.emit('server:error', { message: 'not_rps_winner' });
                return;
            }
            
            const result = rpsLogic.submitSideChoice(room, side);
            if (!result.success) {
                socket.emit('server:error', { message: result.reason });
                return;
            }
            
            // 广播选边结果
            /** @type {SidesDecidedPayload} */
            const sidesDecidedPayload = {
                blackPlayer: result.blackPlayer,
                whitePlayer: result.whitePlayer,
                blackSocketId: result.blackSocketId,
                whiteSocketId: result.whiteSocketId
            };
            io.to(room.id).emit('room:sides_decided', sidesDecidedPayload);

            // 进入技能草稿阶段（白方先选，单人10秒）
            startDraftPhase(io, roomManager, room.id, finalizeGame);
        });

        // 技能草稿选择
        socket.on('client:draft_pick', (data) => {
            /** @type {DraftPickPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:draft_pick', payload)) return;
            const { skillId } = payload;

            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            const { room } = found;
            if (room.status !== 'drafting' || !room.draft) {
                socket.emit('server:error', { message: 'not_in_draft_phase' });
                return;
            }

            const color = room.players.black && room.players.black.id === socket.id
                ? 'black'
                : (room.players.white && room.players.white.id === socket.id ? 'white' : null);
            if (!color) {
                socket.emit('server:error', { message: 'color_not_assigned' });
                return;
            }
            if (room.draft.currentPicker !== color) {
                socket.emit('server:error', { message: 'not_your_draft_turn' });
                return;
            }

            const pool = room.draft.availableSkills || DEFAULT_SKILLS;
            if (!pool.includes(skillId)) {
                socket.emit('server:error', { message: 'skill_not_enabled' });
                return;
            }
            const already = Object.values(room.draft.picks || {});
            if (already.includes(skillId)) {
                socket.emit('server:error', { message: 'skill_already_picked' });
                return;
            }

            room.draft.picks[color] = skillId;
            clearDraftPickTimer(room);

            if (room.draft.picks.black && room.draft.picks.white) {
                room.draft.currentPicker = null;
                emitDraftUpdate(io, room);
                startGameFromDraft(io, roomManager, room, finalizeGame);
                return;
            }

            room.draft.currentPicker = color === 'white' ? 'black' : 'white';
            room.draft.startedAt = Date.now();
            emitDraftUpdate(io, room);
            setupDraftTurnTimeout(io, roomManager, room.id, finalizeGame);
        });
        
        // ========== 游戏流程 ==========
        
        // 落子
        socket.on('client:place_piece', (data) => {
            /** @type {PlacePiecePayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:place_piece', payload)) return;
            const { row, col } = payload;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            if (room.status !== 'playing' || !room.game) {
                socket.emit('server:invalid_move', { reason: 'game_not_playing' });
                return;
            }

            // 验证落子（服务端计算混沌偏移）
            const validation = gameLogic.isValidMove(room, socket.id, row, col);
            if (!validation.valid) {
                socket.emit('server:invalid_move', { reason: validation.reason });
                return;
            }

            const resolvedRow = Number.isInteger(validation.resolvedRow) ? validation.resolvedRow : row;
            const resolvedCol = Number.isInteger(validation.resolvedCol) ? validation.resolvedCol : col;

            // 执行落子
            const pieceValue = gameLogic.placePiece(room, resolvedRow, resolvedCol);
            const player = room.game.currentTurn;

            // 混沌干扰在落子后消耗
            if (room.game.chaosDebuff && room.game.chaosDebuff[player] > 0) {
                gameLogic.consumeChaosDebuff(room);
            }

            // 检查胜负
            const winResult = gameLogic.checkWin(room, resolvedRow, resolvedCol);

            if (winResult) {
                /** @type {PiecePlacedPayload & Record<string, unknown>} */
                const piecePlacedPayload = {
                    row: resolvedRow, col: resolvedCol, player, pieceValue,
                    requestedRow: row,
                    requestedCol: col,
                    resolvedRow,
                    resolvedCol,
                    chaosApplied: !!validation.chaosApplied,
                    state: buildStateDelta(room)
                };
                io.to(room.id).emit('room:piece_placed', piecePlacedPayload);
                finalizeGame(room, winResult.winner, 'five_in_row', winResult.winLine);
            } else {
                let nextTurn = room.game.currentTurn;
                if (room.game.isDoubleMoveActive) {
                    room.game.isDoubleMoveActive = false;
                } else {
                    gameLogic.switchTurn(room);
                    nextTurn = room.game.currentTurn;
                }

                emitTimerSync(io, room);

                /** @type {PiecePlacedPayload & Record<string, unknown>} */
                const piecePlacedWithNextTurnPayload = {
                    row: resolvedRow,
                    col: resolvedCol,
                    player,
                    pieceValue,
                    nextTurn,
                    requestedRow: row,
                    requestedCol: col,
                    resolvedRow,
                    resolvedCol,
                    chaosApplied: !!validation.chaosApplied,
                    state: buildStateDelta(room)
                };
                io.to(room.id).emit('room:piece_placed', piecePlacedWithNextTurnPayload);
            }
        });
        
        // ========== 技能系统 ==========
        
        // 使用技能
        socket.on('client:use_skill', (data) => {
            /** @type {UseSkillPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:use_skill', payload)) return;
            const { skillId, targets } = payload;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            if (room.status !== 'playing' || !room.game) {
                socket.emit('server:skill_invalid', { reason: 'game_not_playing' });
                return;
            }

            // 验证技能
            const validation = skillLogic.isValidSkill(room, socket.id, skillId, targets);
            if (!validation.valid) {
                socket.emit('server:skill_invalid', { reason: validation.reason });
                return;
            }
            
            // 执行技能
            const result = skillLogic.executeSkill(room, skillId, targets);
            
            // 广播技能使用
            /** @type {SkillUsedPayload & Record<string, unknown>} */
            const skillUsedPayload = {
                player: result.player,
                skillId: result.skillId,
                targets,
                changes: result.changes,
                specialEffect: result.specialEffect,
                skillUsed: room.game.skillUsed,
                state: buildStateDelta(room)
            };
            io.to(room.id).emit('room:skill_used', skillUsedPayload);

            // 检查技能是否导致胜利（移动类技能）
            if (result.changes && result.changes.length > 0) {
                for (const change of result.changes) {
                    if (change.value === 1 || change.value === 2) {
                        const winResult = gameLogic.checkWin(room, change.row, change.col);
                        if (winResult) {
                            finalizeGame(room, winResult.winner, 'five_in_row', winResult.winLine);
                            return;
                        }
                    }
                }
            }

            // 炸弹扣时立即判负
            if (skillId === 'bomb' && room.game.bombTarget) {
                const bombTarget = room.game.bombTarget;
                if ((room.game.timeRemaining[bombTarget] || 0) <= 0) {
                    const winner = bombTarget === 'black' ? 'white' : 'black';
                    io.to(room.id).emit('room:bomb_activated', {
                        bombTarget,
                        timeRemaining: room.game.timeRemaining
                    });
                    finalizeGame(room, winner, 'bomb_explode');
                    return;
                }
                io.to(room.id).emit('room:bomb_activated', {
                    bombTarget,
                    timeRemaining: room.game.timeRemaining
                });
            }

            if (result.switchTurn) {
                gameLogic.switchTurn(room);
                /** @type {TurnChangedPayload & Record<string, unknown>} */
                const turnChangedPayload = {
                    currentTurn: room.game.currentTurn,
                    state: buildStateDelta(room)
                };
                io.to(room.id).emit('room:turn_changed', turnChangedPayload);
            }
            emitTimerSync(io, room);
        });
        
        // ========== 投降与悔棋 ==========
        
        // 投降
        socket.on('client:surrender', () => {
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room, role } = found;
            
            if (room.status !== 'playing') return;
            
            // 确定胜者
            const surrenderer = role === 'host' ? room.players.host : room.players.guest;
            const winner = role === 'host' ? 'guest' : 'host';
            const winnerColor = room.players.black.id === room.players[winner].id ? 'black' : 'white';
            
            io.to(room.id).emit('room:player_surrendered', {
                player: surrenderer.nickname,
                socketId: socket.id
            });

            finalizeGame(room, winnerColor, 'surrender');
        });
        
        // 请求悔棋
        socket.on('client:request_undo', () => {
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            if (room.status !== 'playing') return;
            if (!room.game) return;
            
            // 确定请求者颜色
            const requesterColor = room.players.black.id === socket.id ? 'black' : 'white';
            
            // 检查是否已用过悔棋
            if (room.game.undoUsed[requesterColor]) {
                socket.emit('server:error', { message: 'undo_already_used' });
                return;
            }
            
            // 检查是否有待处理的悔棋请求
            if (room.game.undoPending) {
                socket.emit('server:error', { message: 'undo_pending' });
                return;
            }
            
            // 设置悔棋请求
            room.game.undoPending = requesterColor;
            
            // 通知对方
            socket.to(room.id).emit('room:undo_requested', {
                fromPlayer: requesterColor
            });
        });
        
        // 回应悔棋
        socket.on('client:respond_undo', (data) => {
            /** @type {RespondUndoPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:respond_undo', payload)) return;
            const { accept } = payload;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            if (!room.game || !room.game.undoPending) return;
            
            const requesterColor = room.game.undoPending;
            const responderColor = room.players.black.id === socket.id ? 'black' : 'white';
            
            // 验证回应者不是请求者
            if (requesterColor === responderColor) return;
            
            // 标记请求者已使用悔棋（无论是否同意）
            room.game.undoUsed[requesterColor] = true;
            room.game.undoPending = null;
            
            if (accept) {
                // 执行悔棋
                const undoResult = gameLogic.executeUndo(room);
                
                io.to(room.id).emit('room:undo_response', {
                    accepted: true,
                    byPlayer: responderColor
                });
                
                if (undoResult.success) {
                    io.to(room.id).emit('room:undo_executed', {
                        undoneMove: undoResult.undoneMove,
                        currentTurn: undoResult.currentTurn,
                        undoUsed: room.game.undoUsed
                    });
                }
            } else {
                io.to(room.id).emit('room:undo_response', {
                    accepted: false,
                    byPlayer: responderColor,
                    undoUsed: room.game.undoUsed
                });
            }
        });
        
        // ========== 再来一局 ==========
        
        socket.on('client:request_rematch', () => {
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room, role } = found;
            
            if (room.status !== 'finished') return;
            
            socket.to(room.id).emit('room:rematch_request', {
                fromPlayer: role
            });
        });
        
        socket.on('client:accept_rematch', () => {
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            // 重置游戏
            roomManager.resetGame(room.id);
            
            // 开始新一轮猜拳
            io.to(room.id).emit('room:rps_start', {
                timeout: config.rps.timeout,
                round: 1
            });
            
            setupRPSTimeout(io, roomManager, room.id, finalizeGame);
        });
        
        // ========== 公共大厅 ==========
        
        // 获取大厅房间列表
        socket.on('client:lobby_list', () => {
            const rooms = roomManager.getLobbyRooms();
            socket.emit('server:lobby_list', { rooms });
        });
        
        // 创建大厅房间（支持回调确认）
        socket.on('client:lobby_create', (data, callback) => {
            /** @type {LobbyCreatePayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:lobby_create', payload)) {
                if (typeof callback === 'function') {
                    callback({ success: false, message: 'invalid_payload' });
                }
                return;
            }
            const { nickname, rule, enabledSkills, hasPassword, password } = payload;
            const traceId = extractTraceId(payload);
            
            try {
                const room = roomManager.createLobbyRoom(socket.id, nickname, {
                    rule: rule || 'single',
                    enabledSkills: enabledSkills || [],
                    hasPassword: hasPassword || false,
                    password: password || ''
                });
                
                // 加入 Socket.IO 房间
                socket.join(room.id);
                
                const responseData = {
                    roomId: room.id,
                    playerId: socket.id,
                    role: 'host'
                };
                
                // 通知创建者（事件方式，兼容旧客户端）
                socket.emit('server:lobby_room_created', responseData);
                
                // 回调确认（新客户端用这个判断是否成功）
                if (typeof callback === 'function') {
                    callback({ success: true, ...responseData });
                }
                
                // 广播大厅更新给所有在线客户端
                io.emit('server:lobby_update', {
                    rooms: roomManager.getLobbyRooms()
                });
                
            } catch (error) {
                logSocketEvent('error', 'client:lobby_create', socket, 'lobby_create_failed', {
                    traceId,
                    error: error && error.message ? error.message : String(error)
                });
                if (typeof callback === 'function') {
                    callback({ success: false, message: error.message, traceId });
                }
                socket.emit('server:error', {
                    action: 'lobby_create',
                    message: error.message,
                    traceId
                });
            }
        });
        
        // 加入大厅房间
        socket.on('client:lobby_join', (data) => {
            /** @type {LobbyJoinPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:lobby_join', payload)) return;
            const { roomId, nickname, password } = payload;
            
            const result = roomManager.joinLobbyRoom(roomId, socket.id, nickname, password);
            
            if (!result.success) {
                socket.emit('server:lobby_join_failed', {
                    reason: ('reason' in result) ? result.reason : 'lobby_join_failed'
                });
                return;
            }
            
            const room = result.room;
            
            // 加入 Socket.IO 房间
            socket.join(roomId);
            
            // 通知加入者
            socket.emit('server:join_success', {
                roomId: room.id,
                playerId: socket.id,
                role: 'guest',
                opponent: {
                    nickname: room.players.host.nickname,
                    pieceStyle: room.players.host.pieceStyle
                }
            });
            
            // 通知房主
            socket.to(roomId).emit('room:player_joined', {
                nickname: room.players.guest.nickname,
                pieceStyle: room.players.guest.pieceStyle,
                playerId: socket.id
            });
            
            // 广播大厅更新（房间已满，从列表消失）
            io.emit('server:lobby_update', {
                rooms: roomManager.getLobbyRooms()
            });
            
            // 开始猜拳
            io.to(roomId).emit('room:rps_start', {
                timeout: config.rps.timeout,
                round: 1
            });
            
            setupRPSTimeout(io, roomManager, roomId, finalizeGame);
        });
        
        // 离开大厅（只是取消监听，不做特殊处理）
        socket.on('client:lobby_leave', () => {
            // 前端离开大厅页面时调用，目前无需特殊处理
        });
        
        // ========== 断线处理 ==========
        
        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            
            const result = roomManager.leaveRoom(socket.id);
            
            if (result) {
                if (result.gameInProgress) {
                    // 对局流程中任意一方断线，进入重连窗口
                    io.to(result.roomId).emit('room:opponent_disconnected', {
                        timeout: config.reconnect.timeout
                    });
                    
                    // 设置断线超时
                    setupDisconnectTimeout(io, roomManager, result.roomId, socket.id);
                } else if (result.role === 'host') {
                    // 房主在非对局阶段离开，直接关闭房间
                    io.to(result.roomId).emit('room:host_left', {});
                }
                
                // 广播大厅更新（房间可能被删除或状态变化）
                io.emit('server:lobby_update', {
                    rooms: roomManager.getLobbyRooms()
                });
            }
        });
        
        // 重连
        socket.on('client:reconnect', (data) => {
            /** @type {ReconnectPayload} */
            const payload = data;
            if (!validateIncoming(socket, 'client:reconnect', payload)) return;
            const { roomId, oldSocketId } = payload;
            
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('server:reconnect_failed', { reason: 'room_not_found' });
                return;
            }
            
            // 查找断线的玩家（要求 oldSocketId 匹配，防冒充）
            let reconnectedRole = null;
            if (room.players.host && !room.players.host.connected && room.players.host.id === oldSocketId) {
                room.players.host.id = socket.id;
                room.players.host.connected = true;
                room.players.host.disconnectTime = null;
                reconnectedRole = 'host';
            } else if (room.players.guest && !room.players.guest.connected && room.players.guest.id === oldSocketId) {
                room.players.guest.id = socket.id;
                room.players.guest.connected = true;
                room.players.guest.disconnectTime = null;
                reconnectedRole = 'guest';
            }
            
            if (!reconnectedRole) {
                socket.emit('server:reconnect_failed', { reason: 'no_disconnected_player' });
                return;
            }
            
            // 更新黑白玩家的 socket id
            if (room.players.black && room.players[reconnectedRole] === room.players.black) {
                room.players.black.id = socket.id;
            }
            if (room.players.white && room.players[reconnectedRole] === room.players.white) {
                room.players.white.id = socket.id;
            }
            
            socket.join(roomId);
            
            // 发送重连成功和游戏状态
            /** @type {ReconnectSuccessPayload} */
            const reconnectSuccessPayload = {
                roomId,
                role: reconnectedRole,
                boardState: gameLogic.getBoardState(room),
                status: room.status,
                match: room.match || null,
                myColor: room.players.black && room.players.black.id === socket.id
                    ? 'black'
                    : (room.players.white && room.players.white.id === socket.id ? 'white' : null),
                opponent: room.players.black && room.players.black.id === socket.id
                    ? {
                        nickname: room.players.white ? room.players.white.nickname : undefined,
                        pieceStyle: room.players.white ? room.players.white.pieceStyle : undefined
                    }
                    : {
                        nickname: room.players.black ? room.players.black.nickname : undefined,
                        pieceStyle: room.players.black ? room.players.black.pieceStyle : undefined
                    }
            };
            socket.emit('server:reconnect_success', reconnectSuccessPayload);
            
            // 通知对方
            socket.to(roomId).emit('room:opponent_reconnected', {});
        });
    });
}

// ========== 辅助函数 ==========

/**
 * 处理猜拳结果
 */
function handleRPSResult(io, roomManager, room, onGameOver) {
    const result = rpsLogic.determineWinner(room);
    
    if (result.result === 'tie') {
        // 平局，重新猜拳
        io.to(room.id).emit('room:rps_result', {
            hostChoice: result.hostChoice,
            guestChoice: result.guestChoice,
            result: 'tie'
        });
        
        // 重置并开始新一轮
        const newRound = rpsLogic.resetRPS(room);
        
        setTimeout(() => {
            io.to(room.id).emit('room:rps_start', {
                timeout: config.rps.timeout,
                round: newRound
            });
            
            setupRPSTimeout(io, roomManager, room.id, onGameOver);
        }, 2000);  // 2秒后开始新一轮
        
    } else {
        // 有胜者
        io.to(room.id).emit('room:rps_result', {
            hostChoice: result.hostChoice,
            guestChoice: result.guestChoice,
            result: 'decided',
            winner: result.winner
        });
        
        // 进入选边阶段
        room.status = 'choosing_side';
        
        // 通知胜者选边
        const winnerSocketId = result.winner === 'host' 
            ? room.players.host.id 
            : room.players.guest.id;
        
        io.to(winnerSocketId).emit('room:choose_side', {
            timeout: config.rps.sideChoiceTimeout
        });
        
        // 设置选边超时
        setupSideChoiceTimeout(io, roomManager, room.id, winnerSocketId, onGameOver);
    }
}

/**
 * 设置猜拳超时
 */
function setupRPSTimeout(io, roomManager, roomId, onGameOver) {
    setTimeout(() => {
        const room = roomManager.getRoom(roomId);
        if (!room || room.status !== 'rps') return;
        
        // 为未选择的玩家随机选择
        if (!room.rps.hostChoice) {
            room.rps.hostChoice = rpsLogic.randomChoice();
        }
        if (!room.rps.guestChoice) {
            room.rps.guestChoice = rpsLogic.randomChoice();
        }
        
        handleRPSResult(io, roomManager, room, onGameOver);
    }, config.rps.timeout);
}

/**
 * 设置选边超时
 */
function setupSideChoiceTimeout(io, roomManager, roomId, winnerSocketId, onGameOver) {
    setTimeout(() => {
        const room = roomManager.getRoom(roomId);
        if (!room || room.status !== 'choosing_side') return;
        
        // 默认选择黑方（先手）
        const result = rpsLogic.submitSideChoice(room, 'black');
        
        if (result.success) {
            /** @type {SidesDecidedPayload} */
            const timeoutSidesDecidedPayload = {
                blackPlayer: result.blackPlayer,
                whitePlayer: result.whitePlayer,
                blackSocketId: result.blackSocketId,
                whiteSocketId: result.whiteSocketId
            };
            io.to(roomId).emit('room:sides_decided', timeoutSidesDecidedPayload);

            const fallbackGameOver = (targetRoom, winnerColor, reason, winLine) => {
                targetRoom.status = 'finished';
                stopRoomTimer(targetRoom);
                io.to(targetRoom.id).emit('room:game_over', {
                    winner: winnerColor,
                    reason,
                    winLine,
                    state: buildStateDelta(targetRoom)
                });
            };
            startDraftPhase(io, roomManager, roomId, onGameOver || fallbackGameOver);
        }
    }, config.rps.sideChoiceTimeout);
}

/**
 * 设置断线超时
 */
function setupDisconnectTimeout(io, roomManager, roomId, disconnectedSocketId) {
    setTimeout(() => {
        const room = roomManager.getRoom(roomId);
        if (!room) return;
        
        // 检查是否仍然断线
        const hostDisconnected = room.players.host && !room.players.host.connected;
        const guestDisconnected = room.players.guest && !room.players.guest.connected;
        
        if (hostDisconnected || guestDisconnected) {
            // 断线方判负
            const winner = hostDisconnected ? 'guest' : 'host';
            const winnerColor = room.players.black && room.players.black.id === room.players[winner].id 
                ? 'black' : 'white';
            
            room.status = 'finished';
            stopRoomTimer(room);
            
            io.to(roomId).emit('room:game_over', {
                winner: winnerColor,
                reason: 'disconnect_timeout',
                state: buildStateDelta(room)
            });
        }
    }, config.reconnect.timeout);
}

module.exports = setupSocketHandlers;
