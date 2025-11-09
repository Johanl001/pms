# AI Model Explanation

## Overview

The AI-Powered IoT Indoor Plant Monitoring System uses three machine learning models to provide intelligent plant care:

1. **Predictive Watering Model** - Determines when to water the plant
2. **Anomaly Detection Model** - Identifies unusual sensor behavior
3. **Plant Disease Detection Model** - Classifies plant diseases from images

## Predictive Watering Model

### Purpose
The predictive watering model estimates when the plant needs watering based on current and historical sensor data.

### Algorithm
- **Type**: Linear Regression (simplified) / LSTM (advanced)
- **Features**: Soil moisture, temperature, humidity, light intensity
- **Target**: Binary classification (water/no water)

### Implementation
```python
# Simplified example
from sklearn.linear_model import LinearRegression

# Training data (in practice, this would be historical sensor data)
X = [[soil_moisture, temperature, humidity, light], ...]
y = [need_watering, ...]  # 1 if watering needed, 0 otherwise

# Train model
model = LinearRegression()
model.fit(X, y)

# Prediction
current_conditions = [[current_soil, current_temp, current_humidity, current_light]]
probability = model.predict_proba(current_conditions)[0][1]
```

### Decision Logic
- If probability ≥ 0.85: Recommend watering
- Else: Continue monitoring

### Confidence Factors
- Soil moisture level (primary factor)
- Temperature (affects evaporation rate)
- Humidity (affects water retention)
- Light intensity (affects photosynthesis and water usage)

## Anomaly Detection Model

### Purpose
The anomaly detection model identifies unusual patterns in sensor data that might indicate:
- Sensor malfunctions
- Environmental disturbances
- Plant health issues

### Algorithm
- **Type**: Isolation Forest
- **Features**: Soil moisture, temperature, humidity, light intensity
- **Output**: Anomaly score (-1 for anomaly, 1 for normal)

### Implementation
```python
# Simplified example
from sklearn.ensemble import IsolationForest

# Training data (normal operating conditions)
X = [[soil_moisture, temperature, humidity, light], ...]

# Train model
model = IsolationForest(contamination=0.1)  # 10% of data expected to be anomalies
model.fit(X)

# Detection
current_data = [[current_soil, current_temp, current_humidity, current_light]]
anomaly = model.predict(current_data)[0]  # -1 for anomaly, 1 for normal
```

### Types of Anomalies Detected
1. **Sudden spikes** in sensor readings
2. **Flat-line readings** indicating sensor failure
3. **Unusual correlations** between sensors
4. **Periodic patterns** that deviate from normal behavior

## Plant Disease Detection Model

### Purpose
The plant disease detection model classifies plant diseases from images of leaves.

### Algorithm
- **Base Model**: MobileNetV3 (pre-trained on ImageNet)
- **Fine-tuning**: On PlantVillage and PlantDoc datasets
- **Output**: Disease classification with confidence score

### Implementation
```python
# Simplified example
import tensorflow as tf

# Load pre-trained model
model = tf.keras.models.load_model('plant_disease_model.h5')

# Preprocess image
image = preprocess_image(uploaded_image)  # Resize, normalize, etc.

# Prediction
predictions = model.predict(image)
predicted_class = class_names[np.argmax(predictions)]
confidence = np.max(predictions)
```

### Dataset
- **PlantVillage**: 54,303 images of healthy and diseased plants
- **PlantDoc**: 2,598 images of plant diseases with segmentation masks
- **Classes**: Healthy, Powdery Mildew, Leaf Spot, Rust, etc.

### Preprocessing Steps
1. **Resize**: 224x224 pixels
2. **Normalize**: Pixel values between 0 and 1
3. **Augmentation**: Rotation, flipping, brightness adjustment

### Post-processing
- **Grad-CAM**: Generates heatmap showing which parts of the image influenced the decision
- **Confidence Threshold**: Only show results with confidence ≥ 85%

## Model Training and Optimization

### Data Preparation
1. **Sensor Data**:
   - Collected from ESP32 every 10 seconds
   - Stored in Firebase with timestamps
   - Cleaned to remove outliers and missing values

