// ============================================
// Project Lysh - Online Game Logic
// 联网对战游戏逻辑
// ============================================

const OnlineGame = {
    // 状态
    roomId: null,
    role: null,           // 'host' | 'guest'
    myColor: null,        // 'black' | 'white'
    opponentNickname: null,
    opponentPieceStyle: null,
    
    // 技能和悔棋状态
    mySkillUsed: false,
    opponentSkillUsed: false,
    myUndoUsed: false,
    opponentUndoUsed: false,
    
    // 猜拳状态
    rpsPhase: false,
    myRpsChoice: null,
    
    // 防止重复初始化
    _initialized: false,
    
    /**
     * 初始化联网游戏模块
     */
    init: function() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupEventListeners();
        console.log('[OnlineGame] Initialized');
    },
    
    /**
     * 设置 Socket 事件监听
     */
    setupEventListeners: function() {
        const socket = SocketClient;
        
        // 房间事件
        socket.on('server:room_created', this.onRoomCreated.bind(this));
        socket.on('server:join_success', this.onJoinSuccess.bind(this));
        socket.on('server:join_failed', this.onJoinFailed.bind(this));
        socket.on('room:player_joined', this.onPlayerJoined.bind(this));
        socket.on('room:host_left', this.onHostLeft.bind(this));
        
        // 猜拳事件
        socket.on('room:rps_start', this.onRpsStart.bind(this));
        socket.on('room:opponent_chose', this.onOpponentChose.bind(this));
        socket.on('room:rps_result', this.onRpsResult.bind(this));
        socket.on('room:choose_side', this.onChooseSide.bind(this));
        socket.on('room:sides_decided', this.onSidesDecided.bind(this));
        
        // 游戏事件
        socket.on('room:game_start', this.onGameStart.bind(this));
        socket.on('room:piece_placed', this.onPiecePlaced.bind(this));
        socket.on('server:invalid_move', this.onInvalidMove.bind(this));
        socket.on('room:game_over', this.onGameOver.bind(this));
        socket.on('room:turn_changed', this.onTurnChanged.bind(this));
        
        // 技能事件
        socket.on('room:skill_used', this.onSkillUsed.bind(this));
        socket.on('server:skill_invalid', this.onSkillInvalid.bind(this));
        socket.on('room:skill_effect', this.onSkillEffect.bind(this));
        
        // 投降悔棋事件
        socket.on('room:player_surrendered', this.onPlayerSurrendered.bind(this));
        socket.on('room:undo_requested', this.onUndoRequested.bind(this));
        socket.on('room:undo_response', this.onUndoResponse.bind(this));
        socket.on('room:undo_executed', this.onUndoExecuted.bind(this));
        
        // 断线重连
        socket.on('room:opponent_disconnected', this.onOpponentDisconnected.bind(this));
        socket.on('room:opponent_reconnected', this.onOpponentReconnected.bind(this));
        socket.on('server:reconnect_success', this.onReconnectSuccess.bind(this));
        socket.on('server:reconnect_failed', this.onReconnectFailed.bind(this));
        
        // 再来一局
        socket.on('room:rematch_request', this.onRematchRequest.bind(this));
        
        // 错误处理
        socket.on('server:error', this.onServerError.bind(this));
        
        // 公共大厅事件
        socket.on('server:lobby_list', this.onLobbyList.bind(this));
        socket.on('server:lobby_room_created', this.onLobbyRoomCreated.bind(this));
        socket.on('server:lobby_join_failed', this.onLobbyJoinFailed.bind(this));
        socket.on('server:lobby_update', this.onLobbyUpdate.bind(this));
    },
    
    // ========== 房间操作 ==========
    
    /**
     * 创建房间
     */
    createRoom: function(nickname) {
        const pieceStyle = GameState.pieceStyle || 'classic';
        SocketClient.emit('client:create_room', {
            nickname: nickname || '玩家',
            pieceStyle: pieceStyle,
            matchMode: 'single'
        });
    },
    
    /**
     * 加入房间
     */
    joinRoom: function(roomId, nickname) {
        const pieceStyle = GameState.pieceStyle || 'classic';
        SocketClient.emit('client:join_room', {
            roomId: roomId,
            nickname: nickname || '玩家',
            pieceStyle: pieceStyle
        });
    },
    
    /**
     * 离开房间
     */
    leaveRoom: function() {
        SocketClient.disconnect();
        this.resetState();
        OnlineUI.hideAllModals();
        OnlineUI.showToast('已离开房间');
        // 清除特效，防止连珠/烟花残留
        if (typeof FxHost !== 'undefined' && FxHost.clear) FxHost.clear();
        if (typeof VisualFX !== 'undefined' && VisualFX.clear) VisualFX.clear();
        // 返回主菜单
        if (typeof showScreen === 'function') showScreen('main');
    },
    
    // ========== 房间事件处理 ==========
    
    onRoomCreated: function(data) {
        console.log('[OnlineGame] Room created:', data);
        this.roomId = data.roomId;
        this.role = 'host';
        
        // 显示等待界面（房间号连线）
        OnlineUI.showWaitingRoom(data.roomId, { source: '房间号连线' });
    },
    
    onJoinSuccess: function(data) {
        console.log('[OnlineGame] Join success:', data);
        this.roomId = data.roomId;
        this.role = 'guest';
        this.opponentNickname = data.opponent.nickname;
        this.opponentPieceStyle = data.opponent.pieceStyle;
        
        OnlineUI.hideWaitingRoom();
        OnlineUI.showToast('成功加入房间');
    },
    
    onJoinFailed: function(data) {
        console.log('[OnlineGame] Join failed:', data);
        let message = '加入失败';
        switch (data.reason) {
            case 'room_not_found': message = '房间不存在'; break;
            case 'room_not_available': message = '房间已开始游戏'; break;
            case 'room_full': message = '房间已满'; break;
        }
        OnlineUI.showToast(message);
    },
    
    onPlayerJoined: function(data) {
        console.log('[OnlineGame] Player joined:', data);
        this.opponentNickname = data.nickname;
        this.opponentPieceStyle = data.pieceStyle;
        
        // 先更新等待房间中对手槽位，让房主看到对手已加入
        OnlineUI.updateWaitingGuest(data.nickname);
        OnlineUI.showToast(data.nickname + ' 加入了房间');
        
        // 短暂延迟后隐藏等待房间（让用户看到"已加入"状态）
        setTimeout(function() {
            OnlineUI.hideWaitingRoom();
        }, 800);
    },
    
    onHostLeft: function() {
        console.log('[OnlineGame] Host left');
        OnlineUI.showToast('房主已离开，房间关闭');
        this.leaveRoom();
    },
    
    // ========== 猜拳事件处理 ==========
    
    onRpsStart: function(data) {
        console.log('[OnlineGame] RPS start:', data);
        this.rpsPhase = true;
        this.myRpsChoice = null;
        OnlineUI.showRpsModal(data.timeout, data.round);
    },
    
    onOpponentChose: function() {
        console.log('[OnlineGame] Opponent chose');
        OnlineUI.updateRpsOpponentStatus(true);
    },
    
    onRpsResult: function(data) {
        console.log('[OnlineGame] RPS result:', data);
        this.rpsPhase = false;
        
        const myChoice = this.role === 'host' ? data.hostChoice : data.guestChoice;
        const opponentChoice = this.role === 'host' ? data.guestChoice : data.hostChoice;
        
        OnlineUI.showRpsResult(myChoice, opponentChoice, data.result, data.winner === this.role);
    },
    
    onChooseSide: function(data) {
        console.log('[OnlineGame] Choose side:', data);
        OnlineUI.showSideChoiceModal(data.timeout);
    },
    
    onSidesDecided: function(data) {
        console.log('[OnlineGame] Sides decided:', data);
        
        // 确定我的颜色
        if (data.blackSocketId === SocketClient.getId()) {
            this.myColor = 'black';
        } else {
            this.myColor = 'white';
        }
        
        OnlineUI.showToast('你是' + (this.myColor === 'black' ? '黑方(先手)' : '白方(后手)'));
    },
    
    // ========== 游戏事件处理 ==========
    
    onGameStart: function(data) {
        console.log('[OnlineGame] Game start:', data);
        
        // 关闭所有弹窗
        OnlineUI.hideAllModals();
        
        // 设置联网模式状态
        GameState.online = {
            isOnline: true,
            roomId: this.roomId,
            myColor: this.myColor,
            opponentNickname: this.opponentNickname,
            opponentPieceStyle: this.opponentPieceStyle
        };
        
        // 重置技能和悔棋状态
        this.mySkillUsed = false;
        this.opponentSkillUsed = false;
        this.myUndoUsed = false;
        this.opponentUndoUsed = false;
        
        // 启动游戏
        if (typeof startOnlineGame === 'function') {
            startOnlineGame(this.myColor, this.opponentNickname);
        }
        
        // 更新 UI 显示对手信息
        OnlineUI.updateGameUI();
    },
    
    onPiecePlaced: function(data) {
        console.log('[OnlineGame] Piece placed:', data);
        
        // 使用专门的处理函数渲染棋子
        if (typeof handleOnlineOpponentMove === 'function') {
            handleOnlineOpponentMove(data.row, data.col, data.pieceValue);
        } else {
            // 备用：直接更新并渲染
            GameState.board[data.row][data.col] = data.pieceValue;
            board[data.row][data.col] = data.pieceValue;
            const cell = getCell(data.row, data.col);
            if (cell && typeof renderPieceInCell === 'function') {
                renderPieceInCell(cell, data.pieceValue);
            }
        }
        
        // 注意：音效已在 handleOnlineOpponentMove 中播放，这里不重复播放
        
        // 更新回合
        if (data.nextTurn) {
            GameState.currentPlayer = data.nextTurn === 'black' ? 1 : 2;
            currentPlayer = GameState.currentPlayer; // 同步旧变量
            if (typeof updateDynamicUI === 'function') {
                updateDynamicUI();
            }
        }
    },
    
    onInvalidMove: function(data) {
        console.log('[OnlineGame] Invalid move:', data);
        OnlineUI.showToast('无效落子: ' + data.reason);
    },
    
    onGameOver: function(data) {
        console.log('[OnlineGame] Game over:', data);
        
        const iWon = data.winner === this.myColor;
        let message = iWon ? '你赢了！' : '你输了';
        
        switch (data.reason) {
            case 'five_in_row':
                message += ' (五连珠)';
                break;
            case 'surrender':
                message = iWon ? '对手投降，你赢了！' : '你投降了';
                break;
            case 'disconnect_timeout':
                message = iWon ? '对手断线超时，你赢了！' : '断线超时，你输了';
                break;
        }
        
        // 显示胜利特效
        if (iWon && data.winLine && typeof VisualFX !== 'undefined') {
            VisualFX.drawWinLine(data.winLine, GameState.lineEffect || 'lightning');
            VisualFX.startCelebration(GameState.winEffect || 'fireworks');
        }
        
        GameState.gameActive = false;
        OnlineUI.showGameOverModal(iWon, message);
    },
    
    onTurnChanged: function(data) {
        console.log('[OnlineGame] Turn changed:', data);
        GameState.currentPlayer = data.currentTurn === 'black' ? 1 : 2;
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
    },
    
    // ========== 技能事件处理 ==========
    
    onSkillUsed: function(data) {
        console.log('[OnlineGame] Skill used:', data);
        
        // 更新技能使用状态
        if (data.player === this.myColor) {
            this.mySkillUsed = true;
        } else {
            this.opponentSkillUsed = true;
        }
        
        // 应用棋盘变化
        if (data.changes) {
            for (const change of data.changes) {
                if (change.value !== undefined) {
                    GameState.board[change.row][change.col] = change.value;
                }
            }
        }
        
        // 渲染
        if (typeof renderBoard === 'function') {
            renderBoard();
        }
        
        // 显示技能特效提示
        OnlineUI.showToast((data.player === this.myColor ? '你' : '对手') + '使用了技能');
        
        // 更新 UI
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
    },
    
    onSkillInvalid: function(data) {
        console.log('[OnlineGame] Skill invalid:', data);
        OnlineUI.showToast('技能使用无效: ' + data.reason);
    },
    
    onSkillEffect: function(data) {
        console.log('[OnlineGame] Skill effect:', data);
        
        // 处理技能效果（炸弹爆炸、巫毒消失等）
        if (data.effects) {
            for (const effect of data.effects) {
                if (effect.type === 'bomb_explode') {
                    // 炸弹爆炸效果
                    for (const exp of effect.explosions) {
                        GameState.board[exp.row][exp.col] = 0;
                    }
                    OnlineUI.showToast('炸弹爆炸！');
                } else if (effect.type === 'voodoo_expire') {
                    // 巫毒腐蚀生效
                    GameState.board[effect.row][effect.col] = 0;
                    OnlineUI.showToast('巫毒腐蚀生效！');
                }
            }
        }
        
        if (typeof renderBoard === 'function') {
            renderBoard();
        }
    },
    
    // ========== 投降悔棋处理 ==========
    
    onPlayerSurrendered: function(data) {
        console.log('[OnlineGame] Player surrendered:', data);
        // game_over 事件会处理后续
    },
    
    onUndoRequested: function(data) {
        console.log('[OnlineGame] Undo requested:', data);
        OnlineUI.showUndoRequestModal();
    },
    
    onUndoResponse: function(data) {
        console.log('[OnlineGame] Undo response:', data);
        
        // 更新悔棋使用状态
        if (data.undoUsed) {
            this.myUndoUsed = data.undoUsed[this.myColor];
            this.opponentUndoUsed = data.undoUsed[this.myColor === 'black' ? 'white' : 'black'];
        }
        
        if (data.accepted) {
            OnlineUI.showToast('悔棋请求被同意');
        } else {
            OnlineUI.showToast('悔棋请求被拒绝');
        }
    },
    
    onUndoExecuted: function(data) {
        console.log('[OnlineGame] Undo executed:', data);
        
        // 恢复棋盘状态
        if (data.undoneMove) {
            GameState.board[data.undoneMove.row][data.undoneMove.col] = 0;
        }
        
        // 更新回合
        GameState.currentPlayer = data.currentTurn === 'black' ? 1 : 2;
        
        // 更新悔棋状态
        if (data.undoUsed) {
            this.myUndoUsed = data.undoUsed[this.myColor];
            this.opponentUndoUsed = data.undoUsed[this.myColor === 'black' ? 'white' : 'black'];
        }
        
        if (typeof renderBoard === 'function') {
            renderBoard();
        }
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
    },
    
    // ========== 断线重连处理 ==========
    
    onOpponentDisconnected: function(data) {
        console.log('[OnlineGame] Opponent disconnected:', data);
        OnlineUI.showDisconnectWarning(data.timeout);
    },
    
    onOpponentReconnected: function() {
        console.log('[OnlineGame] Opponent reconnected');
        OnlineUI.hideDisconnectWarning();
        OnlineUI.showToast('对手已重连');
    },
    
    onReconnectSuccess: function(data) {
        console.log('[OnlineGame] Reconnect success:', data);
        // TODO: 恢复游戏状态
    },
    
    onReconnectFailed: function(data) {
        console.log('[OnlineGame] Reconnect failed:', data);
        OnlineUI.showToast('重连失败: ' + data.reason);
    },
    
    handleDisconnect: function(reason) {
        console.log('[OnlineGame] Disconnected:', reason);
        if (GameState.online && GameState.online.isOnline) {
            OnlineUI.showToast('与服务器断开连接');
        }
    },
    
    // ========== 再来一局 ==========
    
    onRematchRequest: function(data) {
        console.log('[OnlineGame] Rematch request:', data);
        OnlineUI.showRematchRequestModal();
    },
    
    // ========== 错误处理 ==========
    
    onServerError: function(data) {
        console.error('[OnlineGame] Server error:', data);
        OnlineUI.showToast('服务器错误: ' + data.message);
    },
    
    // ========== 发送操作 ==========
    
    /**
     * 发送落子
     */
    sendMove: function(row, col) {
        SocketClient.emit('client:place_piece', { row, col });
    },
    
    /**
     * 发送技能使用
     */
    sendSkill: function(skillId, targets) {
        SocketClient.emit('client:use_skill', { skillId, targets });
    },
    
    /**
     * 发送投降
     */
    sendSurrender: function() {
        SocketClient.emit('client:surrender', {});
    },
    
    /**
     * 发送悔棋请求
     */
    sendUndoRequest: function() {
        if (this.myUndoUsed) {
            OnlineUI.showToast('你已经使用过悔棋了');
            return;
        }
        SocketClient.emit('client:request_undo', {});
    },
    
    /**
     * 回应悔棋请求
     */
    respondUndo: function(accept) {
        SocketClient.emit('client:respond_undo', { accept });
    },
    
    /**
     * 发送猜拳选择
     */
    sendRpsChoice: function(choice) {
        this.myRpsChoice = choice;
        SocketClient.emit('client:rps_choice', { choice });
    },
    
    /**
     * 发送选边
     */
    sendSideChoice: function(side) {
        SocketClient.emit('client:side_choice', { side });
    },
    
    /**
     * 请求再来一局
     */
    requestRematch: function() {
        SocketClient.emit('client:request_rematch', {});
    },
    
    /**
     * 接受再来一局
     */
    acceptRematch: function() {
        SocketClient.emit('client:accept_rematch', {});
    },
    
    // ========== 公共大厅事件处理 ==========
    
    /**
     * 收到大厅房间列表
     */
    onLobbyList: function(data) {
        console.log('[OnlineGame] Lobby list:', data);
        if (typeof OnlineUI !== 'undefined') {
            OnlineUI.renderRoomList(data.rooms || []);
        }
    },
    
    /**
     * 大厅房间创建成功（复用现有的等待房间流程）
     */
    onLobbyRoomCreated: function(data) {
        console.log('[OnlineGame] Lobby room created:', data);
        this.roomId = data.roomId;
        this.role = 'host';
        // 清除创建超时定时器
        if (OnlineUI._createTimeout) {
            clearTimeout(OnlineUI._createTimeout);
            OnlineUI._createTimeout = null;
        }
        OnlineUI.showWaitingRoom(data.roomId, { source: '公共大厅' });
    },
    
    /**
     * 大厅房间加入失败
     */
    onLobbyJoinFailed: function(data) {
        console.log('[OnlineGame] Lobby join failed:', data);
        OnlineUI.showToast(data.reason || '加入房间失败');
    },
    
    /**
     * 大厅房间列表更新（有人创建/加入/离开时自动推送）
     */
    onLobbyUpdate: function(data) {
        console.log('[OnlineGame] Lobby update:', data);
        if (typeof OnlineUI !== 'undefined') {
            OnlineUI.renderRoomList(data.rooms || []);
        }
    },
    
    // ========== 工具方法 ==========
    
    /**
     * 检查是否轮到我
     */
    isMyTurn: function() {
        if (!GameState.online || !GameState.online.isOnline) return true;
        const currentColor = GameState.currentPlayer === 1 ? 'black' : 'white';
        return currentColor === this.myColor;
    },
    
    /**
     * 重置状态
     */
    resetState: function() {
        this.roomId = null;
        this.role = null;
        this.myColor = null;
        this.opponentNickname = null;
        this.opponentPieceStyle = null;
        this.mySkillUsed = false;
        this.opponentSkillUsed = false;
        this.myUndoUsed = false;
        this.opponentUndoUsed = false;
        this.rpsPhase = false;
        this.myRpsChoice = null;
        
        // 重置初始化标记，确保下次连接时重新注册事件监听
        this._initialized = false;
        
        // 重置 GameState 的联网状态
        if (GameState.online) {
            GameState.online.isOnline = false;
        }
    }
};

// 暴露到全局
window.OnlineGame = OnlineGame;
