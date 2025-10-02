# Configuration for ML pipeline
import os

# Data generation config
NUM_DAYS = 90
NUM_SERVICES = 4
INCIDENT_RATE = 0.3  # 30% of time periods have incidents
SAMPLE_INTERVAL_MINUTES = 5

# Service names
SERVICES = [
    'api-gateway',
    'auth-service', 
    'user-service',
    'database'
]

# Service dependencies
DEPENDENCIES = {
    'api-gateway': ['auth-service', 'user-service'],
    'auth-service': ['database'],
    'user-service': ['database'],
    'database': []
}

# SLO targets
SLO_TARGETS = {
    'latency': 500,  # ms
    'availability': 99.9,  # %
    'error_rate': 1.0,  # %
    'throughput': 100  # rps
}

# Model config
MODEL_NAME = 'xgboost_sre_predictor'
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Paths
DATA_PATH = 'training_data.csv'
MODEL_PATH = '../models/model.onnx'