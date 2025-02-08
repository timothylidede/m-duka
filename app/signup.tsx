import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase";
import { useRouter } from "expo-router";

const db = getFirestore(app);

export default function SignUp() {
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
    <View className="flex-1 justify-center items-center bg-gray-50 px-6">
      {/* Header Navigation */}
      <TouchableOpacity onPress={() => router.push("/login")} className="absolute top-12 left-6">
        <Text className="text-blue-600 text-lg">← Back to Login</Text>
      </TouchableOpacity>

      {/* Signup Card */}
      <View className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        <Text className="text-3xl font-semibold text-center text-gray-900 mb-6">Create Shop</Text>

        {/* Input Fields */}
        <TextInput
          className="w-full px-4 py-3 mb-4 border border-gray-400 rounded-lg bg-white text-gray-900 shadow-sm"
          placeholder="Shop Name"
          placeholderTextColor="#777"
          value={shopName}
          onChangeText={setShopName}
        />
        <TextInput
          className="w-full px-4 py-3 mb-4 border border-gray-400 rounded-lg bg-white text-gray-900 shadow-sm"
          placeholder="Contact Info"
          placeholderTextColor="#777"
          value={contact}
          onChangeText={setContact}
        />
        <TextInput
          className="w-full px-4 py-3 mb-4 border border-gray-400 rounded-lg bg-white text-gray-900 shadow-sm"
          placeholder="4-digit Passcode"
          placeholderTextColor="#777"
          value={passcode}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          onChangeText={setPasscode}
        />

        {/* Error Message */}
        {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

        {/* Register Button */}
        <TouchableOpacity
          className="w-full bg-blue-600 py-3 rounded-lg flex items-center justify-center shadow-md"
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Register</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
