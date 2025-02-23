import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

// Sample data for low stock items
const lowStockItems = [
  { id: "1", name: "Product 1", quantity: 5, threshold: 10 },
  { id: "2", name: "Product 2", quantity: 3, threshold: 10 },
  { id: "3", name: "Product 3", quantity: 8, threshold: 10 },
  { id: "4", name: "Product 4", quantity: 2, threshold: 10 },
  { id: "5", name: "Product 5", quantity: 12, threshold: 10 }, // Not low stock
];
// define an interface
interface Item {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
}

// Function to filter and sort low stock items
const getLowStockItems = (items: Item[]) => {
  return items
    .filter((item) => item.quantity <= item.threshold) // Filter items below threshold
    .sort((a, b) => a.quantity - b.quantity); // Sort by quantity (lowest first)
};

// Restock recommendation based on quantity
const getRestockRecommendation = (quantity: number, threshold: number) => {
  if (quantity === 0) {
    return "Out of stock! Restock immediately.";
  } else if (quantity <= threshold / 2) {
    return "Very low stock! Restock soon.";
  } else {
    return "Low stock. Consider restocking.";
  }
};

// Render each item in the list
const renderItem = ({ item }: { item: Item }) => (
  // <View style={styles.itemContainer}>
  //   <Text style={styles.itemName}>{item.name}</Text>
  //   <Text style={styles.itemQuantity}>Stock: {item.quantity}</Text>
  //   <Text style={styles.itemRecommendation}>
  //     {getRestockRecommendation(item.quantity, item.threshold)}
  //   </Text>
  // </View>
  <TouchableOpacity
    key={item.id}
    style={supplierStyles.supplierCard}
    activeOpacity={0.8}
  >
    <View style={supplierStyles.supplierHeader}>
      <Text style={supplierStyles.supplierName}>{item.name}</Text>
      <Feather name="chevron-right" size={20} color="#64748B" />
    </View>
    <View style={supplierStyles.supplierDetails}>
      <Text style={styles.itemQuantity}>Remaining Stock: {item.quantity}</Text>
      <Text style={supplierStyles.detailText}>
        Rec: {getRestockRecommendation(item.quantity, item.threshold)}
      </Text>
      {/* <Text style={supplierStyles.detailText}>Email: {supplier.email}</Text>
    <Text style={supplierStyles.detailText}>Address: {item.}</Text> */}
    </View>
  </TouchableOpacity>
);

const StockRestockAlertsPage = () => {
  const lowStockList = getLowStockItems(lowStockItems);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Low Stock Alerts</Text>
      {lowStockList.length > 0 ? (
        <FlatList
          data={lowStockList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.noAlerts}>No low stock items to display.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  itemContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  itemRecommendation: {
    fontSize: 14,
    color: "#d9534f", // Red color for alerts
  },
  noAlerts: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});

export const supplierStyles = StyleSheet.create({
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
  supplierCard: {
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
  supplierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  supplierDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  bottomMargin: {
    marginBottom: 100,
  },
});

export default StockRestockAlertsPage;
