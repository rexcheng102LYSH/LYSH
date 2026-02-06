@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Check Status

echo ========================================
echo   Screenshot Auto Backup - Status
echo ========================================
echo.

:: Check auto-start
echo [1/5] Checking auto-start...
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "ScreenshotAutoBackup" >nul 2>&1
if %errorLevel% EQU 0 (
    echo   [OK] Auto-start is installed
    echo   [INFO] Running in background mode
) else (
    echo   [INFO] Auto-start is NOT installed
    echo   [HINT] Run install.bat as administrator
)
echo.

:: Check script files
echo [2/5] Checking script files...
if exist "%~dp0monitor.bat" (
    echo   [OK] monitor.bat exists
) else (
    echo   [ERROR] monitor.bat NOT found
)
if exist "%~dp0monitor.ps1" (
    echo   [OK] monitor.ps1 exists
) else (
    echo   [ERROR] monitor.ps1 NOT found
)
if exist "%~dp0monitor_hidden.vbs" (
    echo   [OK] VBScript wrapper exists
) else (
    echo   [INFO] VBScript wrapper not found (normal if not installed)
)
echo.

:: Check monitoring process
echo [3/5] Checking monitoring process...
tasklist /FI "IMAGENAME eq powershell.exe" /FO CSV | findstr /i "monitor.ps1" >nul 2>&1
if %errorLevel% EQU 0 (
    echo   [OK] Monitoring is running
    echo   [INFO] Running in background (no window)
) else (
    echo   [INFO] Monitoring is NOT running
    echo   [HINT] Run monitor.bat to start
)
echo.

:: Check log file
echo [4/5] Checking log file...
if exist "%~dp0monitor.log" (
    echo   [OK] Log file exists
    echo   [INFO] Last 5 entries:
    powershell -Command "Get-Content '%~dp0monitor.log' -Tail 5 | ForEach-Object { Write-Host '       ' $_ }"
) else (
    echo   [INFO] Log file not found (normal if not running)
)
echo.

:: Check folders
echo [5/5] Checking folders...
if exist "%USERPROFILE%\Pictures\Screenshots" (
    echo   [OK] Source folder exists
    for /f %%a in ('dir "%USERPROFILE%\Pictures\Screenshots\*.png" /b 2^>nul ^| find /c ".png"') do set count=%%a
    echo   Source files: %count%
) else (
    echo   [WARN] Source folder NOT found
    echo   [HINT] Press PrtSc to create it
)
if exist "%~dp0..\screenshot" (
    echo   [OK] Target folder exists
    for /f %%a in ('dir "%~dp0..\screenshot\*.png" /b 2^>nul ^| find /c ".png"') do set count=%%a
    echo   Target files: %count%
) else (
    echo   [WARN] Target folder NOT found
)
echo.

echo ========================================
echo   Summary
echo ========================================
echo.
echo To install auto-start: Run install.bat as administrator
echo To start monitoring: Run monitor.bat
echo To uninstall: Run uninstall.bat as administrator
echo To view logs: type scripts\monitor.log
echo.
pause
