import { Stack, router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StatusBar,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Picker } from "@react-native-picker/picker";
import { useInventoryService, InventoryItem } from "../services/inventory";

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Sanitize product name function
const sanitizeProductName = (name: string): string => {
  let sanitized = name.replace(/[^a-zA-Z\s]/g, "").trim(); // Only letters and spaces
  sanitized = sanitized.slice(0, 50); // Limit to 50 characters
  if (sanitized.length > 0) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase(); // Capitalize first letter
  }
  return sanitized;
};

// Sanitize price function
const sanitizePrice = (price: string): string => {
  // Allow only numbers and one decimal point, remove leading zeros unless followed by decimal
  let sanitized = price.replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "").slice(0, 10); // Limit to 10 characters
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts[0] + "." + parts.slice(1).join(""); // Keep only first decimal point
  }
  if (parts[1]) {
    parts[1] = parts[1].slice(0, 2); // Limit to 2 decimal places
    sanitized = parts[0] + "." + parts[1];
  }
  return sanitized;
};

// Sanitize quantity function
const sanitizeQuantity = (quantity: string): string => {
  // Allow only numbers and a single decimal point
  if (!/^\d*\.?\d{0,2}$/.test(quantity)) {
    return quantity.slice(0, -1); // Prevent invalid characters
  }
  return quantity;
};

export default function AddNewProduct() {
  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [matchingProducts, setMatchingProducts] = useState<InventoryItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const quantityInputRef = useRef<TextInput>(null);
  const inventoryService = useInventoryService();

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

  // Debounced fetch function
  const fetchMatchingProducts = debounce(async (name: string) => {
    if (name.length > 1) {
      try {
        const inventory = await inventoryService.getAllInventory();
        const filtered = inventory.items.filter(item =>
          item.productName.toLowerCase().includes(name.toLowerCase())
        );
        setMatchingProducts(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (error) {
        console.error("Error fetching matching products:", error);
      }
    } else {
      setMatchingProducts([]);
      setShowDropdown(false);
    }
  }, 300);

  useEffect(() => {
    fetchMatchingProducts(productName);
  }, [productName]);

  const handleProductNameChange = (text: string) => {
    const sanitized = sanitizeProductName(text);
    setProductName(sanitized);
  };

  const handleUnitPriceChange = (text: string) => {
    const sanitized = sanitizePrice(text);
    setUnitPrice(sanitized);
  };

  const handleQuantityChange = (text: string) => {
    const sanitized = sanitizeQuantity(text);
    setQuantity(sanitized);
  };

  const selectProduct = (product: InventoryItem) => {
    const sanitizedName = sanitizeProductName(product.productName);
    setProductName(sanitizedName);
    setUnitPrice(product.unitPrice ? sanitizePrice(product.unitPrice.toString()) : "");
    setUnit(product.unit);
    setShowDropdown(false);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  };

  const resetForm = () => {
    setProductName("");
    setUnitPrice("");
    setQuantity("");
    setUnit("pieces");
  };

  const addProductToInventory = async () => {
    const sanitizedProductName = sanitizeProductName(productName);
    const sanitizedUnitPrice = sanitizePrice(unitPrice);
    const sanitizedQuantity = sanitizeQuantity(quantity);

    if (!sanitizedProductName || !sanitizedUnitPrice || !sanitizedQuantity || !unit) {
      Alert.alert("Invalid Input", "Please fill all the fields.");
      return;
    }

    if (sanitizedProductName.length < 2) {
      Alert.alert("Invalid Product Name", "Product name must be at least 2 characters long.");
      return;
    }

    const priceNum = Number(sanitizedUnitPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0.");
      return;
    }

    const quantityNum = Number(sanitizedQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) { // Updated to prevent 0 quantity
      Alert.alert("Invalid Quantity", "Quantity must be greater than 0.");
      return;
    }

    try {
      await inventoryService.addInventoryItem({
        productName: sanitizedProductName,
        unitPrice: priceNum,
        stockAmount: quantityNum,
        unit,
      });

      Alert.alert(
        "Success",
        "Product added successfully!",
        [
          { text: "Add Another", onPress: resetForm, style: "default" },
          { text: "Done", onPress: () => router.back(), style: "cancel" },
        ]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", "Failed to add product. Please try again.");
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.formLabel}>Product Name</Text>
        <View>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={handleProductNameChange}
            placeholder="Enter product name"
            placeholderTextColor="#94A3B8"
            maxLength={50}
          />
          {showDropdown && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={matchingProducts}
                keyExtractor={(item) => item.productId}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => selectProduct(item)}
                  >
                    <Text style={styles.dropdownItemText}>{item.productName}</Text>
                  </TouchableOpacity>
                )}
                style={styles.dropdown}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.formLabel}>Unit Price (KES)</Text>
        <View style={styles.priceInput}>
          <Text style={styles.currencySymbol}>KES</Text>
          <TextInput
            style={[styles.input, styles.priceTextInput]}
            value={unitPrice}
            onChangeText={handleUnitPriceChange}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.formLabel}>Quantity</Text>
          <TextInput
            ref={quantityInputRef}
            style={styles.input}
            value={quantity}
            onChangeText={handleQuantityChange}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.formLabel}>Unit</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={unit}
              onValueChange={setUnit}
              style={styles.picker}
              dropdownIconColor="#2E3192"
            >
              {units.map((unitOption, index) => (
                <Picker.Item
                  key={index}
                  label={unitOption}
                  value={unitOption}
                  color="#1E293B"
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={addProductToInventory}>
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
  );

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#2E3192", "#1BFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
      </LinearGradient>

      <FlatList
        data={[{}]}
        renderItem={() => renderForm()}
        keyExtractor={() => "form"}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 24,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flexGrow: 1,
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
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: "#F8FAFC",
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
  },
  currencySymbol: {
    paddingLeft: 16,
    fontSize: 16,
    color: "#64748B",
  },
  priceTextInput: {
    flex: 1,
    borderWidth: 0,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: "#1E293B",
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    marginTop: 8,
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
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dropdown: {
    maxHeight: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
  },
});