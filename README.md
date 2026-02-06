# Color Analyzer - Colorimetric Analysis of Blood Samples

A mobile application for analyzing colorimetric blood samples using computer vision and machine learning. The app detects wells in test strips, extracts color values, and predicts concentrations using polynomial regression models.

## 📱 Features

- **Image Analysis**: Upload or capture images of colorimetric test strips
- **Well Detection**: Automatically detects wells using advanced circle detection algorithms
- **Color Extraction**: Extracts RGB color values and saturation from each well
- **Concentration Prediction**: Uses polynomial regression to predict concentrations from color channels
- **Trial-wise Results**: Displays results organized by trials with detailed tables
- **Interactive Charts**: Visualizes channel fits with interactive line graphs
- **Mobile-Optimized UI**: Responsive design optimized for iOS and Android devices

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI** server running on port 8001
- **OpenCV** for image processing and well detection
- **NumPy** for numerical computations
- **scikit-learn** for polynomial regression models
- Image optimization for faster processing (downscales large images)

### Frontend (React Native/Expo)
- **React Native** with Expo for cross-platform mobile development
- **expo-image-picker** for camera and gallery access
- **react-native-chart-kit** for data visualization
- **axios** for backend API communication

## 🛠️ Technologies Used

**Backend:**
- Python 3.x
- FastAPI
- OpenCV (cv2)
- NumPy
- scikit-learn
- Uvicorn (ASGI server)

**Frontend:**
- React Native 0.81.5
- Expo SDK
- React 19.1.0
- expo-image-picker
- react-native-chart-kit
- react-native-svg
- expo-linear-gradient

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

### Backend Requirements
- **Python 3.8+** ([Download Python](https://www.python.org/downloads/))
- **pip** (Python package manager)

### Frontend Requirements
- **Node.js 18+** ([Download Node.js](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Expo CLI** (will be installed via npm)

### Mobile Testing
- **Expo Go** app on your iOS/Android device, OR
- **Android Studio** (for Android Emulator), OR
- **Xcode** (for iOS Simulator on Mac)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AdithyanSajith/Colorimetric-Analysis-of-Blood-Samples.git
cd Colorimetric-Analysis-of-Blood-Samples
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

The `requirements.txt` includes:
- fastapi
- uvicorn
- opencv-python
- numpy
- scikit-learn
- python-multipart

#### Run the Backend Server

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

The backend will start on `http://0.0.0.0:8001`

**Note**: The server runs on `0.0.0.0` to be accessible from mobile devices on the same network.

### 3. Frontend Setup

#### Install Node Dependencies

Open a new terminal window:

```bash
cd ColorAnalyzerApp
npm install
```

#### Configure Backend IP Address

**Important**: Update the backend URL in `ColorAnalyzerApp/services/colorAnalyzer.js`

Find your computer's local IP address:
- **Windows**: Open Command Prompt and run `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: Open Terminal and run `ifconfig` or `ip addr` (look for inet address)

Then update line 6 in `colorAnalyzer.js`:

```javascript
const BACKEND_URL = "http://YOUR_LOCAL_IP:8001";
// Example: const BACKEND_URL = "http://192.168.1.100:8001";
```

#### Run the App

```bash
npx expo start
```

This will open the Expo DevTools in your browser.

### 4. Running on Your Device

#### Option A: Using Expo Go (Easiest)

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app
3. Make sure your phone and computer are on the same Wi-Fi network

#### Option B: Using Emulator

**Android Emulator:**
```bash
# Press 'a' in the Expo terminal to run on Android
npx expo start --android
```

**iOS Simulator (Mac only):**
```bash
# Press 'i' in the Expo terminal to run on iOS
npx expo start --ios
```

## 📱 How to Use the App

1. **Launch the app** on your mobile device
2. **Choose an option**:
   - **Choose from Gallery**: Select an existing image
   - **Take Photo**: Capture a new image using the camera
3. **Wait for analysis**: The app will process the image (may take 1-2 minutes for large images)
4. **View results**:
   - Trial Metrics (R², MAE, RMSE)
   - Color Values by trial (R, G, B, RGB, S)
   - Predicted Concentrations per trial
   - Channel Fit graphs (R, G, B channels)

## 🔧 Configuration

### Backend Configuration

**Port**: Default is 8001. To change:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port YOUR_PORT
```

**Image Processing**: The backend automatically downscales images larger than 2000px for faster processing. Adjust this in `Backend/well_detect.py`.

### Frontend Configuration

**API Timeout**: Default is 120 seconds. Modify in `ColorAnalyzerApp/services/colorAnalyzer.js`:
```javascript
timeout: 120000  // milliseconds
```

**Backend URL**: Update in `ColorAnalyzerApp/services/colorAnalyzer.js` if your IP changes.

## 📁 Project Structure

```
CALOBLOOD/
├── Backend/
│   ├── main.py                 # FastAPI server and endpoints
│   ├── well_detect.py          # Well detection using OpenCV
│   ├── feature_extract.py      # Color feature extraction
│   ├── predict.py              # Concentration prediction models
│   └── requirements.txt        # Python dependencies
│
├── ColorAnalyzerApp/
│   ├── App.js                  # Main React Native component
│   ├── app.json                # Expo configuration
│   ├── package.json            # Node dependencies
│   ├── assets/                 # Images and assets
│   ├── components/             # Reusable UI components
│   └── services/
│       └── colorAnalyzer.js    # Backend API integration
│
└── README.md                   # This file
```

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `ModuleNotFoundError`
```bash
# Solution: Install missing dependencies
pip install -r requirements.txt
```

**Issue**: Port 8001 already in use
```bash
# Solution: Kill the process or use a different port
# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8001 | xargs kill -9
```

### Frontend Issues

**Issue**: Cannot connect to backend
- Verify your phone and computer are on the same Wi-Fi network
- Check that the IP address in `colorAnalyzer.js` matches your computer's IP
- Ensure the backend server is running
- Try disabling your firewall temporarily

**Issue**: `expo-image-picker` permissions denied
- The app will request permissions automatically
- If denied, go to your phone's Settings → App Permissions → Allow Camera/Photos

**Issue**: App crashes or freezes
- Clear the Expo cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 🔬 Technical Details

### Image Processing Pipeline

1. **Image Upload**: Image captured/selected by user
2. **Preprocessing**: Large images downscaled to ~1500px
3. **Well Detection**: Hough Circle Transform + Contour Detection
4. **Color Extraction**: RGB values extracted from inner well region (72% radius)
5. **Feature Extraction**: Mean red channel intensity calculated
6. **Prediction**: Polynomial regression predicts concentrations
7. **Results**: Organized by trials and sent to frontend

### Machine Learning Model

- **Algorithm**: Polynomial Regression (degree 2)
- **Features**: R, G, B channel intensities
- **Target**: Blood sample concentration
- **Metrics**: R², MAE, RMSE

## 📄 License

This project is open source and available for educational and research purposes.

## 👥 Contributors

- [Adithyan Sajith](https://github.com/AdithyanSajith)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This app is designed for research and educational purposes. For clinical use, proper validation and regulatory approval would be required.
