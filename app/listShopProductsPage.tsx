import { Stack } from "expo-router";
import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import InventoryComponent from "../components/inventoryComponent";

export default function ListShopProductsPage() {
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
            headerTitle: "Manage Products",
            headerTitleStyle: styles.headerTitle,
          }}
        />
      </LinearGradient>
      <View style={styles.container}>
        <InventoryComponent />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});