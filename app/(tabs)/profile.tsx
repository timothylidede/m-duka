import { RelativePathString, Stack } from "expo-router";
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AuthContext } from "../../context/AuthContext";
import { useSalesService } from "../../services/sales";
import { useInventoryService } from "../../services/inventory";

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
  nextPagePath: RelativePathString;
  highlight?: boolean;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { shopData, logout } = useContext(AuthContext);
  const salesService = useSalesService();
  const inventoryService = useInventoryService();

  const routeInventoryQuickAction = (nextPagePath: RelativePathString) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(nextPagePath);
  };

  // Default store profile with dynamic overrides from AuthContext and services
  const [storeProfile, setStoreProfile] = useState<StoreProfile>({
    storeName: shopData?.name || "Main Street Quick Mart",
    location: shopData?.county || "Carwash Street, Nairobi",
    contactNumber: shopData?.contact || "+254743891547",
    email: shopData?.emailAddress || "j.muthaiga@quickmart.co.ke",
    lastStockUpdate: "2025-02-05 09:30 AM", // Static for now
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
        // Fetch inventory data
        const inventoryData = await inventoryService.getAllInventory();
        
        // Calculate inventory stats
        const totalItems = inventoryData.totalItems;
        const totalValue = inventoryData.totalValue;
        const lowStock = inventoryData.items.filter(item => item.stockAmount > 0 && item.stockAmount <= 5).length; // Example threshold: <= 5 is low stock
        const outOfStock = inventoryData.items.filter(item => item.stockAmount === 0).length;

        // Update store profile with dynamic data
        setStoreProfile((prev) => ({
          ...prev,
          storeName: shopData?.name || prev.storeName,
          location: shopData?.county || prev.location,
          contactNumber: shopData?.contact || prev.contactNumber,
          email: shopData?.emailAddress || prev.email,
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

  const QuickActions: QuickAction[] = [
    {
      actionName: "Add a New Product",
      iconName: "plus-circle",
      nextPagePath: "../add_product",
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
      nextPagePath: "../restockAlerts",
    },
    {
      actionName: "Inventory Analysis",
      iconName: "pie-chart",
      nextPagePath: "../inventoryAnalysis",
    },
    {
      actionName: "Demand Forecast",
      iconName: "trending-up",
      nextPagePath: "../demandForecast",
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
                    onPress={() => routeInventoryQuickAction(action.nextPagePath)}
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
              {/* Removed Generate Inventory Report Button */}
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
              Last inventory update: {storeProfile.lastStockUpdate}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
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
});

export default ProfilePage;