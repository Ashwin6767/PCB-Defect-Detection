#!/usr/bin/env python3
"""
Integrated AOI and Safety Backend Launcher
This script starts both the PCB defect detection backend and the safety monitoring backend
"""

import subprocess
import threading
import time
import sys
import os
from pathlib import Path

def run_aoi_backend():
    """Run the AOI backend server"""
    print("🔧 Starting AOI Backend Server on port 5001...")
    try:
        subprocess.run([
            sys.executable, 
            "aoi_backend_server.py"
        ], cwd=Path(__file__).parent)
    except KeyboardInterrupt:
        print("🔧 AOI Backend stopped")
    except Exception as e:
        print(f"❌ AOI Backend error: {e}")

def run_safety_backend():
    """Run the Safety backend server"""
    print("🛡️ Starting Safety Backend Server on port 8001...")
    try:
        subprocess.run([
            sys.executable, 
            "safety_backend_server.py"
        ], cwd=Path(__file__).parent)
    except KeyboardInterrupt:
        print("🛡️ Safety Backend stopped")
    except Exception as e:
        print(f"❌ Safety Backend error: {e}")

def main():
    print("🚀 Starting Integrated AOI and Safety Monitoring System...")
    print("=" * 60)
    
    # Start both backends in separate threads
    aoi_thread = threading.Thread(target=run_aoi_backend, daemon=True)
    safety_thread = threading.Thread(target=run_safety_backend, daemon=True)
    
    aoi_thread.start()
    time.sleep(2)  # Small delay between starts
    safety_thread.start()
    
    print("\n✅ Both backend servers are starting...")
    print("🌐 AOI Backend: http://localhost:5001")
    print("🛡️ Safety Backend: http://localhost:8001")
    print("🎯 Frontend: http://localhost:8080")
    print("\nPress Ctrl+C to stop all servers")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down all servers...")
        print("✅ All services stopped")

if __name__ == "__main__":
    main()