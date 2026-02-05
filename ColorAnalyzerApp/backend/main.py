from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from typing import List, Dict, Any
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(title="Color Strip Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def rgb_to_hsv_np(r: np.ndarray, g: np.ndarray, b: np.ndarray):
    """Vectorized RGB(0-255) to HSV(0-1)."""
    r = r / 255.0
    g = g / 255.0
    b = b / 255.0

    cmax = np.max([r, g, b], axis=0)
    cmin = np.min([r, g, b], axis=0)
    diff = cmax - cmin

    h = np.zeros_like(cmax)
    # Avoid division by zero
    mask = diff != 0

    r_eq = (cmax == r) & mask
    g_eq = (cmax == g) & mask
    b_eq = (cmax == b) & mask

    h[r_eq] = ((g[r_eq] - b[r_eq]) / diff[r_eq]) % 6
    h[g_eq] = ((b[g_eq] - r[g_eq]) / diff[g_eq]) + 2
    h[b_eq] = ((r[b_eq] - g[b_eq]) / diff[b_eq]) + 4

    h = h / 6.0  # normalize to 0-1

    s = np.zeros_like(cmax)
    nonzero = cmax != 0
    s[nonzero] = diff[nonzero] / cmax[nonzero]
    v = cmax

    return h, s, v


def analyze_strip_image(img_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Analyze color strip image and extract RGB values for each pad.
    Returns polynomial fits and predictions for RGB channels.
    """
    EXPECTED_COLS = 11
    CONCENTRATIONS = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    SAT_THRESH = 35
    VAL_THRESH = 40
    MIN_BLOB_AREA = 60

    # Resize for consistency
    h0, w0 = img_bgr.shape[:2]
    scale = 800.0 / max(h0, w0)
    if scale < 1.0:
        img_bgr = cv2.resize(img_bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)

    # Threshold on S and V
    mask = ((S > SAT_THRESH) & (V > VAL_THRESH)).astype("uint8") * 255

    # Morphological operations
    ko = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kc = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask_open = cv2.morphologyEx(mask, cv2.MORPH_OPEN, ko, iterations=1)
    mask_clean = cv2.morphologyEx(mask_open, cv2.MORPH_CLOSE, kc, iterations=1)

    # Find contours
    cnts, _ = cv2.findContours(mask_clean.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    blobs = []
    for c in cnts:
        area = cv2.contourArea(c)
        if area < 5:
            continue
        peri = cv2.arcLength(c, True)
        if peri == 0:
            continue
        circ = 4.0 * np.pi * area / (peri * peri)
        (x, y), r = cv2.minEnclosingCircle(c)
        if area >= MIN_BLOB_AREA and circ >= 0.3:
            blobs.append((int(x), int(y), int(round(r)), float(area), float(circ)))

    if not blobs:
        raise ValueError("No valid color pads detected on the strip.")

    # Sort left-to-right
    blobs = sorted(blobs, key=lambda b: b[0])
    if len(blobs) > EXPECTED_COLS:
        ys = np.array([b[1] for b in blobs], dtype=float)
        median_y = np.median(ys)
        blobs = sorted(blobs, key=lambda b: abs(b[1] - median_y))[:EXPECTED_COLS]
        blobs = sorted(blobs, key=lambda b: b[0])

    # Extract RGB values for each blob
    h_img, w_img = img_bgr.shape[:2]
    rgb_data = []
    
    for (cx, cy, r, area, circ) in blobs:
        rr = max(1, int(r * 0.72))
        Y, X = np.ogrid[:h_img, :w_img]
        dist2 = (X - cx) ** 2 + (Y - cy) ** 2
        mask_circle = dist2 <= rr * rr
        
        # Extract BGR values from the blob
        b_vals = img_bgr[mask_circle, 0]
        g_vals = img_bgr[mask_circle, 1]
        r_vals = img_bgr[mask_circle, 2]
        s_vals = S[mask_circle]
        
        if b_vals.size > 0:
            rgb_data.append({
                "r_mean": float(np.mean(r_vals)),
                "g_mean": float(np.mean(g_vals)),
                "b_mean": float(np.mean(b_vals)),
                "s_mean": float(np.mean(s_vals)),
                "r_std": float(np.std(r_vals)),
                "g_std": float(np.std(g_vals)),
                "b_std": float(np.std(b_vals)),
            })
        else:
            rgb_data.append({
                "r_mean": 0, "g_mean": 0, "b_mean": 0, "s_mean": 0,
                "r_std": 0, "g_std": 0, "b_std": 0
            })

    # Truncate or pad to EXPECTED_COLS
    if len(rgb_data) > EXPECTED_COLS:
        rgb_data = rgb_data[:EXPECTED_COLS]
    elif len(rgb_data) < EXPECTED_COLS:
        pad = [{"r_mean": 0, "g_mean": 0, "b_mean": 0, "s_mean": 0, "r_std": 0, "g_std": 0, "b_std": 0}] * (EXPECTED_COLS - len(rgb_data))
        rgb_data.extend(pad)

    # Extract individual channel arrays
    x = np.array(CONCENTRATIONS, dtype=float)
    r_values = np.array([d["r_mean"] for d in rgb_data], dtype=float)
    g_values = np.array([d["g_mean"] for d in rgb_data], dtype=float)
    b_values = np.array([d["b_mean"] for d in rgb_data], dtype=float)
    rgb_mean = (r_values + g_values + b_values) / 3.0
    s_values = np.array([d["s_mean"] for d in rgb_data], dtype=float)

    # Fit polynomials for each channel (degree 2)
    def fit_and_evaluate(y_vals, x_vals, channel_name):
        coeffs = np.polyfit(x_vals, y_vals, deg=2)
        poly = np.poly1d(coeffs)

        y_pred = poly(x_vals)
        r2 = r2_score(y_vals, y_pred)
        mae = mean_absolute_error(y_vals, y_pred)
        rmse = np.sqrt(mean_squared_error(y_vals, y_pred))

        x_fit = np.linspace(x_vals.min(), x_vals.max(), 50)
        y_fit = poly(x_fit)

        # Predict concentration from channel value by fitting the inverse mapping.
        inv_coeffs = np.polyfit(y_vals, x_vals, deg=2)
        inv_poly = np.poly1d(inv_coeffs)
        pred_conc = inv_poly(y_vals)

        return {
            "coeffs": coeffs.tolist(),
            "inv_coeffs": inv_coeffs.tolist(),
            "r2": float(r2),
            "mae": float(mae),
            "rmse": float(rmse),
            "fit_x": x_fit.tolist(),
            "fit_y": y_fit.tolist(),
            "actual_x": x_vals.tolist(),
            "actual_y": y_vals.tolist(),
            "predicted_concentration": np.clip(pred_conc, 0, 10).tolist(),
        }

    r_fit = fit_and_evaluate(r_values, x, "R")
    g_fit = fit_and_evaluate(g_values, x, "G")
    b_fit = fit_and_evaluate(b_values, x, "B")
    rgb_fit = fit_and_evaluate(rgb_mean, x, "RGB_mean")

    return {
        "color_values": [
            {
                "well": i + 1,
                "concentration": float(CONCENTRATIONS[i]),
                "r": rgb_data[i]["r_mean"],
                "g": rgb_data[i]["g_mean"],
                "b": rgb_data[i]["b_mean"],
                "rgb_mean": float(rgb_mean[i]),
                "s_mean": rgb_data[i]["s_mean"],
                "pred_from_r": float(r_fit["predicted_concentration"][i]),
                "pred_from_g": float(g_fit["predicted_concentration"][i]),
                "pred_from_b": float(b_fit["predicted_concentration"][i]),
                "pred_from_rgb": float(rgb_fit["predicted_concentration"][i]),
            }
            for i in range(len(rgb_data))
        ],
        "r_channel": r_fit,
        "g_channel": g_fit,
        "b_channel": b_fit,
        "rgb_mean_channel": rgb_fit,
        "trial_metrics": {
            "r2": float(r_fit["r2"]),
            "mae": float(r_fit["mae"]),
            "rmse": float(r_fit["rmse"]),
        }
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not contents:
            return JSONResponse({"error": "Empty file"}, status_code=400)

        # Decode image directly from bytes using numpy
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            return JSONResponse({"error": "Failed to decode image"}, status_code=400)

        result = analyze_strip_image(img_bgr)
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/health")
def health():
    return {"status": "ok"}

