import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";

// Get backend URL from environment or use default
// For iOS/Android apps, use the machine's IP address instead of localhost
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || "http://10.1.28.38:8001";

const API = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
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
