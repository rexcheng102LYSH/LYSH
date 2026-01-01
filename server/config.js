// ============================================
// Project Lysh Server - Configuration
// ============================================

module.exports = {
    // 服务器端口
    port: process.env.PORT || 3000,
    
    // CORS 允许的域名
    allowedOrigins: [
        'http://localhost:5500',      // VS Code Live Server
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000',
        // 生产环境域名（部署时添加）
        // 'https://your-domain.com'
    ],
    
    // 房间设置
    room: {
        maxWaitTime: 10 * 60 * 1000,      // 等待状态最长时间：10分钟
        maxIdleTime: 5 * 60 * 1000,       // 结束后最长空闲时间：5分钟
        cleanupInterval: 60 * 1000         // 清理检查间隔：1分钟
    },
    
    // 猜拳设置
    rps: {
        timeout: 10 * 1000,               // 猜拳超时：10秒
        sideChoiceTimeout: 10 * 1000      // 选边超时：10秒
    },
    
    // 断线重连设置
    reconnect: {
        timeout: 30 * 1000,               // 重连超时：30秒
        heartbeatInterval: 5 * 1000       // 心跳间隔：5秒
    },
    
    // 棋盘设置
    board: {
        size: 15                          // 15x15 棋盘
    }
};
