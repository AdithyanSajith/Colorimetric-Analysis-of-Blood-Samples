import joblib
import os

script_dir = r"d:\CALOBLOOD\Backend"
poly = joblib.load(os.path.join(script_dir, "calibration_poly.pkl"))
model = joblib.load(os.path.join(script_dir, "calibration_model.pkl"))

print(f"Polynomial degree: {poly.degree}")
print(f"Coefficients: {model.coef_}")
print(f"Intercept: {model.intercept_}")

# Test with known values
test_R = [242.26, 167.03, 159.04, 141.91, 135.05, 122.30, 124.79, 121.30, 115.26, 105.74, 99.03, 73.56]

print("\nPredictions:")
for r in test_R:
    X = poly.transform([[r]])
    pred = model.predict(X)[0]
    print(f"R={r:.2f} -> Concentration={pred:.2f}")
