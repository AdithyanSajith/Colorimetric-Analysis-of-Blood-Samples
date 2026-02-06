import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";

// Get backend URL from environment
// Priority: env var > fallback to local IP
// For remote access via Expo tunnel, the friend needs to use PUBLIC_BACKEND_URL
const BACKEND_URL = 
  process.env.EXPO_PUBLIC_BACKEND_URL ||  // Set this for remote access (e.g., from ngrok)
  process.env.REACT_APP_BACKEND_URL ||   "http://10.1.28.38:8001";  // Local IP for development

const API = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,  // Fail faster when backend is unreachable
});

export async function analyzeImageColors(imageUri) {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    const uploadUri = manipulated.uri;

    console.log("📤 Sending RAW image to backend:", uploadUri);

    const formData = new FormData();
    formData.append("file", {
      uri: uploadUri,
      name: "image.jpg",
      type: "image/jpeg",
    });

    const response = await API.post("/analyze", formData);

    console.log("✅ Backend response received:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    throw error;
  }
}
