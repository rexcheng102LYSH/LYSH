@echo off
chcp 65001 >nul 2>&1
title Project Lysh

echo ============================================
echo   Project Lysh - Quick Play
echo ============================================
echo.
echo   Opening game in your browser...
echo.

:: 打开 Zeabur 线上游戏链接
start "" "https://lysh-server.zeabur.app"

echo   Game URL: https://lysh-server.zeabur.app
echo.
echo   Press any key to close this window.
pause >nul
