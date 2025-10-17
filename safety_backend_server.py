#!/usr/bin/env python3
"""
Safety Monitoring Backend Server
This server receives sensor data from Arduino and provides REST API endpoints
for the safety monitoring frontend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import threading
import time
import random

class SafetyBackend:
    def __init__(self):
        self.current_data = {
            "temperature": 22.5,
            "humidity": 45.0,
            "distance": 150.0,
            "pressure": 1013.2,
            "air_quality": 285.0,
            "timestamp": datetime.now().isoformat()
        }
        self.historical_data = []
        self.is_connected = False
        
        # Start demo data generator if no Arduino connected
        self.demo_thread = threading.Thread(target=self._generate_demo_data, daemon=True)
        self.demo_thread.start()
    
    def _generate_demo_data(self):
        """Generate realistic demo sensor data when Arduino is not connected"""
        while True:
            if not self.is_connected:
                # Generate realistic fluctuating sensor data
                base_temp = 22.5
                base_humidity = 45.0
                base_pressure = 1013.2
                base_air_quality = 285.0
                base_distance = 150.0
                
                # Add some realistic variations
                time_factor = time.time() / 10  # Slow oscillation
                
                self.current_data = {
                    "temperature": base_temp + 3 * (0.5 - random.random()) + 2 * math.sin(time_factor),
                    "humidity": max(0, min(100, base_humidity + 10 * (0.5 - random.random()) + 5 * math.cos(time_factor * 0.7))),
                    "distance": max(0, base_distance + 100 * (0.5 - random.random()) + 50 * math.sin(time_factor * 1.2)),
                    "pressure": base_pressure + 5 * (0.5 - random.random()) + 3 * math.cos(time_factor * 0.5),
                    "air_quality": max(0, base_air_quality + 100 * (0.5 - random.random()) + 50 * math.sin(time_factor * 0.8)),
                    "timestamp": datetime.now().isoformat()
                }
                
                # Add to historical data (keep last 100 readings)
                self.historical_data.append(self.current_data.copy())
                if len(self.historical_data) > 100:
                    self.historical_data.pop(0)
            
            time.sleep(1)  # Update every second
    
    def update_sensor_data(self, data):
        """Update sensor data from Arduino"""
        self.current_data = {
            "temperature": float(data.get('temperature', 0)),
            "humidity": float(data.get('humidity', 0)),
            "distance": float(data.get('distance', 0)),
            "pressure": float(data.get('pressure', 0)),
            "air_quality": float(data.get('air_quality', 0)),
            "timestamp": datetime.now().isoformat()
        }
        
        # Add to historical data
        self.historical_data.append(self.current_data.copy())
        if len(self.historical_data) > 100:
            self.historical_data.pop(0)
        
        self.is_connected = True
        return self.current_data
    
    def get_current_data(self):
        """Get current sensor readings"""
        return self.current_data
    
    def get_historical_data(self):
        """Get historical sensor data"""
        return self.historical_data
    
    def get_status(self):
        """Get connection status"""
        return {
            "connected": self.is_connected,
            "last_update": self.current_data.get('timestamp'),
            "data_points": len(self.historical_data)
        }

# Import math for demo data generation
import math

# Flask API setup
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize the safety backend
safety_backend = SafetyBackend()

@app.route('/api/safety/status', methods=['GET'])
def get_status():
    """Get safety monitoring system status"""
    try:
        status = safety_backend.get_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/safety/data', methods=['GET'])
def get_sensor_data():
    """Get current sensor data"""
    try:
        data = safety_backend.get_current_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/safety/historical', methods=['GET'])
def get_historical_data():
    """Get historical sensor data"""
    try:
        data = safety_backend.get_historical_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/safety/update', methods=['POST'])
def update_sensor_data():
    """Receive sensor data from Arduino"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['temperature', 'humidity', 'distance', 'pressure', 'air_quality']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Update sensor data
        result = safety_backend.update_sensor_data(data)
        
        return jsonify({
            'status': 'success',
            'message': 'Sensor data updated successfully',
            'data': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/safety/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Safety Monitoring Backend',
        'timestamp': datetime.now().isoformat()
    })

# Arduino can POST data to this endpoint
@app.route('/api/arduino/sensors', methods=['POST'])
def arduino_sensor_update():
    """Alternative endpoint for Arduino to post sensor data"""
    return update_sensor_data()

if __name__ == '__main__':
    print("🛡️ Starting Safety Monitoring Backend Server...")
    print("🌐 Server will be available at: http://localhost:8001")
    print("📡 API Endpoints:")
    print("   GET  /api/safety/status - Get system status")
    print("   GET  /api/safety/data - Get current sensor data")
    print("   GET  /api/safety/historical - Get historical data")
    print("   POST /api/safety/update - Update sensor data")
    print("   POST /api/arduino/sensors - Arduino sensor update")
    print("   GET  /api/safety/health - Health check")
    print("")
    print("🤖 Demo mode active - generating simulated sensor data")
    print("📲 Arduino can POST JSON data to /api/safety/update or /api/arduino/sensors")
    print("📋 Expected JSON format:")
    print("   {")
    print('     "temperature": 25.5,')
    print('     "humidity": 60.0,')
    print('     "distance": 120.0,')
    print('     "pressure": 1015.2,')
    print('     "air_quality": 300.0')
    print("   }")
    
    app.run(host='0.0.0.0', port=8001, debug=True)