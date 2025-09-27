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

if __name__ == '__main__':
    print("🚀 Starting YOLOv10 AOI Backend Server...")
    print("🤖 Model loaded successfully!")
    print("🌐 Server will be available at: http://localhost:5000")
    print("📡 API Endpoints:")
    print("   POST /api/inspect - Single PCB inspection")
    print("   POST /api/inspect-batch - Batch PCB inspection") 
    print("   GET  /api/images/<filename> - Serve images")
    print("   GET  /api/results/<pcb_id> - Get detailed results")
    print("   POST /api/cleanup - Clean up old files")
    print("   GET  /api/health - Health check")
    
    app.run(host='0.0.0.0', port=5000, debug=True)