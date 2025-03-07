import { Stack } from "expo-router";
import React, { useState } from "react";
import { View, StyleSheet, StatusBar, TextInput, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import InventoryComponent from "../components/inventoryComponent";
import { useRouter } from "expo-router";

export default function ListShopProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (text: string): void => {
    setSearchQuery(text);
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#2E3192", "#1BFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerTintColor: "white",
            headerTitle: "",
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Products List</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#888"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Pass the searchQuery prop to InventoryComponent */}
        <InventoryComponent searchQuery={searchQuery} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 140,
    paddingTop: 50,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    color: "white",
    fontWeight: "700",
  },
  backButton: {
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: -20,
    zIndex: 10,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
});