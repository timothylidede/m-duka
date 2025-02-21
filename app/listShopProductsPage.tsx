import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";

// Mock product data
const products = [
  {
    id: 1,
    name: "Hi, I am loading your shop's products",
    price: 0.0,
    stock: 10,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    stock: 5,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    name: "Bluetooth Speaker",
    price: 49.99,
    stock: 20,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 4,
    name: "Gaming Keyboard",
    price: 79.99,
    stock: 15,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 5,
    name: "Wireless Mouse",
    price: 29.99,
    stock: 25,
    image: "https://via.placeholder.com/150",
  },
];

export default function ProductList() {
  // const [products, setProducts] = useState
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Product List",
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

      <ScrollView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather
            name="search"
            size={20}
            color="#94A3B8"
            style={styles.searchIcon}
          />
        </View>

        {/* Product List */}
        {filteredProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                ${product.price.toFixed(2)}
              </Text>
              <View style={styles.stockContainer}>
                <Feather
                  name={product.stock > 0 ? "check-circle" : "x-circle"}
                  size={16}
                  color={product.stock > 0 ? "#10B981" : "#EF4444"}
                />
                <Text
                  style={[
                    styles.stockText,
                    { color: product.stock > 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#64748B" />
          </TouchableOpacity>
        ))}

        {/* Bottom Margin */}
        <View style={styles.bottomMargin} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  searchIcon: {
    marginLeft: 8,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#2E3192",
    marginBottom: 4,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockText: {
    fontSize: 14,
    marginLeft: 4,
  },
  bottomMargin: {
    marginBottom: 100,
  },
});
