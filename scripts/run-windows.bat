@echo off
setlocal enabledelayedexpansion

REM Run Compiled Binary on Windows
REM Launches the compiled Windows app from dist folder

REM Set colors
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Get script directory and navigate to project root
cd /d "%~dp0.."

echo %BLUE%[%TIME%]%NC% Launching compiled Llama Wrangler (Windows)...

REM Check if dist directory exists
if not exist "dist" (
    echo %RED%[%TIME%] X%NC% No dist/ directory found. Please run ./scripts/compile-build-dist.sh first.
    echo.
    echo Build the application first using:
    echo   - Git Bash: ./scripts/compile-build-dist.sh
    echo   - WSL: ./scripts/compile-build-dist.sh
    echo   - PowerShell with WSL: wsl ./scripts/compile-build-dist.sh
    pause
    exit /b 1
)

REM Find the executable
set "APP_PATH="

REM Check for unpacked executable first (faster launch)
if exist "dist\win-unpacked\*.exe" (
    for %%F in (dist\win-unpacked\*.exe) do (
        set "APP_PATH=%%F"
        echo %BLUE%[%TIME%]%NC% Found unpacked executable: %%~nxF
        goto :found
    )
)

REM Check for installer
if exist "dist\*.exe" (
    for %%F in (dist\*.exe) do (
        REM Skip blockmap files
        echo %%F | findstr /C:".blockmap" >nul
        if errorlevel 1 (
            set "APP_PATH=%%F"
            echo %YELLOW%[%TIME%] !%NC% Found installer: %%~nxF
            echo %YELLOW%[%TIME%] !%NC% Note: This will install the application
            goto :found
        )
    )
)

REM No executable found
echo %RED%[%TIME%] X%NC% Could not find executable in dist/ directory
echo.
echo %YELLOW%[%TIME%] !%NC% Available files in dist/:
dir dist /b
echo.
echo To build the app first, run:
echo   - Git Bash: ./scripts/compile-build-dist.sh
echo   - WSL: ./scripts/compile-build-dist.sh
pause
exit /b 1

:found
REM Launch the application
echo %GREEN%[%TIME%] OK%NC% Launching Llama Wrangler...
start "" "!APP_PATH!"

echo %GREEN%[%TIME%] OK%NC% Llama Wrangler launched successfully!
echo The app is now running
pause