2. **Image Data**:
   - Collected from ESP32-CAM or uploaded by user
   - Preprocessed and resized
   - Annotated with disease labels

### Training Process
1. **Feature Engineering**:
   - Rolling averages for sensor data
   - Time-based features (hour of day, day of week)
   - Correlation features between sensors

2. **Model Selection**:
   - Compare multiple algorithms
   - Use cross-validation for performance estimation
   - Select best performing model

3. **Hyperparameter Tuning**:
   - Grid search or Bayesian optimization
   - Optimize for precision and recall
   - Balance between false positives and false negatives

### Model Evaluation Metrics

#### Predictive Watering Model
- **Accuracy**: Percentage of correct watering decisions
- **Precision**: Of all watering recommendations, how many were actually needed
- **Recall**: Of all times watering was actually needed, how many were correctly identified
- **F1-Score**: Harmonic mean of precision and recall

#### Anomaly Detection Model
- **Precision**: Of all anomalies detected, how many were actually anomalies
- **Recall**: Of all actual anomalies, how many were detected
- **F1-Score**: Harmonic mean of precision and recall

#### Disease Detection Model
- **Top-1 Accuracy**: Percentage of images where the correct disease was the top prediction
- **Top-5 Accuracy**: Percentage of images where the correct disease was in the top 5 predictions
- **Per-Class Precision/Recall**: Performance for each disease type

## Model Deployment

### TensorFlow Lite Conversion
Models are converted to TensorFlow Lite format for efficient inference:

```python
# Convert to TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Save model
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

### Inference Optimization
- **Quantization**: Reduce model size and improve inference speed
- **Pruning**: Remove unnecessary weights
- **Caching**: Store intermediate results for repeated predictions

## Continuous Learning

### Feedback Loop
1. **User Corrections**: When users override AI decisions, this feedback is stored
2. **Model Retraining**: Periodically retrain models with new data
3. **Performance Monitoring**: Track model accuracy over time
4. **A/B Testing**: Compare new models against current ones

### Personalization
- **Plant Species**: Adjust models based on plant type
- **Environmental Conditions**: Adapt to specific location conditions
- **User Preferences**: Learn from user behavior and preferences

## Explainability

### Grad-CAM Visualization
For the disease detection model, Grad-CAM generates heatmaps showing which parts of the image influenced the prediction:

```python
# Simplified Grad-CAM implementation
def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None):
    # Create a model that maps the input image to the activations
    # of the last conv layer as well as the output predictions
    grad_model = tf.keras.models.Model(
        [model.inputs], [model.get_layer(last_conv_layer_name).output, model.output]
    )

    # Then, we compute the gradient of the top predicted class for our input image
    # with respect to the activations of the last conv layer
    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        if pred_index is None:
            pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]

    # This is the gradient of the output neuron (top predicted or chosen)
    # with regard to the output feature map of the last conv layer
    grads = tape.gradient(class_channel, last_conv_layer_output)

    # This is a vector where each entry is the mean intensity of the gradient
    # over a specific feature map channel
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # We multiply each channel in the feature map array
    # by "how important this channel is" with regard to the top predicted class
    # then sum all the channels to obtain the heatmap class activation
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # For visualization purpose, we will also normalize the heatmap between 0 & 1
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()
```

### Confidence Interpretation
- **85%+**: High confidence, auto-actuation allowed
- **70-85%**: Medium confidence, user confirmation recommended
- **Below 70%**: Low confidence, manual decision required

## Future Improvements

1. **Advanced Models**:
   - Transformer-based models for time series prediction
   - Ensemble methods for improved accuracy
   - Few-shot learning for new plant species

2. **Edge Computing**:
   - Deploy models directly on ESP32 for faster response
   - Federated learning to improve models without sharing data

3. **Multi-modal Learning**:
   - Combine sensor data with image analysis
   - Integrate environmental data (weather forecasts, etc.)

4. **Reinforcement Learning**:
   - Learn optimal watering schedules through trial and error
   - Adapt to individual plant behavior over time