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
 * @typedef {{ bombTarget?: 'black'|'white', target?: 'black'|'white', timeRemaining?: { black:number, white:number } }} RoomBombActivatedPayload
 * @typedef {{ loser:'black'|'white', winner:'black'|'white' }} RoomTimeOutPayload
 * @typedef {{ winner:'host'|'guest', winnerColor:'black'|'white', scores:{host:number,guest:number} }} RoomMatchOverPayload
 * @typedef {{ player: string, socketId: string }} RoomPlayerSurrenderedPayload
 * @typedef {{ fromPlayer: 'black'|'white', requesterId?: string, requesterName?: string, message?: string, timeoutMs?: number }} RoomUndoRequestedPayload
 * @typedef {{ accepted: boolean, byPlayer: 'black'|'white', requesterColor?: 'black'|'white', undoUsed?: Record<'black'|'white', boolean>, reason?: string }} RoomUndoResponsePayload
 * @typedef {{ undoneMove?: { row: number, col: number }, boardState?: Record<string, unknown>, currentTurn: 'black'|'white', undoUsed?: Record<'black'|'white', boolean> }} RoomUndoExecutedPayload
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
    undoRequestPending: false,
    
    // 猜拳状态
    rpsPhase: false,
    myRpsChoice: null,
    pendingSkill: null,
    draftState: null,
    matchState: null,
    guestNickname: null,
    _pendingMarkedCells: [],
    _lastBombActivationAt: 0,
    
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
        socket.on('room:bomb_activated', this.onBombActivated.bind(this));
        
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

    generateGuestNickname: function() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let suffix = '';
        for (let i = 0; i < 4; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return '游客' + suffix;
    },

    getGuestNickname: function() {
        if (!this.guestNickname) {
            this.guestNickname = this.generateGuestNickname();
        }
        return this.guestNickname;
    },

    resetGuestNickname: function() {
        this.guestNickname = null;
    },
    
    // ========== 房间操作 ==========
    
    /**
     * 创建房间
     */
    createRoom: function(nickname) {
        const pieceStyle = GameState.pieceStyle || 'classic';
        const guestName = this.getGuestNickname();
        SocketClient.emit('client:create_room', {
            nickname: nickname || guestName,
            pieceStyle: pieceStyle,
            matchMode: 'single'
        });
    },
    
    /**
     * 加入房间
     */
    joinRoom: function(roomId, nickname) {
        const pieceStyle = GameState.pieceStyle || 'classic';
        const guestName = this.getGuestNickname();
        SocketClient.emit('client:join_room', {
            roomId: roomId,
            nickname: nickname || guestName,
            pieceStyle: pieceStyle
        });
    },
    
    /**
     * 离开房间
     */
    leaveRoom: function(options) {
        const opts = options || {};
        const silent = !!opts.silent;
        const skipShowScreen = !!opts.skipShowScreen;
        const skipFxClear = !!opts.skipFxClear;

        if (typeof SocketClient !== 'undefined' && SocketClient && typeof SocketClient.disconnect === 'function') {
            SocketClient.disconnect();
        }
        if (typeof SocketClient !== 'undefined' && SocketClient && typeof SocketClient.clearPendingReconnect === 'function') {
            SocketClient.clearPendingReconnect();
        }

        this.resetState();

        if (typeof OnlineUI !== 'undefined' && OnlineUI && typeof OnlineUI.hideAllModals === 'function') {
            OnlineUI.hideAllModals();
        }
        if (!silent && typeof OnlineUI !== 'undefined' && OnlineUI && typeof OnlineUI.showToast === 'function') {
            OnlineUI.showToast('已离开房间');
        }
        if (!skipFxClear) {
            // 清除特效，防止连珠/烟花残留
            if (typeof FxHost !== 'undefined' && FxHost.clear) FxHost.clear();
            if (typeof VisualFX !== 'undefined' && VisualFX.clear) VisualFX.clear();
        }
        // 返回主菜单
        if (!skipShowScreen && typeof showScreen === 'function') showScreen('main');
    },
    
    // ========== 房间事件处理 ==========
    
    onRoomCreated: function(data) {
        console.log('[OnlineGame] Room created:', data);
        this.roomId = data.roomId;
        this.role = 'host';
        if (data && data.nickname) {
            this.guestNickname = data.nickname;
        }
        
        // 显示等待界面（房间号连线）
        OnlineUI.showWaitingRoom(data.roomId, {
            source: '房间号连线',
            hostName: this.getGuestNickname()
        });
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

    applyBoardStateSnapshot: function(state) {
        if (!state || typeof state !== 'object') return;
        if (Array.isArray(state.board)) {
            GameState.board = state.board.map((row) => Array.isArray(row) ? row.slice() : []);
            board = GameState.board;
        }

        this.applyStateDelta(state);

        if (Array.isArray(state.moveHistory)) {
            GameState.moveHistory = state.moveHistory.map((m) => ({ ...m }));
            GameState.moveCount = GameState.moveHistory.length;
            moveCount = GameState.moveCount;
            const last = GameState.moveHistory.length > 0
                ? GameState.moveHistory[GameState.moveHistory.length - 1]
                : null;
            if (last && Number.isInteger(last.row) && Number.isInteger(last.col)) {
                const pieceValue = last.player === 'black' ? MAPLE : SUN;
                GameState.lastMove = { r: last.row, c: last.col, player: pieceValue };
                lastMove = GameState.lastMove;
            } else {
                GameState.lastMove = null;
                lastMove = null;
            }
        } else {
            GameState.moveHistory = [];
            GameState.moveCount = 0;
            moveCount = 0;
            GameState.lastMove = null;
            lastMove = null;
        }

        if (state.skillUsed) {
            const myPiece = this.myColor === 'black' ? MAPLE : SUN;
            const enemyPiece = myPiece === MAPLE ? SUN : MAPLE;
            this.mySkillUsed = !!GameState.skillUsed[myPiece];
            this.opponentSkillUsed = !!GameState.skillUsed[enemyPiece];
        }
        if (state.undoUsed) {
            this.myUndoUsed = !!state.undoUsed[this.myColor];
            this.opponentUndoUsed = !!state.undoUsed[this.myColor === 'black' ? 'white' : 'black'];
        }
        this.syncUndoButtonState();

        if (typeof renderBoard === 'function') renderBoard();
        if (typeof updateLastMoveMarker === 'function') updateLastMoveMarker();
        if (typeof updateDynamicUI === 'function') updateDynamicUI();
        this.syncBombAudioState();
    },

    clearPendingMarks: function() {
        if (!Array.isArray(this._pendingMarkedCells)) {
            this._pendingMarkedCells = [];
            return;
        }
        for (const cell of this._pendingMarkedCells) {
            if (cell && cell.style) {
                cell.style.opacity = '1';
            }
        }
        this._pendingMarkedCells = [];
    },

    markPendingCell: function(row, col) {
        if (typeof getCell !== 'function') return;
        const cell = getCell(row, col);
        if (!cell) return;
        cell.style.opacity = '0.5';
        if (!Array.isArray(this._pendingMarkedCells)) this._pendingMarkedCells = [];
        if (!this._pendingMarkedCells.includes(cell)) {
            this._pendingMarkedCells.push(cell);
        }
    },

    setPendingCastingMode: function(mode) {
        const boardEl = document.getElementById('board');
        if (!boardEl) return;
        boardEl.classList.remove('casting-voodoo', 'casting-territory', 'casting-move-src', 'casting-move-dest');
        if (mode) {
            boardEl.classList.add(mode);
        }
    },

    clearSkillCastingVisuals: function() {
        this.setPendingCastingMode(null);
        this.clearPendingMarks();
        document.querySelectorAll('.territory-preview').forEach((el) => el.classList.remove('territory-preview'));
    },

    getSkillDisplayName: function(skillId) {
        if (typeof t === 'function') {
            const meta = t(skillId, 'skills');
            if (meta && typeof meta === 'object' && typeof meta.name === 'string') {
                return meta.name;
            }
        }
        return skillId || '技能';
    },

    getToastText: function(key, fallback) {
        if (typeof t === 'function') {
            const value = t(key, 'toast');
            if (typeof value === 'string' && value.length > 0) return value;
        }
        return fallback;
    },

    syncBombAudioState: function() {
        if (typeof SoundEngine === 'undefined') return;

        const targetColor = GameState.bombTarget === MAPLE
            ? 'black'
            : (GameState.bombTarget === SUN ? 'white' : null);
        const currentColor = GameState.currentPlayer === MAPLE ? 'black' : 'white';

        if (!targetColor) {
            if (typeof SoundEngine.setCritical === 'function') {
                SoundEngine.setCritical(false);
            }
            if (SoundEngine.currentTrack === 'bomb' && typeof SoundEngine.switchTrack === 'function') {
                SoundEngine.switchTrack(GameState.userMusicPref);
            }
            return;
        }

        const remain = targetColor === 'black'
            ? Number(GameState.timeRemaining[MAPLE] || 0)
            : Number(GameState.timeRemaining[SUN] || 0);
        if (typeof SoundEngine.setCritical === 'function') {
            SoundEngine.setCritical(remain < 30);
        }

        if (currentColor === targetColor) {
            if (typeof SoundEngine.switchTrack === 'function') {
                SoundEngine.switchTrack('bomb');
            }
        } else if (SoundEngine.currentTrack === 'bomb' && typeof SoundEngine.switchTrack === 'function') {
            SoundEngine.switchTrack(GameState.userMusicPref);
        }
    },

    syncUndoButtonState: function() {
        const undoBtn = document.querySelector('[onclick="undoMove()"]');
        if (!undoBtn) return;
        const disabled = !!this.myUndoUsed;
        undoBtn.disabled = disabled;
        undoBtn.style.pointerEvents = disabled ? 'none' : 'auto';
        undoBtn.style.opacity = disabled ? '0.5' : '';
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
        this.undoRequestPending = false;
        this.pendingSkill = null;
        if (typeof OnlineUI.hideUndoPendingModal === 'function') {
            OnlineUI.hideUndoPendingModal();
        }
        this.syncUndoButtonState();
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
        this.syncBombAudioState();
    },
    
    /** @param {RoomPiecePlacedPayload} data */
    onPiecePlaced: function(data) {
        console.log('[OnlineGame] Piece placed:', data);
        const r = Number.isInteger(data.resolvedRow) ? data.resolvedRow : data.row;
        const c = Number.isInteger(data.resolvedCol) ? data.resolvedCol : data.col;
        const moverPiece = data.player === 'black' ? MAPLE : SUN;
        const prevChaos = Number(GameState.chaosDebuff && GameState.chaosDebuff[moverPiece] || 0);
        
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
        if (prevChaos > 0) {
            if (data.chaosApplied) {
                OnlineUI.showToast(this.getToastText('chaosTrigger', '混乱触发！落点偏移'));
                if (typeof SoundEngine !== 'undefined' && typeof SoundEngine.playChaos === 'function') {
                    SoundEngine.playChaos();
                }
            } else {
                OnlineUI.showToast(this.getToastText('chaosLucky', '混乱触发，但落点未偏移'));
                if (typeof SoundEngine !== 'undefined') {
                    if (typeof SoundEngine.playChaosLucky === 'function') {
                        SoundEngine.playChaosLucky();
                    } else if (typeof SoundEngine.playChaos === 'function') {
                        SoundEngine.playChaos();
                    }
                }
            }
        }
        this.syncBombAudioState();
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

        if (typeof SoundEngine !== 'undefined') {
            if (typeof SoundEngine.setCritical === 'function') {
                SoundEngine.setCritical(false);
            }
            if (data.reason === 'bomb_explode' && typeof SoundEngine.playExplosion === 'function') {
                SoundEngine.playExplosion();
            }
            if (iWon && typeof SoundEngine.playWinEffect === 'function') {
                SoundEngine.playWinEffect(GameState.winEffect || 'default');
            } else if (!iWon && typeof SoundEngine.playDefeat === 'function') {
                SoundEngine.playDefeat();
            }
            if (SoundEngine.currentTrack === 'bomb' && typeof SoundEngine.switchTrack === 'function') {
                SoundEngine.switchTrack(GameState.userMusicPref);
            }
        }

        // 双方都绘制连珠线，胜方额外播放庆祝
        if (data.winLine && typeof VisualFX !== 'undefined') {
            VisualFX.drawWinLine(data.winLine, GameState.winEffect || 'default');
            if (iWon && GameState.winCelebration && GameState.winCelebration !== 'default') {
                VisualFX.startCelebration(GameState.winCelebration);
            }
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
        this.syncBombAudioState();
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
        this.syncBombAudioState();
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
            this.clearPendingSkill();
        } else {
            this.opponentSkillUsed = true;
        }
        
        // 应用棋盘变化
        let latestPieceChange = null;
        let pieceChangeCount = 0;
        if (data.changes) {
            for (const change of data.changes) {
                if (change.value !== undefined) {
                    GameState.board[change.row][change.col] = change.value;
                    if (Array.isArray(board) && Array.isArray(board[change.row])) {
                        board[change.row][change.col] = change.value;
                    }
                    if (change.value === MAPLE || change.value === SUN) {
                        latestPieceChange = { r: change.row, c: change.col, player: change.value };
                        pieceChangeCount++;
                    }
                }
            }
        }
        if (pieceChangeCount > 0) {
            GameState.moveCount += pieceChangeCount;
            moveCount = GameState.moveCount;
            if (latestPieceChange) {
                GameState.lastMove = latestPieceChange;
                lastMove = GameState.lastMove;
            }
        }
        
        // 渲染
        if (typeof renderBoard === 'function') {
            renderBoard();
        }
        if (latestPieceChange && typeof updateLastMoveMarker === 'function') {
            updateLastMoveMarker();
        }
        
        // 显示技能特效提示
        const actor = data.player === this.myColor ? '你' : '对手';
        const skillName = this.getSkillDisplayName(data.skillId);
        OnlineUI.showToast(actor + '使用了' + skillName);

        if (data.player !== this.myColor && typeof SoundEngine !== 'undefined') {
            if (data.skillId === 'chaos' && typeof SoundEngine.playChaos === 'function') {
                SoundEngine.playChaos();
            } else if (typeof SoundEngine.playSkill === 'function') {
                SoundEngine.playSkill();
            }
        }

        this.applyStateDelta(data.state);
        if (data.specialEffect && data.specialEffect.type === 'chaos_applied') {
            OnlineUI.showToast(this.getToastText('chaosTrigger', '混乱触发！落点偏移'));
        }
        if (data.skillId === 'short_battle') {
            OnlineUI.showToast(this.getToastText('shortBattleStart', '短兵战！四子即胜'));
        }
        
        // 更新 UI
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
        }
        this.syncBombAudioState();
    },
    
    onSkillInvalid: function(data) {
        console.log('[OnlineGame] Skill invalid:', data);
        const reason = data && data.reason ? data.reason : 'invalid';
        const reasonMap = {
            game_not_playing: '当前对局不可用',
            not_your_turn: '当前不是你的回合',
            skill_already_used: this.getToastText('skillUsed', '技能已用尽'),
            skill_not_owned: '你未拥有该技能',
            missing_target: '缺少技能目标',
            missing_targets: '缺少技能目标',
            invalid_target_piece: '目标棋子无效',
            target_not_empty: '目标位置不为空',
            zone_restricted: this.getToastText('errZone', '禁区无法落子'),
            not_own_piece: '请选择己方棋子',
            not_enemy_piece: '请选择敌方棋子',
            source_not_piece: '源位置没有棋子',
            invalid_move_path: '移动路径无效',
            unknown_skill: '未知技能'
        };
        OnlineUI.showToast('技能使用无效: ' + (reasonMap[reason] || reason));
        if (typeof SoundEngine !== 'undefined' && typeof SoundEngine.playError === 'function') {
            SoundEngine.playError();
        }
        this.clearPendingSkill();
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
                    if (typeof SoundEngine !== 'undefined' && typeof SoundEngine.playExplosion === 'function') {
                        SoundEngine.playExplosion();
                    }
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
        this.syncBombAudioState();
    },

    /** @param {RoomBombActivatedPayload} data */
    onBombActivated: function(data) {
        console.log('[OnlineGame] Bomb activated:', data);
        if (!data) return;
        const now = Date.now();
        const isDuplicate = (now - Number(this._lastBombActivationAt || 0)) < 1500;
        this._lastBombActivationAt = now;

        const target = data.bombTarget || data.target || null;
        if (target === 'black') {
            GameState.bombTarget = MAPLE;
        } else if (target === 'white') {
            GameState.bombTarget = SUN;
        } else if (target === null) {
            GameState.bombTarget = null;
        }
        bombTarget = GameState.bombTarget;

        if (data.timeRemaining) {
            GameState.timeRemaining = {
                [MAPLE]: Number.isFinite(data.timeRemaining.black) ? data.timeRemaining.black : GameState.timeRemaining[MAPLE],
                [SUN]: Number.isFinite(data.timeRemaining.white) ? data.timeRemaining.white : GameState.timeRemaining[SUN]
            };
            timeRemaining = GameState.timeRemaining;
        }

        if (!isDuplicate) {
            OnlineUI.showToast(this.getToastText('bombStart', '炸弹已激活'));
        }
        this.syncBombAudioState();
        if (typeof updateDynamicUI === 'function') {
            updateDynamicUI();
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
        OnlineUI.showUndoRequestModal(data);
    },
    
    /** @param {RoomUndoResponsePayload} data */
    onUndoResponse: function(data) {
        console.log('[OnlineGame] Undo response:', data);

        const requesterColor = data && data.requesterColor ? data.requesterColor : null;
        const iAmRequester = requesterColor
            ? requesterColor === this.myColor
            : !!this.undoRequestPending;
        const reason = data && data.reason ? data.reason : (data.accepted ? 'accepted' : 'rejected');

        if (iAmRequester) {
            this.undoRequestPending = false;
            if (typeof OnlineUI.hideUndoPendingModal === 'function') {
                OnlineUI.hideUndoPendingModal();
            }
        }
        if (typeof OnlineUI.hideUndoRequestModal === 'function') {
            OnlineUI.hideUndoRequestModal();
        }

        if (data.undoUsed) {
            this.myUndoUsed = !!data.undoUsed[this.myColor];
            this.opponentUndoUsed = !!data.undoUsed[this.myColor === 'black' ? 'white' : 'black'];
        }
        this.syncUndoButtonState();

        if (reason === 'accepted') {
            OnlineUI.showToast(iAmRequester ? '太神奇了！悔棋已成功！' : '且让它一步，这就是风度');
            return;
        }
        if (reason === 'timeout') {
            OnlineUI.showToast(iAmRequester ? '对方没有回应，可能在偷偷睡觉' : '由于您没有回应对方，已默认拒绝');
            return;
        }
        if (reason === 'rejected') {
            OnlineUI.showToast(iAmRequester ? '对方不许悔棋！下次他要悔棋的时候别放过它' : '已让对方滚蛋！');
            return;
        }
        OnlineUI.showToast(data.accepted ? '悔棋请求被同意' : '悔棋请求未通过');
    },
    
    /** @param {RoomUndoExecutedPayload} data */
    onUndoExecuted: function(data) {
        console.log('[OnlineGame] Undo executed:', data);

        if (data.boardState && typeof data.boardState === 'object') {
            this.applyBoardStateSnapshot(data.boardState);
        } else {
            // 兼容旧服务端，仅回退最后一手
            if (data.undoneMove) {
                GameState.board[data.undoneMove.row][data.undoneMove.col] = 0;
                if (Array.isArray(board) && Array.isArray(board[data.undoneMove.row])) {
                    board[data.undoneMove.row][data.undoneMove.col] = 0;
                }
            }
            GameState.currentPlayer = data.currentTurn === 'black' ? MAPLE : SUN;
            currentPlayer = GameState.currentPlayer;
            if (typeof renderBoard === 'function') renderBoard();
            if (typeof updateDynamicUI === 'function') updateDynamicUI();
            this.syncBombAudioState();
        }

        if (data.undoUsed) {
            this.myUndoUsed = !!data.undoUsed[this.myColor];
            this.opponentUndoUsed = !!data.undoUsed[this.myColor === 'black' ? 'white' : 'black'];
        }
        this.undoRequestPending = false;
        if (typeof OnlineUI.hideUndoPendingModal === 'function') {
            OnlineUI.hideUndoPendingModal();
        }
        this.syncUndoButtonState();
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

        if (data.status === 'playing') {
            GameState.gameActive = true;
            gameActive = true;
            if (typeof showScreen === 'function') showScreen('game');
        } else {
            GameState.gameActive = false;
            gameActive = false;
        }
        this.applyBoardStateSnapshot(state);
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
        const message = data && data.message ? data.message : 'unknown_error';
        if (message === 'undo_pending') {
            this.undoRequestPending = true;
            if (typeof OnlineUI.showUndoPendingModal === 'function') {
                OnlineUI.showUndoPendingModal(10000);
            }
            return;
        }
        if (message === 'undo_already_used') {
            this.myUndoUsed = true;
            this.syncUndoButtonState();
            OnlineUI.showToast('本局悔棋已失效');
            return;
        }
        OnlineUI.showToast('服务器错误: ' + message);
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
        if (!SocketClient || !SocketClient.connected) {
            OnlineUI.showToast('未连接到服务器');
            return;
        }
        if (this.undoRequestPending) {
            if (typeof OnlineUI.showUndoPendingModal === 'function') {
                OnlineUI.showUndoPendingModal(10000);
            }
            return;
        }
        this.undoRequestPending = true;
        if (typeof OnlineUI.showUndoPendingModal === 'function') {
            OnlineUI.showUndoPendingModal(10000);
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
        if (data && data.nickname) {
            this.guestNickname = data.nickname;
        }
        // 清除创建超时定时器
        if (OnlineUI._createTimeout) {
            clearTimeout(OnlineUI._createTimeout);
            OnlineUI._createTimeout = null;
        }
        OnlineUI.showWaitingRoom(data.roomId, {
            source: '公共大厅',
            hostName: this.getGuestNickname()
        });
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

        if (typeof SoundEngine !== 'undefined' && typeof SoundEngine.playSkill === 'function') {
            SoundEngine.playSkill();
        }

        const instantSkills = new Set(['double', 'chaos', 'short_battle', 'bomb']);
        const skillName = this.getSkillDisplayName(skillId);
        if (instantSkills.has(skillId)) {
            OnlineUI.showToast(this.getToastText('casting', '释放：') + skillName);
            this.sendSkill(skillId, {});
            return;
        }

        this.clearPendingSkill();
        this.pendingSkill = { id: skillId, step: 0, data: {} };
        GameState.activeEffect = 'online_pending_skill';
        activeEffect = GameState.activeEffect;
        const hintMap = {
            voodoo: this.getToastText('voodooPick', '请选择目标棋子'),
            zone: this.getToastText('zonePick', '请选择领地中心'),
            move_self: this.getToastText('moveSrcSelf', '请选择己方棋子'),
            move_enemy: this.getToastText('moveSrcEnemy', '请选择敌方棋子'),
            swap: this.getToastText('swapPickSelf', '请选择己方棋子'),
            god_hand: this.getToastText('godPick1', '请选择第一颗棋子')
        };
        if (skillId === 'voodoo') {
            this.setPendingCastingMode('casting-voodoo');
        } else if (skillId === 'zone') {
            this.setPendingCastingMode('casting-territory');
        } else {
            this.setPendingCastingMode('casting-move-src');
        }
        OnlineUI.showToast(hintMap[skillId] || '请选择技能目标');
    },

    hasPendingSkill: function() {
        return !!this.pendingSkill;
    },

    clearPendingSkill: function() {
        this.pendingSkill = null;
        GameState.activeEffect = null;
        activeEffect = null;
        this.clearSkillCastingVisuals();
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
                this.markPendingCell(r, c);
                this.setPendingCastingMode('casting-move-dest');
                OnlineUI.showToast(this.getToastText('moveDest', '请选择目标空位'));
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
                this.markPendingCell(r, c);
                this.setPendingCastingMode('casting-move-dest');
                OnlineUI.showToast(this.getToastText('swapPickEnemy', '请选择敌方棋子'));
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
                this.markPendingCell(r, c);
                this.setPendingCastingMode('casting-move-dest');
                const destHint = moves.length === 0
                    ? this.getToastText('godDest1', '请选择第1次落点')
                    : this.getToastText('godDest2', '请选择第2次落点');
                OnlineUI.showToast(destHint);
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
                this.clearPendingMarks();
                this.setPendingCastingMode('casting-move-src');
                OnlineUI.showToast(this.getToastText('godPick2', '请选择第二颗棋子'));
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
        this.undoRequestPending = false;
        this.rpsPhase = false;
        this.myRpsChoice = null;
        this.pendingSkill = null;
        this.clearSkillCastingVisuals();
        this.draftState = null;
        this.matchState = null;
        this.resetGuestNickname();
        this._lastBombActivationAt = 0;
        this.syncUndoButtonState();
        if (typeof OnlineUI !== 'undefined' && typeof OnlineUI.updateMatchScore === 'function') {
            OnlineUI.updateMatchScore(null, null);
        }
        
        // 重置初始化标记，确保下次连接时重新注册事件监听
        this._initialized = false;

        GameState.gameActive = false;
        gameActive = false;
        GameState.activeEffect = null;
        activeEffect = null;
        GameState.selectedCell = null;
        selectedCell = null;
        if (GameState.gameMode === 'online') {
            GameState.gameMode = 'pvp';
            gameMode = GameState.gameMode;
        }
        GameState.bombTarget = null;
        bombTarget = null;
        if (typeof SoundEngine !== 'undefined') {
            if (typeof SoundEngine.setCritical === 'function') {
                SoundEngine.setCritical(false);
            }
            if (SoundEngine.currentTrack === 'bomb' && typeof SoundEngine.switchTrack === 'function') {
                SoundEngine.switchTrack(GameState.userMusicPref);
            }
        }
        
        // 重置 GameState 的联网状态
        if (GameState.online) {
            GameState.online = {
                isOnline: false,
                roomId: null,
                myColor: null,
                opponentNickname: null,
                opponentPieceStyle: null
            };
        }
        if (typeof SocketClient !== 'undefined' && SocketClient && typeof SocketClient.clearPendingReconnect === 'function') {
            SocketClient.clearPendingReconnect();
        }
    }
};

// 暴露到全局
window.OnlineGame = OnlineGame;
