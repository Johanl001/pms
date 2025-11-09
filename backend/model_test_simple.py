import tensorflow as tf
import numpy as np
import os

def test_tflite_model():
    """
    Test the TensorFlow Lite model loading and inference
    """
    print("Testing TensorFlow Lite Model")
    print("=" * 30)
    
    # Check if model file exists
    model_path = "plant_disease_model.tflite"
    if not os.path.exists(model_path):
        print(f"Error: Model file {model_path} not found!")
        return False
    
    try:
        # Load the TensorFlow Lite model
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        
        # Get input and output details
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        print(f"Model loaded successfully!")
        print(f"Input shape: {input_details[0]['shape']}")
        print(f"Output shape: {output_details[0]['shape']}")
        
        # Test with a random input (simulating an image)
        print("\nRunning inference with random input...")
        input_shape = input_details[0]['shape']
        input_data = np.array(np.random.random_sample(input_shape), dtype=np.float32)
        
        # Run inference
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        
        # Get the output
        output_data = interpreter.get_tensor(output_details[0]['index'])
        predicted_class = np.argmax(output_data[0])
        confidence = np.max(output_data[0])
        
        print(f"Inference successful!")
        print(f"Predicted class index: {predicted_class}")
        print(f"Confidence: {confidence:.4f}")
        print("Test completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error during model testing: {e}")
        return False

if __name__ == "__main__":
    test_tflite_model()