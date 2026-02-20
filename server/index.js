// ============================================
// Project Lysh Server - Main Entry
// 同时托管前端静态文件 + WebSocket 后端
// ============================================

const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const RoomManager = require('./roomManager');
const setupSocketHandlers = require('./socketHandlers');

// 前端项目根目录（server/ 的上一级）
const FRONTEND_ROOT = path.join(__dirname, '..');

// 创建 Express 应用
const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

// 托管前端静态文件（index.html, js/, css/, assets/ 等）
app.use(express.static(FRONTEND_ROOT));

// 创建 HTTP 服务器
const httpServer = createServer(app);

// 创建 Socket.IO 服务器
const io = new Server(httpServer, {
    cors: {
        origin: '*',
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

// 健康检查接口（移到 /api/status，根路径留给 index.html）
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        name: 'Project Lysh Server',
        version: '1.1.0',
        lobbySupported: true,
        roomIdLength: 4,
        rooms: roomManager.getRoomCount(),
        connections: io.engine.clientsCount
    });
});

// 房间状态接口（调试用）
app.get('/api/rooms', (req, res) => {
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
    console.log(`  Game: http://localhost:${config.port}`);
    console.log(`  Time: ${new Date().toLocaleString()}`);
    console.log('============================================');
    console.log('');
    console.log('  Open the game URL above in your browser!');
    console.log('');
});
