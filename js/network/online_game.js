// ============================================
// Project Lysh - Online Game Logic
// 联网对战游戏逻辑
// ============================================

/**
 * @typedef {{ nickname: string, pieceStyle?: string, playerId: string }} RoomPlayerJoinedPayload
 * @typedef {{ timeout: number, round: number }} RoomRpsStartPayload
 * @typedef {{ hostChoice: 'rock'|'paper'|'scissors', guestChoice: 'rock'|'paper'|'scissors', result: 'tie'|'decided', winner?: 'host'|'guest' }} RoomRpsResultPayload
 * @typedef {{ timeout: number }} RoomChooseSidePayload
 * @typedef {{ blackPlayer: string, whitePlayer: string, blackSocketId: string, whiteSocketId: string }} RoomSidesDecidedPayload
 * @typedef {{ firstPicker: 'black'|'white', availableSkills: string[], timeoutMs: number }} RoomDraftStartPayload
 * @typedef {{ picked: { black?: string, white?: string }, currentPicker: 'black'|'white'|null, remainMs?: number }} RoomDraftUpdatePayload
 * @typedef {{ playerSkills: { black: string|null, white: string|null } }} RoomDraftCompletePayload
 * @typedef {{ blackPlayer: string, whitePlayer: string, playerSkills?: { black: string|null, white: string|null }, timeRemaining?: { black:number, white:number }, match?: unknown }} RoomGameStartPayload
 * @typedef {{ row: number, col: number, player: 'black'|'white', pieceValue: number, nextTurn?: 'black'|'white', requestedRow?: number, requestedCol?: number, resolvedRow?: number, resolvedCol?: number, chaosApplied?: boolean, state?: Record<string, unknown> }} RoomPiecePlacedPayload
 * @typedef {{ winner: 'black'|'white', winLine?: { row: number, col: number }[], reason: 'five_in_row'|'surrender'|'disconnect_timeout'|string }} RoomGameOverPayload
 * @typedef {{ currentTurn: 'black'|'white' }} RoomTurnChangedPayload
 * @typedef {{ row: number, col: number, value?: number }} RoomSkillChange
 * @typedef {{ player: 'black'|'white', skillId: string, targets?: Record<string, unknown>, changes?: RoomSkillChange[], specialEffect?: unknown, skillUsed?: Record<string, boolean>, state?: Record<string, unknown> }} RoomSkillUsedPayload
 * @typedef {{ type: 'bomb_explode', row: number, col: number, explosions: { row: number, col: number, was: number }[] } | { type: 'voodoo_expire', row: number, col: number } | Record<string, unknown>} RoomSkillEffectItem
 * @typedef {{ effects?: RoomSkillEffectItem[] }} RoomSkillEffectPayload
 * @typedef {{ timeRemaining: { black:number, white:number }, currentTurn:'black'|'white', ts:number }} RoomTimerSyncPayload
 * @typedef {{ loser:'black'|'white', winner:'black'|'white' }} RoomTimeOutPayload
 * @typedef {{ winner:'host'|'guest', winnerColor:'black'|'white', scores:{host:number,guest:number} }} RoomMatchOverPayload
 * @typedef {{ player: string, socketId: string }} RoomPlayerSurrenderedPayload
 * @typedef {{ fromPlayer: 'black'|'white' }} RoomUndoRequestedPayload
 * @typedef {{ accepted: boolean, byPlayer: 'black'|'white', undoUsed?: Record<'black'|'white', boolean> }} RoomUndoResponsePayload
 * @typedef {{ undoneMove?: { row: number, col: number }, currentTurn: 'black'|'white', undoUsed?: Record<'black'|'white', boolean> }} RoomUndoExecutedPayload
 * @typedef {{ timeout: number }} RoomOpponentDisconnectedPayload
 * @typedef {{ fromPlayer: 'host'|'guest' }} RoomRematchRequestPayload
 */
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
    pendingSkill: null,
    draftState: null,
    matchState: null,
    
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
        socket.on('room:draft_start', this.onDraftStart.bind(this));
        socket.on('room:draft_update', this.onDraftUpdate.bind(this));
        socket.on('room:draft_complete', this.onDraftComplete.bind(this));
        
        // 游戏事件
        socket.on('room:game_start', this.onGameStart.bind(this));
        socket.on('room:piece_placed', this.onPiecePlaced.bind(this));
        socket.on('server:invalid_move', this.onInvalidMove.bind(this));
        socket.on('room:game_over', this.onGameOver.bind(this));
        socket.on('room:turn_changed', this.onTurnChanged.bind(this));
        socket.on('room:timer_sync', this.onTimerSync.bind(this));
        socket.on('room:time_out', this.onTimeOut.bind(this));
        socket.on('room:match_over', this.onMatchOver.bind(this));
        
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
    
    /** @param {RoomPlayerJoinedPayload} data */
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
    
    /** @param {RoomRpsStartPayload} data */
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
    
    /** @param {RoomRpsResultPayload} data */
    onRpsResult: function(data) {
        console.log('[OnlineGame] RPS result:', data);
        this.rpsPhase = false;
        
        const myChoice = this.role === 'host' ? data.hostChoice : data.guestChoice;
        const opponentChoice = this.role === 'host' ? data.guestChoice : data.hostChoice;
        
        OnlineUI.showRpsResult(myChoice, opponentChoice, data.result, data.winner === this.role);
    },
    
    /** @param {RoomChooseSidePayload} data */
    onChooseSide: function(data) {
        console.log('[OnlineGame] Choose side:', data);
        if (typeof OnlineUI.hideGameOverModal === 'function') {
            OnlineUI.hideGameOverModal();
        }
        OnlineUI.showSideChoiceModal(data.timeout);
    },
    
    /** @param {RoomSidesDecidedPayload} data */
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

    /** @param {RoomDraftStartPayload} data */
    onDraftStart: function(data) {
        console.log('[OnlineGame] Draft start:', data);
        this.draftState = {
            availableSkills: Array.isArray(data.availableSkills) ? data.availableSkills.slice() : [],
            currentPicker: data.firstPicker,
            picked: {},
            remainMs: Number.isFinite(data.timeoutMs) ? data.timeoutMs : 0
        };
        if (typeof OnlineUI.showDraftModal === 'function') {
            OnlineUI.showDraftModal(this.draftState.availableSkills, this.myColor, this.sendDraftPick.bind(this));
            if (typeof OnlineUI.updateDraftState === 'function') {
                OnlineUI.updateDraftState(this.draftState, this.myColor);
            }
        } else if (typeof showScreen === 'function') {
            showScreen('draft');
        }
    },

    /** @param {RoomDraftUpdatePayload} data */
    onDraftUpdate: function(data) {
        console.log('[OnlineGame] Draft update:', data);
        this.draftState = this.draftState || {};
        this.draftState.picked = data.picked || {};
        this.draftState.currentPicker = data.currentPicker;
        this.draftState.remainMs = Number.isFinite(data.remainMs) ? data.remainMs : this.draftState.remainMs;
        if (typeof OnlineUI.updateDraftState === 'function') {
            OnlineUI.updateDraftState(this.draftState, this.myColor);
        }
    },

    /** @param {RoomDraftCompletePayload} data */
    onDraftComplete: function(data) {
        console.log('[OnlineGame] Draft complete:', data);
        if (data && data.playerSkills) {
            GameState.playerSkills = {
                [MAPLE]: data.playerSkills.black || null,
                [SUN]: data.playerSkills.white || null
            };
            playerSkills = GameState.playerSkills;
        }
        if (typeof OnlineUI.hideDraftModal === 'function') {
            OnlineUI.hideDraftModal();
        }
    },
    
    // ========== 游戏事件处理 ==========

    applyStateDelta: function(state) {
        if (!state || typeof state !== 'object') return;
        if (state.currentTurn) {
            GameState.currentPlayer = state.currentTurn === 'black' ? MAPLE : SUN;
            currentPlayer = GameState.currentPlayer;
        }
        if (state.skillUsed) {
            GameState.skillUsed = {
                [MAPLE]: !!state.skillUsed.black,
                [SUN]: !!state.skillUsed.white
            };
            skillUsed = GameState.skillUsed;
        }
        if (state.playerSkills) {
            GameState.playerSkills = {
                [MAPLE]: state.playerSkills.black || null,
                [SUN]: state.playerSkills.white || null
            };
            playerSkills = GameState.playerSkills;
        }
        if (state.chaosDebuff) {
            GameState.chaosDebuff = {
                [MAPLE]: Number(state.chaosDebuff.black || 0),
                [SUN]: Number(state.chaosDebuff.white || 0)
            };
            chaosDebuff = GameState.chaosDebuff;
        }
        if (Number.isFinite(state.shortBattleTurns)) {
            GameState.shortBattleTurns = state.shortBattleTurns;
            shortBattleTurns = GameState.shortBattleTurns;
        }
        if (Array.isArray(state.territoryZones)) {
            GameState.territoryZones = state.territoryZones.map((z) => ({
                r: z.row,
                c: z.col,
                owner: z.player === 'black' ? MAPLE : SUN,
                turns: Number(z.turnsLeft || 0)
            }));
            territoryZones = GameState.territoryZones;
            if (typeof updateTerritoriesUI === 'function') updateTerritoriesUI();
        }
        if (typeof state.isDoubleMoveActive === 'boolean') {
            GameState.isDoubleMoveActive = state.isDoubleMoveActive;
            isDoubleMoveActive = GameState.isDoubleMoveActive;
        }
        if (state.bombTarget) {
            GameState.bombTarget = state.bombTarget === 'black' ? MAPLE : SUN;
        } else if (state.bombTarget === null) {
            GameState.bombTarget = null;
        }
        bombTarget = GameState.bombTarget;
        if (state.timeRemaining) {
            GameState.timeRemaining = {
                [MAPLE]: Number.isFinite(state.timeRemaining.black) ? state.timeRemaining.black : GameState.timeRemaining[MAPLE],
                [SUN]: Number.isFinite(state.timeRemaining.white) ? state.timeRemaining.white : GameState.timeRemaining[SUN]
            };
            timeRemaining = GameState.timeRemaining;
        }
    },
    
    /** @param {RoomGameStartPayload} data */
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
        this.pendingSkill = null;
        this.matchState = data.match || null;
        if (typeof OnlineUI.updateMatchScore === 'function') {
            OnlineUI.updateMatchScore(this.matchState, this.role);
        }

        if (data.playerSkills) {
            GameState.playerSkills = {
                [MAPLE]: data.playerSkills.black || null,
                [SUN]: data.playerSkills.white || null
            };
            playerSkills = GameState.playerSkills;
        }
        if (data.timeRemaining) {
            GameState.timeRemaining = {
                [MAPLE]: Number.isFinite(data.timeRemaining.black) ? data.timeRemaining.black : 240,
                [SUN]: Number.isFinite(data.timeRemaining.white) ? data.timeRemaining.white : 240
            };
            timeRemaining = GameState.timeRemaining;
        }
        
        // 启动游戏
        if (typeof startOnlineGame === 'function') {
            startOnlineGame(this.myColor, this.opponentNickname, data);
        }
        
        // 更新 UI 显示对手信息
        OnlineUI.updateGameUI();
    },
    
    /** @param {RoomPiecePlacedPayload} data */
    onPiecePlaced: function(data) {
        console.log('[OnlineGame] Piece placed:', data);
        const r = Number.isInteger(data.resolvedRow) ? data.resolvedRow : data.row;
        const c = Number.isInteger(data.resolvedCol) ? data.resolvedCol : data.col;
        
        // 使用专门的处理函数渲染棋子
        if (typeof handleOnlineOpponentMove === 'function') {
            handleOnlineOpponentMove(r, c, data.pieceValue);
        } else {
            // 备用：直接更新并渲染
            GameState.board[r][c] = data.pieceValue;
            board[r][c] = data.pieceValue;
            const cell = getCell(r, c);
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
        this.applyStateDelta(data.state);
        if (data.chaosApplied) {
            OnlineUI.showToast('混沌干扰触发');
        }
    },
    
    onInvalidMove: function(data) {
        console.log('[OnlineGame] Invalid move:', data);
        OnlineUI.showToast('无效落子: ' + data.reason);
    },
    
    /** @param {RoomGameOverPayload} data */
    onGameOver: function(data) {
        console.log('[OnlineGame] Game over:', data);
        this.applyStateDelta(data.state);
        if (data.match) {
            this.matchState = data.match;
            if (typeof OnlineUI.updateMatchScore === 'function') {
                OnlineUI.updateMatchScore(this.matchState, this.role);
            }
        }
        
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
            case 'timeout':
                message = iWon ? '对手超时，你赢了！' : '你超时了';
                break;
            case 'bomb_explode':
                message = iWon ? '炸弹引爆，你赢了！' : '炸弹引爆，你输了';
                break;
        }
        
        // 显示胜利特效
        if (iWon && data.winLine && typeof VisualFX !== 'undefined') {
            VisualFX.drawWinLine(data.winLine, GameState.lineEffect || 'lightning');
            VisualFX.startCelebration(GameState.winEffect || 'fireworks');
        }
        
        GameState.gameActive = false;
        gameActive = false;

        const isBo3InterRound = !!(data.match && data.match.mode === 'bo3' && !data.match.over);
        if (isBo3InterRound) {
            OnlineUI.showToast('本局结束，进入下一局选边');
            return;
        }
        OnlineUI.showGameOverModal(iWon, message);
    },
    
    /** @param {RoomTurnChangedPayload} data */
    onTurnChanged: function(data) {
        console.log('[OnlineGame] Turn changed:', data);
        GameState.currentPlayer = data.currentTurn === 'black' ? 1 : 2;
        currentPlayer = GameState.currentPlayer;
        this.applyStateDelta(data.state);
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
    },

    /** @param {RoomTimerSyncPayload} data */
    onTimerSync: function(data) {
        if (!data || !data.timeRemaining) return;
        GameState.timeRemaining = {
            [MAPLE]: Number.isFinite(data.timeRemaining.black) ? data.timeRemaining.black : GameState.timeRemaining[MAPLE],
            [SUN]: Number.isFinite(data.timeRemaining.white) ? data.timeRemaining.white : GameState.timeRemaining[SUN]
        };
        timeRemaining = GameState.timeRemaining;
        if (data.currentTurn) {
            GameState.currentPlayer = data.currentTurn === 'black' ? MAPLE : SUN;
            currentPlayer = GameState.currentPlayer;
        }
        if (typeof updateDynamicUI === 'function') updateDynamicUI();
    },

    /** @param {RoomTimeOutPayload} data */
    onTimeOut: function(data) {
        console.log('[OnlineGame] Timeout:', data);
        OnlineUI.showToast('超时判负');
    },

    /** @param {RoomMatchOverPayload} data */
    onMatchOver: function(data) {
        console.log('[OnlineGame] Match over:', data);
        this.matchState = {
            mode: 'bo3',
            scores: data.scores || { host: 0, guest: 0 },
            over: true,
            winner: data.winner
        };
        if (typeof OnlineUI.updateMatchScore === 'function') {
            OnlineUI.updateMatchScore(this.matchState, this.role);
        }
        OnlineUI.showToast('BO3 比赛结束');
    },
    
    // ========== 技能事件处理 ==========
    
    /** @param {RoomSkillUsedPayload} data */
    onSkillUsed: function(data) {
        console.log('[OnlineGame] Skill used:', data);
        
        // 更新技能使用状态
        if (data.player === this.myColor) {
            this.mySkillUsed = true;
            this.pendingSkill = null;
            GameState.activeEffect = null;
            activeEffect = null;
        } else {
            this.opponentSkillUsed = true;
        }
        
        // 应用棋盘变化
        if (data.changes) {
            for (const change of data.changes) {
                if (change.value !== undefined) {
                    GameState.board[change.row][change.col] = change.value;
                    if (Array.isArray(board) && Array.isArray(board[change.row])) {
                        board[change.row][change.col] = change.value;
                    }
                }
            }
        }
        
        // 渲染
        if (typeof renderBoard === 'function') {
            renderBoard();
        }
        
        // 显示技能特效提示
        OnlineUI.showToast((data.player === this.myColor ? '你' : '对手') + '使用了技能');
        this.applyStateDelta(data.state);
        if (data.specialEffect && data.specialEffect.type === 'bomb_activated') {
            OnlineUI.showToast('炸弹已激活');
        }
        
        // 更新 UI
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
    },
    
    onSkillInvalid: function(data) {
        console.log('[OnlineGame] Skill invalid:', data);
        OnlineUI.showToast('技能使用无效: ' + data.reason);
    },
    
    /** @param {RoomSkillEffectPayload} data */
    onSkillEffect: function(data) {
        console.log('[OnlineGame] Skill effect:', data);
        
        // 处理技能效果（炸弹爆炸、巫毒消失等）
        if (data.effects) {
            for (const effect of data.effects) {
                if (effect.type === 'bomb_explode') {
                    // 炸弹爆炸效果
                    for (const exp of effect.explosions) {
                        GameState.board[exp.row][exp.col] = 0;
                        if (Array.isArray(board) && Array.isArray(board[exp.row])) {
                            board[exp.row][exp.col] = 0;
                        }
                    }
                    OnlineUI.showToast('炸弹爆炸！');
                } else if (effect.type === 'voodoo_expire') {
                    // 巫毒腐蚀生效
                    GameState.board[effect.row][effect.col] = 0;
                    if (Array.isArray(board) && Array.isArray(board[effect.row])) {
                        board[effect.row][effect.col] = 0;
                    }
                    OnlineUI.showToast('巫毒腐蚀生效！');
                }
            }
        }
        
        if (typeof renderBoard === 'function') {
            renderBoard();
        }
    },
    
    // ========== 投降悔棋处理 ==========
    
    /** @param {RoomPlayerSurrenderedPayload} data */
    onPlayerSurrendered: function(data) {
        console.log('[OnlineGame] Player surrendered:', data);
        // game_over 事件会处理后续
    },
    
    /** @param {RoomUndoRequestedPayload} data */
    onUndoRequested: function(data) {
        console.log('[OnlineGame] Undo requested:', data);
        OnlineUI.showUndoRequestModal();
    },
    
    /** @param {RoomUndoResponsePayload} data */
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
    
    /** @param {RoomUndoExecutedPayload} data */
    onUndoExecuted: function(data) {
        console.log('[OnlineGame] Undo executed:', data);
        
        // 恢复棋盘状态
        if (data.undoneMove) {
            GameState.board[data.undoneMove.row][data.undoneMove.col] = 0;
            if (Array.isArray(board) && Array.isArray(board[data.undoneMove.row])) {
                board[data.undoneMove.row][data.undoneMove.col] = 0;
            }
        }
        
        // 更新回合
        GameState.currentPlayer = data.currentTurn === 'black' ? 1 : 2;
        currentPlayer = GameState.currentPlayer;
        
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
    
    /** @param {RoomOpponentDisconnectedPayload} data */
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
        if (!data || !data.boardState) return;
        const state = data.boardState;
        if (data.roomId) this.roomId = data.roomId;
        if (data.role) this.role = data.role;
        if (data.myColor) this.myColor = data.myColor;
        if (data.opponent && data.opponent.nickname) {
            this.opponentNickname = data.opponent.nickname;
            this.opponentPieceStyle = data.opponent.pieceStyle || this.opponentPieceStyle;
        }
        if (data.match) {
            this.matchState = data.match;
            if (typeof OnlineUI.updateMatchScore === 'function') {
                OnlineUI.updateMatchScore(this.matchState, this.role);
            }
        }
        GameState.online = {
            isOnline: true,
            roomId: this.roomId,
            myColor: this.myColor,
            opponentNickname: this.opponentNickname,
            opponentPieceStyle: this.opponentPieceStyle
        };
        GameState.gameMode = 'online';
        gameMode = 'online';

        GameState.board = state.board || GameState.board;
        board = GameState.board;
        if (data.status === 'playing') {
            GameState.gameActive = true;
            gameActive = true;
            if (typeof showScreen === 'function') showScreen('game');
        } else {
            GameState.gameActive = false;
            gameActive = false;
        }
        this.applyStateDelta(state);
        if (Array.isArray(state.moveHistory)) {
            GameState.moveHistory = state.moveHistory;
        }
        if (typeof renderBoard === 'function') renderBoard();
        if (typeof updateDynamicUI === 'function') updateDynamicUI();
        OnlineUI.hideDisconnectWarning();
        if (SocketClient && typeof SocketClient.clearPendingReconnect === 'function') {
            SocketClient.clearPendingReconnect();
        }
        OnlineUI.showToast('重连成功，状态已恢复');
    },
    
    onReconnectFailed: function(data) {
        console.log('[OnlineGame] Reconnect failed:', data);
        if (SocketClient && typeof SocketClient.clearPendingReconnect === 'function') {
            SocketClient.clearPendingReconnect();
        }
        OnlineUI.showToast('重连失败: ' + data.reason);
    },
    
    handleDisconnect: function(reason) {
        console.log('[OnlineGame] Disconnected:', reason);
        if (GameState.online && GameState.online.isOnline) {
            OnlineUI.showToast('与服务器断开连接');
        }
    },
    
    // ========== 再来一局 ==========
    
    /** @param {RoomRematchRequestPayload} data */
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

    sendDraftPick: function(skillId) {
        SocketClient.emit('client:draft_pick', { skillId });
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

    activateOnlineSkill: function(skillId) {
        if (!this.isMyTurn()) {
            OnlineUI.showToast('当前不是你的回合');
            return;
        }
        if (this.mySkillUsed) {
            OnlineUI.showToast('技能已使用');
            return;
        }

        const instantSkills = new Set(['double', 'chaos', 'short_battle', 'bomb']);
        if (instantSkills.has(skillId)) {
            this.sendSkill(skillId, {});
            return;
        }

        this.pendingSkill = { id: skillId, step: 0, data: {} };
        GameState.activeEffect = 'online_pending_skill';
        activeEffect = GameState.activeEffect;
        const hintMap = {
            voodoo: '请选择目标棋子',
            zone: '请选择领地中心',
            move_self: '请选择己方棋子',
            move_enemy: '请选择敌方棋子',
            swap: '请选择己方棋子',
            god_hand: '请选择第一颗棋子'
        };
        OnlineUI.showToast(hintMap[skillId] || '请选择技能目标');
    },

    hasPendingSkill: function() {
        return !!this.pendingSkill;
    },

    clearPendingSkill: function() {
        this.pendingSkill = null;
        GameState.activeEffect = null;
        activeEffect = null;
    },

    handleSkillCellClick: function(r, c) {
        if (!this.pendingSkill) return false;
        const skillId = this.pendingSkill.id;
        const val = GameState.board[r][c];
        const myPiece = GameState.currentPlayer;
        const enemyPiece = myPiece === MAPLE ? SUN : MAPLE;

        if (skillId === 'voodoo') {
            if (val === EMPTY || val === CORRODED) return true;
            this.sendSkill(skillId, { pos: { row: r, col: c } });
            this.clearPendingSkill();
            return true;
        }

        if (skillId === 'zone') {
            this.sendSkill(skillId, { pos: { row: r, col: c } });
            this.clearPendingSkill();
            return true;
        }

        if (skillId === 'move_self' || skillId === 'move_enemy') {
            if (!this.pendingSkill.data.from) {
                const ok = skillId === 'move_self' ? val === myPiece : val === enemyPiece;
                if (!ok) return true;
                this.pendingSkill.data.from = { row: r, col: c };
                OnlineUI.showToast('请选择目标空位');
                return true;
            }
            if (val !== EMPTY) return true;
            this.sendSkill(skillId, {
                from: this.pendingSkill.data.from,
                to: { row: r, col: c }
            });
            this.clearPendingSkill();
            return true;
        }

        if (skillId === 'swap') {
            if (!this.pendingSkill.data.own) {
                if (val !== myPiece) return true;
                this.pendingSkill.data.own = { row: r, col: c };
                OnlineUI.showToast('请选择敌方棋子');
                return true;
            }
            if (val !== enemyPiece) return true;
            this.sendSkill(skillId, {
                own: this.pendingSkill.data.own,
                opponent: { row: r, col: c }
            });
            this.clearPendingSkill();
            return true;
        }

        if (skillId === 'god_hand') {
            const moves = this.pendingSkill.data.moves || [];
            if (!this.pendingSkill.data.from) {
                if (val === EMPTY || val === CORRODED) return true;
                this.pendingSkill.data.from = { row: r, col: c };
                OnlineUI.showToast('请选择落点');
                return true;
            }
            if (val !== EMPTY) return true;
            moves.push({
                from: this.pendingSkill.data.from,
                to: { row: r, col: c }
            });
            this.pendingSkill.data.moves = moves;
            this.pendingSkill.data.from = null;
            if (moves.length >= 2) {
                this.sendSkill(skillId, { moves });
                this.clearPendingSkill();
            } else {
                OnlineUI.showToast('请选择第二颗棋子');
            }
            return true;
        }

        return false;
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
        this.pendingSkill = null;
        this.draftState = null;
        this.matchState = null;
        if (typeof OnlineUI !== 'undefined' && typeof OnlineUI.updateMatchScore === 'function') {
            OnlineUI.updateMatchScore(null, null);
        }
        
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
