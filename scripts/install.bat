@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Install Auto-Start

:: Check admin
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: Administrator privileges required!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ========================================
echo   Install Auto-Start
echo ========================================
echo.

:: Get script paths
set "SCRIPT_DIR=%~dp0"
set "MONITOR_PS1=%SCRIPT_DIR%monitor.ps1"
set "VBS_WRAPPER=%SCRIPT_DIR%monitor_hidden.vbs"
set "REG_KEY=HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

:: Delete old entry
reg delete "%REG_KEY%" /v "ScreenshotAutoBackup" /f >nul 2>&1

:: Create VBScript wrapper for hidden execution
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_WRAPPER%"
echo WshShell.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""%MONITOR_PS1%""", 0, False >> "%VBS_WRAPPER%"

:: Add new entry using VBScript wrapper
reg add "%REG_KEY%" /v "ScreenshotAutoBackup" /t REG_SZ /d "\"%VBS_WRAPPER%\"" /f >nul 2>&1

if %errorLevel% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS!
    echo ========================================
    echo.
    echo Auto-start installed successfully!
    echo.
    echo Script will run in background on next system startup.
    echo No window will appear.
    echo.
    echo To test now, run: monitor.bat
    echo.
) else (
    echo.
    echo ========================================
    echo   FAILED!
    echo ========================================
    echo.
    echo Installation failed with error code: %errorLevel%
    echo.
)

pause
