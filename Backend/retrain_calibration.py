"""
Retrain calibration models using reference data from the well plate
This matches the reference notebook approach exactly
"""
import numpy as np
import joblib
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import os

# Reference data from the calibration table (matching your analysis)
# Format: Concentration (g/dL), R value
reference_data = [
    (0.5, 167.529301),
    (1.0, 159.171289),
    (2.0, 142.563327),
    (3.0, 134.866232),
    (4.0, 123.327478),
    (5.0, 125.132325),
    (6.0, 122.401361),
    (7.0, 115.480151),
    (8.0, 105.604915),
    (9.0, 99.060491),
    (10.0, 73.809074),
]

# Extract X (R values) and y (Concentrations)
R_values = np.array([r for c, r in reference_data]).reshape(-1, 1)
concentrations = np.array([c for c, r in reference_data])

print("=" * 70)
print("CALIBRATION MODEL TRAINING - Matching Reference Notebook")
print("=" * 70)
print(f"\nData points: {len(reference_data)}")
print(f"R range: {R_values.min():.1f} - {R_values.max():.1f}")
print(f"Concentration range: {concentrations.min():.1f} - {concentrations.max():.1f}\n")

# Test polynomial degrees 2, 3, and 4 based on analysis
# Degree 4 performs best: R²=0.9788, RMSE=0.4506
best_degree = 4
best_r2 = -np.inf
best_poly = None
best_model = None
best_mae = np.inf

for degree in [2, 3, 4]:
    print(f"Testing polynomial degree {degree}...")
    
    # Create and fit
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_poly = poly.fit_transform(R_values)
    model = LinearRegression()
    model.fit(X_poly, concentrations)
    
    # Evaluate
    y_pred = model.predict(X_poly)
    r2 = r2_score(concentrations, y_pred)
    mae = mean_absolute_error(concentrations, y_pred)
    rmse = np.sqrt(mean_squared_error(concentrations, y_pred))
    
    print(f"  R² = {r2:.6f} | MAE = {mae:.4f} | RMSE = {rmse:.4f}")
    
    # Choose best by R² then MAE
    if r2 > best_r2 or (r2 == best_r2 and mae < best_mae):
        best_r2 = r2
        best_mae = mae
        best_degree = degree
        best_poly = poly
        best_model = model

print(f"\n{'=' * 70}")
print(f"BEST MODEL: Degree {best_degree}")
print(f"R² = {best_r2:.6f} | MAE = {best_mae:.4f}")
print(f"{'=' * 70}\n")

# Show predictions
print(f"{'Actual':<12} {'R Value':<12} {'Predicted':<12} {'Error':<12}")
print("-" * 50)

X_poly_best = best_poly.transform(R_values)
y_pred_best = best_model.predict(X_poly_best)

for i, (actual_c, r_val) in enumerate(reference_data):
    pred_c = y_pred_best[i]
    error = pred_c - actual_c
    print(f"{actual_c:<12.2f} {r_val:<12.2f} {pred_c:<12.3f} {error:+.3f}")

# Save models
script_dir = os.path.dirname(os.path.abspath(__file__))
poly_path = os.path.join(script_dir, "calibration_poly.pkl")
model_path = os.path.join(script_dir, "calibration_model.pkl")

joblib.dump(best_poly, poly_path)
joblib.dump(best_model, model_path)

print(f"\n✅ Models trained and saved!")
print(f"   Polynomial Features: {poly_path}")
print(f"   Regression Model: {model_path}")
print(f"\nPolynomial degree: {best_degree}")
print(f"Coefficients: {best_model.coef_}")
print(f"Intercept: {best_model.intercept_:.6f}")

