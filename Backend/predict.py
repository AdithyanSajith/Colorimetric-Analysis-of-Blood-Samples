import joblib
import numpy as np
import os

# Load trained calibration models
script_dir = os.path.dirname(os.path.abspath(__file__))
poly = joblib.load(os.path.join(script_dir, "calibration_poly.pkl"))
model = joblib.load(os.path.join(script_dir, "calibration_model.pkl"))

def predict_concentrations(features):
    """
    Predict concentrations from R values using trained polynomial regression model.
    
    features = [
        {
            "trial": 1,
            "R_values": [r1, r2, r3, ...]  (12 values per trial)
        },
        ...
    ]
    
    Returns predictions in same format as training.
    Predicts concentration for all wells (no control wells skipped).
    """
    all_predictions = []

    for trial_data in features:
        trial_id = trial_data["trial"]
        R_values = trial_data["R_values"]

        trial_predictions = []

        for R in R_values:
            # Ensure scalar float
            R = float(R)
            
            # Transform using polynomial features and predict
            X = poly.transform([[R]])
            concentration = model.predict(X)[0]
            
            # Round to 6 decimal places to match notebook precision
            trial_predictions.append(round(float(concentration), 6))

        all_predictions.append({
            "trial": trial_id,
            "concentrations": trial_predictions
        })

    return all_predictions
