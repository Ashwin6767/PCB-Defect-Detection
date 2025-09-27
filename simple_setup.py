#!/usr/bin/env python3
"""
Simple Setup for YOLOv10 AOI Integration
"""

import os
import shutil

def main():
    print("Setting up YOLOv10 AOI Integration...")
    
    # Create directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("results", exist_ok=True)
    print("Created directories: uploads, results")
    
    # Check if files exist
    if os.path.exists("best.pt"):
        print("Found YOLOv10 model: best.pt")
    else:
        print("WARNING: best.pt model not found!")
    
    if os.path.exists("aoi-vision-flow"):
        print("Found web interface: aoi-vision-flow")
    else:
        print("ERROR: aoi-vision-flow directory not found!")
        return
    
    # Copy modified files
    if os.path.exists("aoi-vision-flow/src/pages/UploadPage_Modified.tsx"):
        shutil.copy2("aoi-vision-flow/src/pages/UploadPage_Modified.tsx", 
                     "aoi-vision-flow/src/pages/UploadPage.tsx")
        print("Updated UploadPage.tsx")
    
    if os.path.exists("aoi-vision-flow/src/pages/InspectionPage_Modified.tsx"):
        shutil.copy2("aoi-vision-flow/src/pages/InspectionPage_Modified.tsx", 
                     "aoi-vision-flow/src/pages/InspectionPage.tsx")
        print("Updated InspectionPage.tsx")
    
    print("\nSetup complete!")
    print("\nTO START THE SYSTEM:")
    print("1. Start backend: python aoi_backend_server.py")
    print("2. In new terminal: cd aoi-vision-flow && npm install && npm run dev")
    print("3. Open: http://localhost:5173")

if __name__ == "__main__":
    main()