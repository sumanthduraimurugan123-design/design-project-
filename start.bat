@echo off
title UGI - Global Intel & Telemetry Launcher
color 0B
cls

echo =======================================================================
echo          GLOBAL INTEL & TELEMETRY (UGI) - ONE-CLICK LAUNCHER
echo =======================================================================
echo.

:: 1. Check Node.js installation
echo [1/4] Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Node.js is NOT installed on this computer!
    echo Node.js is required to run the frontend and backend servers.
    echo.
    echo Please download and install Node.js (LTS version) from:
    echo   https://nodejs.org/
    echo.
    set /p opennode="Would you like to open the Node.js website now? (Y/N): "
    if /i "%opennode%"=="Y" start https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Auto-install backend dependencies if missing (e.g. freshly unzipped folder)
if not exist "%~dp0backend\node_modules" (
    echo.
    echo [NOTICE] First-time setup detected: Backend packages missing.
    echo Installing backend dependencies (this only happens once)...
    cd /d "%~dp0backend"
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install backend dependencies. Please check your internet connection.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

:: 3. Auto-install frontend dependencies if missing
if not exist "%~dp0frontend\node_modules" (
    echo.
    echo [NOTICE] First-time setup detected: Frontend packages missing.
    echo Installing frontend dependencies (this only happens once)...
    cd /d "%~dp0frontend"
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install frontend dependencies. Please check your internet connection.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

echo.
echo [2/4] Launching UGI Backend & Database Engine (Port 5000)...
start "UGI - Backend & Database [5000]" cmd /k "cd /d ""%~dp0backend"" && echo Starting Backend Server and Database... && npm start"

:: Wait 3 seconds for backend to bind port 5000
timeout /t 3 /nobreak >nul

echo [3/4] Launching UGI Frontend Web Interface (Port 5173)...
start "UGI - Frontend Client [5173]" cmd /k "cd /d ""%~dp0frontend"" && echo Starting Vite Dev Server... && npm run dev"

:: Wait 3 seconds for Vite dev server to bind port 5173
timeout /t 3 /nobreak >nul

echo [4/4] Opening UGI Command Center in your default browser...
start http://localhost:5173

cls
color 0A
echo =======================================================================
echo          GLOBAL INTEL & TELEMETRY (UGI) - RUNNING SUCCESSFULLY
echo =======================================================================
echo.
echo   * Web Application:      http://localhost:5173
echo   * Backend REST API:     http://localhost:5000
echo   * Database Endpoints:   http://localhost:5000/api/news
echo                           http://localhost:5000/api/alerts
echo                           http://localhost:5000/api/logs
echo                           http://localhost:5000/api/users
echo.
echo  ---------------------------------------------------------------------
echo   Both services are now running in separate terminal windows.
echo   To stop all services cleanly at any time, double-click 'stop.bat'.
echo =======================================================================
echo.
pause
