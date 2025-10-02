"""
Model Server - Serves XGBoost predictions via HTTP
"""
from flask import Flask, request, jsonify
import pickle
import numpy as np
import os

app = Flask(__name__)

# Load model and features at startup
print("Loading model...")
# Check both possible paths for Docker compatibility
model_path = 'models/model.pkl' if os.path.exists('models/model.pkl') else '../models/model.pkl'
features_path = 'models/features.txt' if os.path.exists('models/features.txt') else '../models/features.txt'

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print(f"Model loaded from {model_path}")
except Exception as e:
    print(f"Warning: Could not load model from {model_path}: {e}")
    model = None

try:
    with open(features_path, 'r') as f:
        feature_names = [line.strip() for line in f.readlines()]
    print(f"Features loaded! Expecting {len(feature_names)} features")
except Exception as e:
    print(f"Warning: Could not load features from {features_path}: {e}")
    feature_names = []

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'loaded' if model else 'not loaded'})

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500
        
    try:
        data = request.json
        
        # Extract features in correct order
        features = []
        for feature_name in feature_names:
            if feature_name in data:
                features.append(data[feature_name])
            else:
                # Use default values for missing features
                features.append(0.0)
        
        # Convert to numpy array
        X = np.array([features], dtype=np.float32)
        
        # Get prediction
        prob = model.predict_proba(X)[0]
        prediction = model.predict(X)[0]
        
        # Determine risk level and recommendation
        incident_prob = prob[1]
        
        if incident_prob < 0.3:
            risk_level = "low"
            recommendation = "System stable. Continue monitoring."
        elif incident_prob < 0.6:
            risk_level = "medium"
            recommendation = "Increased risk detected. Review metrics and prepare for scaling."
        elif incident_prob < 0.8:
            risk_level = "high"
            recommendation = "High risk! Scale up resources immediately."
        else:
            risk_level = "critical"
            recommendation = "CRITICAL! Incident imminent. Execute incident response plan NOW."
        
        # Determine incident type based on metrics
        incident_type = "unknown"
        if 'database_cpu' in data and data['database_cpu'] > 80:
            incident_type = "database_overload"
        elif 'api_gateway_latency' in data and data['api_gateway_latency'] > 1000:
            incident_type = "high_latency"
        elif 'slo_violation_count' in data and data['slo_violation_count'] > 5:
            incident_type = "slo_breach"
        
        response = {
            'incident_probability': float(incident_prob),
            'risk_level': risk_level,
            'confidence': float(max(prob)),
            'predicted_incident_type': incident_type,
            'recommendation': recommendation,
            'model_version': 'xgboost_v1',
            'prediction': int(prediction)
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/features', methods=['GET'])
def get_features():
    return jsonify({'features': feature_names, 'count': len(feature_names)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting model server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)