#!/usr/bin/env python3
"""
Setup Script for YOLOv10 AOI Integration
This script sets up the complete integration between your YOLOv10 model and the web interface
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def setup_integration():
    """Setup the complete YOLOv10 AOI integration"""
    
    print("🚀 Setting up YOLOv10 AOI Integration...")
    print("="*50)
    
    # 1. Check if required files exist
    required_files = [
        "best.pt",
        "aoi-vision-flow/package.json",
        "aoi_backend_server.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    # 2. Create directory structure
    directories = [
        "uploads",
        "results",
        "static"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    # 3. Replace frontend files with integrated versions
    frontend_replacements = [
        ("aoi-vision-flow/src/pages/UploadPage_Modified.tsx", "aoi-vision-flow/src/pages/UploadPage.tsx"),
        ("aoi-vision-flow/src/pages/InspectionPage_Modified.tsx", "aoi-vision-flow/src/pages/InspectionPage.tsx")
    ]
    
    for source, target in frontend_replacements:
        if os.path.exists(source):
            shutil.copy2(source, target)
            print(f"✅ Updated: {target}")
        else:
            print(f"⚠️  Skipped: {source} not found")
    
    # 4. Create startup scripts
    create_startup_scripts()
    
    # 5. Create integration test script
    create_test_script()
    
    print("\n🎉 Integration setup complete!")
    print("\n📋 NEXT STEPS:")
    print("1. Start the backend server:")
    print("   python aoi_backend_server.py")
    print("\n2. In a new terminal, start the frontend:")
    print("   cd aoi-vision-flow")
    print("   npm install")
    print("   npm run dev")
    print("\n3. Open your browser to:")
    print("   http://localhost:5173 (frontend)")
    print("   http://localhost:5000/api/health (backend)")
    
    return True

def create_startup_scripts():
    """Create convenient startup scripts"""
    
    # Backend startup script
    backend_script = '''#!/usr/bin/env python3
"""
Start YOLOv10 AOI Backend Server
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting YOLOv10 AOI Backend Server...")
    
    # Check if model exists
    if not os.path.exists("best.pt"):
        print("❌ Error: best.pt model file not found!")
        print("   Make sure your trained YOLOv10 model is in the current directory")
        return False
    
    # Start the server
    try:
        subprocess.run([sys.executable, "aoi_backend_server.py"], check=True)
    except KeyboardInterrupt:
        print("\\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
'''
    
    with open("start_backend.py", "w") as f:
        f.write(backend_script)
    
    # Frontend startup script (batch file for Windows)
    frontend_script = '''@echo off
echo Starting YOLOv10 AOI Frontend...
cd aoi-vision-flow
echo Installing dependencies...
call npm install
echo Starting development server...
call npm run dev
pause
'''
    
    with open("start_frontend.bat", "w") as f:
        f.write(frontend_script)
    
    # Combined startup script
    combined_script = '''#!/usr/bin/env python3
"""
Start Complete YOLOv10 AOI System
Starts both backend and frontend servers
"""

import subprocess
import sys
import os
import time
import threading

def start_backend():
    """Start the Python backend server"""
    print("🔧 Starting backend server...")
    subprocess.run([sys.executable, "aoi_backend_server.py"])

def start_frontend():
    """Start the React frontend server"""
    print("🎨 Starting frontend server...")
    time.sleep(3)  # Wait for backend to start
    
    os.chdir("aoi-vision-flow")
    
    # Install dependencies if needed
    if not os.path.exists("node_modules"):
        print("📦 Installing npm dependencies...")
        subprocess.run(["npm", "install"], check=True)
    
    # Start development server
    subprocess.run(["npm", "run", "dev"])

def main():
    print("🚀 Starting Complete YOLOv10 AOI System...")
    print("="*50)
    
    # Check requirements
    if not os.path.exists("best.pt"):
        print("❌ Error: best.pt model not found!")
        return False
    
    if not os.path.exists("aoi-vision-flow/package.json"):
        print("❌ Error: Frontend not found!")
        return False
    
    try:
        # Start backend in separate thread
        backend_thread = threading.Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Start frontend in main thread
        start_frontend()
        
    except KeyboardInterrupt:
        print("\\n🛑 System stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
'''
    
    with open("start_complete_system.py", "w") as f:
        f.write(combined_script)
    
    print("✅ Created startup scripts:")
    print("   - start_backend.py")
    print("   - start_frontend.bat")
    print("   - start_complete_system.py")

def create_test_script():
    """Create a test script to verify integration"""
    
    test_script = '''#!/usr/bin/env python3
"""
Test YOLOv10 AOI Integration
Tests the connection between frontend and backend
"""

import requests
import json
import os
from pathlib import Path

def test_backend_health():
    """Test if backend server is running"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend server is healthy")
            print(f"   Status: {data.get('status')}")
            print(f"   Model loaded: {data.get('model_loaded')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure backend server is running on port 5000")
        return False

def test_model_inference():
    """Test model inference with a sample image"""
    
    # Find a sample image from validation set
    sample_images = list(Path("DATASET/valid/images").glob("*.jpg"))[:1]
    
    if not sample_images:
        print("⚠️  No sample images found for testing")
        return False
    
    sample_image = sample_images[0]
    print(f"🧪 Testing inference with: {sample_image.name}")
    
    try:
        with open(sample_image, 'rb') as f:
            files = {'image': f}
            data = {'pcbId': 'TEST-001'}
            
            response = requests.post(
                "http://localhost:5000/api/inspect",
                files=files,
                data=data,
                timeout=30
            )
            
        if response.status_code == 200:
            result = response.json()
            print("✅ Model inference successful")
            print(f"   PCB ID: {result.get('pcbId')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Defect Type: {result.get('defectType')}")
            print(f"   Confidence: {result.get('confidence')}%")
            print(f"   Total Defects: {result.get('metrics', {}).get('total_defects', 0)}")
            return True
        else:
            print(f"❌ Model inference failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Model inference error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def main():
    print("🧪 Testing YOLOv10 AOI Integration...")
    print("="*40)
    
    # Test 1: Backend health
    print("\\n1️⃣  Testing backend health...")
    backend_ok = test_backend_health()
    
    if not backend_ok:
        print("\\n❌ Backend tests failed. Please start the backend server first.")
        return False
    
    # Test 2: Model inference
    print("\\n2️⃣  Testing model inference...")
    inference_ok = test_model_inference()
    
    if not inference_ok:
        print("\\n❌ Model inference tests failed.")
        return False
    
    print("\\n🎉 All tests passed! Integration is working correctly.")
    print("\\n🌐 You can now:")
    print("   1. Open http://localhost:5173 in your browser")
    print("   2. Upload PCB images for inspection")
    print("   3. View real-time YOLOv10 detection results")
    
    return True

if __name__ == "__main__":
    main()
'''
    
    with open("test_integration.py", "w") as f:
        f.write(test_script)
    
    print("✅ Created test script: test_integration.py")

if __name__ == "__main__":
    success = setup_integration()
    
    if success:
        print("\n🎯 QUICK START GUIDE:")
        print("1. Run: python start_backend.py")
        print("2. Run: python test_integration.py")
        print("3. Open http://localhost:5173 in your browser")
        print("4. Upload PCB images and see YOLOv10 results!")
    else:
        print("\n❌ Setup failed. Please check the errors above.")