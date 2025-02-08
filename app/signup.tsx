import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase";
import { useRouter } from "expo-router";

const db = getFirestore(app);

const SignUp = () => {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [contact, setContact] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");
    if (!shopName || !contact || !passcode) {
      setError("All fields are required.");
      return;
    }
    if (!/^[0-9]{4}$/.test(passcode)) {
      setError("Passcode must be a 4-digit number.");
      return;
    }

    setLoading(true);
    const shopId = shopName.toLowerCase().replace(/\s+/g, "-");

    try {
      const shopRef = doc(db, "shops", shopId);
      const shopSnapshot = await getDoc(shopRef);

      if (shopSnapshot.exists()) {
        setError("Shop name already exists. Choose another.");
        setLoading(false);
        return;
      }

      await setDoc(shopRef, { name: shopName, contact, password: passcode });

      alert("Shop registered successfully!");
      router.push("/login"); // Navigate to login page
    } catch (err) {
      setError("Error creating shop. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1B3B5A", "#21748A"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/login")} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Shop</Text>
      </LinearGradient>

      <View style={styles.cardContainer}>
        <TextInput
          style={styles.input}
          placeholder="Shop Name"
          placeholderTextColor="#777"
          value={shopName}
          onChangeText={setShopName}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Info"
          placeholderTextColor="#777"
          value={contact}
          onChangeText={setContact}
        />
        <TextInput
          style={styles.input}
          placeholder="4-digit Passcode"
          placeholderTextColor="#777"
          value={passcode}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          onChangeText={setPasscode}
        />

        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

        <TouchableOpacity style={styles.registerButton} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    paddingTop: 20,
  },
  header: {
    width: "100%",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  cardContainer: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginTop: -20,
  },
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  registerButton: {
    width: "100%",
    backgroundColor: "#21748A",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  registerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
