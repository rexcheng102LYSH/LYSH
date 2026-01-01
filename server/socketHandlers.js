// ============================================
// Project Lysh Server - Socket Event Handlers
// ============================================

const config = require('./config');
const gameLogic = require('./gameLogic');
const rpsLogic = require('./rpsLogic');
const skillLogic = require('./skillLogic');

function setupSocketHandlers(io, roomManager) {
    
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);
        
        // ========== 房间管理 ==========
        
        // 创建房间
        socket.on('client:create_room', (data) => {
            const { nickname, pieceStyle, matchMode } = data;
            
            try {
                const room = roomManager.createRoom(
                    socket.id,
                    nickname,
                    pieceStyle || 'classic',
                    matchMode || 'single'
                );
                
                // 加入 Socket.IO 房间
                socket.join(room.id);
                
                socket.emit('server:room_created', {
                    roomId: room.id,
                    playerId: socket.id,
                    role: 'host'
                });
                
            } catch (error) {
                socket.emit('server:error', {
                    action: 'create_room',
                    message: error.message
                });
            }
        });
        
        // 加入房间
        socket.on('client:join_room', (data) => {
            const { roomId, nickname, pieceStyle } = data;
            
            const result = roomManager.joinRoom(
                roomId,
                socket.id,
                nickname,
                pieceStyle || 'classic'
            );
            
            if (!result.success) {
                socket.emit('server:join_failed', {
                    reason: result.reason
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
            
            // 开始猜拳
            io.to(roomId).emit('room:rps_start', {
                timeout: config.rps.timeout,
                round: 1
            });
            
            // 设置猜拳超时
            setupRPSTimeout(io, roomManager, roomId);
        });
        
        // ========== 猜拳系统 ==========
        
        // 提交猜拳选择
        socket.on('client:rps_choice', (data) => {
            const { choice } = data;
            
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
                handleRPSResult(io, roomManager, room);
            }
        });
        
        // 提交选边
        socket.on('client:side_choice', (data) => {
            const { side } = data;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room, role } = found;
            
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
            
            // 初始化游戏
            roomManager.initGame(room.id);
            
            // 广播选边结果和游戏开始
            io.to(room.id).emit('room:sides_decided', {
                blackPlayer: result.blackPlayer,
                whitePlayer: result.whitePlayer,
                blackSocketId: result.blackSocketId,
                whiteSocketId: result.whiteSocketId
            });
            
            io.to(room.id).emit('room:game_start', {
                blackPlayer: result.blackPlayer,
                whitePlayer: result.whitePlayer
            });
        });
        
        // ========== 游戏流程 ==========
        
        // 落子
        socket.on('client:place_piece', (data) => {
            const { row, col } = data;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            // 验证落子
            const validation = gameLogic.isValidMove(room, socket.id, row, col);
            if (!validation.valid) {
                socket.emit('server:invalid_move', { reason: validation.reason });
                return;
            }
            
            // 执行落子
            const pieceValue = gameLogic.placePiece(room, row, col);
            const player = room.game.currentTurn;
            
            // 检查胜负
            const winResult = gameLogic.checkWin(room, row, col);
            
            if (winResult) {
                // 游戏结束
                room.status = 'finished';
                
                io.to(room.id).emit('room:piece_placed', {
                    row, col, player, pieceValue
                });
                
                io.to(room.id).emit('room:game_over', {
                    winner: winResult.winner,
                    winLine: winResult.winLine,
                    reason: 'five_in_row'
                });
            } else {
                // 处理回合结束效果（炸弹、巫毒等）
                const turnEffects = skillLogic.processTurnEndEffects(room);
                if (turnEffects.length > 0) {
                    io.to(room.id).emit('room:skill_effect', {
                        effects: turnEffects
                    });
                }
                
                // 切换回合
                gameLogic.switchTurn(room);
                
                io.to(room.id).emit('room:piece_placed', {
                    row, col, player, pieceValue,
                    nextTurn: room.game.currentTurn
                });
            }
        });
        
        // ========== 技能系统 ==========
        
        // 使用技能
        socket.on('client:use_skill', (data) => {
            const { skillId, targets } = data;
            
            const found = roomManager.getRoomBySocketId(socket.id);
            if (!found) return;
            
            const { room } = found;
            
            // 验证技能
            const validation = skillLogic.isValidSkill(room, socket.id, skillId, targets);
            if (!validation.valid) {
                socket.emit('server:skill_invalid', { reason: validation.reason });
                return;
            }
            
            // 执行技能
            const result = skillLogic.executeSkill(room, skillId, targets);
            
            // 广播技能使用
            io.to(room.id).emit('room:skill_used', {
                player: result.player,
                skillId: result.skillId,
                targets,
                changes: result.changes,
                specialEffect: result.specialEffect,
                skillUsed: room.game.skillUsed
            });
            
            // 检查技能是否导致胜利（如双连）
            if (result.changes && result.changes.length > 0) {
                for (const change of result.changes) {
                    if (change.value === 1 || change.value === 2) {
                        const winResult = gameLogic.checkWin(room, change.row, change.col);
                        if (winResult) {
                            room.status = 'finished';
                            io.to(room.id).emit('room:game_over', {
                                winner: winResult.winner,
                                winLine: winResult.winLine,
                                reason: 'five_in_row'
                            });
                            return;
                        }
                    }
                }
            }
            
            // 处理回合结束效果
            const turnEffects = skillLogic.processTurnEndEffects(room);
            if (turnEffects.length > 0) {
                io.to(room.id).emit('room:skill_effect', {
                    effects: turnEffects
                });
            }
            
            // 切换回合
            gameLogic.switchTurn(room);
            
            io.to(room.id).emit('room:turn_changed', {
                currentTurn: room.game.currentTurn
            });
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
            
            room.status = 'finished';
            
            io.to(room.id).emit('room:player_surrendered', {
                player: surrenderer.nickname,
                socketId: socket.id
            });
            
            io.to(room.id).emit('room:game_over', {
                winner: winnerColor,
                reason: 'surrender'
            });
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
            const { accept } = data;
            
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
            
            setupRPSTimeout(io, roomManager, room.id);
        });
        
        // ========== 断线处理 ==========
        
        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            
            const result = roomManager.leaveRoom(socket.id);
            
            if (result) {
                if (result.role === 'host') {
                    // 房主离开，通知 guest 并关闭房间
                    io.to(result.roomId).emit('room:host_left', {});
                } else if (result.gameInProgress) {
                    // 游戏进行中 guest 断线
                    io.to(result.roomId).emit('room:opponent_disconnected', {
                        timeout: config.reconnect.timeout
                    });
                    
                    // 设置断线超时
                    setupDisconnectTimeout(io, roomManager, result.roomId, socket.id);
                }
            }
        });
        
        // 重连
        socket.on('client:reconnect', (data) => {
            const { roomId, oldSocketId } = data;
            
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('server:reconnect_failed', { reason: 'room_not_found' });
                return;
            }
            
            // 查找断线的玩家
            let reconnectedRole = null;
            if (room.players.host && !room.players.host.connected) {
                room.players.host.id = socket.id;
                room.players.host.connected = true;
                room.players.host.disconnectTime = null;
                reconnectedRole = 'host';
            } else if (room.players.guest && !room.players.guest.connected) {
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
            socket.emit('server:reconnect_success', {
                roomId,
                role: reconnectedRole,
                boardState: gameLogic.getBoardState(room),
                status: room.status
            });
            
            // 通知对方
            socket.to(roomId).emit('room:opponent_reconnected', {});
        });
    });
}

