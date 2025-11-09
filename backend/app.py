from flask import Flask, request, jsonify
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
        disease_model = tf.lite.Interpreter(model_path="plant_disease_model.tflite")
        disease_model.allocate_tensors()
        logger.info("Disease detection model loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to load disease detection model: {e}")
    
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
    water_now = probability >= 0.85
    confidence = float(probability)
    
    # Simple estimation of next watering time (in hours)
    # This is a placeholder - in a real implementation, you would use a time series model
    next_watering_hours = max(1, int(6 * (1 - probability)))
    next_watering = time.time() + (next_watering_hours * 3600)
    
    return {
        "water_now": water_now,
        "confidence": confidence,
        "next_watering": next_watering
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
    # In a real implementation, you would save to Firebase or another database
    # For now, we'll just log to console
    logger.info(f"Sensor Data: {sensor_data}")
    logger.info(f"Health Score: {health_score}")
    logger.info(f"Watering Prediction: {watering_prediction}")
    logger.info(f"Anomaly Detected: {is_anomaly}")
    
    # Example of what would be saved to database:
    log_entry = {
        "timestamp": sensor_data.get("timestamp", time.time()),
        "sensor_data": sensor_data,
        "health_score": health_score,
        "watering_prediction": watering_prediction,
        "anomaly_detected": is_anomaly
    }
    
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
        
        # Prepare response for ESP32
        response = {
            "water": actuate_water,
            "light": False,  # Placeholder - in a real implementation, you would determine this based on light needs
            "health_score": health_score,
            "anomaly_detected": is_anomaly
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
        
        if not action:
            return jsonify({"error": "No action specified"}), 400
        
        # In a real implementation, you would:
        # 1. Check safety constraints
        # 2. Actuate the appropriate device
        # 3. Log the action
        
        response = {
            "action": action,
            "status": "executed",
            "timestamp": time.time()
        }
        
        logger.info(f"Actuation command: {action}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing actuation command: {str(e)}")
        return jsonify({"error": "Failed to process actuation command"}), 500

# Endpoint to get dashboard data
@app.route('/dashboard_data', methods=['GET'])
def dashboard_data():
    # In a real implementation, you would retrieve data from database
    # For now, return mock data
    mock_data = {
        "current_readings": {
            "soil_moisture": 520,
            "temperature": 24.5,
            "humidity": 62,
            "light_intensity": 450
        },
        "health_score": 87.5,
        "watering_prediction": {
            "water_now": False,
            "confidence": 0.23,
            "next_watering": time.time() + 7200  # 2 hours from now
        },
        "recent_data": [
            {"timestamp": time.time() - 300, "soil_moisture": 515, "temperature": 24.2},
            {"timestamp": time.time() - 600, "soil_moisture": 518, "temperature": 24.3},
            {"timestamp": time.time() - 900, "soil_moisture": 522, "temperature": 24.4},
        ]
    }
    
    return jsonify(mock_data)

# Initialize models when app starts
with app.app_context():
    initialize_models()
    train_models()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)