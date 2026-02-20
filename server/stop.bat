@echo off
chcp 65001 >nul 2>&1
title Project Lysh Server - Stop

echo ============================================
echo   Project Lysh Server - Stop Utility
echo ============================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 查找并终止正在运行的 Node.js 服务器进程
echo [INFO] Looking for running server processes...
echo.

set KILLED=0

:: 使用 wmic 查找当前目录下的 node 进程并终止
for /f "tokens=2" %%i in ('wmic process where "commandline like '%%server%%index.js%%'" get processid /value 2^>nul ^| findstr "ProcessId="') do (
    echo [INFO] Stopping server process (PID: %%i)...
    taskkill /PID %%i /F >nul 2>&1
    set KILLED=1
)

:: 额外检查端口 3000 是否被占用
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo [INFO] Freeing port 3000 (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    set KILLED=1
)

echo.
if "%KILLED%"=="1" (
    echo [SUCCESS] Server stopped successfully!
) else (
    echo [INFO] No running server process found.
)

echo.
echo Press any key to close this window...
pause >nul
