@echo off
setlocal

cd /d "%~dp0"

echo [git-stash] preparing startup...

where node >nul 2>nul
if errorlevel 1 (
  echo [git-stash] Node.js not found. Please install Node.js first.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [git-stash] npm.cmd not found. Please check Node.js installation.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [git-stash] first run: installing dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo [git-stash] dependency install failed.
    pause
    exit /b 1
  )
)

netstat -ano | findstr ":3760" | findstr "LISTENING" >nul
if not errorlevel 1 (
  echo [git-stash] service already running on port 3760.
  start "" "http://localhost:3760"
  exit /b 0
)

echo [git-stash] opening browser...
start "" "http://localhost:3760"

echo [git-stash] starting service, keep this window open.
call npm.cmd run start

endlocal
