@echo off
title UGI - Stop All Services
color 0E
cls

echo =======================================================================
echo          GLOBAL INTEL & TELEMETRY (UGI) - STOP ALL SERVICES
echo =======================================================================
echo.
echo Terminating processes on Port 5000 (Backend / Database)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Terminating processes on Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

color 0A
echo.
echo All UGI services (Frontend, Backend, Database) have been stopped.
echo =======================================================================
echo.
pause
