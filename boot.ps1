Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

Write-Host "📁 Navigating to project directory..." -ForegroundColor Cyan
cd "C:\Project\PCB"

Write-Host "🧹 Clearing backend cache..." -ForegroundColor Magenta
if (Test-Path "uploads") { Remove-Item "uploads\*" -Force -Recurse ; Write-Host "✅ Cleared uploads folder" } else { Write-Host "ℹ️ No uploads folder found" }
if (Test-Path "annotated") { Remove-Item "annotated\*" -Force -Recurse ; Write-Host "✅ Cleared annotated folder" } else { Write-Host "ℹ️ No annotated folder found" }
if (Test-Path "results") { Remove-Item "results\*" -Force -Recurse ; Write-Host "✅ Cleared results folder" } else { Write-Host "ℹ️ No results folder found" }
if (Test-Path "temp") { Remove-Item "temp\*" -Force -Recurse ; Write-Host "✅ Cleared temp folder" } else { Write-Host "ℹ️ No temp folder found" }

Write-Host "🧹 Clearing frontend cache..." -ForegroundColor Magenta
cd "C:\Project\PCB\aoi-vision-flow"
if (Test-Path "dist") { Remove-Item "dist" -Force -Recurse ; Write-Host "✅ Cleared dist folder" } else { Write-Host "ℹ️ No dist folder found" }
if (Test-Path "node_modules\.vite") { Remove-Item "node_modules\.vite" -Force -Recurse ; Write-Host "✅ Cleared Vite cache" } else { Write-Host "ℹ️ No Vite cache found" }

Write-Host "🚀 Starting backend server..." -ForegroundColor Green
cd "C:\Project\PCB"
Start-Process powershell -ArgumentList "-Command", "C:/Project/PCB/.venv/Scripts/python.exe aoi_backend_server.py"

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🌐 Starting frontend server..." -ForegroundColor Green
cd "C:\Project\PCB\aoi-vision-flow"
Start-Process powershell -ArgumentList "-Command", "npm run dev"

Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "✅ AOI Vision Flow System Started!" -ForegroundColor Green
Write-Host "📊 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🖥️  Frontend UI: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 System Features:" -ForegroundColor White
Write-Host "   • Direct YOLOv10 model inference (no confidence scoring)" -ForegroundColor Gray
Write-Host "   • Binary classification: PASS/FAIL based on defect detection" -ForegroundColor Gray
Write-Host "   • Real-time counters with live updates" -ForegroundColor Gray
Write-Host "   • Defect analysis modal with bounding box visualization" -ForegroundColor Gray
Write-Host "   • Comprehensive cleanup system" -ForegroundColor Gray
Write-Host "   • Industrial conveyor belt animations" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Usage Instructions:" -ForegroundColor White
Write-Host "   1. Open http://localhost:8080 in your browser" -ForegroundColor Gray
Write-Host "   2. Upload PCB images for inspection" -ForegroundColor Gray
Write-Host "   3. View results with detailed defect analysis" -ForegroundColor Gray
Write-Host "   4. Monitor live counters for Pass/Fail statistics" -ForegroundColor Gray