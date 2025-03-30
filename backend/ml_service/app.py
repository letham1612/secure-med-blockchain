from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pandas as pd

app = Flask(__name__)
CORS(app)

# In a production environment, you would load pre-trained models
# For demonstration, we'll create simple models
def create_mock_models():
    # Create a simple disease prediction model
    X = np.random.rand(1000, 8)  # 8 symptoms
    y = np.random.randint(0, 3, 1000)  # 3 possible diseases
    disease_model = RandomForestClassifier(n_estimators=10)
    disease_model.fit(X, y)
    
    # Create a simple risk assessment model
    X_risk = np.random.rand(1000, 6)  # 6 risk factors
    y_risk = np.random.randint(0, 3, 1000)  # 3 risk levels
    risk_model = RandomForestClassifier(n_estimators=10)
    risk_model.fit(X_risk, y_risk)
    
    return disease_model, risk_model

# Create and save mock models
disease_model, risk_model = create_mock_models()

@app.route('/predict/disease', methods=['POST'])
def predict_disease():
    try:
        data = request.json
        symptoms = np.array([
            data['fever'], data['cough'], data['fatigue'],
            data['difficultyBreathing'], data['headache'],
            data['bodyPain'], data['lossOfTaste'], data['soreThroat']
        ]).astype(float).reshape(1, -1)
        
        prediction = disease_model.predict(symptoms)[0]
        diseases = ['Common Cold', 'Influenza', 'COVID-19']
        
        return jsonify({
            'disease': diseases[prediction],
            'confidence': float(max(disease_model.predict_proba(symptoms)[0]))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict/risk', methods=['POST'])
def predict_risk():
    try:
        data = request.json
        risk_factors = np.array([
            data['age'], data['bmi'], data['smoking'],
            data['diabetes'], data['heartDisease'], data['hypertension']
        ]).astype(float).reshape(1, -1)
        
        prediction = risk_model.predict(risk_factors)[0]
        risk_levels = ['Low', 'Medium', 'High']
        
        return jsonify({
            'risk_level': risk_levels[prediction],
            'confidence': float(max(risk_model.predict_proba(risk_factors)[0]))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True) 