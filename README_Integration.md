# YOLOv10 PCB AOI Integration

This project integrates your trained YOLOv10 PCB defect detection model with a modern web-based AOI (Automated Optical Inspection) interface.

## 🎯 What This Integration Provides

### **Complete AOI System**
- **Web Interface**: Modern React-based upload and inspection interface
- **YOLOv10 Backend**: Flask API server that runs your trained model
- **Real-time Results**: Live processing and display of inspection results
- **Ensemble Scoring**: Smart classification of PASS/FAIL/QUESTIONABLE status

### **Key Features**
- ✅ Drag & drop PCB image upload
- ✅ Real-time YOLOv10 defect detection
- ✅ Ensemble scoring for good PCB classification
- ✅ Detailed defect analysis with bounding boxes
- ✅ Batch processing support
- ✅ Professional inspection report interface

## 🚀 Quick Start

### **1. Start the Backend Server**
```bash
# Make sure you're in the PCB directory with best.pt model
python aoi_backend_server.py
```

The server will start on `http://localhost:5000` and load your YOLOv10 model.

### **2. Start the Frontend Interface**
Open a new terminal:
```bash
cd aoi-vision-flow
npm install
npm run dev
```

The web interface will be available at `http://localhost:5173`

### **3. Use the System**
1. Open `http://localhost:5173` in your browser
2. Upload PCB images (drag & drop or file selector)
3. Click "Start AOI Inspection"
4. View real-time YOLOv10 detection results

## 📊 Your YOLOv10 Model Performance

Based on your model validation results:
- **Accuracy**: 94.97% mAP@0.5
- **Precision**: 92.62%
- **Recall**: 88.89%
- **Speed**: ~53ms per image
- **Classes**: 8 defect types detected

## 🔧 System Architecture

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   Web Frontend  │ ◄────────────► │  Flask Backend   │
│  (React/TypeScript) │              │   (Python)       │
└─────────────────┘                └──────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  YOLOv10 Model   │
                                   │    (best.pt)     │
                                   └──────────────────┘
```

### **Backend API Endpoints**
- `POST /api/inspect` - Single PCB inspection
- `POST /api/inspect-batch` - Batch PCB inspection  
- `GET /api/images/<filename>` - Serve result images
- `GET /api/results/<pcb_id>` - Get detailed results
- `GET /api/health` - Health check

### **Ensemble Scoring Algorithm**
The system uses a smart ensemble approach to classify PCBs:

1. **High Confidence Detections** (Weight: 4)
   - Counts detections with >75% confidence
   - Strong indicator of actual defects

2. **Detection Density** (Weight: 2) 
   - Total number of detections found
   - Helps identify noisy vs clean PCBs

3. **Average Confidence** (Weight: 2)
   - Average confidence of all detections
   - Indicates model certainty

4. **Defect Area Coverage** (Weight: 3)
   - Percentage of PCB area covered by defects
   - Physical extent of problems

**Final Classification:**
- Score 0-2: ✅ **PASS** (Good PCB)
- Score 3-5: ⚠️ **QUESTIONABLE** (Manual review)
- Score 6+: ❌ **FAIL** (Defective PCB)

## 📁 File Structure

```
PCB/
├── best.pt                          # Your trained YOLOv10 model
├── aoi_backend_server.py            # Flask API server
├── simple_setup.py                 # Setup script
├── uploads/                         # Uploaded images
├── results/                         # Processed results and annotations
└── aoi-vision-flow/
    ├── src/
    │   └── pages/
    │       ├── UploadPage.tsx       # Modified upload interface
    │       └── InspectionPage.tsx   # Modified results interface
    └── package.json
```

## 🧪 Testing the Integration

Run the test script to verify everything is working:
```bash
python test_integration.py
```

This will:
- Check backend server health
- Test model inference with a sample image
- Verify API connectivity

## 🔍 Understanding Results

### **Status Classifications**
- **PASS**: PCB meets quality standards (ensemble score ≤2)
- **FAIL**: PCB has significant defects (ensemble score >5)  
- **QUESTIONABLE**: Borderline case requiring review (score 3-5)

### **Defect Types Detected**
Your model detects these 8 PCB defect classes:
1. `falsecopper` - False copper connections
2. `missinghole` - Missing drill holes
3. `mousebite` - Mouse bite defects
4. `opencircuit` - Open circuit breaks
5. `pinhole` - Pin holes in copper
6. `scratch` - Surface scratches
7. `shortcircuit` - Short circuit bridges
8. `spur` - Copper spurs

### **Metrics Provided**
- **Confidence**: Model confidence in primary defect
- **Total Defects**: Number of defects detected
- **Ensemble Score**: Combined scoring metric
- **Area Coverage**: Percentage of PCB affected
- **Processing Time**: Time taken for analysis

## 🎛️ Customization

### **Adjusting Thresholds**
Edit `aoi_backend_server.py` to modify:
```python
# Confidence thresholds
self.high_conf_threshold = 0.75    # Adjust for sensitivity
self.good_threshold = 2            # PASS/QUESTIONABLE boundary
self.questionable_threshold = 5    # QUESTIONABLE/FAIL boundary
```

### **Adding New Features**
- Modify frontend in `aoi-vision-flow/src/pages/`
- Add API endpoints in `aoi_backend_server.py`
- Customize ensemble scoring algorithm

## 🚦 Troubleshooting

### **Backend Issues**
- Ensure `best.pt` model file exists
- Check Python dependencies are installed
- Verify port 5000 is available

### **Frontend Issues**
- Run `npm install` in aoi-vision-flow directory
- Check Node.js version compatibility
- Verify port 5173 is available

### **Model Issues**
- Confirm model was trained with same class names
- Check image formats are supported
- Verify model file isn't corrupted

## 🎉 Success!

You now have a complete professional AOI system powered by your YOLOv10 model! The integration provides:

- **Real-time PCB inspection** with your trained model
- **Professional web interface** for operators
- **Smart ensemble scoring** for reliable classification
- **Detailed defect analysis** with visual feedback
- **Batch processing** capability for production use

Your 94.97% accuracy YOLOv10 model is now ready for deployment in a production AOI environment!