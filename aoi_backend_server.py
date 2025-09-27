#!/usr/bin/env python3
"""
YOLOv10 Model Integration with AOI Vision Flow Web Interface
This script creates a backend API that the web interface can call to get real model predictions
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import base64
import io
from PIL import Image
import os
import json
from datetime import datetime
import uuid
import cv2
import tempfile

class YOLOv10AOIBackend:
    def __init__(self, model_path="best.pt"):
        self.model = YOLO(model_path)
        self.class_names = {
            0: 'falsecopper',
            1: 'missinghole', 
            2: 'mousebite',
            3: 'opencircuit',
            4: 'pinhole',
            5: 'scratch',
            6: 'shortcircuit',
            7: 'spur'
        }
        

        
        # Create uploads directory
        os.makedirs("uploads", exist_ok=True)
        os.makedirs("results", exist_ok=True)
    
    def cleanup_old_files(self, preserve_recent_minutes: int = 10):
        """Clean up old uploaded and result files.

        Instead of deleting everything (which caused freshly produced images to vanish
        before the frontend modal tried to load them), only remove files older than
        preserve_recent_minutes. Default keeps the last 10 minutes of artifacts.
        """
        try:
            cutoff = datetime.now().timestamp() - (preserve_recent_minutes * 60)
            removed = 0
            for directory in ("uploads", "results"):
                if os.path.exists(directory):
                    for filename in os.listdir(directory):
                        file_path = os.path.join(directory, filename)
                        if os.path.isfile(file_path):
                            try:
                                mtime = os.path.getmtime(file_path)
                                if mtime < cutoff:
                                    os.remove(file_path)
                                    removed += 1
                            except Exception as inner_e:
                                print(f"Skipping file (stat error): {file_path} -> {inner_e}")
            print(f"✅ Cleanup completed - removed {removed} old files (kept recent {preserve_recent_minutes} min)")
        except Exception as e:
            print(f"Warning: Could not clean old files: {e}")

    def process_pcb_image(self, image_data, pcb_id=None):
        """Process a single PCB image and return inspection results"""
        
        if pcb_id is None:
            pcb_id = f"PCB-{uuid.uuid4().hex[:8].upper()}"
        
        try:
            # Decode base64 image if needed
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            else:
                image = Image.open(image_data)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Save uploaded image
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            image_filename = f"{pcb_id}_{timestamp}.jpg"
            image_path = os.path.join("uploads", image_filename)
            image.save(image_path)
            
            # Run YOLO inference
            results = self.model(image_path, conf=0.25, iou=0.45)
            
            # Extract detections
            all_detections = results[0].boxes
            
            # Simple decision: if any defects detected = FAIL, else PASS
            if all_detections is not None and len(all_detections) > 0:
                status = "FAIL"
                defects_found = self._extract_defect_details(all_detections)
                primary_defect = self._get_primary_defect(defects_found)
            else:
                status = "PASS"
                defects_found = []
                primary_defect = "None"
            
            # Create annotated image
            annotated_image = results[0].plot()
            annotated_filename = f"{pcb_id}_{timestamp}_annotated.jpg"
            annotated_path = os.path.join("results", annotated_filename)
            # Convert BGR to RGB and save with PIL
            annotated_image_rgb = annotated_image[..., ::-1]  # BGR to RGB
            Image.fromarray(annotated_image_rgb).save(annotated_path)
            
            # Prepare result
            inspection_result = {
                "pcbId": pcb_id,
                "status": status,
                "defectType": primary_defect,
                "timestamp": datetime.now().isoformat(),
                "metrics": {
                    "total_defects": len(defects_found)
                },
                "defects_detected": defects_found,
                "images": {
                    "original": image_filename,
                    "annotated": annotated_filename
                }
            }
            
            # Save result to JSON
            result_filename = f"{pcb_id}_{timestamp}_result.json"
            result_path = os.path.join("results", result_filename)
            with open(result_path, 'w') as f:
                json.dump(inspection_result, f, indent=2)
            
            return inspection_result
            
        except Exception as e:
            return {
                "pcbId": pcb_id,
                "status": "ERROR",
                "defectType": f"Processing Error: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "error": True
            }
    

    
    def _extract_defect_details(self, detections):
        """Extract detailed information about detected defects"""
        
        if detections is None:
            return []
        
        defects = []
        for box in detections:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            defects.append({
                'type': self.class_names.get(class_id, f'unknown_{class_id}'),
                'confidence': round(confidence, 3),
                'bbox': [round(coord, 1) for coord in [x1, y1, x2, y2]],
                'area': round((x2-x1) * (y2-y1), 1)
            })
        
        return defects
    
    def _get_primary_defect(self, defects):
        """Get the primary defect type for display"""
        
        if not defects:
            return "None"
        
        # Return the defect with highest confidence
        primary = max(defects, key=lambda x: x['confidence'])
        return primary['type'].replace('_', ' ').title()
    
    def _convert_to_h264_mp4(self, input_path, output_path):
        """Convert video to browser-compatible H.264 MP4 using ffmpeg or fallback"""
        
        # Method 1: Try ffmpeg (best quality and compatibility)
        try:
            import subprocess
            
            print("Attempting ffmpeg conversion...")
            
            # Use your exact command for maximum browser compatibility
            cmd = [
                'ffmpeg', '-y',  # -y to overwrite output file
                '-i', input_path,  # input file
                '-c:v', 'libx264',  # H.264 codec (best browser support)
                '-crf', '23',  # quality (lower = better quality)
                '-preset', 'fast',  # encoding speed
                '-c:a', 'aac',  # audio codec (if any)
                '-movflags', '+faststart',  # optimize for web streaming
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                print("✅ FFmpeg H.264 conversion successful")
                return True
            else:
                print(f"❌ FFmpeg failed: {result.stderr}")
                
        except (ImportError, FileNotFoundError, subprocess.TimeoutExpired) as e:
            print(f"FFmpeg not available: {e}")
        
        # Method 2: Try OpenCV with different approach
        print("Trying OpenCV conversion to MP4...")
        
        try:
            cap = cv2.VideoCapture(input_path)
            if not cap.isOpened():
                raise Exception("Cannot open input video")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # Try different MP4-compatible codecs
            mp4_codecs = [
                ('mp4v', 'MP4V'),
                ('MJPG', 'Motion JPEG'),
                ('XVID', 'XVID')
            ]
            
            for codec, desc in mp4_codecs:
                try:
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                    
                    if out.isOpened():
                        print(f"Using {desc} codec for MP4")
                        
                        # Copy all frames
                        frame_count = 0
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        
                        while True:
                            ret, frame = cap.read()
                            if not ret:
                                break
                            
                            out.write(frame)
                            frame_count += 1
                        
                        out.release()
                        cap.release()
                        
                        print(f"OpenCV conversion completed: {frame_count} frames")
                        return True
                    else:
                        out.release()
                        
                except Exception as e:
                    print(f"{desc} failed: {e}")
            
            cap.release()
            
        except Exception as e:
            print(f"OpenCV conversion failed: {e}")
        
        print("❌ All conversion methods failed")
        return False
    
    def process_pcb_video(self, video_file, video_id=None):
        """Process a video file for PCB defect detection"""
        
        if video_id is None:
            video_id = f"VIDEO-{uuid.uuid4().hex[:8]}"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        try:
            print(f"Starting video processing for {video_id}")
            
            # Save uploaded video temporarily
            temp_video_path = os.path.join("uploads", f"{video_id}_{timestamp}.mp4")
            print(f"Saving video to: {temp_video_path}")
            video_file.save(temp_video_path)
            
            # Verify file was saved
            if not os.path.exists(temp_video_path):
                raise Exception(f"Failed to save video file to {temp_video_path}")
            
            print(f"Video file saved successfully, size: {os.path.getsize(temp_video_path)} bytes")
            
            # Open video with OpenCV
            cap = cv2.VideoCapture(temp_video_path)
            if not cap.isOpened():
                raise Exception(f"Could not open video file: {temp_video_path}")
            
            # Get video properties
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            print(f"Video properties: {frame_width}x{frame_height} @ {fps:.2f} FPS, {total_frames} frames")
            
            if frame_width == 0 or frame_height == 0 or fps == 0:
                raise Exception("Invalid video properties - video may be corrupted")
            
            # Create output video with universally supported codec
            # Try AVI with XVID first (most compatible), then fallback to MJPG
            
            video_formats = [
                (f"{video_id}_{timestamp}_processed.avi", 'XVID', 'XVID/AVI (most compatible)'),
                (f"{video_id}_{timestamp}_processed.avi", 'MJPG', 'MJPG/AVI (good compatibility)'),
                (f"{video_id}_{timestamp}_processed.mp4", 'MJPG', 'MJPG/MP4 (fallback)')
            ]
            
            out = None
            output_video_path = None
            used_format = None
            
            for filename, codec, desc in video_formats:
                try:
                    test_path = os.path.join("results", filename)
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    test_out = cv2.VideoWriter(test_path, fourcc, fps, (frame_width, frame_height))
                    
                    if test_out.isOpened():
                        print(f"✅ Using {desc}")
                        out = test_out
                        output_video_path = test_path
                        used_format = f"{codec}/{filename.split('.')[-1].upper()}"
                        break
                    else:
                        test_out.release()
                        print(f"❌ {desc} failed")
                        
                except Exception as e:
                    print(f"❌ {desc} error: {e}")
            
            if not out or not out.isOpened():
                raise Exception("Failed to create video writer with any supported codec")
            
            print(f"Video writer created successfully with {used_format}")
            print(f"Output file: {output_video_path}")
            
            if not out.isOpened():
                raise Exception("Failed to create output video writer")
            
            frame_count = 0
            total_defects = 0
            defect_frames = []
            all_defects = []
            
            print(f"Starting frame processing...")
            
            # Calculate frame interval for 700ms sampling
            frame_interval = max(1, int(fps * 0.7))  # Process every 700ms worth of frames
            print(f"Processing every {frame_interval} frames (700ms intervals)")
            
            # Process frames at 700ms intervals
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Only process frames at 700ms intervals
                should_process = (frame_count - 1) % frame_interval == 0
                
                if should_process:
                    print(f"Processing frame {frame_count}/{total_frames}")
                    
                    # Run YOLO inference on frame
                    results = self.model.predict(source=frame, save=False, conf=0.25, verbose=False)
                    result = results[0]
                    
                    # Extract defects from this frame
                    frame_defects = []
                    if result.boxes is not None:
                        frame_defects = self._extract_defect_details(result.boxes)
                        total_defects += len(frame_defects)
                        
                        if frame_defects:
                            defect_frames.append({
                                'frame': frame_count,
                                'timestamp': frame_count / fps,
                                'defects': frame_defects
                            })
                            all_defects.extend(frame_defects)
                    
                    # Annotate frame
                    annotated_frame = result.plot()
                    
                    # Add frame info
                    status_text = f"Frame: {frame_count}/{total_frames} | Defects: {len(frame_defects)} | Processed"
                    cv2.putText(annotated_frame, status_text, (10, 30), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                else:
                    # For non-processed frames, just copy the original frame
                    annotated_frame = frame.copy()
                    
                    # Add frame info showing it was skipped
                    status_text = f"Frame: {frame_count}/{total_frames} | Skipped"
                    cv2.putText(annotated_frame, status_text, (10, 30), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                
                # Write frame to output video
                if annotated_frame is not None and annotated_frame.shape[:2] == (frame_height, frame_width):
                    out.write(annotated_frame)
                else:
                    print(f"Warning: Frame {frame_count} has wrong dimensions or is None")
                    if annotated_frame is not None:
                        print(f"Expected: {frame_height}x{frame_width}, Got: {annotated_frame.shape}")
                    # Write original frame as fallback
                    out.write(frame)
            
            # Cleanup
            cap.release()
            out.release()
            
            # Verify output video was created successfully
            if not os.path.exists(output_video_path):
                raise Exception(f"Failed to create output video: {output_video_path}")
            
            output_size = os.path.getsize(output_video_path)
            print(f"Output video created successfully: {output_video_path} ({output_size} bytes)")
            
            # Test if the created video can be opened (validation)
            test_cap = cv2.VideoCapture(output_video_path)
            if not test_cap.isOpened():
                test_cap.release()
                raise Exception(f"Created video cannot be opened: {output_video_path}")
            
            test_frame_count = int(test_cap.get(cv2.CAP_PROP_FRAME_COUNT))
            test_cap.release()
            print(f"Video validation successful: {test_frame_count} frames")
            
            # Convert to browser-compatible H.264 MP4
            browser_video_path = os.path.join("results", f"{video_id}_{timestamp}_processed.mp4")
            
            try:
                print("Converting to browser-compatible H.264 MP4...")
                success = self._convert_to_h264_mp4(output_video_path, browser_video_path)
                
                if success and os.path.exists(browser_video_path) and os.path.getsize(browser_video_path) > 0:
                    print("✅ H.264 MP4 conversion successful")
                    # Keep both files but use MP4 for serving
                    output_video_path = browser_video_path
                else:
                    print("⚠️ H.264 conversion failed, using AVI original")
                    
            except Exception as e:
                print(f"⚠️ H.264 conversion failed: {e}, using AVI original")
            
            # Calculate processed frames and defect density
            processed_frames = (total_frames + frame_interval - 1) // frame_interval  # Ceiling division
            frames_with_defects = len(defect_frames)
            defect_density = frames_with_defects / processed_frames if processed_frames > 0 else 0
            
            print(f"Processed {processed_frames} frames out of {total_frames} total frames")
            print(f"Found defects in {frames_with_defects} processed frames")
            print(f"Defect density: {defect_density:.3f}")
            
            # Determine overall status based on processed frames
            if defect_density > 0.3:  # More than 30% of processed frames have defects
                status = "FAIL"
            elif defect_density > 0.15:  # 15-30% of processed frames have defects
                status = "QUESTIONABLE"
            else:
                status = "PASS"
            
            # Get primary defect type
            primary_defect = "None"
            if all_defects:
                defect_types = {}
                for defect in all_defects:
                    defect_type = defect['type']
                    if defect_type not in defect_types:
                        defect_types[defect_type] = []
                    defect_types[defect_type].append(defect['confidence'])
                
                # Find most common defect type with highest average confidence
                primary_defect = max(defect_types.keys(), 
                                   key=lambda x: (len(defect_types[x]), sum(defect_types[x])/len(defect_types[x])))
                primary_defect = primary_defect.replace('_', ' ').title()
            
            # Create individual results for each defect frame (like batch image processing)
            frame_results = []
            
            # Add overall video summary as first result
            summary_result = {
                "pcbId": f"{video_id}-SUMMARY",
                "videoId": video_id,
                "status": status,
                "defectType": f"Video Summary - {primary_defect}",
                "timestamp": datetime.now().isoformat(),
                "metrics": {
                    "total_frames": total_frames,
                    "processed_frames": processed_frames,
                    "frames_with_defects": frames_with_defects,
                    "total_defects": total_defects,
                    "defect_density": round(defect_density, 4),
                    "duration_seconds": round(total_frames / fps, 2),
                    "fps": round(fps, 2),
                    "processing_interval_ms": 700,
                    "frame_interval": frame_interval
                },
                "files": {
                    "original": os.path.basename(temp_video_path),
                    "processed": os.path.basename(output_video_path)
                }
            }
            frame_results.append(summary_result)
            
            # Create individual results for each defect frame
            for i, frame_data in enumerate(defect_frames[:20]):  # Limit to first 20 defect frames
                # Extract frame image
                frame_image_filename = f"{video_id}_frame_{frame_data['frame']}.jpg"
                frame_image_path = os.path.join("results", frame_image_filename)
                
                # Extract the specific frame from video
                cap_extract = cv2.VideoCapture(temp_video_path)
                cap_extract.set(cv2.CAP_PROP_POS_FRAMES, frame_data['frame'] - 1)
                ret_extract, frame_extract = cap_extract.read()
                cap_extract.release()
                
                if ret_extract:
                    # Run YOLO on this specific frame to get annotated version
                    results_extract = self.model.predict(source=frame_extract, save=False, conf=0.25, verbose=False)
                    annotated_frame_extract = results_extract[0].plot()
                    
                    # Save both original and annotated frame
                    original_frame_filename = f"{video_id}_frame_{frame_data['frame']}_original.jpg"
                    original_frame_path = os.path.join("results", original_frame_filename)
                    cv2.imwrite(original_frame_path, frame_extract)
                    cv2.imwrite(frame_image_path, annotated_frame_extract)
                
                # Determine frame status
                frame_defect_count = len(frame_data['defects'])
                if frame_defect_count > 3:
                    frame_status = "FAIL"
                elif frame_defect_count > 1:
                    frame_status = "QUESTIONABLE"
                else:
                    frame_status = "FAIL"  # Any defects in a frame is considered fail
                
                # Get primary defect for this frame
                frame_primary_defect = "None"
                if frame_data['defects']:
                    frame_primary_defect = max(frame_data['defects'], key=lambda x: x['confidence'])['type'].replace('_', ' ').title()
                
                frame_result = {
                    "pcbId": f"{video_id}-F{frame_data['frame']:04d}",
                    "videoId": video_id,
                    "frameNumber": frame_data['frame'],
                    "timestamp_seconds": frame_data['timestamp'],
                    "status": frame_status,
                    "defectType": frame_primary_defect,
                    "timestamp": datetime.now().isoformat(),
                    "metrics": {
                        "total_defects": frame_defect_count,
                        "frame_number": frame_data['frame'],
                        "video_timestamp": round(frame_data['timestamp'], 2)
                    },
                    "defects_detected": frame_data['defects'],
                    "images": {
                        "original": original_frame_filename if ret_extract else None,
                        "annotated": frame_image_filename if ret_extract else None
                    }
                }
                frame_results.append(frame_result)
            
            # Save individual results
            for i, result in enumerate(frame_results):
                result_filename = f"{video_id}_{timestamp}_result_{i:03d}.json"
                result_path = os.path.join("results", result_filename)
                with open(result_path, 'w') as f:
                    json.dump(result, f, indent=2)
            
            return frame_results
            
        except Exception as e:
            return {
                "videoId": video_id,
                "status": "ERROR",
                "defectType": f"Processing Error: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "error": True
            }

# Flask API setup
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize the backend
aoi_backend = YOLOv10AOIBackend("best.pt")

@app.route('/api/inspect', methods=['POST'])
def inspect_pcb():
    """API endpoint for PCB inspection"""
    
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Get optional PCB ID
        pcb_id = request.form.get('pcbId')
        
        # Process the image
        result = aoi_backend.process_pcb_image(file, pcb_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/inspect-video', methods=['POST'])
def inspect_video():
    """API endpoint for video PCB inspection"""
    
    try:
        print("Video inspection endpoint called")
        
        if 'video' not in request.files:
            print("No video file in request")
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        if file.filename == '':
            print("Empty video filename")
            return jsonify({'error': 'No video file selected'}), 400
        
        print(f"Processing video file: {file.filename}")
        
        # Get optional video ID
        video_id = request.form.get('videoId')
        
        # Process the video
        results = aoi_backend.process_pcb_video(file, video_id)
        
        print(f"Video processing complete: {len(results)} results generated")
        return jsonify({'results': results})
        
    except Exception as e:
        print(f"Video processing error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/inspect-batch', methods=['POST'])
def inspect_batch():
    """API endpoint for batch PCB inspection.

    Previous implementation wiped all existing artifacts BEFORE processing. This caused
    image 404 issues when the frontend navigated then attempted to load annotated images.
    We now: (1) perform an age-based cleanup (keeping recent session files) AFTER creating
    new results, so that current batch files remain available for the details modal.
    """
    try:
        files = request.files.getlist('images')
        if not files:
            return jsonify({'error': 'No image files provided'}), 400

        results = []
        for i, file in enumerate(files):
            if file.filename != '':
                pcb_id = f"PCB-{i+1:03d}"
                result = aoi_backend.process_pcb_image(file, pcb_id)
                results.append(result)

        # Post-batch cleanup of stale (older) files only
        aoi_backend.cleanup_old_files()

        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/<path:filename>')
def serve_image(filename):
    """Serve uploaded and result images"""
    
    # Try uploads directory first
    if os.path.exists(os.path.join('uploads', filename)):
        return send_from_directory('uploads', filename)
    
    # Then try results directory
    if os.path.exists(os.path.join('results', filename)):
        return send_from_directory('results', filename)
    
    return jsonify({'error': 'Image not found'}), 404

@app.route('/api/videos/<path:filename>', methods=['GET', 'HEAD', 'OPTIONS'])
def serve_video(filename):
    """Serve uploaded and processed videos with proper headers for browser compatibility"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Range'
        return response
    
    try:
        file_path = None
        directory = None
        
        # Try uploads directory first
        if os.path.exists(os.path.join('uploads', filename)):
            file_path = os.path.join('uploads', filename)
            directory = 'uploads'
        # Then try results directory
        elif os.path.exists(os.path.join('results', filename)):
            file_path = os.path.join('results', filename)
            directory = 'results'
        
        if file_path:
            print(f"Serving video: {filename} from {directory}")
            response = send_from_directory(directory, filename)
            
            # Add headers for better browser compatibility
            response.headers['Content-Type'] = 'video/mp4'
            response.headers['Accept-Ranges'] = 'bytes'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Range'
            
            return response
        
        print(f"Video file not found: {filename}")
        print(f"Checked paths:")
        print(f"  - uploads/{filename}: {os.path.exists(os.path.join('uploads', filename))}")
        print(f"  - results/{filename}: {os.path.exists(os.path.join('results', filename))}")
        return jsonify({'error': 'Video not found'}), 404
        
    except Exception as e:
        print(f"Error serving video {filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/extract-frame/<video_id>/<int:frame_number>')
def extract_frame(video_id, frame_number):
    """Extract a specific frame from a processed video"""
    
    try:
        # Find the video file
        video_files = [f for f in os.listdir('results') if f.startswith(video_id) and f.endswith('.mp4')]
        if not video_files:
            return jsonify({'error': 'Video not found'}), 404
        
        video_path = os.path.join('results', video_files[0])
        
        # Extract frame
        cap = cv2.VideoCapture(video_path)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number - 1)  # Frame numbers are 1-based
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return jsonify({'error': 'Could not extract frame'}), 404
        
        # Save frame as image
        frame_filename = f"{video_id}_frame_{frame_number}.jpg"
        frame_path = os.path.join('results', frame_filename)
        cv2.imwrite(frame_path, frame)
        
        return send_from_directory('results', frame_filename)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/results/<pcb_id>')
