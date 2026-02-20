@echo off
chcp 65001 >nul 2>&1
title Project Lysh Server - Restart

echo ============================================
echo   Project Lysh Server - Restart
echo ============================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 杀掉占用端口3000的旧进程
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo [INFO] Stopping old server (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

:: 等待端口释放
timeout /t 1 /nobreak >nul

echo [INFO] Restarting...
echo.

:: 调用 start.bat（自带依赖检测和端口检查）
call "%~dp0start.bat"
