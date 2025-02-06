// PasscodeScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";

const CORRECT_PASSCODE = "1234"; // Set the required passcode
const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

function PasscodeScreen() {
  const [passcode, setPasscode] = useState("");
  const [shouldShowPasscode, setShouldShowPasscode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLastOpened = async () => {
      const lastOpened = await AsyncStorage.getItem("lastOpenedTime");
      const now = Date.now();

      if (!lastOpened || now - parseInt(lastOpened, 10) > ONE_HOUR) {
        setShouldShowPasscode(true); // Show passcode if > 1 hour
      } else {
        router.replace("/(tabs)"); // Go directly to tabs if < 1 hour
      }

      SplashScreen.hideAsync();
    };

    checkLastOpened();
  }, []);

  interface HandlePressProps {
    num: string;
  }

  const handlePress = async ({ num }: HandlePressProps): Promise<void> => {
    if (passcode.length < 4) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);

      if (newPasscode.length === 4) {
        if (newPasscode === CORRECT_PASSCODE) {
          await AsyncStorage.setItem("lastOpenedTime", Date.now().toString()); // Save timestamp
          router.replace("/(tabs)"); // Navigate to main app
        } else {
          setPasscode(""); // Reset input if incorrect
        }
      }
    }
  };

  const handleDelete = () => {
    if (passcode.length > 0) {
      setPasscode(passcode.slice(0, -1));
    }
  };

  const handleSignUp = () => {
    router.push("/signup"); // Navigate to the sign-up page
  };

  if (!shouldShowPasscode) return null; // Don't render passcode screen if not needed

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Passcode</Text>
      <View style={styles.dots}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <View
              key={i}
              style={[styles.dot, passcode.length > i && styles.filledDot]}
            />
          ))}
      </View>
      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.key}
            onPress={() => handlePress({ num: num.toString() })}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        {/* Delete Button */}
        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
      </View>
      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  dots: {
    flexDirection: "row",
    marginBottom: 30,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  filledDot: {
    backgroundColor: "#000",
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 240,
    justifyContent: "center",
  },
  key: {
    width: 60,
    height: 60,
    margin: 10,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  keyText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  signUpButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PasscodeScreen;