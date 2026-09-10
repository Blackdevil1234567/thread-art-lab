@echo off
title Threadify - Thread Art Generator
color 0A

echo ============================================
echo        THREADIFY - Thread Art Generator
echo ============================================
echo.
echo Starting Backend Server...
start "Threadify Backend" cmd /k "cd /d "d:\thread art\backend" && call venv\Scripts\activate && python main.py"

echo Starting Frontend Dev Server...
timeout /t 3 /nobreak >nul
start "Threadify Frontend" cmd /k "cd /d "d:\thread art\frontend" && npm run dev"

echo.
echo ============================================
echo  Both servers are starting up!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo ============================================
echo.
echo You can close this window. The servers
echo are running in their own windows.
echo.
pause