// ========== 辅助函数 ==========

/**
 * 处理猜拳结果
 */
function handleRPSResult(io, roomManager, room) {
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
            
            setupRPSTimeout(io, roomManager, room.id);
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
        setupSideChoiceTimeout(io, roomManager, room.id, winnerSocketId);
    }
}

/**
 * 设置猜拳超时
 */
function setupRPSTimeout(io, roomManager, roomId) {
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
        
        handleRPSResult(io, roomManager, room);
    }, config.rps.timeout);
}

/**
 * 设置选边超时
 */
function setupSideChoiceTimeout(io, roomManager, roomId, winnerSocketId) {
    setTimeout(() => {
        const room = roomManager.getRoom(roomId);
        if (!room || room.status !== 'choosing_side') return;
        
        // 默认选择黑方（先手）
        const result = rpsLogic.submitSideChoice(room, 'black');
        
        if (result.success) {
            roomManager.initGame(roomId);
            
            io.to(roomId).emit('room:sides_decided', {
                blackPlayer: result.blackPlayer,
                whitePlayer: result.whitePlayer,
                blackSocketId: result.blackSocketId,
                whiteSocketId: result.whiteSocketId
            });
            
            io.to(roomId).emit('room:game_start', {
                blackPlayer: result.blackPlayer,
                whitePlayer: result.whitePlayer
            });
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
            
            io.to(roomId).emit('room:game_over', {
                winner: winnerColor,
                reason: 'disconnect_timeout'
            });
        }
    }, config.reconnect.timeout);
}

module.exports = setupSocketHandlers;
