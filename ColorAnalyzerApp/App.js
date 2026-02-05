import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { analyzeImageColors } from "./services/colorAnalyzer";

const { width } = Dimensions.get("window");

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      analyze(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      analyze(res.assets[0].uri);
    }
  };

  const analyze = async (uri) => {
    try {
      setLoading(true);
      setResult(null);
      const data = await analyzeImageColors(uri);
      setResult(data);
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || "Unknown error occurred";
      Alert.alert(
        "Analysis Failed",
        `Error: ${errorMsg}\n\nMake sure the backend server is running and accessible.`
      );
      console.error("Analysis error:", e);
    } finally {
      setLoading(false);
    }
  };

  const evalPoly = (coeffs, x) => {
    if (!Array.isArray(coeffs) || coeffs.length === 0) {
      return 0;
    }
    return coeffs.reduce((sum, c, i) => {
      const power = coeffs.length - 1 - i;
      return sum + c * Math.pow(x, power);
    }, 0);
  };

  const buildChannelChart = (channel, dotColor) => {
    const xs = Array.isArray(channel?.actual_x) ? channel.actual_x : [];
    const ys = Array.isArray(channel?.actual_y) ? channel.actual_y : [];
    const coeffs = Array.isArray(channel?.coeffs) ? channel.coeffs : [];
    const fitAtActual = xs.map((x) => evalPoly(coeffs, x));
    const labels = xs.map((x, i) => (i % 2 === 0 ? x.toFixed(1) : ""));

    return {
      labels,
      datasets: [
        {
          data: ys,
          color: () => dotColor,
          strokeWidth: 2,
        },
        {
          data: fitAtActual,
          color: () => "#9b59b6",
          strokeWidth: 2,
        },
      ],
    };
  };

  return (
    <LinearGradient
      colors={["#ffffff", "#ffe6ea", "#f7b6c4"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* LOGO */}
        <Image
          source={require("./assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* TITLE */}
        <Text style={styles.title}>Color Analyzer</Text>
        <Text style={styles.subtitle}>
          Analyze colors from images and{"\n"}colorimetric strips
        </Text>

        {/* BUTTONS */}
        {!result && !loading && (
          <>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={takePhoto}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {/* IMAGE PREVIEW */}
        {image && (
          <Image source={{ uri: image }} style={styles.preview} />
        )}

        {/* LOADING */}
        {loading && <ActivityIndicator size="large" color="#c4161c" />}

        {/* RESULTS */}
        {result && (
          <View style={styles.resultBox}>
            {/* COLOR SPACE VALUES TABLE */}
            <Text style={styles.sectionTitle}>📊 Color Space Values</Text>
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Well</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Conc</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>R</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>G</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>B</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>RGB</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>S</Text>
                </View>
                {result.color_values.map((row, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.well}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.concentration.toFixed(1)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.r.toFixed(1)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.g.toFixed(1)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.b.toFixed(1)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.rgb_mean.toFixed(1)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.s_mean.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* TRIAL METRICS */}
            <Text style={styles.sectionTitle}>📈 Trial Metrics</Text>
            <View style={styles.metricsContainer}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>R²</Text>
                <Text style={styles.metricValue}>{result.trial_metrics.r2.toFixed(4)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MAE</Text>
                <Text style={styles.metricValue}>{result.trial_metrics.mae.toFixed(4)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>RMSE</Text>
                <Text style={styles.metricValue}>{result.trial_metrics.rmse.toFixed(4)}</Text>
              </View>
            </View>

            {/* GRAPHS */}
            <Text style={styles.sectionTitle}>📉 Channel Fits</Text>
            
            <Text style={styles.graphTitle}>R Channel</Text>
            <LineChart
              data={buildChannelChart(result.r_channel, "#ff6b6b")}
              width={width - 30}
              height={220}
              yAxisLabel=""
              xAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 2,
                propsForLabels: { fontSize: 10 },
                decimalPlaces: 0,
              }}
              style={styles.chart}
            />

            <Text style={styles.graphTitle}>G Channel</Text>
            <LineChart
              data={buildChannelChart(result.g_channel, "#66bb6a")}
              width={width - 30}
              height={220}
              yAxisLabel=""
              xAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 2,
                propsForLabels: { fontSize: 10 },
                decimalPlaces: 0,
              }}
              style={styles.chart}
            />

            <Text style={styles.graphTitle}>B Channel</Text>
            <LineChart
              data={buildChannelChart(result.b_channel, "#42a5f5")}
              width={width - 30}
              height={220}
              yAxisLabel=""
              xAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 2,
                propsForLabels: { fontSize: 10 },
                decimalPlaces: 0,
              }}
              style={styles.chart}
            />

            <Text style={styles.graphTitle}>RGB Mean Channel</Text>
            <LineChart
              data={buildChannelChart(result.rgb_mean_channel, "#ffa726")}
              width={width - 30}
              height={220}
              yAxisLabel=""
              xAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 2,
                propsForLabels: { fontSize: 10 },
                decimalPlaces: 0,
              }}
              style={styles.chart}
            />

            {/* PREDICTED VALUES */}
            <Text style={styles.sectionTitle}>🎯 Predicted Concentrations</Text>
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Well</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>True Conc</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Pred from R</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Pred from G</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Pred from B</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall]}>Pred from RGB</Text>
                </View>
                {result.color_values.map((row, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.well}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>{row.concentration.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>
                      {result.r_channel.predicted_concentration[idx]?.toFixed(2) || "N/A"}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>
                      {result.g_channel.predicted_concentration[idx]?.toFixed(2) || "N/A"}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>
                      {result.b_channel.predicted_concentration[idx]?.toFixed(2) || "N/A"}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall]}>
                      {result.rgb_mean_channel.predicted_concentration[idx]?.toFixed(2) || "N/A"}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setImage(null);
                setResult(null);
              }}
            >
              <Text style={styles.buttonText}>Analyze Another Image</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#c4161c",
  },
  subtitle: {
    fontSize: 16,
    color: "#c4161c",
    textAlign: "center",
    marginVertical: 10,
  },
  button: {
    width: width * 0.85,
    backgroundColor: "#d1122f",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "#b01028",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  preview: {
    width: width * 0.9,
    height: 250,
    borderRadius: 12,
    marginTop: 20,
  },
  resultBox: {
    width: "100%",
    backgroundColor: "#fff",
    marginTop: 30,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: "#c4161c",
  },
  tableContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 2,
    borderBottomColor: "#c4161c",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    padding: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  tableCellSmall: {
    minWidth: 50,
    width: 50,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  metricBox: {
    backgroundColor: "#f9f9f9",
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#c4161c",
  },
  graphTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dataValue: {
    fontSize: 14,
    color: "#666",
  },
  metricBoxOld: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
});