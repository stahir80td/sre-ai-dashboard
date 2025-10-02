 
"""
Convert pickle model to ONNX format
"""
import pickle
import numpy as np
from skl2onnx import to_onnx
import onnx

print("Loading pickle model...")
with open('../models/model.pkl', 'rb') as f:
    model = pickle.load(f)

print("Loading feature names...")
with open('../models/features.txt', 'r') as f:
    feature_names = [line.strip() for line in f.readlines()]

num_features = len(feature_names)
print(f"Model expects {num_features} features")

print("Converting to ONNX...")
# Create sample input for shape inference
X_sample = np.random.randn(1, num_features).astype(np.float32)

# Convert
onnx_model = to_onnx(model, X_sample, target_opset=12)

# Save
onnx_path = "../models/model.onnx"
onnx.save(onnx_model, onnx_path)

print(f"✅ Model saved to {onnx_path}")

# Test the ONNX model
import onnxruntime as rt
sess = rt.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
input_name = sess.get_inputs()[0].name
output = sess.run(None, {input_name: X_sample})
print(f"✅ ONNX test successful! Output shape: {output[0].shape}")
print(f"   Prediction probabilities: {output[1][0]}")