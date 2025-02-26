import { Stack } from "expo-router";
import { RelativePathString } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

// Interfaces remain the same
interface SalesMetrics {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  targetAchieved: number;
  averageOrderValue: number;
  totalTransactions: number;
  profitMargin: number;
  yearToDateSales: number;
}

interface SalesSummary {
  topSellingItems: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    time: string;
    items: number;
    amount: number;
  }>;
  metrics: SalesMetrics;
  lastUpdate: string;
}

interface QuickAction {
  actionName: string;
  iconName: string;
  nextPagePath: RelativePathString;
}

const BusinessPage: React.FC = () => {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  const routeAction = (nextPagePath: RelativePathString) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(nextPagePath);
  };

  const salesData: SalesSummary = {
    topSellingItems: [
      { id: "SKU001", name: "Bread", quantity: 45, revenue: 2250.0 },
      { id: "SKU002", name: "Sugar", quantity: 32, revenue: 1600.0 },
      { id: "SKU003", name: "Mandazi", quantity: 28, revenue: 1400.0 },
      { id: "SKU004", name: "Milk", quantity: 25, revenue: 1250.0 },
      { id: "SKU005", name: "Rice", quantity: 20, revenue: 1000.0 },
    ],
    recentTransactions: [
      { id: "TX1234", time: "15:45", items: 3, amount: 450.0 },
      { id: "TX1233", time: "14:32", items: 1, amount: 150.0 },
      { id: "TX1232", time: "13:15", items: 5, amount: 780.0 },
      { id: "TX1231", time: "12:08", items: 2, amount: 300.0 },
    ],
    metrics: {
      dailySales: 5850.0,
      weeklySales: 32450.0,
      monthlySales: 124680.0,
      targetAchieved: 85,
      averageOrderValue: 78.5,
      totalTransactions: 142,
      profitMargin: 22.5,
      yearToDateSales: 1247800.0,
    },
    lastUpdate: "2025-02-26 15:30:00",
  };

  const QuickActions: QuickAction[] = [
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
      actionName: "Sales Analytics",
      iconName: "trending-up",
      nextPagePath: "../salesAnalytics",
    },
    {
      actionName: "Financial Summary",
      iconName: "dollar-sign",
      nextPagePath: "../financialSummary",
    },
    {
      actionName: "KRA Tax Compliance",
      iconName: "shield",
      nextPagePath: "../kraTaxCompliance",
    },
    {
      actionName: "Manage Credit Sales",
      iconName: "credit-card",
      nextPagePath: "../creditManagement",
    },
  ];

  // Enhanced MetricCard with more appealing design
  const MetricCard = ({ label, value, icon, bgColor }: { label: string; value: string; icon: string; bgColor: string }) => (
    <View style={[styles.metricCard, { backgroundColor: bgColor }]}>
      <View style={styles.metricContent}>
        <View style={styles.metricIconContainer}>
          <Feather name={icon as any} size={24} color="white" />
        </View>
        <View style={styles.metricTextContainer}>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.metricLabel}>{label}</Text>
        </View>
      </View>
    </View>
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
          {/* Enhanced Dashboard Header Section */}
          <View style={styles.dashboardContainer}>
            <LinearGradient
              colors={["#2E3192", "#1BFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.dashboardHeader}>
                <Text style={styles.greeting}>Good afternoon!</Text>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>

              <View style={styles.revenueCard}>
                <View style={styles.revenueCardContent}>
                  <View style={styles.revenueTextContainer}>
                    <Text style={styles.revenueLabel}>All-Time Revenue</Text>
                    <Text style={styles.revenueAmount}>
                      KES {salesData.metrics.monthlySales.toLocaleString()}
                    </Text>
                    
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${salesData.metrics.targetAchieved}%` }]} />
                      </View>
                      <Text style={styles.progressText}>
                        {salesData.metrics.targetAchieved}% of monthly target
                      </Text>
                    </View>
                  </View>
                  <View style={styles.revenueIconContainer}>
                    <View style={styles.revenueIcon}>
                      <Feather name="trending-up" size={28} color="white" />
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Enhanced Metrics Section */}
            <View style={styles.metricCardsContainer}>
              <MetricCard
                label="Transactions"
                value={salesData.metrics.totalTransactions.toString()}
                icon="shopping-cart"
                bgColor="#4C60F5"
              />
              <MetricCard
                label="Avg Order"
                value={`KES ${salesData.metrics.averageOrderValue}`}
                icon="shopping-bag"
                bgColor="#33BBCF"
              />
              <MetricCard
                label="Daily Sales"
                value={`KES ${salesData.metrics.dailySales.toLocaleString()}`}
                icon="calendar"
                bgColor="#5E35B1"
              />
              <MetricCard
                label="Profit Margin"
                value={`${salesData.metrics.profitMargin}%`}
                icon="percent"
                bgColor="#00C853"
              />
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatCard}>
                <View style={styles.quickStatIconContainer}>
                  <Feather name="check-circle" size={16} color="#00C853" />
                </View>
                <Text style={styles.quickStatValue}>KES {salesData.metrics.weeklySales.toLocaleString()}</Text>
                <Text style={styles.quickStatLabel}>Weekly Sales</Text>
              </View>
              
              <View style={styles.quickStatDivider} />
              
              <View style={styles.quickStatCard}>
                <View style={styles.quickStatIconContainer}>
                  <Feather name="users" size={16} color="#FF6D00" />
                </View>
                <Text style={styles.quickStatValue}>{salesData.metrics.totalTransactions} orders</Text>
                <Text style={styles.quickStatLabel}>Monthly Count</Text>
              </View>
            </View>
          </View>

          {/* Rest of the content remains the same */}
          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={24} color="#2E3192" />
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>

            {salesData.recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    <Feather name="shopping-cart" size={16} color="#2E3192" />
                  </View>
                  <View>
                    <Text style={styles.transactionId}>{transaction.id}</Text>
                    <Text style={styles.transactionTime}>{transaction.time}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionItems}>
                    {transaction.items} {transaction.items === 1 ? "item" : "items"}
                  </Text>
                  <Text style={styles.transactionAmount}>
                    KES {transaction.amount}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => routeAction("../allTransactions")}
            >
              <Text style={styles.viewAllButtonText}>View All Transactions</Text>
              <Feather name="chevron-right" size={16} color="#2E3192" />
            </TouchableOpacity>
          </View>

          {/* Top Selling Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="award" size={24} color="#2E3192" />
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

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="zap" size={24} color="#2E3192" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.actionGrid}>
              {QuickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => routeAction(action.nextPagePath)}
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
                  </LinearGradient>
                  <Text style={styles.actionButtonText}>
                    {action.actionName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  dashboardContainer: {
    marginBottom: 12,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  revenueCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  revenueCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueTextContainer: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
    marginBottom: 12,
  },
  revenueIconContainer: {
    paddingLeft: 20,
  },
  revenueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "white",
    opacity: 0.9,
  },
  metricCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: -30,
    zIndex: 1,
  },
  metricCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricTextContainer: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  metricLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  quickStatIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
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
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  transactionTime: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  transactionItems: {
    fontSize: 12,
    color: "#64748B",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E3192",
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 8,
  },
  viewAllButtonText: {
    color: "#2E3192",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
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
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "30%",
    alignItems: "center",
    marginBottom: 20,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
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