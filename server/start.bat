@echo off
chcp 65001 >nul 2>&1
title Project Lysh Server

echo ============================================
echo   Project Lysh Server Launcher
echo ============================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查 Node.js 是否安装
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 检查依赖是否已安装（检查 express 模块是否存在）
if not exist "node_modules\express\package.json" (
    echo [INFO] Dependencies not found or incomplete, installing...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [INFO] Dependencies installed successfully!
    echo.
)

:: 检查端口3000是否被占用，如果被占用则自动释放
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo [INFO] Port 3000 is in use by PID %%a, stopping old process...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo [INFO] Starting server on port 3000...
echo [INFO] Game URL: http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server
echo.

:: 延迟1秒后自动打开浏览器
start "" "http://localhost:3000"

:: 启动服务器
node index.js

:: 如果服务器意外停止，暂停以查看错误信息
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped with error code: %ERRORLEVEL%
    echo [TIP] Check if port 3000 is already in use
    pause
)
