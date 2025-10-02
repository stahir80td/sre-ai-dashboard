"""
SRE AI Dashboard - ML Training Pipeline V2
Includes extreme failure scenarios and cascade failures
"""

import numpy as np
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

print("="*60)
print("SRE AI Dashboard - Training Pipeline V2")
print("Now with cascade failures and extreme scenarios!")
print("="*60)

# Configuration
SERVICES = ['api-gateway', 'auth-service', 'user-service', 'database']

def generate_normal_operations(num_samples=3000):
    """Generate normal operational data"""
    data = []
    
    for i in range(num_samples):
        row = {
            'hour_of_day': np.random.randint(0, 24),
            'is_peak_hour': np.random.randint(0, 2),
            'is_weekend': np.random.randint(0, 2),
        }
        
        # Normal operations - all services healthy
        for service in SERVICES:
            feature_prefix = service.replace('-', '_')
            row[f'{feature_prefix}_cpu'] = np.random.uniform(20, 70)
            row[f'{feature_prefix}_memory'] = np.random.uniform(30, 65)
            row[f'{feature_prefix}_latency'] = np.random.uniform(100, 400)
            row[f'{feature_prefix}_availability'] = np.random.uniform(98, 100)
            row[f'{feature_prefix}_error_rate'] = np.random.uniform(0, 2)
            row[f'{feature_prefix}_throughput'] = np.random.uniform(80, 150)
        
        # Topology features
        row['dependency_health_score'] = np.random.uniform(95, 100)
        row['cascade_risk'] = np.random.uniform(0, 0.2)
        row['slo_violation_count'] = np.random.randint(0, 2)
        row['critical_path_latency'] = np.random.uniform(100, 500)
        
        # No incident in normal operations
        row['will_have_incident'] = 0
        
        data.append(row)
    
    return data

def generate_degraded_scenarios(num_samples=2000):
    """Generate degraded but not critical scenarios"""
    data = []
    
    for i in range(num_samples):
        row = {
            'hour_of_day': np.random.randint(0, 24),
            'is_peak_hour': np.random.randint(0, 2),
            'is_weekend': np.random.randint(0, 2),
        }
        
        # Pick a service to degrade
        degraded_service = np.random.choice(SERVICES)
        
        for service in SERVICES:
            feature_prefix = service.replace('-', '_')
            
            if service == degraded_service:
                # Degraded service
                row[f'{feature_prefix}_cpu'] = np.random.uniform(75, 95)
                row[f'{feature_prefix}_memory'] = np.random.uniform(70, 90)
                row[f'{feature_prefix}_latency'] = np.random.uniform(500, 1500)
                row[f'{feature_prefix}_availability'] = np.random.uniform(85, 95)
                row[f'{feature_prefix}_error_rate'] = np.random.uniform(5, 15)
                row[f'{feature_prefix}_throughput'] = np.random.uniform(40, 80)
            else:
                # Other services slightly affected
                row[f'{feature_prefix}_cpu'] = np.random.uniform(40, 75)
                row[f'{feature_prefix}_memory'] = np.random.uniform(40, 70)
                row[f'{feature_prefix}_latency'] = np.random.uniform(200, 600)
                row[f'{feature_prefix}_availability'] = np.random.uniform(95, 99)
                row[f'{feature_prefix}_error_rate'] = np.random.uniform(1, 5)
                row[f'{feature_prefix}_throughput'] = np.random.uniform(70, 120)
        
        # Topology features
        row['dependency_health_score'] = np.random.uniform(70, 90)
        row['cascade_risk'] = np.random.uniform(0.3, 0.6)
        row['slo_violation_count'] = np.random.randint(2, 8)
        row['critical_path_latency'] = np.random.uniform(500, 1500)
        
        # Medium risk of incident
        row['will_have_incident'] = 1 if np.random.random() > 0.5 else 0
        
        data.append(row)
    
    return data

