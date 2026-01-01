// ============================================
// Project Lysh Server - Main Entry
// ============================================

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const RoomManager = require('./roomManager');
const setupSocketHandlers = require('./socketHandlers');

// 创建 Express 应用
const app = express();
app.use(cors({
    origin: config.allowedOrigins,
    methods: ['GET', 'POST']
}));

// 创建 HTTP 服务器
const httpServer = createServer(app);

// 创建 Socket.IO 服务器
const io = new Server(httpServer, {
    cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST']
    },
    // 连接设置
    pingTimeout: 60000,
    pingInterval: 25000
});

// 创建房间管理器
const roomManager = new RoomManager();

// 设置 Socket 事件处理
setupSocketHandlers(io, roomManager);

// 定时清理过期房间
setInterval(() => {
    const cleaned = roomManager.cleanupRooms();
    if (cleaned > 0) {
        console.log(`[Cleanup] Removed ${cleaned} expired rooms`);
    }
}, config.room.cleanupInterval);

// 健康检查接口
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        name: 'Project Lysh Server',
        version: '1.0.0',
        rooms: roomManager.getRoomCount(),
        connections: io.engine.clientsCount
    });
});

// 房间状态接口（调试用）
app.get('/rooms', (req, res) => {
    res.json({
        count: roomManager.getRoomCount(),
        rooms: roomManager.getRoomList()
    });
});

// 启动服务器
httpServer.listen(config.port, () => {
    console.log('============================================');
    console.log('  Project Lysh Server Started');
    console.log('============================================');
    console.log(`  Port: ${config.port}`);
    console.log(`  Time: ${new Date().toLocaleString()}`);
    console.log('============================================');
});
