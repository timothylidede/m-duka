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
import {
  getDBConnection,
  saveProducts,
  createProductsTable,
  getProducts,
} from "@/localDatabase/database";

import { Picker } from "@react-native-picker/picker";
import { Product } from "../localDatabase/types";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export default function AddNewProduct() {
  const [Products, setNewProducts] = useState<Product[]>([]);
  // const [newProduct, setNewProduct] = useState(Product);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces"); // Default unit

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

  // const addProductToDatabase = async () => {
  //   if (!productName || !price || !quantity || !unit) {
  //     Alert.alert("Invalid Input", "Please fill all the fields.");
  //     return;
  //   }

  //   if (isNaN(Number(price))) {
  //     Alert.alert("Invalid Price", "Please enter a valid price.");
  //     return;
  //   }

  //   if (isNaN(Number(quantity))) {
  //     Alert.alert("Invalid Quantity", "Please enter a valid quantity.");
  //     return;
  //   }

  //   // Create a new product object
  //   const product: Product = {
  //     id: Math.random().toString(), // Generate a unique ID (you can use a better ID generation method)
  //     name: productName,
  //     price: parseFloat(price),
  //     quantity: parseInt(quantity),
  //     unit: unit,
  //     isNearlyStockedOut: false,
  //     isStockedOut: parseInt(quantity) === 0 ? true : false,
  // movingFast: 0,
  //   dailySales: 0,
  //   weeklySales: 0,
  //   monthlySales: 0,
  //   yearlySales: 0,
  //   dailyRevenue: 0,
  //   weeklyRevenue: 0,
  //   monthlyRevenue: 0,
  //   yearlyRevenue: 0,
  // };
  // console.log(product);

  // const db = await connectToDatabase();
  // await addproduct(db, product);
  // console.log("Product should have been added successfully apparently");
  // let products = await getProducts(db);
  // console.log(products);
  // console.log("Product added successfully");

  //   addproduct(db, product);
  //   console.log("Product added successfully");
  // });

  // console.log("Product added successfully");

  // Add the product to the database
  // addShopProduct(product, (id) => {
  //   if (id) {
  //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  //     Alert.alert("Success", "Product added successfully!");
  //     router.back(); // Navigate back after success
  //   } else {
  //     Alert.alert("Error", "Failed to add product. Please try again.");
  //   }
  // });
  // };

  const loadDataCallback = useCallback(async () => {
    try {
      const initTodos = [
        { id: 0, value: "go to shop" },
        { id: 1, value: "eat at least a one healthy foods" },
        { id: 2, value: "Do some exercises" },
      ];
      const db = await getDBConnection();
      await createProductsTable(db);
      // const storedTodoItems = await getTodoItems(db);
      // if (storedTodoItems.length) {
      //   setTodos(storedTodoItems);
      // } else {
      //   await saveTodoItems(db, initTodos);
      //   setTodos(initTodos);
      // }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadDataCallback();
  }, [loadDataCallback]);

  const addProductToDatabase = async () => {
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

    console.log("Tests passed when adding product to database");
    // if (!newTodo.trim()) return;
    try {
      // Create a new product object
      let product: Product = {
        id: productName, // Generate a unique ID (you can use a better ID generation method)
        name: productName,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        unit: unit,
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

      const newProducts: Product[] = [product];
      setNewProducts(newProducts);
      console.log(newProducts);
      const db = await getDBConnection();
      console.log("Connected to the database");
      await saveProducts(db, newProducts);
      console.log("Product added successfully");

      const storedTodoItems: Product[] = await getProducts(db);
      console.log("Tried to get a product");
      if (storedTodoItems.length) {
        // setTodos(storedTodoItems);
        console.log("There is an element in the products table");
        console.log(storedTodoItems[0]);
      } else {
        // await saveTodoItems(db, initTodos);
        // setTodos(initTodos);
        console.log("There is no element in the products table");
      }
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
              onValueChange={(itemValue) => setUnit(itemValue)}
              style={styles.picker}
              dropdownIconColor="#2E3192"
            >
              {units.map((unit, index) => (
                <Picker.Item key={index} label={unit} value={unit} />
              ))}
            </Picker>
          </View>

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
