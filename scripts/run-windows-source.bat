@echo off
setlocal enabledelayedexpansion

REM Run from Source on Windows (Development Mode)
REM Launches the app directly from source code using Electron

REM Set colors
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Get script directory and navigate to project root
cd /d "%~dp0.."

echo %BLUE%[%TIME%]%NC% Starting Llama Wrangler from source (Windows)...

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[%TIME%] X%NC% Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[%TIME%] X%NC% npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo %RED%[%TIME%] X%NC% package.json not found. Make sure you're in the project root directory.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo %BLUE%[%TIME%]%NC% Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%[%TIME%] X%NC% Failed to install dependencies
        pause
        exit /b 1
    )
    echo %GREEN%[%TIME%] OK%NC% Dependencies installed
)

REM Launch the app from source
echo %BLUE%[%TIME%]%NC% Launching Llama Wrangler from source code...
echo Press Ctrl+C to stop the application
echo.

REM Run the app in development mode
call npm start

echo.
echo %GREEN%[%TIME%] OK%NC% Application session ended
pause