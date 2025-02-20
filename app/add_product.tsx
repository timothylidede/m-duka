import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Picker } from "@react-native-picker/picker";
import { Product } from "../localDatabase/types";
import { addShopProduct } from "../localDatabase/shopOwnerServices";

export default function AddNewProduct() {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const units = ["pieces", "kg", "grams", "liters", "ml", "packets", "boxes", "bottles", "bags"];

  const handleSubmit = () => {
    if (!productName || !price || !quantity || !unit) {
      Alert.alert("Invalid Input", "Please fill all the fields.");
      return;
    }

    if (isNaN(Number(price))) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }

    if (isNaN(Number(quantity))) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity.");
      return;
    }

    const product: Product = {
      id: Math.random().toString(),
      name: productName,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      unit: unit,
      isNearlyStockedOut: false,
      isStockedOut: false,
      movingFast: 0,
      dailySales: 0,
      weeklySales: 0,
      monthlySales: 0,
      yearlySales: 0,
      dailyRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
    };

    addShopProduct(product, (id) => {
      if (id) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Product added successfully!");
        router.back();
      } else {
        Alert.alert("Error", "Failed to add product. Please try again.");
      }
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Enter product name"
            placeholderTextColor="#94A3B8"
            autoFocus
          />

          <Text style={styles.formLabel}>Price (KES)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Enter price"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter quantity"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Unit</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={unit}
              onValueChange={setUnit}
              style={styles.picker}
              dropdownIconColor="#2E3192"
            >
              {units.map((unit, index) => (
                <Picker.Item key={index} label={unit} value={unit} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={["#2E3192", "#1BFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Feather name="plus-circle" size={24} color="white" />
              <Text style={styles.submitButtonText}>Add Product</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // Keep your existing styles exactly the same
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  formLabel: {
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  picker: {
    width: "100%",
    color: "#1E293B",
    borderRadius: 16,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    marginTop: 16,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
});