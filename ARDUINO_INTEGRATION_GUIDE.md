# Arduino Safety Sensor Integration Guide

## Overview
This guide explains how to integrate your Arduino sensor system with the HALO Safety Monitor dashboard.

## Arduino Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Safety backend server details
const char* serverURL = "http://YOUR_COMPUTER_IP:8001/api/safety/update";

// Sensor pins (adjust according to your setup)
#define TEMP_SENSOR_PIN A0
#define HUMIDITY_SENSOR_PIN A1
#define DISTANCE_TRIGGER_PIN 7
#define DISTANCE_ECHO_PIN 8
#define PRESSURE_SENSOR_PIN A2
#define AIR_QUALITY_SENSOR_PIN A3

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor pins
  pinMode(DISTANCE_TRIGGER_PIN, OUTPUT);
  pinMode(DISTANCE_ECHO_PIN, INPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Read sensor values
  float temperature = readTemperature();
  float humidity = readHumidity();
  float distance = readDistance();
  float pressure = readPressure();
  float airQuality = readAirQuality();
  
  // Send data to safety backend
  sendSensorData(temperature, humidity, distance, pressure, airQuality);
  
  delay(1000); // Send data every second
}

float readTemperature() {
  // Replace with your temperature sensor reading logic
  int sensorValue = analogRead(TEMP_SENSOR_PIN);
  float voltage = sensorValue * (5.0 / 1023.0);
  float temperature = (voltage - 0.5) * 100; // For TMP36 sensor
  return temperature;
}

float readHumidity() {
  // Replace with your humidity sensor reading logic
  int sensorValue = analogRead(HUMIDITY_SENSOR_PIN);
  float humidity = map(sensorValue, 0, 1023, 0, 100);
  return humidity;
}

float readDistance() {
  // Ultrasonic sensor reading
  digitalWrite(DISTANCE_TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(DISTANCE_TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(DISTANCE_TRIGGER_PIN, LOW);
  
  long duration = pulseIn(DISTANCE_ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2; // Convert to cm
  return distance;
}

float readPressure() {
  // Replace with your pressure sensor reading logic
  int sensorValue = analogRead(PRESSURE_SENSOR_PIN);
  float pressure = map(sensorValue, 0, 1023, 950, 1050); // Example range
  return pressure;
}

float readAirQuality() {
  // Replace with your air quality sensor reading logic
  int sensorValue = analogRead(AIR_QUALITY_SENSOR_PIN);
  float airQuality = map(sensorValue, 0, 1023, 0, 1000);
  return airQuality;
}

void sendSensorData(float temp, float hum, float dist, float press, float airQ) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["distance"] = dist;
    doc["pressure"] = press;
    doc["air_quality"] = airQ;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Data sent successfully");
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error sending data");
      Serial.println("HTTP Response code: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
```

## Required Arduino Libraries

Install these libraries through the Arduino IDE Library Manager:

1. **WiFi** (ESP32/ESP8266)
2. **HTTPClient** 
3. **ArduinoJson** by Benoit Blanchon

## Sensor Connections

### Temperature Sensor (TMP36)
- VCC → 5V
- GND → GND  
- OUT → A0

### Humidity Sensor (DHT22)
- VCC → 5V
- GND → GND
- DATA → A1

### Ultrasonic Distance Sensor (HC-SR04)
- VCC → 5V
- GND → GND
- TRIG → Pin 7
- ECHO → Pin 8

### Pressure Sensor (BMP180/BMP280)
- VCC → 3.3V
- GND → GND
- SDA → A4 (I2C)
- SCL → A5 (I2C)

### Air Quality Sensor (MQ-135)
- VCC → 5V
- GND → GND
- AOUT → A3

## Setup Instructions

1. **Hardware Setup**
   - Connect all sensors according to the wiring diagram above
   - Ensure proper power supply for all components
   - Test each sensor individually first

2. **Arduino Code Configuration**
   - Replace `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD` with your WiFi credentials
   - Replace `YOUR_COMPUTER_IP` with the IP address of the computer running the safety backend
   - Adjust sensor pin definitions if different from the example
   - Modify sensor reading functions according to your specific sensors

3. **Backend Configuration**
   - Start the safety backend server: `python safety_backend_server.py`
   - The server runs on port 8001 by default
   - Arduino should send data to: `http://YOUR_IP:8001/api/safety/update`

4. **Testing**
   - Upload the Arduino code
   - Open Serial Monitor to see connection status and data transmission
   - Check the safety dashboard at `http://localhost:8080/safety`
   - Verify that sensor data appears in real-time

## Data Format

The Arduino sends JSON data in this format:

```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "distance": 120.0,
  "pressure": 1015.2,
  "air_quality": 300.0
}
```

## Troubleshooting

### Common Issues

1. **Arduino not connecting to WiFi**
   - Check SSID and password
   - Ensure Arduino is within WiFi range
   - Verify WiFi network allows new device connections

2. **Data not appearing in dashboard**
   - Check Arduino Serial Monitor for HTTP response codes
   - Verify computer IP address in Arduino code
   - Ensure safety backend server is running on port 8001
   - Check firewall settings on computer

3. **Sensor readings incorrect**
   - Verify sensor wiring connections
   - Check sensor power supply voltages
   - Calibrate sensors if necessary
   - Test sensors individually

### Network Configuration

- Find your computer's IP address:
  - Windows: `ipconfig`
  - Mac/Linux: `ifconfig`
- Ensure both Arduino and computer are on the same network
- Consider setting a static IP for the computer running the backend

## Security Considerations

- Use this setup only on trusted networks
- Consider implementing authentication for production use
- Monitor network traffic if security is a concern
- Use HTTPS in production environments

## Demo Mode

If no Arduino is connected, the safety backend automatically generates realistic demo data for testing the dashboard functionality.