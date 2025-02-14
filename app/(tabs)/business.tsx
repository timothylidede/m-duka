import { Stack } from "expo-router";
import { RelativePathString } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

interface SalesMetrics {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  targetAchieved: number;
  averageOrderValue: number;
  totalTransactions: number;
}

interface SalesSummary {
  topSellingItems: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  metrics: SalesMetrics;
  lastUpdate: string;
}

interface QuickAction {
  actionName: string;
  iconName: string;
  nextPagePath: RelativePathString;
}

interface MetricCard {
  label: string;
  value: string | number;
  icon: string;
}

const BusinessPage: React.FC = () => {
  const [dateRange, setDateRange] = useState("Today");

  // routes a pae to a next page
  // Check definition of the type quickaction
  const router = useRouter();
  const routeProfilePageQuickAction = (nextPagePath: RelativePathString) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(nextPagePath); // Update the path to match your file structure
  };

  const salesData: SalesSummary = {
    topSellingItems: [
      { id: "SKU001", name: "Bread", quantity: 45, revenue: 2250.0 },
      { id: "SKU002", name: "Sugar", quantity: 32, revenue: 1600.0 },
      { id: "SKU003", name: "Mandazi", quantity: 28, revenue: 1400.0 },
    ],
    metrics: {
      dailySales: 5850.0,
      weeklySales: 32450.0,
      monthlySales: 124680.0,
      targetAchieved: 85,
      averageOrderValue: 78.5,
      totalTransactions: 142,
    },
    lastUpdate: "2025-02-09 15:30:00",
  };

  const QuickActions: QuickAction[] = [
    {
      actionName: "Manage Shop Products",
      iconName: "user",
      nextPagePath: "../listShopProductsPage",
    },
    {
      actionName: "Generate Daily Report",
      iconName: "file-text",
      nextPagePath: "../dailyReportPage",
    },
    {
      actionName: "Generate Monthly Report",
      iconName: "bar-chart-2",
      nextPagePath: "../monthlyReportPage",
    },
    {
      actionName: "Manage Credit",
      iconName: "box",
      nextPagePath: "../underConstruction",
    },
    {
      actionName: "KRA Tax Compliance",
      iconName: "shopping-bag",
      nextPagePath: "../underConstruction",
    },
    // { actionName: 'Manage Promotions', iconName: 'gift' },
    // { actionName: 'Manage Staff', iconName: 'users' },
    // { actionName: 'Add New Item', iconName: 'plus' },
  ];

  const MetricCards: MetricCard[] = [
    {
      label: "Total Sales",
      value: `KES ${salesData.metrics.dailySales.toLocaleString()}`,
      icon: "dollar-sign",
    },
    {
      label: "Transactions",
      value: salesData.metrics.totalTransactions,
      icon: "shopping-cart",
    },
    {
      label: "Avg Order",
      value: `KES ${salesData.metrics.averageOrderValue}`,
      icon: "trending-up",
    },
    {
      label: "Target",
      value: `${salesData.metrics.targetAchieved}%`,
      icon: "target",
    },
  ];

  const MetricCard: React.FC<{
    label: string;
    value: string | number;
    icon: string;
  }> = ({ label, value, icon }) => (
    <LinearGradient
      colors={["#2E3192", "#1BFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.metricCard}
    >
      <View style={styles.metricIconContainer}>
        <Feather name={icon as any} size={24} color="white" />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </LinearGradient>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Manage Business",
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
        <ScrollView>
          <View style={styles.dateSelector}>
            {["Today", "Week", "Month"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.dateButton,
                  dateRange === period && styles.activeDateButton,
                ]}
                onPress={() => setDateRange(period)}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    dateRange === period && styles.activeDateButtonText,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.metricsGrid}>
            {MetricCards.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}

            {/* Replaced the commented code below with the one above */}
            {/* <MetricCard
              label="Total Sales"
              value={`KES ${salesData.metrics.dailySales.toLocaleString()}`}
              icon="dollar-sign"
            />
            <MetricCard
              label="Transactions"
              value={salesData.metrics.totalTransactions}
              icon="shopping-cart"
            />
            <MetricCard
              label="Avg Order"
              value={`KES ${salesData.metrics.averageOrderValue}`}
              icon="trending-up"
            />
            <MetricCard
              label="Target"
              value={`${salesData.metrics.targetAchieved}%`}
              icon="target"
            /> */}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="box" size={24} color="#2E3192" />
              <Text style={styles.sectionTitle}>Top Selling Items</Text>
            </View>

            {salesData.topSellingItems.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemId}>{item.id}</Text>
                </View>
                <View style={styles.itemStats}>
                  <Text style={styles.itemQuantity}>{item.quantity} units</Text>
                  <Text style={styles.itemRevenue}>KES {item.revenue}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="zap" size={24} color="#2E3192" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            {QuickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => {
                  routeProfilePageQuickAction(action.nextPagePath);
                }}
              >
                <LinearGradient
                  colors={["#2E3192", "#1BFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Feather
                    name={action.iconName as keyof typeof Feather.glyphMap}
                    size={24}
                    color="white"
                  />
                  <Text style={styles.actionButtonText}>
                    {action.actionName}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.lastUpdate}>
            Last updated: {salesData.lastUpdate}
          </Text>
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
  dateSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeDateButton: {
    backgroundColor: "#2E3192",
  },
  dateButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  activeDateButtonText: {
    color: "#fff",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  metricCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  metricIconContainer: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    color: "#1E293B",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  itemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E3192",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
  },
  itemId: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  itemStats: {
    alignItems: "flex-end",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#64748B",
  },
  itemRevenue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E3192",
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  lastUpdate: {
    textAlign: "center",
    color: "#64748B",
    padding: 20,
    fontSize: 12,
    marginBottom: 60,
  },
});

export default BusinessPage;
