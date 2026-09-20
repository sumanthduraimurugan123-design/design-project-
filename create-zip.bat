@echo off
title UGI - Create Clean Zip for Email / Sharing
color 0B
cls

echo =======================================================================
echo          UGI - PACKAGING CLEAN PROJECT ZIP (WITHOUT NODE_MODULES)
echo =======================================================================
echo.
echo Compressing project files...
echo Excluded: node_modules, .git, .agents, dist, temporary files
echo.

set OUTPUT_ZIP=%~dp0sumanthproject-ready-to-send.zip

if exist "%OUTPUT_ZIP%" del /f /q "%OUTPUT_ZIP%"

tar -a -c -f "%OUTPUT_ZIP%" --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude=".agents" --exclude="*.zip" backend frontend database start.bat stop.bat create-zip.bat plans

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Failed to create zip file.
    pause
    exit /b 1
)

color 0A
echo.
echo =======================================================================
echo  SUCCESS! Clean zip created:
echo  %OUTPUT_ZIP%
echo.
echo  This zip file is tiny (~150 KB) and ready to attach in your email!
echo  When the recipient downloads and unzips, they just double-click start.bat.
echo =======================================================================
echo.
pause
