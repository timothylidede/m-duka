// PasscodeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "../config/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ONE_HOUR = 60 * 60 * 1000;
const db = getFirestore(app);

export default function PasscodeScreen() {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [shouldShowPasscode, setShouldShowPasscode] = useState(false);
  const [dotScale] = useState([...Array(4)].map(() => new Animated.Value(1)));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLastOpened = async () => {
      try {
        const lastOpened = await AsyncStorage.getItem("lastOpenedTime");
        const savedEmail = await AsyncStorage.getItem("savedEmail");
        if (savedEmail) setEmail(savedEmail);

        const now = Date.now();
        if (!lastOpened || now - parseInt(lastOpened, 10) > ONE_HOUR) {
          setShouldShowPasscode(true);
        } else {
          router.replace("/(tabs)");
        }
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error("Error checking last opened time:", error);
        setShouldShowPasscode(true);
        await SplashScreen.hideAsync();
      }
    };

    checkLastOpened();
  }, []);

  const fetchPasscode = async (email: string) => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return null;
    }

    try {
      const shopsRef = collection(db, "shops");
      const q = query(shopsRef, where("emailAddress", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const shopData = querySnapshot.docs[0].data();
        return shopData.password;
      } else {
        Alert.alert("Error", "No shop found with this email address");
        return null;
      }
    } catch (error) {
      console.error("Error fetching passcode:", error);
      Alert.alert("Error", "Failed to verify credentials. Please try again.");
      return null;
    }
  };

  const animateDot = (index: number) => {
    Animated.sequence([
      Animated.timing(dotScale[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(dotScale[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = async ({ num }: { num: string }) => {
    if (passcode.length < 4) {
      const newPasscode = passcode + num;
      animateDot(passcode.length);
      setPasscode(newPasscode);

      if (newPasscode.length === 4) {
        setLoading(true);
        try {
          const storedPasscode = await fetchPasscode(email);
          if (storedPasscode && newPasscode === storedPasscode) {
            await AsyncStorage.setItem("lastOpenedTime", Date.now().toString());
            await AsyncStorage.setItem("savedEmail", email);
            router.replace("/(tabs)");
          } else {
            setPasscode("");
            Alert.alert(
              "Invalid Passcode",
              "The passcode you entered is incorrect. Please try again."
            );
          }
        } catch (error) {
          console.error("Error during login:", error);
          Alert.alert(
            "Error",
            "An error occurred during login. Please try again."
          );
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleDelete = () => {
    setPasscode(passcode.slice(0, -1));
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleForgotPasscode = () => {
    Alert.alert(
      "Reset Passcode",
      "Please contact support to reset your passcode.",
      [{ text: "OK" }]
    );
  };

  if (!shouldShowPasscode) return null;

  return (
    <LinearGradient colors={["#1a2a6c", "#b21f1f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.cardContainer}>
          <MaterialCommunityIcons
            name="store"
            size={30}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>Passcode</Text>
          <View style={styles.dotsContainer}>
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    passcode.length > i && styles.filledDot,
                    { transform: [{ scale: dotScale[i] }] },
                  ]}
                />
              ))}
          </View>

          <View style={styles.keypadContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((num, index) => {
              if (num === "") {
                // Render an empty view for layout spacing
                return (
                  <View
                    key={index}
                    style={[
                      styles.key,
                      { backgroundColor: "transparent", borderColor: "transparent" },
                    ]}
                  />
                );
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.key,
                    num === "⌫" && styles.deleteKey,
                    loading && styles.disabledKey,
                  ]}
                  onPress={() =>
                    num === "⌫"
                      ? handleDelete()
                      : handlePress({ num: num.toString() })
                  }
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.keyText,
                      num === "⌫" && styles.deleteKeyText,
                      loading && styles.disabledKeyText,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Verifying...</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPasscode}
            disabled={loading}
          >
            <Text style={styles.forgotButtonText}>Forgot Passcode?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    padding: 25,
    backdropFilter: "blur(10px)",
  },
  icon: {
    alignSelf: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  filledDot: {
    backgroundColor: "#fff",
  },
  keypadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    transform: [{ scale: 0.8 }],
    justifyContent: "center",
  },
  key: {
    width: 70,
    height: 70,
    margin: 8,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  keyText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  deleteKey: {
    backgroundColor: "rgba(255,100,100,0.2)",
  },
  deleteKeyText: {
    color: "#ff6b6b",
  },
  disabledKey: {
    opacity: 0.5,
  },
  disabledKeyText: {
    opacity: 0.5,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  bottomButtons: {
    marginTop: 30,
    alignItems: "center",
  },
  forgotButton: {
    marginBottom: 15,
  },
  forgotButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  signUpButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 60,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
