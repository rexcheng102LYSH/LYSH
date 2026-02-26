// @ts-check
/* global io, OnlineGame */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {string} event
 * @param {unknown} data
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateOutgoingPayload(event, data) {
    switch (event) {
        case 'client:create_room':
            if (!isObject(data) || typeof data.nickname !== 'string' || !data.nickname.trim()) {
                return { valid: false, reason: 'invalid_nickname' };
            }
            return { valid: true };
        case 'client:join_room':
        case 'client:lobby_join':
            if (!isObject(data) || typeof data.roomId !== 'string' || !data.roomId.trim()) {
                return { valid: false, reason: 'invalid_room_id' };
            }
            if (typeof data.nickname !== 'string' || !data.nickname.trim()) {
                return { valid: false, reason: 'invalid_nickname' };
            }
            return { valid: true };
        case 'client:place_piece':
            if (!isObject(data) || !Number.isInteger(data.row) || !Number.isInteger(data.col)) {
                return { valid: false, reason: 'invalid_position' };
            }
            return { valid: true };
        case 'client:use_skill':
            if (!isObject(data) || typeof data.skillId !== 'string' || !data.skillId.trim()) {
                return { valid: false, reason: 'invalid_skill_id' };
            }
            return { valid: true };
        case 'client:rps_choice':
            if (!isObject(data) || !['rock', 'paper', 'scissors'].includes(/** @type {string} */ (data.choice))) {
                return { valid: false, reason: 'invalid_choice' };
            }
            return { valid: true };
        case 'client:side_choice':
            if (!isObject(data) || (data.side !== 'black' && data.side !== 'white')) {
                return { valid: false, reason: 'invalid_side' };
            }
            return { valid: true };
        case 'client:respond_undo':
            if (!isObject(data) || typeof data.accept !== 'boolean') {
                return { valid: false, reason: 'invalid_accept' };
            }
            return { valid: true };
        case 'client:lobby_create':
            if (!isObject(data) || typeof data.nickname !== 'string' || !data.nickname.trim()) {
                return { valid: false, reason: 'invalid_nickname' };
            }
            return { valid: true };
        case 'client:reconnect':
            if (!isObject(data) || typeof data.roomId !== 'string' || typeof data.oldSocketId !== 'string') {
                return { valid: false, reason: 'invalid_reconnect_payload' };
            }
            return { valid: true };
        default:
            return { valid: true };
    }
}

