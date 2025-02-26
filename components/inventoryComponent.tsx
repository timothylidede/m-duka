import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { InventoryData, InventoryItem, useInventoryService } from "../services/inventory";
import { LinearGradient } from "expo-linear-gradient";

const InventoryComponent = () => {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    unitPrice: "",
    stockAmount: "",
    unit: "",
  });

  const inventoryService = useInventoryService();

  const loadInventory = async () => {
    try {
      const data = await inventoryService.getAllInventory();
      setInventory(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.productId);
    setEditValues({
      unitPrice: item.unitPrice.toString(),
      stockAmount: item.stockAmount.toString(),
      unit: item.unit,
    });
  };

  const handleSave = async (item: InventoryItem) => {
    const unitPrice = Number(editValues.unitPrice);
    const stockAmount = Number(editValues.stockAmount);

    if (isNaN(unitPrice) || isNaN(stockAmount)) {
      Alert.alert("Error", "Please enter valid numbers for price and quantity");
      return;
    }

    try {
      const updates = {
        unitPrice,
        stockAmount,
        unit: editValues.unit,
      };

      const success = await inventoryService.updateInventoryItem(item.productId, updates);

      if (success) {
        setEditingId(null);
        loadInventory();
      } else {
        Alert.alert("Error", "Failed to update product");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update product");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete ${item.productName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await inventoryService.deleteInventoryItem(item.productId);
              loadInventory();
            } catch (error) {
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const isEditing = editingId === item.productId;

    return (
      <View style={styles.itemContainer}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name</Text>
              <Text style={styles.editValue}>{item.productName}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit Price (KES)</Text>
              <TextInput
                style={styles.editInput}
                value={editValues.unitPrice}
                onChangeText={(text) => setEditValues({ ...editValues, unitPrice: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stock Amount</Text>
              <TextInput
                style={styles.editInput}
                value={editValues.stockAmount}
                onChangeText={(text) => setEditValues({ ...editValues, stockAmount: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.editInput}
                value={editValues.unit}
                onChangeText={(text) => setEditValues({ ...editValues, unit: text })}
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setEditingId(null)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSave(item)}
                style={[styles.editButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.itemHeader}>
              <Text style={styles.productName}>{item.productName}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                  <Feather name="edit" size={18} color="#2E3192" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>KES {item.unitPrice}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Stock:</Text>
                <Text style={styles.detailValue}>{item.stockAmount} {item.unit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total Price:</Text>
                <Text style={styles.detailValue}>
                  KES {(item.unitPrice * item.stockAmount).toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>{item.lastUpdated.toLocaleString()}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E3192" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Items</Text>
          <Text style={styles.summaryValue}>{inventory?.totalItems || 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>
            KES {inventory?.totalValue.toLocaleString() || 0}
          </Text>
        </View>
      </View>

      <FlatList
        data={inventory?.items || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add_product")}
      >
        <LinearGradient
          colors={["#2E3192", "#1BFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addButtonGradient}
        >
          <Feather name="plus" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summary: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  list: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  editContainer: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  editValue: {
    fontSize: 16,
    color: "#1E293B",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  editButtonText: {
    color: "#64748B",
  },
  saveButton: {
    backgroundColor: "#2E3192",
    borderColor: "#2E3192",
  },
  saveButtonText: {
    color: "white",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default InventoryComponent;