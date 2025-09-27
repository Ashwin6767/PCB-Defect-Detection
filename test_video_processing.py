#!/usr/bin/env python3
"""
Simple test script to debug video processing issues
"""

import cv2
import os
import numpy as np

def test_video_processing(input_video_path):
    """Test video processing step by step"""
    
    print("=== VIDEO PROCESSING DEBUG ===")
    print(f"Input video: {input_video_path}")
    
    # Step 1: Check if input video exists and can be opened
    if not os.path.exists(input_video_path):
        print("❌ Input video file does not exist!")
        return False
    
    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        print("❌ Cannot open input video!")
        return False
    
    # Step 2: Get video properties
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"✅ Input video opened successfully")
    print(f"   Resolution: {frame_width}x{frame_height}")
    print(f"   FPS: {fps}")
    print(f"   Total frames: {total_frames}")
    
    # Step 3: Test reading a few frames
    print("\n=== TESTING FRAME READING ===")
    for i in range(min(5, total_frames)):
        ret, frame = cap.read()
        if not ret:
            print(f"❌ Failed to read frame {i}")
            cap.release()
            return False
        print(f"✅ Frame {i}: {frame.shape}")
    
    # Reset to beginning
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    # Step 4: Test video writer with different codecs
    print("\n=== TESTING VIDEO WRITERS ===")
    
    codecs_to_test = [
        ('mp4v', 'MP4V'),
        ('XVID', 'XVID'),
        ('MJPG', 'MJPG'),
        ('H264', 'H264'),
    ]
    
    working_codec = None
    
    for codec_name, codec_desc in codecs_to_test:
        print(f"Testing codec: {codec_desc}")
        
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec_name)
            test_output = f"test_output_{codec_name}.mp4"
            
            out = cv2.VideoWriter(test_output, fourcc, fps, (frame_width, frame_height))
            
            if out.isOpened():
                print(f"✅ {codec_desc} writer created successfully")
                
                # Test writing a few frames
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                frames_written = 0
                
                for i in range(min(10, total_frames)):
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # Add simple text annotation for testing
                    cv2.putText(frame, f"Frame {i}", (10, 30), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    
                    out.write(frame)
                    frames_written += 1
                
                out.release()
                
                # Test if the output video can be read
                test_cap = cv2.VideoCapture(test_output)
                if test_cap.isOpened():
                    test_frames = int(test_cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    test_cap.release()
                    
                    print(f"✅ {codec_desc} output video readable: {test_frames} frames")
                    
                    if working_codec is None:
                        working_codec = (codec_name, codec_desc, test_output)
                else:
                    print(f"❌ {codec_desc} output video not readable")
                
            else:
                print(f"❌ {codec_desc} writer failed to open")
                out.release()
                
        except Exception as e:
            print(f"❌ {codec_desc} codec error: {e}")
    
    cap.release()
    
    # Step 5: Report results
    print("\n=== RESULTS ===")
    if working_codec:
        codec_name, codec_desc, test_file = working_codec
        file_size = os.path.getsize(test_file)
        print(f"✅ Best working codec: {codec_desc}")
        print(f"✅ Test file: {test_file} ({file_size} bytes)")
        
        # Test in browser by creating a simple HTML file
        html_content = f"""
<!DOCTYPE html>
<html>
<head><title>Video Test</title></head>
<body>
    <h1>Video Codec Test: {codec_desc}</h1>
    <video controls width="640">
        <source src="{test_file}" type="video/mp4">
        Your browser does not support the video tag.
    </video>
    <p>File: {test_file}</p>
    <p>Size: {file_size} bytes</p>
</body>
</html>
        """
        
        with open("video_test.html", "w") as f:
            f.write(html_content)
        
        print(f"✅ Created video_test.html for browser testing")
        return True
    else:
        print("❌ No working codec found!")
        return False

if __name__ == "__main__":
    # Test with any video file you have
    test_files = [
        "uploads/test_video.mp4",
        "results/VIDEO-de687ecb_20250927_125612_processed.mp4",
        "uploads/VIDEO-de687ecb_20250927_125612.mp4"
    ]
    
    for test_file in test_files:
        if os.path.exists(test_file):
            print(f"\nTesting with: {test_file}")
            test_video_processing(test_file)
            break
    else:
        print("No test video files found. Please upload a video first.")