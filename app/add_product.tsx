// import React from "react";
// import { View, Text } from "react-native";

// const AddProduct = () => {
//   return (
//     <View className="flex justify-center items-center min-h-screen">
//       <Text>Add Product</Text>
//     </View>
//   );
// };

// export default AddProduct;

import { Stack, router } from "expo-router";
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
  Platform,
} from "react-native";
// import useCallback from "react";
import { useCallback, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
// import {
//   getDBConnection,
//   saveProducts,
//   createProductsTable,
//   getProducts,
// } from "@/localDatabase/database";
import { handleSaveProduct, loadProductsData } from "@/localDatabase/products";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

import { Picker } from "@react-native-picker/picker";
import { Product } from "../localDatabase/types";
import { createDbIfNeeded } from "../localDatabase/database";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export default function AddNewProduct() {
  // const [newProduct, setNewProduct] = useState(Product);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [productUnit, setProductUnit] = useState("pieces"); // Default productUnit
  // const [loadedProduct, setLoadedProduct] = useState<Product>();

  const database = useSQLiteContext();

  // List of possible units
  const units = [
    "pieces",
    "kg",
    "grams",
    "liters",
    "ml",
    "packets",
    "boxes",
    "bottles",
    "bags",
  ];

  // a function that concatenates a list of strings

  const addProductToDatabase = async () => {
    if (!productName || !price || !quantity || !productUnit) {
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

    console.log("Tests passed when adding product to database");
    // if (!newTodo.trim()) return;
    try {
      // Create a new product object
      let product: Product = {
        id: productName, // Generate a unique ID (you can use a better ID generation method)
        name: productName,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        unit: productUnit,
        description: productDescription,
        isNearlyStockedOut: false,
        isStockedOut: parseInt(quantity) === 0 ? true : false,
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

      //save tHe products using handleSaveProduct
      await handleSaveProduct(product, database);
      Alert.alert(
        `Success, you have added ${product.id} successfully to your shop. `
      );
      // console.log("Product added successfully");
      // const storedTodoItems = await loadProductsData(database);
      // // console.log("Tried to get a product");
      // // console.log(storedTodoItems?.length);
      // if (storedTodoItems?.length) {
      //   // setTodos(storedTodoItems);
      //   console.log("There is an element in the products table");
      //   console.log(storedTodoItems);
      // } else {
      //   // await saveTodoItems(db, initTodos);
      //   // setTodos(initTodos);
      //   console.log("There is no element in the products table but logging");
      //   // console.log(storedTodoItems?.length);
      // }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add New Product",
          headerStyle: {
            backgroundColor: "#2E3192",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Hi, describe your new product</Text>

          <TextInput
            style={styles.input}
            value={productDescription}
            onChangeText={setProductDescription}
            placeholder="i.e A 2kg packet of maize flour"
            placeholderTextColor="#94A3B8"
            autoFocus
          />
          <Text style={styles.formLabel}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Enter the name of the product. "
            placeholderTextColor="#94A3B8"
            autoFocus
          />

          <Text style={styles.formLabel}>
            What are the units for {productName ? productName : "the product"}
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={productUnit}
              onValueChange={(itemValue) => setProductUnit(itemValue)}
              style={styles.picker}
              dropdownIconColor="#2E3192"
            >
              {units.map((productUnit, index) => (
                <Picker.Item
                  key={index}
                  label={productUnit}
                  value={productUnit}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.formLabel}>
            How much is one {productUnit} of{" "}
            {productName ? productName : " your product"}?
          </Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="i.e 50"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>
            How many {productUnit ? productUnit : " units "} are you adding to
            your inventory?
          </Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter the number of units"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={addProductToDatabase}
          >
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
