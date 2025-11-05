import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const STORAGE_KEY = "@bmi_history_v1";

export default function App() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [errorHeight, setErrorHeight] = useState("");
  const [errorWeight, setErrorWeight] = useState("");
  const [isDark, setIsDark] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (bmi !== null) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [bmi]);

  const validateInputs = () => {
    let ok = true;
    setErrorHeight("");
    setErrorWeight("");
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (!height) {
      setErrorHeight("Vendosë lartësinë");
      ok = false;
    } else if (isNaN(h) || h <= 0) {
      setErrorHeight("Vlera e lartë duhet të jetë numër pozitiv");
      ok = false;
    }

    if (!weight) {
      setErrorWeight("Vendosë peshën");
      ok = false;
    } else if (isNaN(w) || w <= 0) {
      setErrorWeight("Vlera e peshës duhet të jetë numër pozitiv");
      ok = false;
    }

    return ok;
  };

  const calculateBMI = async () => {
    Keyboard.dismiss();
    if (!validateInputs()) return;

    const h = parseFloat(height);
    const w = parseFloat(weight);
    const heightM = h / 100;
    const result = w / (heightM * heightM);
    const rounded = parseFloat(result.toFixed(1));
    setBmi(rounded);

    let st = "";
    let message = "";
    let emoji = "";
    if (rounded < 18.5) {
      st = "Underweight";
      message = "Ndoshta duhen më shumë kalori dhe ushtrime për masë muskulore.";
      emoji = "🥗";
    } else if (rounded < 24.9) {
      st = "Normal";
      message = "Shumë mirë! Ruaje stilin e jetesës.";
      emoji = "💪";
    } else if (rounded < 29.9) {
      st = "Overweight";
      message = "Shiko dietën dhe aktivitetin ditor. Ecje 30 min çdo ditë.";
      emoji = "🏃‍♂️";
    } else {
      st = "Obese";
      message = "Konsulto specialistin dhe fillo plan ushqimi + aktivitet.";
      emoji = "⚠️";
    }
    setStatus(`${st} ${emoji}`);
    setMsg(message);

    const item = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      bmi: rounded,
      status: `${st} ${emoji}`,
    };
    const newHist = [item, ...history].slice(0, 20);
    setHistory(newHist);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHist));
  };

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}
  };

  const clearAll = () => {
    setHeight("");
    setWeight("");
    setBmi(null);
    setStatus("");
    setMsg("");
    setErrorHeight("");
    setErrorWeight("");
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  // Gradient për status me Dark / Light Mode
  const getColorByStatus = () => {
    if (status.includes("Underweight")) 
      return isDark ? ["#c7d2fe", "#93c5fd"] : ["#eef6ff", "#dbeafe"];
    if (status.includes("Normal")) 
      return isDark ? ["#93c5fd", "#60a5fa"] : ["#dbeafe", "#bfdbfe"];
    if (status.includes("Overweight")) 
      return isDark ? ["#60a5fa", "#2563eb"] : ["#bfdbfe", "#93c5fd"];
    if (status.includes("Obese")) 
      return isDark ? ["#3b82f6", "#1e3a8a"] : ["#93c5fd", "#60a5fa"];
    return isDark ? ["#0f172a", "#1e3a8a"] : ["#f0f4ff", "#dbeafe"];
  };

  const renderHistoryItem = ({ item }) => {
    const d = new Date(item.date);
    return (
      <View style={styles.histItem}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.histDate, { color: isDark ? "#d6e7ff" : "#1e293b" }]}>
            {d.toLocaleDateString()}{" "}
            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text style={[styles.histStatus, { color: isDark ? "#9fb7d8" : "#334155" }]}>
            {item.status}
          </Text>
        </View>
        <View style={styles.histBmiBox}>
          <Text style={[styles.histBmiText, { color: isDark ? "#fff" : "#1e293b" }]}>
            {item.bmi}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#071025" : "#f1f5f9" }]}>
      <LinearGradient
        colors={isDark ? ["#0f172a", "#1e3a8a"] : ["#f0f4ff", "#dbeafe"]}
        style={styles.container}
      >
        <Text style={[styles.header, { color: isDark ? "#e6eef8" : "#1e293b" }]}>BMI Calculator</Text>

        <View style={styles.card}>
          <Text style={[styles.label, { color: isDark ? "#cfe4ff" : "#334155" }]}>Height (cm)</Text>
          <TextInput
            style={[styles.input, errorHeight ? styles.inputError : null, { color: isDark ? "#fff" : "#1e293b", borderColor: isDark ? "rgba(255,255,255,0.04)" : "#cbd5e1" }]}
            value={height}
            onChangeText={(t) => setHeight(t.replace(",", "."))}
            keyboardType="numeric"
            maxLength={4}
          />
          {errorHeight ? <Text style={styles.errorText}>{errorHeight}</Text> : null}

          <Text style={[styles.label, { marginTop: 14, color: isDark ? "#cfe4ff" : "#334155" }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, errorWeight ? styles.inputError : null, { color: isDark ? "#fff" : "#1e293b", borderColor: isDark ? "rgba(255,255,255,0.04)" : "#cbd5e1" }]}
            value={weight}
            onChangeText={(t) => setWeight(t.replace(",", "."))}
            keyboardType="numeric"
            maxLength={4}
          />
          {errorWeight ? <Text style={styles.errorText}>{errorWeight}</Text> : null}

          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryBtn} onPress={calculateBMI}>
              <Text style={styles.primaryBtnText}>Calculate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={clearAll}>
              <Text style={styles.ghostBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {bmi !== null && (
            <Animated.View
              style={[
                styles.resultCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: scaleAnim },
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={getColorByStatus()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultInner}
              >
                <Text style={[styles.resultLabel, { color: isDark ? "#e6eef8" : "#1e293b" }]}>Your BMI</Text>
                <Text style={[styles.resultNumber, { color: isDark ? "#fff" : "#1e293b" }]}>{bmi}</Text>
                <Text style={[styles.resultStatus, { color: isDark ? "#fff" : "#1e293b" }]}>{status}</Text>
                <Text style={[styles.resultMsg, { color: isDark ? "#dbeafe" : "#334155" }]}>{msg}</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        <View style={styles.historyCard}>
          <View style={styles.histHeader}>
            <Text style={[styles.histTitle, { color: isDark ? "#dbeafe" : "#1e293b" }]}>History</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.smallBtn} onPress={loadHistory}>
                <Text style={styles.smallBtnText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: "#ff6b6b" }]}
                onPress={clearHistory}
              >
                <Text style={[styles.smallBtnText, { color: "#fff" }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {history.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? "#a8b8d0" : "#64748b" }]}>Nuk ka të dhëna historike</Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(i) => i.id}
              renderItem={renderHistoryItem}
              style={{ width: "100%" }}
              contentContainerStyle={{ paddingBottom: 6 }}
            />
          )}
        </View>

        <View style={styles.themeSwitch}>
          <TouchableOpacity
            style={[
              styles.themeBtn,
              { backgroundColor: isDark ? "#e0f2fe" : "#1e3a8a" },
            ]}
            onPress={() => setIsDark(!isDark)}
          >
            <Text
              style={[
                styles.themeBtnText,
                { color: isDark ? "#1e3a8a" : "#e0f2fe" },
              ]}
            >
              {isDark ? "Light Mode" : "Dark Mode"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 14 },
  card: {
    width: width > 700 ? 700 : "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: Platform.OS === "web" ? 12 : 14,
    fontSize: 16,
    borderWidth: 1,
  },
  inputError: { borderColor: "#ff9a9e" },
  errorText: { color: "#ff9a9e", marginTop: 6, fontSize: 13 },
  row: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#38bdf8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#07263a" },
  ghostBtn: {
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  ghostBtnText: { fontWeight: "600" },
  resultCard: { marginTop: 18, borderRadius: 14, overflow: "hidden" },
  resultInner: { padding: 16, alignItems: "center", width: "100%" },
  resultLabel: { fontSize: 12, fontWeight: "700", alignSelf: "flex-start" },
  resultNumber: { fontSize: 48, fontWeight: "800" },
  resultStatus: { marginTop: 6, fontWeight: "700" },
  resultMsg: { marginTop: 8, fontSize: 13, textAlign: "center" },
  historyCard: {
    width: width > 700 ? 700 : "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  histHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  histTitle: { fontSize: 16, fontWeight: "700" },
  smallBtn: {
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  smallBtnText: { fontWeight: "700", fontSize: 13 },
  emptyText: { paddingVertical: 12, fontSize: 13 },
  histItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.02)",
  },
  histDate: { fontSize: 13, fontWeight: "600" },
  histStatus: { fontSize: 12 },
  histBmiBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  histBmiText: { fontSize: 16, fontWeight: "800" },
  themeSwitch: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  themeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  themeBtnText: { fontWeight: "700", fontSize: 14 },
});
