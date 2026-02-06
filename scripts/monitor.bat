@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Screenshot Auto Backup - Monitoring

echo ========================================
echo   Screenshot Auto Backup
echo ========================================
echo.
echo Starting screenshot monitoring...
echo.
echo Source: %USERPROFILE%\Pictures\Screenshots
echo Target: %~dp0..\screenshot
echo.
echo Press Ctrl+C to stop
echo.

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0monitor.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Monitoring script failed
    echo.
    pause
)
