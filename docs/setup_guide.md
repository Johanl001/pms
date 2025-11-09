# Setup Guide

## Prerequisites

Before setting up the AI-Powered IoT Indoor Plant Monitoring System, ensure you have the following:

### Hardware Requirements
1. **ESP32 Development Board** (NodeMCU-32S or similar)
2. **Sensors**:
   - Capacitive Soil Moisture Sensor
   - DHT22 Temperature & Humidity Sensor
   - BH1750 Light Sensor
3. **Actuators**:
   - 5V Water Pump
   - LED Grow Light
4. **Relay Modules** (2-channel or individual relays)
5. **Breadboard and Jumper Wires**
6. **Power Supply** (5V adapter, 2A+ recommended)
7. **Micro USB Cable** (for ESP32 programming)

### Software Requirements
1. **Arduino IDE** (for ESP32 firmware)
2. **Python 3.8+** (for backend server)
3. **Node.js 16+** (for dashboard development)
4. **Git** (for version control)
5. **Firebase Account** (free tier)

## Hardware Setup

Follow the instructions in [wiring_diagram.md](wiring_diagram.md) to connect all components.

## Software Setup

### 1. ESP32 Firmware

1. **Install ESP32 Board Package**:
   - Open Arduino IDE
   - Go to File → Preferences
   - Add `https://dl.espressif.com/dl/package_esp32_index.json` to "Additional Board Manager URLs"
   - Go to Tools → Board → Boards Manager
   - Search for "esp32" and install "ESP32 by Espressif Systems"

2. **Install Required Libraries**:
   - Go to Tools → Manage Libraries
   - Install the following libraries:
     - WiFi
     - HTTPClient
     - ArduinoJson
     - DHT sensor library
     - Adafruit Unified Sensor

3. **Configure and Upload Firmware**:
   - Open `esp32_firmware/plant_monitor.ino`
   - Update WiFi credentials:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     ```
   - Update server URL:
     ```cpp
     const char* serverUrl = "http://your-server-ip:5000/data";
     ```
   - Select your ESP32 board (Tools → Board)
   - Select the correct COM port (Tools → Port)
   - Upload the sketch

### 2. Backend Server

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Generate a service account key (Project Settings → Service Accounts → Generate New Private Key)
   - Replace the contents of `backend/serviceAccountKey.json` with your downloaded JSON file

2. **Install Python Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the Server**:
   ```bash
   python app.py
   ```
   The server will start on `http://localhost:5000`

### 3. AI Models

1. **Install Jupyter Notebook** (if not already installed):
   ```bash
   pip install jupyter
   ```

2. **Run the Training Notebook**:
   ```bash
   cd ai_models
   jupyter notebook plant_disease_detection.ipynb
   ```
   - Execute all cells to train the model
   - The TensorFlow Lite model will be saved as `plant_disease_model.tflite`

3. **Move the Model to Backend**:
   ```bash
   mv plant_disease_model.tflite ../backend/
   ```

### 4. Web Dashboard

1. **Install Node.js Dependencies**:
   ```bash
   cd dashboard
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:3000`

## System Configuration

### 1. Network Configuration

1. **Find Backend Server IP**:
   - On Windows: `ipconfig`
   - On macOS/Linux: `ifconfig`
   - Note the local IP address (e.g., 192.168.1.100)

2. **Update ESP32 Firmware**:
   - Update the server URL in the firmware:
     ```cpp
     const char* serverUrl = "http://192.168.1.100:5000/data";
     ```

3. **Update Dashboard Proxy**:
   - The Vite config already includes a proxy to `http://localhost:5000`
   - No changes needed for local development

### 2. Firebase Configuration

1. **Add Firebase Config to Dashboard**:
   - Create `dashboard/src/firebase.js`:
     ```javascript
     import { initializeApp } from 'firebase/app';
     import { getFirestore } from 'firebase/firestore';
     
     const firebaseConfig = {
       // Your Firebase config from Firebase Console
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     
     const app = initializeApp(firebaseConfig);
     const db = getFirestore(app);
     
     export { db };
     ```

