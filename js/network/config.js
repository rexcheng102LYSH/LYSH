// ============================================
// Project Lysh - Network Configuration
// 联网对战配置文件
// ============================================
// 
// 【部署说明】
// 部署到 Zeabur 后，将下面的 SERVER_URL 改为你的服务器地址
// 例如：https://lysh-server.zeabur.app
//
// 如果前后端部署在同一域名下，可以留空，系统会自动检测
// ============================================

(function() {
    'use strict';
    
    // 如果内联脚本已强制设定了本地地址（__FORCE_LOCAL），则跳过覆盖
    if (window.__FORCE_LOCAL) {
        console.log('[Config] Skipped: inline script already forced local URL:', window.GAME_SERVER_URL);
        window.NetworkConfig = {
            serverUrl: window.GAME_SERVER_URL,
            reconnectAttempts: 5,
            reconnectDelay: 2000,
            connectionTimeout: 10000
        };
        return;
    }
    
    // ========================================
    // 服务器地址配置
    // ========================================
    
    // 生产环境服务器地址（部署时修改这里！）
    const PRODUCTION_SERVER_URL = 'https://lysh-server.zeabur.app';
    
    // 开发环境服务器地址
    const DEVELOPMENT_SERVER_URL = 'http://localhost:3000';
    
    // ========================================
    // 自动检测环境
    // ========================================
    
    function getServerUrl() {
        // 先检测是否为本地开发环境
        var h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1' || h.indexOf('192.168.') === 0) {
            console.log('[Config] Development mode, using:', DEVELOPMENT_SERVER_URL);
            return DEVELOPMENT_SERVER_URL;
        }
        
        // 线上环境：使用生产地址
        if (PRODUCTION_SERVER_URL) {
            console.log('[Config] Production mode, using:', PRODUCTION_SERVER_URL);
            return PRODUCTION_SERVER_URL;
        }
        
        // 兜底：同域名
        var autoUrl = window.location.protocol + '//' + window.location.hostname;
        console.log('[Config] Production mode, auto-detected:', autoUrl);
        return autoUrl;
    }
    
    // ========================================
    // 暴露全局配置
    // ========================================
    
    window.GAME_SERVER_URL = getServerUrl();
    
    window.NetworkConfig = {
        serverUrl: window.GAME_SERVER_URL,
        reconnectAttempts: 5,
        reconnectDelay: 2000,
        connectionTimeout: 10000
    };
    
    console.log('[Config] Server URL:', window.GAME_SERVER_URL);
    
})();
