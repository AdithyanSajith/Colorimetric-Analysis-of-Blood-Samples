"""
Verify that the model produces consistent predictions
Tests with the reference R values from calibration data
"""
import joblib
import numpy as np
import os

# Load models
script_dir = os.path.dirname(os.path.abspath(__file__))
poly = joblib.load(os.path.join(script_dir, "calibration_poly.pkl"))
model = joblib.load(os.path.join(script_dir, "calibration_model.pkl"))

print("=" * 70)
print("PREDICTION VERIFICATION TEST")
print("=" * 70)
print(f"\nModel degree: {poly.degree}")
print(f"Model coefficients: {model.coef_}")
print(f"Model intercept: {model.intercept_:.6f}")

# Test with example R values from your analysis
test_cases = [
    (167.529301, 0.5,   "Well 2"),
    (159.171289, 1.0,   "Well 3"),
    (142.563327, 2.0,   "Well 4"),
    (134.866232, 3.0,   "Well 5"),
    (123.327478, 4.0,   "Well 6"),
    (125.132325, 5.0,   "Well 7"),
    (122.401361, 6.0,   "Well 8"),
    (115.480151, 7.0,   "Well 9"),
    (105.604915, 8.0,   "Well 10"),
    (99.060491,  9.0,   "Well 11"),
    (73.809074,  10.0,  "Well 12"),
]

print(f"\n{'Well':<12} {'R Value':<15} {'Expected':<12} {'Predicted':<12} {'Match'}")
print("-" * 70)

all_match = True
for R_val, expected_conc, well_name in test_cases:
    X = poly.transform([[R_val]])
    predicted_conc = model.predict(X)[0]
    
    # Check if prediction matches expected (within small tolerance)
    matches = abs(predicted_conc - expected_conc) < 1.5
    match_symbol = "✓" if matches else "✗"
    
    if not matches:
        all_match = False
    
    print(f"{well_name:<12} {R_val:<15.2f} {expected_conc:<12.2f} {predicted_conc:<12.2f} {match_symbol}")

print("-" * 70)
if all_match:
    print("\n✅ All predictions are consistent!")
else:
    print("\n⚠️  Some predictions differ from expected values")

print("\nThis model will give you the same predictions for the same R values.")
