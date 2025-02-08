import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { app } from "../config/firebase"; // Adjust path to your Firebase config

const ONE_HOUR = 60 * 60 * 1000;
const db = getFirestore(app);

export default function PasscodeScreen() {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [shouldShowPasscode, setShouldShowPasscode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLastOpened = async () => {
      const lastOpened = await AsyncStorage.getItem("lastOpenedTime");
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      if (savedEmail) setEmail(savedEmail);

      const now = Date.now();
      if (!lastOpened || now - parseInt(lastOpened, 10) > ONE_HOUR) {
        setShouldShowPasscode(true);
      } else {
        router.replace("/(tabs)");
      }
      SplashScreen.hideAsync();
    };

    checkLastOpened();
  }, []);

  const fetchPasscode = async (email: string) => {
    if (!email) {
      console.log("fetchPasscode: No email provided.");
      return null;
    }
  
    try {
      console.log(`fetchPasscode: Searching for shop with email: ${email}`);
  
      const shopsRef = collection(db, "shops");
      const q = query(shopsRef, where("emailAddress", "==", email));
      console.log("fetchPasscode: Running Firestore query:", q);
  
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const shopData = querySnapshot.docs[0].data();
        console.log("fetchPasscode: Shop found:", shopData);
        return shopData.password; // Return the password field
      } else {
        console.log("fetchPasscode: No shop found with this email.");
      }
    } catch (error) {
      console.error("fetchPasscode: Error fetching passcode:", error);
    }
  
    console.log("fetchPasscode: Returning null (passcode not found or error occurred).");
    return null;
  };
  
  

  interface HandlePressProps {
    num: string;
  }

  const handlePress = async ({ num }: HandlePressProps): Promise<void> => {
    if (passcode.length < 4) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);

      if (newPasscode.length === 4) {
        const storedPasscode = await fetchPasscode(email);
        if (storedPasscode && newPasscode === storedPasscode) {
          await AsyncStorage.setItem("lastOpenedTime", Date.now().toString());
          await AsyncStorage.setItem("savedEmail", email);
          router.replace("/(tabs)");
        } else {
          setPasscode("");
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
    console.log("Forgot Passcode");
  };

  if (!shouldShowPasscode) return null;

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <LinearGradient colors={["#1B3B5A", "#21748A"]} style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Login</Text>
        </LinearGradient>
        <View style={styles.cardBody}>
          <Text style={styles.title}>Email address:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Text style={styles.title}>Passcode:</Text>
          <View style={styles.dots}>
            {Array(4).fill(0).map((_, i) => (
              <View key={i} style={[styles.dot, passcode.length > i && styles.filledDot]} />
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
            <TouchableOpacity style={styles.key} onPress={handleDelete}>
              <Text style={styles.keyText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.forgotPasscodeButton} onPress={handleForgotPasscode}>
        <Text style={styles.forgotPasscodeButtonText}>Forgot Passcode?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up Instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardContainer: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cardHeader: {
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  cardBody: {
    padding: 20,
  },
  input: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 15,
  },
  dots: {
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 20,
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
    justifyContent: "center",
    marginHorizontal: 30,
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
    backgroundColor: "#21748A",
    borderRadius: 8,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasscodeButton: {
    marginTop: 10,
    alignItems: "center",
  },
  forgotPasscodeButtonText: {
    color: "#21748A",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
