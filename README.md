# 🪴 AI-Powered IoT Indoor Plant Monitoring & Automation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

## 🌿 Overview

This project implements a complete smart indoor plant monitoring and automation system using ESP32, AI models, and a responsive web dashboard. The system collects environmental data, analyzes it with machine learning models, and automatically controls actuators to optimize plant health.

The system demonstrates closed-loop intelligence by sensing, analyzing, deciding, and acting autonomously while providing a user-friendly interface for monitoring and manual control.

## 🌟 Key Features

### AI Capabilities
- **Predictive Watering Model** - Estimates when to water next based on sensor readings
- **Health Score Estimation** - Quantifies plant condition from sensor data
- **Image-Based Disease Detection** - Classifies plant diseases using computer vision
- **Anomaly Detection** - Identifies unusual sensor behavior or faults
- **AI-based Recommendations** - Provides actionable insights with confidence scores
- **Auto-Control Logic** - Automatically actuates if confidence ≥ 85%
- **Personalized Learning Loop** - Improves over time based on user feedback

### Hardware Integration
- **ESP32 Firmware** - Reads sensors every 10 seconds and controls actuators
- **Sensor Suite** - Soil moisture, temperature, humidity, and light intensity
- **Actuator Control** - Water pump and grow light with safety mechanisms
- **Safety Parameters** - Max pump time, min watering intervals, daily limits

### Web Dashboard
- **Live Monitoring** - Real-time sensor data visualization
- **Interactive Charts** - Historical trends and health metrics
- **Manual Controls** - Override AI decisions when needed
- **Disease Detection** - Upload images for AI analysis
- **Recommendations** - Personalized care suggestions
- **Responsive Design** - Works on mobile, tablet, and desktop

## 🏗️ System Architecture

```
graph TB
    A[ESP32 Microcontroller] --> B[WiFi Network]
    B --> C[Backend Server]
    C --> D[Firebase Database]
    C --> E[AI Models]
    E --> C
    C --> F[Web Dashboard]
    F --> B
    A --> G[Sensors]
    A --> H[Actuators]
```

## 📁 Project Structure

```
.
├── esp32_firmware/          # ESP32 Arduino code
│   └── plant_monitor.ino    # Main firmware
├── backend/                 # Python Flask server
│   ├── app.py               # Main server application
│   ├── requirements.txt     # Python dependencies
│   └── models/              # AI models (TFLite)
├── ai_models/               # Model training notebooks
│   ├── plant_disease_detection.ipynb
│   └── README.md            # AI models documentation
├── dashboard/               # React web interface
│   ├── src/                 # React components
│   ├── package.json         # Node.js dependencies
│   └── tailwind.config.js   # Tailwind CSS config
├── docs/                    # Documentation
│   ├── setup_guide.md       # Installation instructions
│   ├── wiring_diagram.md    # Hardware connections
│   ├── system_architecture.md
│   └── model_explanation.md
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Multi-container setup
└── README.md                # This file
```

## 🔧 Hardware Components

### Microcontroller
- **ESP32 Development Board** (NodeMCU-32S or similar)

### Sensors
- **Capacitive Soil Moisture Sensor** (Analog output)
- **DHT22 Temperature/Humidity Sensor**
- **BH1750 Light Intensity Sensor** (I2C interface)

### Actuators
- **5V Water Pump** (submersible, 3-5W)
- **LED Grow Light** (full spectrum, 5-10W)
- **Relay Modules** (5V, 2-channel recommended)

### Miscellaneous
- **Breadboard and Jumper Wires**
- **Power Supply** (5V/2A+ adapter)
- **Micro USB Cable** (for ESP32 programming)

## 🧠 AI Models

### Predictive Watering
- **Algorithm**: Linear Regression / LSTM
- **Inputs**: Soil moisture, temperature, humidity, light
- **Output**: Probability of needing water (0-1)
- **Confidence Threshold**: 85% for auto-actuation

### Anomaly Detection
- **Algorithm**: Isolation Forest
- **Purpose**: Detect sensor faults or unusual conditions
- **Features**: All sensor readings
- **Output**: Anomaly flag (-1/1)

### Disease Detection
- **Base Model**: MobileNetV3 (pre-trained)
- **Fine-tuned on**: PlantVillage + PlantDoc datasets
- **Outputs**: Disease class + confidence score
- **Format**: TensorFlow Lite for efficient inference
- **Training**: See [AI Models Documentation](ai_models/README.md)

## 🚀 Quick Start

### Prerequisites
- Arduino IDE (for ESP32 firmware)
- Python 3.8+ (for backend)
- Node.js 16+ (for dashboard)
- Firebase Account (free tier)

### 1. Hardware Setup
1. Wire components according to [wiring diagram](docs/wiring_diagram.md)
2. Install ESP32 board package in Arduino IDE
3. Install required libraries (WiFi, HTTPClient, ArduinoJson, DHT)

### 2. Configure and Flash ESP32
```cpp
// Update in esp32_firmware/plant_monitor.ino
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-server-ip:5000/data";
```
Upload the sketch to your ESP32.

### 3. Backend Server
```bash
cd backend
# Update the serviceAccountKey.json file with your Firebase credentials
pip install -r requirements.txt
python app.py
```
Server runs on `http://localhost:5000`

### 4. Web Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Dashboard available at `http://localhost:3000`

### 5. AI Models (Optional)
```bash
cd ai_models
jupyter notebook plant_disease_detection.ipynb
```
Train and export the TensorFlow Lite model.

## 🐳 Docker Deployment

For easier deployment, use Docker:

```bash
docker-compose up --build
```

This will start:
- Backend server on port 5000
- Web dashboard on port 3000
- Firestore emulator on port 8080

## 📖 Documentation

- [Setup Guide](docs/setup_guide.md) - Complete installation instructions
- [Wiring Diagram](docs/wiring_diagram.md) - Hardware connections
- [System Architecture](docs/system_architecture.md) - Detailed system design
- [Model Explanation](docs/model_explanation.md) - AI model details

## 🛡️ Safety Features

- **Pump Safety Timer** - Maximum 20-second activation
- **Watering Intervals** - Minimum 6-hour between waterings
- **Daily Limit** - Maximum 60 seconds of watering per day
- **Confidence Threshold** - Auto-actuation only at 85%+ confidence
- **Watchdog Timer** - ESP32 monitors pump operation

## 🌱 Future Enhancements

- **Voice Control** - Integrate with voice assistants
- **GPT-based Summaries** - Natural language plant status reports
- **Alert System** - Email/SMS/Telegram notifications
- **Multi-plant Support** - Scale to multiple plant monitoring
- **Battery Optimization** - Low-power modes for portable setups
- **Offline Operation** - Local data buffering during network outages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- PlantVillage and PlantDoc datasets for disease detection training
- TensorFlow Lite for efficient model deployment
- Firebase for real-time database capabilities
- React and TailwindCSS for the responsive dashboard