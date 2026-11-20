@echo off
setlocal EnableExtensions
TITLE Rotaract Club of Khopoli - Website
cd /d "%~dp0"

echo ==========================================================
echo   ROTARACT KHOPOLI - WEBSITE STARTER
 echo ==========================================================
echo.
echo Project folder: %CD%
echo.

if not exist "package.json" goto badfolder
where node >nul 2>&1
if errorlevel 1 goto nonode
where npm >nul 2>&1
if errorlevel 1 goto nonpm

echo Found Node.js:
node --version
echo Found npm:
call npm --version
echo.
if not exist "node_modules\next\package.json" (
  echo Installing project dependencies. An internet connection is required for first setup.
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 goto npmfailed
)

echo.
echo Starting development server...
echo When you see Ready, open: http://localhost:3000
echo Keep this window OPEN while using the website.
echo Press Ctrl+C to stop the server.
echo.
call npm run dev
if errorlevel 1 goto serverfailed

echo The development server was stopped.
goto finished

:nonode
echo [ERROR] Node.js was not found.
echo Install Node.js LTS from https://nodejs.org/
echo Then close and reopen this starter.
goto finished

:nonpm
echo [ERROR] npm was not found. Reinstall Node.js LTS with npm included.
goto finished

:badfolder
echo [ERROR] package.json is missing from: %CD%
echo Right-click the ZIP file and choose "Extract All..." first.
echo Then open the extracted project folder and run this file.
goto finished

:npmfailed
echo.
echo [ERROR] npm install failed. Review the error printed above.
echo You may need internet access or a compatible version of Node.js.
goto finished

:serverfailed
echo.
echo [ERROR] Next.js exited with an error. Review the error above.
echo If port 3000 is occupied, Next.js may choose another port.
goto finished

:finished
echo.
echo ==========================================================
echo   The window is being kept open for troubleshooting.
echo   Copy or screenshot the error if you need help.
echo ==========================================================
pause
endlocal