/**
 * @param {string} event
 * @param {unknown} data
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateIncomingPayload(event, data) {
    if (!isObject(data)) {
        return { valid: false, reason: 'invalid_payload' };
    }

    switch (event) {
        case 'server:join_success':
            if (typeof data.roomId !== 'string' || typeof data.playerId !== 'string' || typeof data.role !== 'string') {
                return { valid: false, reason: 'invalid_join_success' };
            }
            return { valid: true };
        case 'room:piece_placed':
            if (!Number.isInteger(data.row) || !Number.isInteger(data.col)) {
                return { valid: false, reason: 'invalid_piece_placed' };
            }
            return { valid: true };
        case 'room:game_over':
            if (typeof data.reason !== 'string') {
                return { valid: false, reason: 'invalid_game_over' };
            }
            return { valid: true };
        case 'server:error':
            if (typeof data.message !== 'string' && typeof data.reason !== 'string') {
                return { valid: false, reason: 'invalid_server_error' };
            }
            return { valid: true };
        default:
            return { valid: true };
    }
}

function getTraceIdFromPayload(payload) {
    if (!isObject(payload)) return null;
    return typeof payload.__traceId === 'string' ? payload.__traceId : null;
}

// ============================================
// Project Lysh - Socket Client
// 联网对战 Socket.IO 客户端封装
// ============================================

const SocketClient = {
    socket: null,
    connected: false,
    
    /**
     * 自动获取服务器地址
     * 优先级：window.GAME_SERVER_URL > 生产环境自动检测 > 开发环境
     */
    getServerUrl: function() {
        // 使用内联脚本/config.js 设定的全局地址，兜底 Zeabur 线上服务器
        return window.GAME_SERVER_URL || 'https://lysh-server.zeabur.app';
    },
    
    // 保留 serverUrl 属性以兼容旧代码
    get serverUrl() {
        return this.getServerUrl();
    },
    
    /**
     * 连接到服务器
     */
    connect: function() {
        if (this.socket && this.connected) {
            console.log('[Socket] Already connected');
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            try {
                // 检查 Socket.IO 是否已加载
                if (typeof io === 'undefined') {
                    reject(new Error('Socket.IO not loaded'));
                    return;
                }
                
                console.log('[Socket] Connecting to', this.serverUrl);
                
                this.socket = io(this.serverUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000
                });
                
                this.socket.on('connect', () => {
                    console.log('[Socket] Connected:', this.socket.id);
                    this.connected = true;
                    resolve();
                });
                
                this.socket.on('connect_error', (error) => {
                    console.error('[Socket] Connection error:', error);
                    this.connected = false;
                    reject(error);
                });
                
                this.socket.on('disconnect', (reason) => {
                    console.log('[Socket] Disconnected:', reason);
                    this.connected = false;
                    
                    // 通知 UI 断线
                    if (OnlineGame && OnlineGame.handleDisconnect) {
                        OnlineGame.handleDisconnect(reason);
                    }
                });
                
                // 设置连接超时
                setTimeout(() => {
                    if (!this.connected) {
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * 断开连接
     */
    disconnect: function() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            console.log('[Socket] Manually disconnected');
        }
    },
    
    /**
     * 发送事件
     */
    emit: function(event, data) {
        if (!this.socket || !this.connected) {
            console.error('[Socket] Not connected, cannot emit:', event);
            return false;
        }
        const validation = validateOutgoingPayload(event, data);
        if (!validation.valid) {
            console.warn('[Socket] Blocked invalid payload:', event, validation.reason, data);
            if (window.LYSH_DIAGNOSTICS && window.LYSH_DIAGNOSTICS.reportNetwork) {
                window.LYSH_DIAGNOSTICS.reportNetwork('outgoing_blocked', event, null, {
                    reason: validation.reason
                });
            }
            return false;
        }

        let payload = data;
        let traceId = null;
        if (isObject(data)) {
            traceId = (window.LYSH_DIAGNOSTICS && window.LYSH_DIAGNOSTICS.newTraceId)
                ? window.LYSH_DIAGNOSTICS.newTraceId('net')
                : `net-${Date.now().toString(36)}`;
            payload = Object.assign({}, data, {
                __traceId: traceId,
                __clientTs: Date.now()
            });
        }

        this.socket.emit(event, payload);
        if (window.LYSH_DIAGNOSTICS && window.LYSH_DIAGNOSTICS.reportNetwork) {
            window.LYSH_DIAGNOSTICS.reportNetwork('outgoing', event, traceId, null);
        }
        return true;
    },
    
    /**
     * 监听事件
     */
    on: function(event, callback) {
        if (!this.socket) {
            console.error('[Socket] Not connected, cannot listen:', event);
            return;
        }
        if (typeof callback !== 'function') {
            console.error('[Socket] Invalid callback for event:', event);
            return;
        }
        this.socket.on(event, (payload) => {
            const validation = validateIncomingPayload(event, payload);
            if (!validation.valid) {
                console.warn('[Socket] Ignored invalid incoming payload:', event, validation.reason, payload);
                if (window.LYSH_DIAGNOSTICS && window.LYSH_DIAGNOSTICS.reportNetwork) {
                    window.LYSH_DIAGNOSTICS.reportNetwork('incoming_blocked', event, getTraceIdFromPayload(payload), {
                        reason: validation.reason
                    });
                }
                return;
            }

            if (window.LYSH_DIAGNOSTICS && window.LYSH_DIAGNOSTICS.reportNetwork) {
                window.LYSH_DIAGNOSTICS.reportNetwork('incoming', event, getTraceIdFromPayload(payload), null);
            }
            callback(payload);
        });
    },
    
    /**
     * 移除事件监听
     */
    off: function(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    },
    
    /**
     * 获取 Socket ID
     */
    getId: function() {
        return this.socket ? this.socket.id : null;
    }
};

// 暴露到全局
window.SocketClient = SocketClient;
