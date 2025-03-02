import { RelativePathString, Stack } from "expo-router";
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AuthContext } from "../../context/AuthContext";
import { useSalesService } from "../../services/sales";
import { useInventoryService, InventoryItem } from "../../services/inventory";

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
  let sanitized = name.replace(/[^a-zA-Z\s]/g, ""); // Only letters and spaces
  sanitized = sanitized.slice(0, 50); // Limit to 50 characters
  if (sanitized.length > 0) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase(); // Capitalize first letter
  }
  return sanitized;
};

// Sanitize price function
const sanitizePrice = (price: string): string => {
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
  return quantity.replace(/[^0-9]/g, "").slice(0, 10); // Limit to 10 digits
};

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

interface StoreProfile {
  storeName: string;
  location: string;
  contactNumber: string;
  email?: string;
  lastStockUpdate: string;
  inventoryStats: InventoryStats;
}

interface QuickAction {
  actionName: string;
  iconName: string;
  nextPagePath?: RelativePathString;
  onPress?: () => void;
  highlight?: boolean;
}

const { width } = Dimensions.get('window');

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { shopData, logout } = useContext(AuthContext);
  const salesService = useSalesService();
  const inventoryService = useInventoryService();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState({
    productName: '',
    unitPrice: '',
    quantity: '',
  });
  const [matchingProducts, setMatchingProducts] = useState<InventoryItem[]>([]);
  const quantityInputRef = useRef<TextInput>(null);

  const routeInventoryQuickAction = (nextPagePath: RelativePathString) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(nextPagePath);
  };

  const [storeProfile, setStoreProfile] = useState<StoreProfile>({
    storeName: shopData?.name || "Main Street Quick Mart",
    location: shopData?.county || "Carwash Street, Nairobi",
    contactNumber: shopData?.contact || "+254743891547",
    email: shopData?.emailAddress || "j.muthaiga@quickmart.co.ke",
    lastStockUpdate: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }), // Dynamic default
    inventoryStats: {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inventoryData = await inventoryService.getAllInventory();
        
        const totalItems = inventoryData.totalItems;
        const totalValue = inventoryData.totalValue;
        const lowStock = inventoryData.items.filter(item => item.stockAmount > 0 && item.stockAmount <= 5).length;
        const outOfStock = inventoryData.items.filter(item => item.stockAmount === 0).length;

        // Find the most recent lastUpdated timestamp
        const latestUpdate = inventoryData.items.reduce((latest, item) => {
          const itemDate = new Date(item.lastUpdated);
          return itemDate > latest ? itemDate : latest;
        }, new Date(0));

        setStoreProfile((prev) => ({
          ...prev,
          storeName: shopData?.name || prev.storeName,
          location: shopData?.county || prev.location,
          contactNumber: shopData?.contact || prev.contactNumber,
          email: shopData?.emailAddress || prev.email,
          lastStockUpdate: latestUpdate.getTime() === 0
            ? prev.lastStockUpdate
            : latestUpdate.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
          inventoryStats: {
            totalItems,
            lowStock,
            outOfStock,
            totalValue,
          },
        }));
      } catch (error) {
        console.error("Error fetching inventory data:", error);
      }
    };

    fetchData();
  }, [shopData, inventoryService]);

  const fetchMatchingProducts = debounce(async (name: string) => {
    if (name.length > 1) {
      try {
        const inventory = await inventoryService.getAllInventory();
        const filtered = inventory.items.filter(item =>
          item.productName.toLowerCase().includes(name.toLowerCase())
        );
        setMatchingProducts(filtered);
      } catch (error) {
        console.error("Error fetching matching products:", error);
      }
    } else {
      setMatchingProducts([]);
    }
  }, 300);

  const handleProductNameChange = (text: string) => {
    const sanitized = sanitizeProductName(text);
    setNewProduct({ ...newProduct, productName: sanitized });
    fetchMatchingProducts(sanitized);
  };

  const handleUnitPriceChange = (text: string) => {
    const sanitized = sanitizePrice(text);
    setNewProduct({ ...newProduct, unitPrice: sanitized });
  };

  const handleQuantityChange = (text: string) => {
    const sanitized = sanitizeQuantity(text);
    setNewProduct({ ...newProduct, quantity: sanitized });
  };

  const selectProduct = (product: InventoryItem) => {
    const sanitizedName = sanitizeProductName(product.productName);
    setNewProduct({
      ...newProduct,
      productName: sanitizedName,
      unitPrice: product.unitPrice ? sanitizePrice(product.unitPrice.toString()) : "",
    });
    setMatchingProducts([]);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  };

  const addProductToInventory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { productName, unitPrice, quantity } = newProduct;
    const sanitizedProductName = sanitizeProductName(productName);
    const sanitizedUnitPrice = sanitizePrice(unitPrice);
    const sanitizedQuantity = sanitizeQuantity(quantity);

    if (!sanitizedProductName || !sanitizedUnitPrice || !sanitizedQuantity) {
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
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Invalid Quantity", "Quantity must be greater than 0.");
      return;
    }

    try {
      await inventoryService.addInventoryItem({
        productName: sanitizedProductName,
        unitPrice: priceNum,
        stockAmount: quantityNum,
        unit: "pieces", // Default unit since removed
      });

      Alert.alert(
        "Success",
        "Product added successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setNewProduct({ productName: '', unitPrice: '', quantity: '' });
              setModalVisible(false);
            },
          },
        ],
        { cancelable: false }
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Refresh inventory data
      const inventoryData = await inventoryService.getAllInventory();
      const totalItems = inventoryData.totalItems;
      const totalValue = inventoryData.totalValue;
      const lowStock = inventoryData.items.filter(item => item.stockAmount > 0 && item.stockAmount <= 5).length;
      const outOfStock = inventoryData.items.filter(item => item.stockAmount === 0).length;
      const latestUpdate = inventoryData.items.reduce((latest, item) => {
        const itemDate = new Date(item.lastUpdated);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0));

      setStoreProfile((prev) => ({
        ...prev,
        lastStockUpdate: latestUpdate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        inventoryStats: {
          totalItems,
          lowStock,
          outOfStock,
          totalValue,
        },
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to add product. Please try again.");
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const QuickActions: QuickAction[] = [
    {
      actionName: "Add a New Product",
      iconName: "plus-circle",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setModalVisible(true);
      },
      highlight: true,
    },
    {
      actionName: "Supplier Management",
      iconName: "truck",
      nextPagePath: "../supplierManagement",
    },
    {
      actionName: "Stock Restock Alerts",
      iconName: "bell",
      nextPagePath: "../underConstruction",
    },
    {
      actionName: "Inventory Analysis",
      iconName: "pie-chart",
      nextPagePath: "../underConstruction",
    },
    {
      actionName: "Demand Forecast",
      iconName: "trending-up",
      nextPagePath: "../underConstruction",
    },
  ];

  const handleLogout = async () => {
    try {
      Alert.alert(
        "Confirm Logout",
        "Are you sure you want to log out?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Logout",
            onPress: async () => {
              await logout();
              router.replace("/login");
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Store Profile",
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

      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={["#2E3192", "#1BFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.storeInfo}>
              <View style={styles.storeIconContainer}>
                <Feather name="shopping-bag" size={32} color="white" />
              </View>
              <Text style={styles.storeName}>{storeProfile.storeName}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => routeInventoryQuickAction("../listShopProductsPage")}
                  style={styles.businessButton}
                >
                  <Feather name="package" size={18} color="#2E3192" />
                  <Text style={styles.businessButtonText}>Manage Shop Products</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <Feather name="log-out" size={18} color="white" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {/* Inventory Actions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="zap" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Inventory Actions</Text>
              </View>

              <View style={styles.quickActionsGrid}>
                {QuickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quickActionButton,
                      action.highlight && styles.highlightedAction,
                    ]}
                    onPress={action.onPress || (() => routeInventoryQuickAction(action.nextPagePath!))}
                  >
                    <View
                      style={[
                        styles.quickActionIcon,
                        action.highlight && styles.highlightedActionIcon,
                      ]}
                    >
                      <Feather
                        name={action.iconName as any}
                        size={24}
                        color={action.highlight ? "white" : "#2E3192"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.quickActionText,
                        action.highlight && styles.highlightedActionText,
                      ]}
                    >
                      {action.actionName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Store Profile Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="user" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Store Profile</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="map-pin" size={20} color="#64748B" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{storeProfile.location}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="phone" size={20} color="#64748B" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{storeProfile.contactNumber}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="mail" size={20} color="#64748B" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{storeProfile.email || ''}</Text>
                </View>
              </View>
            </View>

            {/* Inventory Overview Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="box" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Inventory Overview</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statsCard}>
                  <Feather name="package" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>{storeProfile.inventoryStats.totalItems}</Text>
                  <Text style={styles.statsLabel}>Total Items</Text>
                </View>

                <View style={[styles.statsCard, styles.alertCard]}>
                  <Feather name="alert-circle" size={24} color="#DC2626" />
                  <Text style={[styles.statsValue, styles.alertValue]}>
                    {storeProfile.inventoryStats.lowStock}
                  </Text>
                  <Text style={styles.statsLabel}>Low Stock</Text>
                </View>

                <View style={[styles.statsCard, styles.criticalCard]}>
                  <Feather name="x-circle" size={24} color="#DC2626" />
                  <Text style={[styles.statsValue, styles.alertValue]}>
                    {storeProfile.inventoryStats.outOfStock}
                  </Text>
                  <Text style={styles.statsLabel}>Out of Stock</Text>
                </View>

                <View style={styles.statsCard}>
                  <Feather name="dollar-sign" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    KES {storeProfile.inventoryStats.totalValue.toLocaleString()}
                  </Text>
                  <Text style={styles.statsLabel}>Total Value</Text>
                </View>
              </View>
            </View>

            {/* Attention Required Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="alert-triangle" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Attention Required</Text>
              </View>

              <View style={styles.alertsContainer}>
                {storeProfile.inventoryStats.outOfStock > 0 && (
                  <View style={styles.alertItem}>
                    <View style={[styles.alertIndicator, styles.criticalIndicator]} />
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>Critical: Out of Stock Items</Text>
                      <Text style={styles.alertDescription}>
                        {storeProfile.inventoryStats.outOfStock} items need immediate restock
                      </Text>
                    </View>
                  </View>
                )}

                {storeProfile.inventoryStats.lowStock > 0 && (
                  <View style={styles.alertItem}>
                    <View style={[styles.alertIndicator, styles.warningIndicator]} />
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>Warning: Low Stock Items</Text>
                      <Text style={styles.alertDescription}>
                        {storeProfile.inventoryStats.lowStock} items running low in inventory
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.lastUpdate}>
              Last updated: {storeProfile.lastStockUpdate}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Add New Product Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add New Product</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Feather name="x" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Product Name</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="package" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter product name"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        value={newProduct.productName}
                        onChangeText={handleProductNameChange}
                        maxLength={50}
                      />
                    </View>
                    {matchingProducts.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <FlatList
                          data={matchingProducts}
                          keyExtractor={(item) => item.productId}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.suggestionItem}
                              onPress={() => selectProduct(item)}
                            >
                              <Text>{item.productName}</Text>
                            </TouchableOpacity>
                          )}
                          style={{ maxHeight: 150 }}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Unit Price (KES)</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="dollar-sign" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        keyboardType="numeric"
                        value={newProduct.unitPrice}
                        onChangeText={handleUnitPriceChange}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="hash" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        ref={quantityInputRef}
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        keyboardType="numeric"
                        value={newProduct.quantity}
                        onChangeText={handleQuantityChange}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={addProductToInventory}>
                      <LinearGradient
                        colors={["#2E3192", "#1BFFFF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                      >
                        <Text style={styles.saveButtonText}>Add Product</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  storeInfo: {
    alignItems: "center",
    marginVertical: 20,
  },
  storeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  storeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  businessButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessButtonText: {
    color: "#2E3192",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    color: "#1E293B",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  statsCard: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: "#FEF2F2",
  },
  criticalCard: {
    backgroundColor: "#FEE2E2",
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E3192",
    marginTop: 8,
    marginBottom: 4,
  },
  alertValue: {
    color: "#DC2626",
  },
  statsLabel: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  highlightedAction: {
    backgroundColor: "#2E3192",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(46, 49, 146, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  highlightedActionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  highlightedActionText: {
    color: "white",
  },
  alertsContainer: {
    gap: 12,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  alertIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  criticalIndicator: {
    backgroundColor: "#DC2626",
  },
  warningIndicator: {
    backgroundColor: "#F59E0B",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: "#64748B",
  },
  lastUpdate: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginBottom: 60,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: width,
    alignSelf: 'stretch',
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    alignSelf: 'stretch',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    width: '100%',
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  cancelButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default ProfilePage;