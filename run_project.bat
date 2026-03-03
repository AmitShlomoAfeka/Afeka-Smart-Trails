@echo off
echo ==========================================
echo Starting Afeka Hiking Trails 2026 Project
echo ==========================================

:: 1. Check if MongoDB is needed (User responsibility, just a reminder)
echo [INFO] Ensure MongoDB is running locally or your URI is set in server/.env
echo.

:: 2. Start Backend Server
echo [1/2] Launching Backend Server...
start "Afeka Backend" cmd /k "cd server && echo Installing dependencies... && npm install && echo Starting Server... && node index.js"

:: 3. Start Frontend Client
echo [2/2] Launching Frontend Client...
timeout /t 5 >nul
start "Afeka Frontend" cmd /k "cd client && echo Installing dependencies... && npm install && echo Starting Client... && npm run dev"

echo.
echo ==========================================
echo Project is launching!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Please wait for the Next.js compilation to finish in the client window.
echo ==========================================
pause
