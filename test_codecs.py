#!/usr/bin/env python3
"""
Test different video codecs for browser compatibility
"""

import cv2
import os
import numpy as np

def test_codecs():
    """Test different codec combinations"""
    
    # Create a simple test video
    width, height = 640, 480
    fps = 30
    duration = 2  # seconds
    total_frames = fps * duration
    
    print("=== TESTING VIDEO CODECS ===")
    
    # Test different codec/container combinations
    test_configs = [
        ('test_xvid.avi', 'XVID', 'XVID + AVI'),
        ('test_mjpg.avi', 'MJPG', 'MJPG + AVI'),
        ('test_mjpg.mp4', 'MJPG', 'MJPG + MP4'),
        ('test_mp4v.mp4', 'mp4v', 'MP4V + MP4'),
        ('test_h264.mp4', 'H264', 'H264 + MP4'),
        ('test_x264.mp4', 'X264', 'X264 + MP4'),
    ]
    
    working_configs = []
    
    for filename, codec, description in test_configs:
        print(f"\nTesting: {description}")
        
        try:
            # Create video writer
            fourcc = cv2.VideoWriter_fourcc(*codec)
            out = cv2.VideoWriter(filename, fourcc, fps, (width, height))
            
            if not out.isOpened():
                print(f"❌ {description}: VideoWriter failed to open")
                continue
            
            # Generate test frames
            for i in range(total_frames):
                # Create a simple test frame with moving rectangle
                frame = np.zeros((height, width, 3), dtype=np.uint8)
                
                # Add colored background
                frame[:, :] = [50, 100, 150]
                
                # Add moving rectangle
                x = int((i / total_frames) * (width - 100))
                cv2.rectangle(frame, (x, height//2 - 50), (x + 100, height//2 + 50), (0, 255, 0), -1)
                
                # Add frame number
                cv2.putText(frame, f"Frame {i}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                
                out.write(frame)
            
            out.release()
            
            # Check if file was created and has reasonable size
            if os.path.exists(filename):
                file_size = os.path.getsize(filename)
                if file_size > 1000:  # At least 1KB
                    print(f"✅ {description}: Created successfully ({file_size} bytes)")
                    
                    # Test if it can be read back
                    test_cap = cv2.VideoCapture(filename)
                    if test_cap.isOpened():
                        test_frames = int(test_cap.get(cv2.CAP_PROP_FRAME_COUNT))
                        test_fps = test_cap.get(cv2.CAP_PROP_FPS)
                        test_cap.release()
                        
                        if test_frames > 0:
                            print(f"✅ {description}: Readable ({test_frames} frames @ {test_fps} FPS)")
                            working_configs.append((filename, codec, description, file_size))
                        else:
                            print(f"❌ {description}: No frames readable")
                    else:
                        print(f"❌ {description}: Cannot be read back")
                else:
                    print(f"❌ {description}: File too small ({file_size} bytes)")
            else:
                print(f"❌ {description}: File not created")
                
        except Exception as e:
            print(f"❌ {description}: Exception - {e}")
    
    # Summary
    print("\n=== RESULTS SUMMARY ===")
    if working_configs:
        print("✅ Working configurations:")
        for filename, codec, desc, size in working_configs:
            print(f"   {desc}: {filename} ({size} bytes)")
        
        # Create HTML test page
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Codec Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .codec-test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        video { width: 100%; max-width: 640px; }
    </style>
</head>
<body>
    <h1>Video Codec Test Results</h1>
"""
        
        for filename, codec, desc, size in working_configs:
            html_content += f"""
    <div class="codec-test">
        <h3>{desc}</h3>
        <p>File: {filename} ({size} bytes)</p>
        <video controls>
            <source src="{filename}" type="video/{'mp4' if filename.endswith('.mp4') else 'avi'}">
            Your browser does not support this video format.
        </video>
    </div>
"""
        
        html_content += """
</body>
</html>
"""
        
        with open('codec_test_results.html', 'w') as f:
            f.write(html_content)
        
        print(f"\n✅ Created codec_test_results.html for browser testing")
        print("   Open this file in your browser to test which codecs work")
        
    else:
        print("❌ No working configurations found!")

if __name__ == "__main__":
    test_codecs()