def get_result(pcb_id):
    """Get detailed results for a specific PCB"""
    
    # Find the most recent result file for this PCB ID
    result_files = [f for f in os.listdir('results') if f.startswith(pcb_id) and f.endswith('_result.json')]
    
    if not result_files:
        return jsonify({'error': 'Result not found'}), 404
    
    # Get the most recent result
    latest_result = sorted(result_files)[-1]
    result_path = os.path.join('results', latest_result)
    
    with open(result_path, 'r') as f:
        result = json.load(f)
    
    return jsonify(result)

@app.route('/api/cleanup', methods=['POST'])
def cleanup_files():
    """Manual cleanup endpoint.

    Accept optional 'preserve_minutes' to override default window.
    """
    try:
        preserve = request.json.get('preserve_minutes') if request.is_json else None
        preserve = int(preserve) if preserve is not None else 10
        aoi_backend.cleanup_old_files(preserve_recent_minutes=preserve)
        return jsonify({'status': 'cleaned', 'preserve_minutes': preserve, 'timestamp': datetime.now().isoformat()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test-video')
def test_video():
    """Test endpoint to check video files"""
    try:
        video_files = []
        if os.path.exists('results'):
            for file in os.listdir('results'):
                if file.endswith('.mp4'):
                    file_path = os.path.join('results', file)
                    file_size = os.path.getsize(file_path)
                    
                    # Test if video can be opened
                    import cv2
                    cap = cv2.VideoCapture(file_path)
                    is_valid = cap.isOpened()
                    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) if is_valid else 0
                    fps = cap.get(cv2.CAP_PROP_FPS) if is_valid else 0
                    cap.release()
                    
                    video_files.append({
                        'filename': file,
                        'size': file_size,
                        'url': f'/api/videos/{file}',
                        'direct_url': f'http://localhost:5000/api/videos/{file}',
                        'is_valid': is_valid,
                        'frame_count': frame_count,
                        'fps': fps
                    })
        
        return jsonify({
            'video_files': video_files,
            'count': len(video_files),
            'results_dir_exists': os.path.exists('results')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/simple-video-test', methods=['POST'])
def simple_video_test():
    """Simple video test - just copy input to output without processing"""
    
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        # Save input video
        input_path = os.path.join("uploads", f"test_input.mp4")
        file.save(input_path)
        
        # Simple copy without any processing
        output_path = os.path.join("results", f"test_output.mp4")
        
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            return jsonify({'error': 'Cannot open input video'}), 400
        
        # Get properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Create writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            cap.release()
            return jsonify({'error': 'Cannot create output video'}), 400
        
        # Copy frames
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Just add simple text
            cv2.putText(frame, f"Frame {frame_count}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            out.write(frame)
            frame_count += 1
        
        cap.release()
        out.release()
        
        return jsonify({
            'status': 'success',
            'input_file': 'test_input.mp4',
            'output_file': 'test_output.mp4',
            'frames_processed': frame_count,
            'output_url': f'/api/videos/test_output.mp4'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-video-page')
def test_video_page():
    """Simple HTML page to test video playback"""
    video_files = []
    if os.path.exists('results'):
        for file in os.listdir('results'):
            if file.endswith('.mp4'):
                video_files.append(file)
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Video Test Page</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            video { width: 100%; max-width: 800px; margin: 10px 0; }
            .video-info { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>AOI Video Test Page</h1>
        <p>This page tests video playback directly from the backend.</p>
    """
    
    for video_file in video_files:
        html += f"""
        <div class="video-info">
            <h3>{video_file}</h3>
            <p>URL: <a href="/api/videos/{video_file}" target="_blank">/api/videos/{video_file}</a></p>
            <video controls>
                <source src="/api/videos/{video_file}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        """
    
    html += """
    </body>
    </html>
    """
    
    return html

if __name__ == '__main__':
    print("🚀 Starting YOLOv10 AOI Backend Server...")
    print("🤖 Model loaded successfully!")
    print("🌐 Server will be available at: http://localhost:5000")
    print("📡 API Endpoints:")
    print("   POST /api/inspect - Single PCB inspection")
    print("   POST /api/inspect-batch - Batch PCB inspection")
    print("   POST /api/inspect-video - Video PCB inspection") 
    print("   GET  /api/images/<filename> - Serve images")
    print("   GET  /api/videos/<filename> - Serve videos")
    print("   GET  /api/extract-frame/<video_id>/<frame> - Extract specific frame")
    print("   GET  /api/results/<pcb_id> - Get detailed results")
    print("   POST /api/cleanup - Clean up old files")
    print("   GET  /api/health - Health check")
    print("   GET  /api/test-video - List available video files")
    
    app.run(host='0.0.0.0', port=5000, debug=True)