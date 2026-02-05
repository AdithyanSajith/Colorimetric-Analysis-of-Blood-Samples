import joblib
import numpy as np
import os

# Load trained calibration models with proper path handling
script_dir = os.path.dirname(os.path.abspath(__file__))
poly = joblib.load(os.path.join(script_dir, "calibration_poly.pkl"))
model = joblib.load(os.path.join(script_dir, "calibration_model.pkl"))

def predict_concentrations(features):
    """
    features = [
        {
            "trial": 1,
            "R_values": [r1, r2, r3, ...]
        },
        ...
    ]
    """

    all_predictions = []

    for trial_data in features:
        trial_id = trial_data["trial"]
        R_values = trial_data["R_values"]

        trial_predictions = []

        for R in R_values:
            # Ensure scalar float
            R = float(R)

            X = poly.transform([[R]])
            concentration = model.predict(X)[0]

            trial_predictions.append(round(float(concentration), 3))

        all_predictions.append({
            "trial": trial_id,
            "concentrations": trial_predictions
        })

    return all_predictions
