import tensorflow as tf
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.inception_v3 import InceptionV3
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import numpy as np
import matplotlib.pyplot as plt
import os
from sklearn.model_selection import train_test_split
import pathlib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# Configuration
BATCH_SIZE = 32
IMG_HEIGHT = 256
IMG_WIDTH = 256
EPOCHS = 25

# Define the classes (based on the dataset structure)
CLASS_NAMES = [
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

print("Setting up data generators...")

# Data preprocessing and augmentation
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    shear_range=0.2,
    validation_split=0.2
)

validation_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

print("Loading data from PlantVillage dataset...")

# Load training data from the actual PlantVillage dataset
train_generator = train_datagen.flow_from_directory(
    r'C:\Users\dnitr\Desktop\COLLEGE\IOT 2025\quoderproject\ai_models\PlantVillage\PlantVillage',  # Absolute path to the actual dataset
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

# Load validation data from the actual PlantVillage dataset
validation_generator = validation_datagen.flow_from_directory(
    r'C:\Users\dnitr\Desktop\COLLEGE\IOT 2025\quoderproject\ai_models\PlantVillage\PlantVillage',  # Absolute path to the actual dataset
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=True
)

print(f"Number of training samples: {train_generator.samples}")
print(f"Number of validation samples: {validation_generator.samples}")
print(f"Number of classes: {train_generator.num_classes}")

# Create and compile model using transfer learning
def create_model():
    # Use InceptionV3 as base model (pre-trained on ImageNet)
    base_model = InceptionV3(
        include_top=False,
        weights='imagenet',
        input_shape=(IMG_HEIGHT, IMG_WIDTH, 3)
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Add custom classifier on top
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(1024, activation='relu')(x)
    x = Dropout(0.4)(x)
    x = Dense(train_generator.num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=x)
    
    model.compile(
        optimizer=Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

print("Creating model...")
model = create_model()
model.summary()

print("Starting training...")
# Define callbacks
checkpoint = ModelCheckpoint(
    'backend/plant_disease_model_best.h5',
    monitor='val_accuracy',
    verbose=1,
    save_best_only=True,
    mode='auto'
)

early = EarlyStopping(
    monitor='val_accuracy',
    min_delta=0,
    patience=5,
    verbose=1,
    mode='auto'
)

# Train the model
history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    epochs=EPOCHS,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // BATCH_SIZE,
    callbacks=[checkpoint, early]
)

# Evaluate the model
print("Evaluating model...")
test_loss, test_acc = model.evaluate(validation_generator, verbose=2)
print(f'Validation accuracy: {test_acc:.4f}')

# Plot training history
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Training Accuracy')
plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
plt.title('Model Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

plt.tight_layout()
# Create directory if it doesn't exist
os.makedirs('ai_models', exist_ok=True)
plt.savefig('ai_models/training_history.png')
plt.show()

# Convert to TensorFlow Lite model
print("Converting to TensorFlow Lite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = {tf.lite.Optimize.DEFAULT}
tflite_model = converter.convert()

model_dir = 'backend/'
os.makedirs(model_dir, exist_ok=True)

# Save the TensorFlow Lite model
with open('backend/plant_disease_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("TensorFlow Lite model saved as 'backend/plant_disease_model.tflite'")

# Test the TensorFlow Lite model
print("Testing TensorFlow Lite model...")
interpreter = tf.lite.Interpreter(model_path='backend/plant_disease_model.tflite')
interpreter.allocate_tensors()

# Get input and output tensors
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Test the model with a sample input
input_shape = input_details[0]['shape']
input_data = np.array(np.random.random_sample(input_shape), dtype=np.float32)

interpreter.set_tensor(input_details[0]['index'], input_data)
interpreter.invoke()

# Get the output
output_data = interpreter.get_tensor(output_details[0]['index'])
predicted_class = np.argmax(output_data[0])
confidence = np.max(output_data[0])

# Get class names from the generator
class_names = list(train_generator.class_indices.keys())
print(f"Predicted class: {class_names[predicted_class]}")
print(f"Confidence: {confidence:.4f}")

print("Model training and conversion completed successfully!")