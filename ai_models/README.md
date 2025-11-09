# AI Models for Plant Disease Detection

## Overview

This directory contains the Jupyter notebook for training the plant disease detection model used in the AI-Powered IoT Indoor Plant Monitoring System.

## Model Architecture

The model uses transfer learning with MobileNetV3 as the base model, which is pre-trained on ImageNet. This approach allows us to achieve high accuracy with limited plant disease data.

## Datasets

The model is designed to work with the following datasets:

1. **PlantVillage Dataset**
   - Contains 54,303 images of healthy and diseased plants
   - Covers 14 crop species with various diseases
   - Available at: https://github.com/spMohanty/PlantVillage-Dataset

2. **PlantDoc Dataset**
   - Contains 2,598 images of plant diseases with segmentation masks
   - Focuses on common diseases in Indian subcontinent
   - Available at: https://github.com/pratikkayal/PlantDoc-Dataset

## How to Train with Real Data

### 1. Download the Datasets

```bash
# Clone the PlantVillage dataset
git clone https://github.com/spMohanty/PlantVillage-Dataset.git

# Clone the PlantDoc dataset
git clone https://github.com/pratikkayal/PlantDoc-Dataset.git
```

### 2. Organize the Data

Structure your data in the following format:

```
datasets/
├── plantvillage/
│   ├── Apple___Apple_scab/
│   ├── Apple___Black_rot/
│   ├── Apple___Cedar_apple_rust/
│   ├── Apple___healthy/
│   ├── Blueberry___healthy/
│   ├── Cherry___Powdery_mildew/
│   ├── Cherry___healthy/
│   └── ... (other plant/disease combinations)
└── plantdoc/
    ├── Apple Scab/
    ├── Black Rot/
    ├── Cedar Apple Rust/
    └── ... (other diseases)
```

### 3. Update the Notebook

In the `plant_disease_detection.ipynb` notebook, uncomment and modify the data loading sections:

```python
# Load training data
train_generator = train_datagen.flow_from_directory(
    'path/to/your/dataset/train',
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

# Load validation data
validation_generator = validation_datagen.flow_from_directory(
    'path/to/your/dataset/validation',
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)
```

### 4. Run the Training

Execute all cells in the notebook to:
1. Load and preprocess the data
2. Create and compile the model
3. Train the model
4. Evaluate performance
5. Convert to TensorFlow Lite format

## Fine-tuning (Advanced)

For better performance, you can fine-tune the model:

1. Train the model with frozen base layers (as in the notebook)
2. Unfreeze some of the top layers of the base model
3. Continue training with a much lower learning rate

```python
# Fine-tuning example
# Unfreeze the top layers of the base model
base_model.trainable = True

# Fine-tune from this layer onwards
fine_tune_at = 100

# Freeze all the layers before the `fine_tune_at` layer
for layer in base_model.layers[:fine_tune_at]:
  layer.trainable = False

# Use a lower learning rate for fine-tuning
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5/10),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Continue training
model.fit(train_generator, epochs=FINE_TUNE_EPOCHS, validation_data=validation_generator)
```

## Model Evaluation

The notebook includes code to:
- Plot training history (accuracy and loss)
- Evaluate on test data
- Generate classification reports
- Create confusion matrices

## Deployment

After training, the model is converted to TensorFlow Lite format and saved as `plant_disease_model.tflite`. This file should be moved to the backend directory:

```bash
mv plant_disease_model.tflite ../backend/
```

## Requirements

- Python 3.7+
- TensorFlow 2.0+
- Jupyter Notebook
- OpenCV
- Matplotlib
- Scikit-learn
- Pandas
- NumPy

Install requirements:
```bash
pip install -r ../backend/requirements.txt
```

## Usage Notes

1. **Data Augmentation**: The notebook includes data augmentation techniques to increase the effective size of the dataset and improve model generalization.

2. **Transfer Learning**: Using a pre-trained model significantly reduces training time and improves performance, especially with limited data.

3. **Model Size**: The TensorFlow Lite conversion reduces model size for efficient deployment on edge devices or servers with limited resources.

4. **Performance Monitoring**: Monitor training and validation metrics to detect overfitting and adjust hyperparameters accordingly.