### 3. Safety Parameters

Adjust safety parameters in both ESP32 firmware and backend server as needed:

**ESP32 Firmware** (`plant_monitor.ino`):
```cpp
const unsigned long MIN_WATERING_INTERVAL = 21600000; // 6 hours
const unsigned long MAX_PUMP_TIME = 20000; // 20 seconds
const unsigned long MAX_DAILY_WATERING = 60000; // 60 seconds
```

**Backend Server** (`app.py`):
```python
MAX_PUMP_TIME = 20  # seconds
MIN_WATERING_INTERVAL = 6 * 3600  # 6 hours
MAX_DAILY_WATERING = 60  # seconds
```

## Testing the System

### 1. Hardware Testing

1. **Verify Sensor Readings**:
   - Open Serial Monitor in Arduino IDE
   - Check that sensor values are being read correctly
   - Verify data is being sent to the backend server

2. **Test Actuators**:
   - Send manual actuation commands through the dashboard
   - Verify the pump and light respond correctly
   - Check safety timers work properly

### 2. Backend Testing

1. **Check API Endpoints**:
   - Visit `http://localhost:5000/dashboard_data` to see mock data
   - Use tools like Postman to test POST endpoints

2. **Verify Database Storage**:
   - Check Firebase Firestore for stored sensor data
   - Verify disease analysis results are stored

### 3. Dashboard Testing

1. **Verify Data Display**:
   - Check that sensor data appears in real-time
   - Verify charts are updating correctly
   - Test all interactive components

2. **Test Image Upload**:
   - Upload a plant image
   - Verify the analysis results display correctly

## Troubleshooting

### Common Issues

1. **ESP32 Not Connecting to WiFi**:
   - Check WiFi credentials in firmware
   - Verify WiFi network is accessible
   - Ensure ESP32 is within range

2. **No Data in Dashboard**:
   - Check backend server is running
   - Verify network connectivity between ESP32 and backend
   - Check Firebase configuration

3. **Actuators Not Responding**:
   - Verify relay wiring
   - Check power supply to actuators
   - Confirm safety parameters are not preventing actuation

4. **AI Models Not Working**:
   - Verify TensorFlow Lite model is in the correct location
   - Check model input/output formats match expectations
   - Ensure required Python packages are installed

### Debugging Tips

1. **Enable Logging**:
   - Increase log level in backend server
   - Add debug prints in ESP32 firmware
   - Use browser developer tools for dashboard issues

2. **Check Connections**:
   - Verify all hardware connections
   - Test network connectivity with ping
   - Confirm firewall settings allow required ports

3. **Review Error Messages**:
   - Read error messages carefully
   - Search for specific error codes online
   - Check documentation for known issues

## Deployment

### Local Deployment

For local testing and development, the system is already configured to run locally.

### Cloud Deployment

To deploy to cloud services:

1. **Backend Server**:
   - Deploy to services like Render, Heroku, or AWS
   - Update ESP32 firmware with new server URL
   - Update dashboard proxy settings

2. **Dashboard**:
   - Build for production: `npm run build`
   - Deploy to Firebase Hosting, Vercel, or Netlify
   - Update API endpoints in production build

3. **Database**:
   - Firebase Firestore works the same in production
   - Ensure proper security rules are configured

## Maintenance

### Regular Tasks

1. **Update Dependencies**:
   - Periodically update Python packages
   - Update Node.js packages
   - Update Arduino libraries

2. **Retrain Models**:
   - Collect new data regularly
   - Retrain models with updated datasets
   - Evaluate model performance

3. **Monitor System**:
   - Check logs for errors
   - Monitor resource usage
   - Verify all components are functioning

### Backup Procedures

1. **Database Backup**:
   - Use Firebase export functionality
   - Regularly backup important data

2. **Code Backup**:
   - Use version control (Git)
   - Push to remote repository regularly

3. **Configuration Backup**:
   - Document all configuration settings
   - Keep copies of important files