def generate_cascade_failures(num_samples=2500):
    """Generate complete cascade failure scenarios - CRITICAL for training!"""
    data = []
    
    for i in range(num_samples):
        row = {
            'hour_of_day': np.random.randint(0, 24),
            'is_peak_hour': np.random.randint(0, 2),
            'is_weekend': np.random.randint(0, 2),
        }
        
        # Scenario type
        scenario = np.random.choice(['database_down', 'partial_cascade', 'complete_failure'])
        
        if scenario == 'database_down':
            # Database completely down
            row['database_cpu'] = np.random.uniform(30, 50)
            row['database_memory'] = np.random.uniform(35, 55)
            row['database_latency'] = np.random.uniform(1000, 2000)
            row['database_availability'] = np.random.uniform(0, 60)  # Can be 0!
            row['database_error_rate'] = np.random.uniform(40, 100)  # Can be 100!
            row['database_throughput'] = np.random.uniform(0, 50)
            
            # Auth and User services fail due to database
            for service in ['auth_service', 'user_service']:
                row[f'{service}_cpu'] = np.random.uniform(20, 40)
                row[f'{service}_memory'] = np.random.uniform(30, 50)
                row[f'{service}_latency'] = 2000  # Max latency
                row[f'{service}_availability'] = 0  # Completely down
                row[f'{service}_error_rate'] = 100  # Total failure
                row[f'{service}_throughput'] = 0
            
            # API Gateway fails due to dependencies
            row['api_gateway_cpu'] = np.random.uniform(35, 50)
            row['api_gateway_memory'] = np.random.uniform(40, 55)
            row['api_gateway_latency'] = 2000
            row['api_gateway_availability'] = 0
            row['api_gateway_error_rate'] = 100
            row['api_gateway_throughput'] = 0
            
        elif scenario == 'partial_cascade':
            # Database degraded, some services down
            row['database_cpu'] = np.random.uniform(80, 95)
            row['database_memory'] = np.random.uniform(75, 90)
            row['database_latency'] = np.random.uniform(800, 1500)
            row['database_availability'] = np.random.uniform(70, 85)
            row['database_error_rate'] = np.random.uniform(10, 30)
            row['database_throughput'] = np.random.uniform(30, 70)
            
            # One service down, one degraded
            auth_down = np.random.random() > 0.5
            
            if auth_down:
                row['auth_service_cpu'] = np.random.uniform(20, 40)
                row['auth_service_memory'] = np.random.uniform(30, 50)
                row['auth_service_latency'] = 2000
                row['auth_service_availability'] = 0
                row['auth_service_error_rate'] = 100
                row['auth_service_throughput'] = 0
                
                row['user_service_cpu'] = np.random.uniform(70, 90)
                row['user_service_memory'] = np.random.uniform(65, 85)
                row['user_service_latency'] = np.random.uniform(500, 1200)
                row['user_service_availability'] = np.random.uniform(80, 95)
                row['user_service_error_rate'] = np.random.uniform(5, 20)
                row['user_service_throughput'] = np.random.uniform(40, 80)
            else:
                row['user_service_cpu'] = np.random.uniform(20, 40)
                row['user_service_memory'] = np.random.uniform(30, 50)
                row['user_service_latency'] = 2000
                row['user_service_availability'] = 0
                row['user_service_error_rate'] = 100
                row['user_service_throughput'] = 0
                
                row['auth_service_cpu'] = np.random.uniform(70, 90)
                row['auth_service_memory'] = np.random.uniform(65, 85)
                row['auth_service_latency'] = np.random.uniform(500, 1200)
                row['auth_service_availability'] = np.random.uniform(80, 95)
                row['auth_service_error_rate'] = np.random.uniform(5, 20)
                row['auth_service_throughput'] = np.random.uniform(40, 80)
            
            # API Gateway severely degraded
            row['api_gateway_cpu'] = np.random.uniform(80, 95)
            row['api_gateway_memory'] = np.random.uniform(75, 90)
            row['api_gateway_latency'] = np.random.uniform(1000, 2000)
            row['api_gateway_availability'] = np.random.uniform(50, 80)
            row['api_gateway_error_rate'] = np.random.uniform(30, 70)
            row['api_gateway_throughput'] = np.random.uniform(10, 50)
            
        else:  # complete_failure
            # Everything is down
            for service in SERVICES:
                feature_prefix = service.replace('-', '_')
                row[f'{feature_prefix}_cpu'] = np.random.uniform(10, 40)
                row[f'{feature_prefix}_memory'] = np.random.uniform(20, 50)
                row[f'{feature_prefix}_latency'] = 2000
                row[f'{feature_prefix}_availability'] = 0
                row[f'{feature_prefix}_error_rate'] = 100
                row[f'{feature_prefix}_throughput'] = 0
        
        # Extreme topology features for cascade scenarios
        row['dependency_health_score'] = np.random.uniform(0, 30)  # Very low
        row['cascade_risk'] = np.random.uniform(0.6, 1.0)  # High risk
        row['slo_violation_count'] = np.random.randint(12, 16)  # Many violations
        row['critical_path_latency'] = 2000  # Maximum
        
        # ALWAYS an incident in cascade scenarios
        row['will_have_incident'] = 1
        
        data.append(row)
    
    return data

