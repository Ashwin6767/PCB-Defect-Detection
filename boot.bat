@echo off
cd /d "C:\Project\PCB"
echo ========================================
echo      AOI Vision Flow System Boot
echo ========================================
echo.
echo [1/6] Stopping existing processes...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq AOI Backend*" >nul 2>&1
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq AOI Frontend*" >nul 2>&1
echo     - Python processes stopped
echo     - Node.js processes stopped
echo     - Previous AOI windows closed

echo.
echo [2/6] Clearing backend cache...
if exist "uploads" rmdir /s /q "uploads" >nul 2>&1
if exist "annotated" rmdir /s /q "annotated" >nul 2>&1
if exist "results" rmdir /s /q "results" >nul 2>&1
if exist "temp" rmdir /s /q "temp" >nul 2>&1
echo     - Upload cache cleared
echo     - Results cache cleared

echo.
echo [3/6] Clearing frontend cache...
cd /d "C:\Project\PCB\aoi-vision-flow" >nul 2>&1
if exist "dist" rmdir /s /q "dist" >nul 2>&1
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite" >nul 2>&1
echo     - Build cache cleared
echo     - Vite cache cleared

echo.
echo [4/6] Starting backend server...
cd /d "C:\Project\PCB"
REM Determine python interpreter (prefer venv)
set "PY_INT=C:\Project\PCB\.venv\Scripts\python.exe"
if not exist "%PY_INT%" (
	echo     - Virtual environment not found, using system python
	set "PY_INT=python"
) else (
	echo     - Using virtual environment python
)
start "AOI Backend" cmd /k "%PY_INT% aoi_backend_server.py"
echo     - YOLOv10 backend starting with %PY_INT%

echo.
echo [5/6] Waiting for backend initialization...
timeout /t 5 /nobreak >nul
echo     - Backend ready!

echo.
echo [6/6] Starting frontend server...
cd /d "C:\Project\PCB\aoi-vision-flow"
if not exist "node_modules" (
	echo     - node_modules missing, running npm install ^(first-time setup^)...
	call npm install >nul 2>&1
	echo     - npm dependencies installed
)
start "AOI Frontend" cmd /k "npm run dev"
echo     - React frontend starting...

echo.
echo ========================================
echo   AOI Vision Flow System Started!
echo ========================================
echo.
echo 🚀 System Status:
echo    Backend API: http://localhost:5000
echo    Frontend UI: http://localhost:8080
echo.
echo 🎯 Features Active:
echo    - Direct YOLOv10 model inference
echo    - Real-time defect detection
echo    - Live counter updates
echo    - Defect analysis modal
echo    - Comprehensive cleanup system
echo.
echo 📋 Next Steps:
echo    1. Open http://localhost:8080 in your browser
echo    2. Upload PCB images for inspection
echo    3. View results with detailed analysis
echo.
echo Press any key to close this launcher...
pause >nul