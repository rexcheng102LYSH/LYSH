// ============================================
// Project Lysh - Socket Client
// 联网对战 Socket.IO 客户端封装
// ============================================

const SocketClient = {
    socket: null,
    serverUrl: 'http://localhost:3000',  // 开发环境，部署时修改
    connected: false,
    
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
        this.socket.emit(event, data);
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
        this.socket.on(event, callback);
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
