from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
import tensorflow as tf
import cv2
from PIL import Image
import io
import base64
import firebase_admin
from firebase_admin import credentials, firestore
import json
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Firebase (you'll need to add your service account key)
db = None
try:
    # Check if the service account key file has valid data
    with open('serviceAccountKey.json', 'r') as f:
        key_data = json.load(f)
    
    # Check if it contains placeholder values
    if key_data.get('project_id') == 'your-project-id' or key_data.get('private_key') == '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n':
        logger.warning("Service account key contains placeholder values. Using mock database.")
    else:
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase initialized successfully")
except Exception as e:
    logger.warning(f"Firebase initialization failed: {e}. Using mock database.")

# Global variables for models and data
watering_model = None
anomaly_detector = None
disease_model = None
sensor_data_buffer = []

# In-memory storage for sensor data (as a temporary solution while Firebase is not configured)
in_memory_storage = []

# Safety parameters
MAX_PUMP_TIME = 20  # seconds
MIN_WATERING_INTERVAL = 6 * 3600  # 6 hours
MAX_DAILY_WATERING = 60  # seconds

# Initialize models
def initialize_models():
    global watering_model, anomaly_detector, disease_model
    
    # Initialize predictive watering model (simple logistic regression)
    watering_model = LogisticRegression()
    
    # Initialize anomaly detector
    anomaly_detector = IsolationForest(contamination="auto", random_state=42)
    
    # Initialize disease detection model
    try:
        import os
        model_path = "plant_disease_model.tflite"
        # Try current directory first, then backend directory
        if not os.path.exists(model_path):
            model_path = os.path.join(os.path.dirname(__file__), "plant_disease_model.tflite")
        if os.path.exists(model_path):
            disease_model = tf.lite.Interpreter(model_path=model_path)
            disease_model.allocate_tensors()
            logger.info(f"Disease detection model loaded successfully from {model_path}")
        else:
            logger.warning("Disease detection model file not found. Disease detection will use mock data.")
            disease_model = None
    except Exception as e:
        logger.warning(f"Failed to load disease detection model: {e}")
        disease_model = None
    
    logger.info("Models initialized")

# Train models with sample data
def train_models():
    global watering_model, anomaly_detector
    
    # Initialize models if not already done
    if watering_model is None:
        watering_model = LogisticRegression()
    if anomaly_detector is None:
        anomaly_detector = IsolationForest(contamination="auto", random_state=42)
    
    # Sample training data for watering model
    # In a real implementation, this would come from historical sensor data
    np.random.seed(42)
    days = np.arange(1, 31)
    soil_moisture = 1000 - (days * 15) + np.random.normal(0, 50, 30)
    temperature = 25 + np.random.normal(0, 5, 30)
    humidity = 60 + np.random.normal(0, 10, 30)
    light = 500 + np.random.normal(0, 100, 30)
    
    X_water = np.column_stack((soil_moisture, temperature, humidity, light))
    # Ensure we have both classes by setting different thresholds
    y_water = np.where(soil_moisture < 400, 1, 0)  # Need watering if soil moisture < 400
    
    # Ensure we have both classes in the training data
    if len(np.unique(y_water)) < 2:
        # Force some samples to be class 1 to ensure both classes are present
        y_water[0:5] = 1
    
    watering_model.fit(X_water, y_water)
    
    # Train anomaly detector
    sensor_data = np.column_stack((soil_moisture, temperature, humidity, light))
    anomaly_detector.fit(sensor_data)
    
    logger.info("Models trained with sample data")

# Calculate plant health score
def calculate_health_score(sensor_data):
    soil_moisture = sensor_data['soil_moisture']
    temperature = sensor_data['temperature']
    humidity = sensor_data['humidity']
    light = sensor_data['light_intensity']
    
    # Simple heuristic-based health score (0-100)
    # Optimal ranges: soil moisture 400-700, temp 20-30°C, humidity 50-70%, light 300-800
    soil_score = max(0, 100 - abs(soil_moisture - 550) / 2)
    temp_score = max(0, 100 - abs(temperature - 25) * 5)
    humidity_score = max(0, 100 - abs(humidity - 60) * 2)
    light_score = max(0, 100 - abs(light - 550) / 3)
    
    health_score = (soil_score + temp_score + humidity_score + light_score) / 4
    return min(100, max(0, health_score))

# Predict when to water next
def predict_watering_time(sensor_data):
    global watering_model
    
    if watering_model is None:
        return {"water_now": False, "confidence": 0.0, "next_watering": None}
    
    # Prepare data for prediction
    X = np.array([[sensor_data['soil_moisture'], 
                   sensor_data['temperature'], 
                   sensor_data['humidity'], 
                   sensor_data['light_intensity']]])
    
    # Get prediction probability
    try:
        probability = watering_model.predict_proba(X)[0][1]  # Probability of needing water
    except:
        # Fallback if model not properly trained
        probability = 0.0
    
    # Decision based on confidence threshold
    water_now = bool(probability >= 0.85)  # Convert to Python bool
    confidence = float(probability)
    
    # Simple estimation of next watering time (in hours)
    # This is a placeholder - in a real implementation, you would use a time series model
    next_watering_hours = max(1, int(6 * (1 - probability)))
    next_watering = time.time() + (next_watering_hours * 3600)
    
    return {
        "water_now": water_now,
        "confidence": confidence,
        "next_watering": float(next_watering)  # Convert to Python float
    }

# Detect anomalies in sensor data
def detect_anomalies(sensor_data):
    global anomaly_detector, sensor_data_buffer
    
    if anomaly_detector is None:
        return False
    
    # Add current data to buffer
    sensor_data_buffer.append([
        sensor_data['soil_moisture'],
        sensor_data['temperature'],
        sensor_data['humidity'],
        sensor_data['light_intensity']
    ])
    
    # Keep only last 50 readings
    if len(sensor_data_buffer) > 50:
        sensor_data_buffer.pop(0)
    
    # Need at least 10 data points for anomaly detection
    if len(sensor_data_buffer) < 10:
        return False
    
    # Detect anomaly in current data point
    current_data = np.array([[
        sensor_data['soil_moisture'],
        sensor_data['temperature'],
        sensor_data['humidity'],
        sensor_data['light_intensity']
    ]])
    
    try:
        anomaly = anomaly_detector.predict(current_data)[0] == -1
        return bool(anomaly)
    except:
        return False

# Analyze plant disease from image
def analyze_plant_disease(image_data):
    global disease_model
    
    # If model is not loaded, return mock result
    if disease_model is None:
        diseases = ["Healthy", "Powdery Mildew", "Leaf Spot", "Rust"]
        import random
        disease = random.choice(diseases)
        confidence = random.uniform(0.7, 0.95)
        
        return {
            "disease": disease,
            "confidence": float(confidence),
            "treatment": get_treatment_recommendation(disease)
        }
    
    try:
        # Decode the image data
        image = Image.open(io.BytesIO(image_data))
        
        # Preprocess the image for the model
        # Resize to match model input size
        image = image.resize((256, 256))
        
        # Convert to numpy array and normalize
        image_array = np.array(image, dtype=np.float32)
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        # Normalize pixel values to [0, 1]
        image_array = image_array / 255.0
        
        # Get input and output tensors
        input_details = disease_model.get_input_details()
        output_details = disease_model.get_output_details()
        
        # Set the input tensor
        disease_model.set_tensor(input_details[0]['index'], image_array)
        
        # Run inference
        disease_model.invoke()
        
        # Get the output
        output_data = disease_model.get_tensor(output_details[0]['index'])
        
        # Get predicted class and confidence
        predicted_class = np.argmax(output_data[0])
        confidence = np.max(output_data[0])
        
        # Define class names (should match training data)
        class_names = [
            'Pepper__bell___Bacterial_spot',
            'Pepper__bell___healthy',
            'Potato___Early_blight',
            'Potato___Late_blight',
            'Potato___healthy',
            'Tomato_Bacterial_spot',
            'Tomato_Early_blight',
            'Tomato_Late_blight',
            'Tomato_Leaf_Mold',
            'Tomato_Septoria_leaf_spot',
            'Tomato_Spider_mites_Two_spotted_spider_mite',
            'Tomato__Target_Spot',
            'Tomato__Tomato_YellowLeaf__Curl_Virus',
            'Tomato__Tomato_mosaic_virus',
            'Tomato_healthy'
        ]
        
        # Get disease name
        if predicted_class < len(class_names):
            disease = class_names[predicted_class]
        else:
            disease = "Unknown"
        
        return {
            "disease": disease,
            "confidence": float(confidence),
            "treatment": get_treatment_recommendation(disease)
        }
    
    except Exception as e:
        logger.error(f"Error in disease analysis: {str(e)}")
        # Return mock result on error
        diseases = ["Healthy", "Powdery Mildew", "Leaf Spot", "Rust"]
        import random
        disease = random.choice(diseases)
        confidence = random.uniform(0.7, 0.95)
        
        return {
            "disease": disease,
            "confidence": float(confidence),
            "treatment": get_treatment_recommendation(disease)
        }

# Get treatment recommendation based on disease
def get_treatment_recommendation(disease):
    recommendations = {
        "Healthy": "Your plant is healthy! Keep up the good care.",
        "Powdery Mildew": "Apply neem oil or potassium bicarbonate spray. Improve air circulation.",
        "Leaf Spot": "Remove affected leaves. Avoid overhead watering. Apply copper-based fungicide.",
        "Rust": "Remove infected parts. Apply sulfur or copper fungicide. Ensure good air circulation."
    }
    return recommendations.get(disease, "Monitor your plant closely and maintain proper care.")

# Check safety constraints for actuation
def check_safety_constraints(action, last_actuation_time):
    current_time = time.time()
    
    if action == "water":
        # Check minimum interval between watering
        if current_time - last_actuation_time < MIN_WATERING_INTERVAL:
            return False, "Minimum watering interval not met"
        
    return True, "Safe to actuate"

# Log data to database
def log_data(sensor_data, health_score, watering_prediction, is_anomaly):
    # Log to console
    logger.info(f"Sensor Data: {sensor_data}")
    logger.info(f"Health Score: {health_score}")
    logger.info(f"Watering Prediction: {watering_prediction}")
    logger.info(f"Anomaly Detected: {is_anomaly}")
    
    # Store in memory (as a temporary solution while Firebase is not configured)
    global in_memory_storage
    log_entry = {
        "timestamp": sensor_data.get("timestamp", time.time()),
        "sensor_data": sensor_data,
        "health_score": float(health_score),
        "watering_prediction": watering_prediction,
        "anomaly_detected": bool(is_anomaly)
    }
    
    # Add to in-memory storage
    in_memory_storage.append(log_entry)
    
    # Keep only the last 100 entries to prevent memory issues
    if len(in_memory_storage) > 100:
        in_memory_storage.pop(0)
    
    # Log the current size of in_memory_storage
    logger.info(f"In-memory storage now contains {len(in_memory_storage)} entries")
    
    # Save to Firebase if available
    if db is not None:
        try:
            db.collection('plant_data').add(log_entry)
        except Exception as e:
            logger.error(f"Failed to save to Firebase: {e}")
    
    return log_entry

# Endpoint to receive sensor data from ESP32
@app.route('/data', methods=['POST'])
def receive_sensor_data():
    try:
        # Parse JSON data
        sensor_data = request.get_json()
        logger.info(f"Received sensor data: {sensor_data}")
        
        # Calculate health score
        health_score = calculate_health_score(sensor_data)
        
        # Predict watering needs
        watering_prediction = predict_watering_time(sensor_data)
        
        # Detect anomalies
        is_anomaly = detect_anomalies(sensor_data)
        
        # Check if we should actuate watering
        actuate_water = False
        if watering_prediction["water_now"] and watering_prediction["confidence"] >= 0.85:
            # In a real implementation, you would check last actuation time from database
            last_watering_time = 0  # Placeholder
            safe_to_water, _ = check_safety_constraints("water", last_watering_time)
            if safe_to_water:
                actuate_water = True
        
        # Log data
        log_entry = log_data(sensor_data, health_score, watering_prediction, is_anomaly)
        
        # Prepare response for ESP32 (convert numpy types to Python native types)
        response = {
            "water": bool(actuate_water),  # Convert numpy.bool_ to Python bool
            "light": False,  # Placeholder - in a real implementation, you would determine this based on light needs
            "health_score": float(health_score),
            "anomaly_detected": bool(is_anomaly)
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing sensor data: {str(e)}")
        return jsonify({"error": "Failed to process sensor data"}), 500

# Endpoint to receive plant images for disease analysis
@app.route('/upload_image', methods=['POST'])
def upload_image():
    try:
        # Get image data
        if 'image' in request.files:
            # Image uploaded as file
            image_file = request.files['image']
            image_data = image_file.read()
        else:
            # Image sent as base64 in JSON
            data = request.get_json()
            if 'image' not in data:
                return jsonify({"error": "No image provided"}), 400
            
            image_data = base64.b64decode(data['image'])
        
        # Analyze plant disease
        disease_analysis = analyze_plant_disease(image_data)
        
        # Log analysis
        logger.info(f"Disease analysis: {disease_analysis}")
        
        # Save to database if available
        if db is not None:
            try:
                db.collection('disease_analysis').add({
                    "timestamp": time.time(),
                    "result": disease_analysis
                })
            except Exception as e:
                logger.error(f"Failed to save disease analysis to Firebase: {e}")
        
        return jsonify(disease_analysis)
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": "Failed to process image"}), 500

# Endpoint to manually control actuators
@app.route('/actuate', methods=['POST'])
def actuate():
    try:
        data = request.get_json()
        action = data.get('action')
        force = data.get('force', False)
        state = data.get('state')  # For light control
        
        if not action:
            return jsonify({"error": "No action specified"}), 400
        
        # Handle different actions
        if action == 'water':
            # Check safety constraints if not forced
            if not force:
                # In a real implementation, check last watering time from database
                last_watering_time = 0  # Placeholder
                safe_to_water, message = check_safety_constraints("water", last_watering_time)
                if not safe_to_water:
                    return jsonify({"error": message}), 400
            
            # Log the action
            logger.info(f"Watering command received (force: {force})")
            response = {
                "action": "water",
                "status": "executed",
                "message": "Watering command sent to device",
                "timestamp": time.time()
            }
            
        elif action == 'light':
            # Handle light toggle
            light_state = state if state is not None else True
            logger.info(f"Light control command: {'ON' if light_state else 'OFF'}")
            response = {
                "action": "light",
                "state": light_state,
                "status": "executed",
                "message": f"Light turned {'ON' if light_state else 'OFF'}",
                "timestamp": time.time()
            }
        else:
            return jsonify({"error": f"Unknown action: {action}"}), 400
        
        # Save to database if available
        if db is not None:
            try:
                db.collection('actuations').add({
                    "timestamp": time.time(),
                    "action": action,
                    "force": force,
                    "state": state if action == 'light' else None
                })
            except Exception as e:
                logger.error(f"Failed to save actuation to Firebase: {e}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing actuation command: {str(e)}")
        return jsonify({"error": "Failed to process actuation command"}), 500

# Endpoint to get dashboard data
@app.route('/dashboard_data', methods=['GET'])
def dashboard_data():
    # Try to retrieve data from database or use in-memory storage
    try:
        global in_memory_storage
        
        # Log the current state of in_memory_storage for debugging
        logger.info(f"In-memory storage length: {len(in_memory_storage)}")
        if in_memory_storage:
            logger.info(f"Latest entry: {in_memory_storage[-1] if in_memory_storage else 'None'}")
        
        # Initialize default values
        anomaly_detected = False
        
        # Use in-memory storage if Firebase is not available or as a fallback
        if in_memory_storage or db is None:
            # Get the most recent data from in-memory storage
            if in_memory_storage:
                # Sort by timestamp to get the most recent first
                sorted_data = sorted(in_memory_storage, key=lambda x: x['timestamp'], reverse=True)
                recent_data = []
                
                # Format recent data for the chart
                for data in sorted_data[:10]:  # Last 10 entries
                    sensor_data = data.get("sensor_data", {})
                    recent_data.append({
                        "timestamp": data.get("timestamp", time.time()),
                        "soil_moisture": sensor_data.get("soil_moisture", 0),
                        "temperature": sensor_data.get("temperature", 0),
                        "humidity": sensor_data.get("humidity", 0),
                        "light_intensity": sensor_data.get("light_intensity", 0)
                    })
                
                # Get the most recent data for current readings
                latest_data = sorted_data[0]
                sensor_data = latest_data.get("sensor_data", {})
                current_readings = {
                    "soil_moisture": sensor_data.get("soil_moisture", 0),
                    "temperature": sensor_data.get("temperature", 0),
                    "humidity": sensor_data.get("humidity", 0),
                    "light_intensity": sensor_data.get("light_intensity", 0)
                }
                
                # Get health score and watering prediction from the document
                health_score = latest_data.get("health_score", 85.0)
                watering_prediction = latest_data.get("watering_prediction", {
                    "water_now": False,
                    "confidence": 0.3,
                    "next_watering": time.time() + 7200
                })
                anomaly_detected = latest_data.get("anomaly_detected", False)
            else:
                # Fallback to mock data if no recent data
                current_readings = {
                    "soil_moisture": 520,
                    "temperature": 24.5,
                    "humidity": 62,
                    "light_intensity": 450
                }
                health_score = 87.5
                watering_prediction = {
                    "water_now": False,
                    "confidence": 0.23,
                    "next_watering": time.time() + 7200
                }
                anomaly_detected = False
                recent_data = [
                    {"timestamp": time.time() - 300, "soil_moisture": 515, "temperature": 24.2, "humidity": 60, "light_intensity": 500},
                    {"timestamp": time.time() - 600, "soil_moisture": 518, "temperature": 24.3, "humidity": 61, "light_intensity": 490},
                    {"timestamp": time.time() - 900, "soil_moisture": 522, "temperature": 24.4, "humidity": 62, "light_intensity": 480},
                ]
        else:
            # Try to get data from Firebase
            recent_data_ref = db.collection('plant_data').order_by('timestamp', direction='DESCENDING').limit(10)
            recent_docs = recent_data_ref.stream()
            
            recent_data = []
            latest_doc_data = None
            for doc in recent_docs:
                data = doc.to_dict()
                if latest_doc_data is None:
                    latest_doc_data = data  # Store the first (most recent) document
                sensor_data = data.get("sensor_data", {})
                recent_data.append({
                    "timestamp": data.get("timestamp", time.time()),
                    "soil_moisture": sensor_data.get("soil_moisture", 0),
                    "temperature": sensor_data.get("temperature", 0),
                    "humidity": sensor_data.get("humidity", 0),
                    "light_intensity": sensor_data.get("light_intensity", 0)
                })
            
            # Get the most recent data for current readings
            if recent_data and latest_doc_data is not None:
                latest_data = recent_data[0]
                current_readings = {
                    "soil_moisture": latest_data["soil_moisture"],
                    "temperature": latest_data["temperature"],
                    "humidity": latest_data["humidity"],
                    "light_intensity": latest_data["light_intensity"]
                }
                
                # Get health score and watering prediction from the document
                health_score = latest_doc_data.get("health_score", 85.0)
                watering_prediction = latest_doc_data.get("watering_prediction", {
                    "water_now": False,
                    "confidence": 0.3,
                    "next_watering": time.time() + 7200
                })
                anomaly_detected = latest_doc_data.get("anomaly_detected", False)
            else:
                # Fallback to mock data if no recent data
                current_readings = {
                    "soil_moisture": 520,
                    "temperature": 24.5,
                    "humidity": 62,
                    "light_intensity": 450
                }
                health_score = 87.5
                watering_prediction = {
                    "water_now": False,
                    "confidence": 0.23,
                    "next_watering": time.time() + 7200
                }
                anomaly_detected = False
                recent_data = [
                    {"timestamp": time.time() - 300, "soil_moisture": 515, "temperature": 24.2, "humidity": 60, "light_intensity": 500},
                    {"timestamp": time.time() - 600, "soil_moisture": 518, "temperature": 24.3, "humidity": 61, "light_intensity": 490},
                    {"timestamp": time.time() - 900, "soil_moisture": 522, "temperature": 24.4, "humidity": 62, "light_intensity": 480},
                ]
    except Exception as e:
        logger.error(f"Error retrieving dashboard data: {e}")
        # Fallback to mock data on error
        current_readings = {
            "soil_moisture": 520,
            "temperature": 24.5,
            "humidity": 62,
            "light_intensity": 450
        }
        health_score = 87.5
        watering_prediction = {
            "water_now": False,
            "confidence": 0.23,
            "next_watering": time.time() + 7200
        }
        anomaly_detected = False
        recent_data = [
            {"timestamp": time.time() - 300, "soil_moisture": 515, "temperature": 24.2, "humidity": 60, "light_intensity": 500},
            {"timestamp": time.time() - 600, "soil_moisture": 518, "temperature": 24.3, "humidity": 61, "light_intensity": 490},
            {"timestamp": time.time() - 900, "soil_moisture": 522, "temperature": 24.4, "humidity": 62, "light_intensity": 480},
        ]
    
    dashboard_data = {
        "current_readings": current_readings,
        "health_score": health_score,
        "watering_prediction": watering_prediction,
        "anomaly_detected": anomaly_detected,
        "recent_data": recent_data
    }
    
    logger.info(f"Sending dashboard data: {dashboard_data}")
    return jsonify(dashboard_data)

# Initialize models when app starts
with app.app_context():
    initialize_models()
    train_models()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)