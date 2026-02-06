@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Uninstall Auto-Start

:: Check admin
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: Administrator privileges required!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ========================================
echo   Uninstall Auto-Start
echo ========================================
echo.
echo This will remove auto-start.
echo.

reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "ScreenshotAutoBackup" /f >nul 2>&1

:: Delete VBScript wrapper if exists
if exist "%~dp0monitor_hidden.vbs" (
    del "%~dp0monitor_hidden.vbs" /f /q >nul 2>&1
)

if %errorLevel% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS!
    echo ========================================
    echo.
    echo Auto-start removed successfully!
    echo.
    echo Note: Monitoring script may still be running in background.
    echo       To stop it, run task manager and end powershell.exe processes.
    echo.
) else (
    echo.
    echo ========================================
    echo   INFO
    echo ========================================
    echo.
    echo Auto-start was not installed.
    echo.
)

pause