def generate_near_failure_scenarios(num_samples=2000):
    """Generate scenarios right before cascade failure"""
    data = []
    
    for i in range(num_samples):
        row = {
            'hour_of_day': np.random.randint(0, 24),
            'is_peak_hour': np.random.randint(0, 2),
            'is_weekend': np.random.randint(0, 2),
        }
        
        # Database under extreme stress but not down yet
        row['database_cpu'] = np.random.uniform(85, 98)
        row['database_memory'] = np.random.uniform(85, 95)
        row['database_latency'] = np.random.uniform(800, 1800)
        row['database_availability'] = np.random.uniform(75, 90)
        row['database_error_rate'] = np.random.uniform(8, 25)
        row['database_throughput'] = np.random.uniform(40, 70)
        
        # Other services showing stress
        for service in ['auth_service', 'user_service']:
            row[f'{service}_cpu'] = np.random.uniform(70, 90)
            row[f'{service}_memory'] = np.random.uniform(65, 85)
            row[f'{service}_latency'] = np.random.uniform(400, 1200)
            row[f'{service}_availability'] = np.random.uniform(90, 97)
            row[f'{service}_error_rate'] = np.random.uniform(3, 10)
            row[f'{service}_throughput'] = np.random.uniform(60, 90)
        
        # API Gateway struggling
        row['api_gateway_cpu'] = np.random.uniform(75, 92)
        row['api_gateway_memory'] = np.random.uniform(70, 88)
        row['api_gateway_latency'] = np.random.uniform(600, 1500)
        row['api_gateway_availability'] = np.random.uniform(88, 96)
        row['api_gateway_error_rate'] = np.random.uniform(5, 15)
        row['api_gateway_throughput'] = np.random.uniform(50, 80)
        
        # High risk topology features
        row['dependency_health_score'] = np.random.uniform(40, 70)
        row['cascade_risk'] = np.random.uniform(0.5, 0.8)
        row['slo_violation_count'] = np.random.randint(6, 12)
        row['critical_path_latency'] = np.random.uniform(800, 1800)
        
        # Very likely to have incident soon
        row['will_have_incident'] = 1 if np.random.random() > 0.2 else 0
        
        data.append(row)
    
    return data

def main():
    print("\nGenerating training data with extreme scenarios...")
    
    # Combine all scenarios
    all_data = []
    
    print("- Generating 3000 normal operations samples...")
    all_data.extend(generate_normal_operations(3000))
    
    print("- Generating 2000 degraded scenarios...")
    all_data.extend(generate_degraded_scenarios(2000))
    
    print("- Generating 2500 CASCADE FAILURE scenarios...")
    all_data.extend(generate_cascade_failures(2500))
    
    print("- Generating 2000 near-failure scenarios...")
    all_data.extend(generate_near_failure_scenarios(2000))
    
    # Create DataFrame
    df = pd.DataFrame(all_data)
    print(f"\nTotal samples: {len(df)}")
    print(f"Incident rate: {df['will_have_incident'].mean()*100:.1f}%")
    
    # Save sample for inspection
    df.head(100).to_csv("training_data_v2.csv", index=False)
    print("Sample saved to training_data_v2.csv")
    
    # Check extreme values in data
    print("\nData statistics:")
    print(f"- Min availability: {df[[col for col in df.columns if 'availability' in col]].min().min():.1f}")
    print(f"- Max error_rate: {df[[col for col in df.columns if 'error_rate' in col]].max().max():.1f}")
    print(f"- Max SLO violations: {df['slo_violation_count'].max()}")
    print(f"- Services with 0% availability: {(df[[col for col in df.columns if 'availability' in col]] == 0).sum().sum()} instances")
    print(f"- Services with 100% error rate: {(df[[col for col in df.columns if 'error_rate' in col]] == 100).sum().sum()} instances")
    
    # Prepare features and labels
    feature_cols = [col for col in df.columns if col != 'will_have_incident']
    X = df[feature_cols]
    y = df['will_have_incident']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train XGBoost
    print("\nTraining XGBoost model...")
    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=8,
        learning_rate=0.1,
        objective='binary:logistic',
        random_state=42,
        eval_metric='logloss',
        scale_pos_weight=1,  # Balanced for incident detection
        subsample=0.8,
        colsample_bytree=0.8
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    print("\n" + "="*60)
    print("MODEL PERFORMANCE")
    print("="*60)
    print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred):.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, 
                                target_names=['No Incident', 'Will Have Incident']))
    
    # Test on extreme cases
    print("\n" + "="*60)
    print("TESTING ON EXTREME SCENARIOS")
    print("="*60)
    
    # Create extreme test case - everything down
    extreme_test = {}
    for col in feature_cols:
        if 'availability' in col:
            extreme_test[col] = 0
        elif 'error_rate' in col:
            extreme_test[col] = 100
        elif 'latency' in col:
            extreme_test[col] = 2000
        elif 'throughput' in col:
            extreme_test[col] = 0
        elif col == 'slo_violation_count':
            extreme_test[col] = 16
        elif col == 'cascade_risk':
            extreme_test[col] = 1.0
        elif col == 'dependency_health_score':
            extreme_test[col] = 0
        elif col == 'critical_path_latency':
            extreme_test[col] = 2000
        else:
            extreme_test[col] = X_test[col].mean()
    
    extreme_df = pd.DataFrame([extreme_test])
    extreme_pred = model.predict_proba(extreme_df)[0, 1]
    print(f"Complete system failure prediction: {extreme_pred*100:.1f}% incident probability")
    
    # Save model
    print("\nSaving model...")
    with open('../models/model.pkl', 'wb') as f:
        pickle.dump(model, f)
    print("Model saved to ../models/model.pkl")
    
    # Save feature names
    with open('../models/features.txt', 'w') as f:
        for feature in feature_cols:
            f.write(f"{feature}\n")
    print("Features saved to ../models/features.txt")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\nTop 10 Most Important Features:")
    for idx, row in feature_importance.head(10).iterrows():
        print(f"{row['feature']:35s}: {row['importance']:.4f}")
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("Model is now trained on cascade failures and extreme scenarios")
    print("="*60)

if __name__ == "__main__":
    main()