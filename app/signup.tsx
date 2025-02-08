import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase";
import { useRouter } from "expo-router";

const db = getFirestore(app);
const counties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo",
  "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
  "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori",
  "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

const SignUp = () => {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [contact, setContact] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");
    if (!shopName || !contact || !county || !email || !password) {
      setError("All fields are required.");
      return;
    }
    if (!/^[0-9]{4}$/.test(password)) {
      setError("Password must be a 4-digit number.");
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
      await setDoc(shopRef, { name: shopName, contact, county, emailAddress: email, password });
      alert("Shop registered successfully!");
      router.push("/login");
    } catch (err) {
      setError("Error creating shop. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1B3B5A", "#21748A"]} style={styles.header}>
        {/* Back button now uses replace to go back to login */}
        <TouchableOpacity onPress={() => router.replace("/login")} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Shop</Text>
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
        <Picker
          selectedValue={county}
          onValueChange={(itemValue) => setCounty(itemValue)}
          style={styles.input}
          itemStyle={styles.pickerItem}
        >
          {counties.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="4-digit Password"
          placeholderTextColor="#777"
          value={password}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
        <TouchableOpacity style={styles.registerButton} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerText}>Register</Text>}
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
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 40,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  cardContainer: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    marginTop: -20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#eee",
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
  },
  pickerItem: {
    fontSize: 16,
    color: "#333",
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  registerButton: {
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
