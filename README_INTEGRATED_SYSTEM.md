# 🔧🛡️ AOI Inspector + HALO Safety Monitor - Integrated System

A comprehensive quality control and safety monitoring solution combining PCB defect detection with environmental safety monitoring.

## ✨ Features

### 🔧 AOI Inspector (PCB Defect Detection)
- **Single Image Inspection**: Upload individual PCB images for defect analysis
- **Batch Processing**: Process multiple PCB images simultaneously  
- **Video Analysis**: Analyze PCB inspection videos frame by frame
- **AI-Powered Detection**: YOLOv10 model for accurate defect classification
- **Real-time Results**: Instant defect detection with confidence scores
- **Detailed Reports**: Comprehensive analysis with annotated images

### 🛡️ HALO Safety Monitor (Environmental Monitoring)
- **Real-time Sensor Data**: Temperature, humidity, pressure, air quality, distance
- **Arduino Integration**: Direct connection to Arduino sensor systems
- **Historical Charts**: Track environmental trends over time
- **Safety Alerts**: Visual indicators for environmental conditions
- **Radar Visualization**: Distance sensor with radar-style display
- **Demo Mode**: Simulated data when hardware not connected

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Arduino with sensors (optional - demo mode available)

### 1. Start Backend Services
```bash
# Option 1: Start both backends together
python start_integrated_system.py

# Option 2: Start individually
python aoi_backend_server.py      # Port 5001
python safety_backend_server.py   # Port 8001
```

### 2. Start Frontend
```bash
cd aoi-vision-flow
npm install
npm run dev                        # Port 8080
```

### 3. Access the Application
Open your browser to: **http://localhost:8080**

## 🖥️ Application Interface

### Navigation Tabs
- **📤 Upload**: PCB image upload and processing
- **🔍 Inspection**: PCB quality analysis and results
- **🛡️ Safety Monitor**: Environmental safety dashboard

### Safety Monitor Features
- **Radial Gauges**: Temperature and humidity visualization
- **Metric Cards**: Pressure and air quality readings
- **Radar Display**: Distance sensor with sweep animation
- **Historical Chart**: Time-series data visualization
- **Connection Status**: Arduino connectivity indicator
- **IP Configuration**: Set Arduino IP address

## 🔌 Arduino Integration

### Hardware Requirements
- ESP32 or ESP8266 microcontroller
- Temperature sensor (TMP36 or DHT22)
- Humidity sensor (DHT22)
- Ultrasonic distance sensor (HC-SR04)
- Pressure sensor (BMP180/BMP280)
- Air quality sensor (MQ-135)

### Quick Setup
1. Connect sensors according to the wiring guide
2. Upload the Arduino code (see `ARDUINO_INTEGRATION_GUIDE.md`)
3. Configure WiFi credentials in Arduino code
4. Set your computer's IP address in the Arduino code
5. Start the safety backend server
6. Power on Arduino and verify connection

## 📊 API Endpoints

### AOI Backend (Port 5001)
- `POST /api/inspect` - Single PCB inspection
- `POST /api/inspect-batch` - Batch PCB processing
- `POST /api/inspect-video` - Video PCB analysis
- `GET /api/images/<filename>` - Serve processed images
- `GET /api/health` - Health check

### Safety Backend (Port 8001)
- `GET /api/safety/status` - Connection status
- `GET /api/safety/data` - Current sensor readings
- `GET /api/safety/historical` - Historical data
- `POST /api/safety/update` - Update sensor data
- `POST /api/arduino/sensors` - Arduino data endpoint

## 🎨 Theme and Styling

The integrated system features:
- **Blue and Black Gradient**: Safety components use blue/black gradients
- **Material Design**: Modern UI with consistent theming
- **Responsive Layout**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic theme adaptation
- **Smooth Animations**: Enhanced user experience

## 🔧 Configuration

### Environment Variables
Create `.env` file in `aoi-vision-flow/`:
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_SAFETY_API_URL=http://localhost:8001
```

### Arduino Configuration
```cpp
// WiFi Settings
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend URL
const char* serverURL = "http://YOUR_COMPUTER_IP:8001/api/safety/update";
```

## 📈 Data Flow

```
Arduino Sensors → WiFi → Safety Backend → Frontend Dashboard
PCB Images → AOI Backend → AI Processing → Results Display
```

## 🛠️ Development

### File Structure
```
PCB-Defect-Detection/
├── aoi_backend_server.py           # Main AOI backend
├── safety_backend_server.py        # Safety monitoring backend
├── start_integrated_system.py      # Launcher script
├── best.pt                         # YOLO model
├── ARDUINO_INTEGRATION_GUIDE.md    # Arduino setup guide
└── aoi-vision-flow/                # Frontend application
    ├── src/
    │   ├── components/
    │   │   ├── safety/             # Safety monitoring components
    │   │   └── Navigation.tsx      # Tab navigation
    │   ├── pages/
    │   │   ├── SafetyMonitor.tsx   # Safety dashboard page
    │   │   ├── UploadPage.tsx      # PCB upload page
    │   │   └── InspectionPage.tsx  # PCB inspection page
    │   └── hooks/
    │       └── useSafetyWebSocket.ts # Safety data hook
    └── package.json
```

## 🔒 Security Notes

- **Network Security**: Use only on trusted networks
- **Data Privacy**: Sensor data is processed locally
- **Authentication**: Consider adding auth for production use
- **Firewall**: Ensure ports 5001, 8001, 8080 are accessible

## 📋 System Requirements

### Minimum Requirements
- **CPU**: Dual-core 2.5GHz
- **RAM**: 4GB 
- **Storage**: 2GB free space
- **Network**: WiFi or Ethernet connection

### Recommended Requirements
- **CPU**: Quad-core 3.0GHz+
- **RAM**: 8GB+
- **GPU**: CUDA-compatible for faster AI processing
- **Storage**: SSD with 5GB+ free space

## 🐛 Troubleshooting

### Common Issues
1. **Backend won't start**: Check Python dependencies and port availability
2. **Arduino not connecting**: Verify WiFi credentials and IP address
3. **Frontend errors**: Ensure Node.js version 16+ and run `npm install`
4. **YOLO model missing**: Ensure `best.pt` is in the project root directory

### Debug Commands
```bash
# Check port usage
netstat -an | grep :5001
netstat -an | grep :8001
netstat -an | grep :8080

# Test API endpoints
curl http://localhost:5001/api/health
curl http://localhost:8001/api/safety/status
```

## 📞 Support

For technical support:
1. Check the troubleshooting section
2. Review Arduino integration guide
3. Verify all dependencies are installed
4. Check network connectivity and firewall settings

## 🎯 Future Enhancements

- [ ] Real-time alerts and notifications
- [ ] Data export functionality  
- [ ] Mobile app integration
- [ ] Cloud data synchronization
- [ ] Advanced analytics and reporting
- [ ] Multi-language support

---

**Note**: This integrated system provides both PCB quality control and environmental safety monitoring in a single, cohesive platform. The safety monitoring features complement the existing PCB inspection capabilities without affecting the core AOI functionality.