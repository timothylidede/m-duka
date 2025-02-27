import { Stack } from "expo-router";
import { RelativePathString } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSalesService, SaleMetadata } from "../../services/sales";
import { useInventoryService } from "../../services/inventory";

// Interfaces (simplified for this context)
interface QuickAction {
  actionName: string;
  iconName: string;
  nextPagePath: RelativePathString;
}

interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

const BusinessPage: React.FC = () => {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const salesService = useSalesService();
  const inventoryService = useInventoryService();

  // State for dynamic data
  const [allTimeRevenue, setAllTimeRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<SaleMetadata[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);

  useEffect(() => {
    const fetchSalesAndInventoryData = async () => {
      try {
        // Fetch basic sales metrics
        const allTimeData = await salesService.getAllTimeSalesData();
        setAllTimeRevenue(allTimeData.totalRevenue);
        setTotalTransactions(allTimeData.totalTransactions);

        const todayData = await salesService.getTodaysSalesData();
        setTodayRevenue(todayData.totalRevenue);

        const weekData = await salesService.getWeeklySalesData();
        setWeekRevenue(weekData.totalRevenue);

        const monthData = await salesService.getMonthlySalesData();
        setMonthRevenue(monthData.totalRevenue);

        const transactionResult = await salesService.getTransactions({ limit: 5 });
        setRecentTransactions(transactionResult.transactions);

        // Fetch all transactions for top-selling items
        const allTransactionsResult = await salesService.getTransactions();
        const inventoryData = await inventoryService.getAllInventory();

        // Aggregate sales data
        const salesAggregation: { [key: string]: { quantity: number; revenue: number } } = {};

        allTransactionsResult.transactions.forEach((transaction) => {
          if (transaction.lineItems) {
            transaction.lineItems.forEach((item) => {
              if (item.productId && item.productId !== "No product ID") {
                if (!salesAggregation[item.productId]) {
                  salesAggregation[item.productId] = { quantity: 0, revenue: 0 };
                }
                salesAggregation[item.productId].quantity += item.quantity;
                salesAggregation[item.productId].revenue += item.price * item.quantity;
              }
            });
          }
        });

        // Map to inventory data and rank
        const topItems: TopSellingItem[] = Object.keys(salesAggregation)
          .map((productId) => {
            const inventoryItem = inventoryData.items.find(
              (item) => item.productId === productId
            );
            return {
              id: productId,
              name: inventoryItem ? inventoryItem.productName : productId,
              quantity: salesAggregation[productId].quantity,
              revenue: salesAggregation[productId].revenue,
            };
          })
          .sort((a, b) => b.quantity - a.quantity) // Rank by quantity sold
          .slice(0, 5); // Top 5 items

        setTopSellingItems(topItems);
      } catch (error) {
        console.error("Error fetching sales or inventory data:", error);
        setTopSellingItems([]); // Fallback to empty list on error
      }
    };

    fetchSalesAndInventoryData();
  }, []);

  const targets = [10000, 50000, 100000, 250000, 500000, 1000000];

  const getLevelInfo = (revenue: number, targets: number[]) => {
    let currentLevel = 0;
    let nextTarget = targets[0];
    let progress = 0;

    for (let i = 0; i < targets.length; i++) {
      if (revenue < targets[i]) {
        nextTarget = targets[i];
        progress =
          i === 0
            ? (revenue / targets[0]) * 100
            : ((revenue - targets[i - 1]) / (targets[i] - targets[i - 1])) * 100;
        break;
      }
      currentLevel = i + 1;
    }

    if (currentLevel === targets.length) {
      progress = 100; // Max level achieved
    }

    return { currentLevel, nextTarget, progress };
  };

  const levelInfo = getLevelInfo(allTimeRevenue, targets);

  const routeAction = (nextPagePath: RelativePathString) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(nextPagePath);
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

  const MetricCard = ({
    label,
    value,
    icon,
    bgColor,
  }: {
    label: string;
    value: string;
    icon: string;
    bgColor: string;
  }) => (
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

  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good evening";
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Manage Business",
          headerStyle: { backgroundColor: "#2E3192" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
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
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>

              <View style={styles.revenueCard}>
                <View style={styles.revenueCardContent}>
                  <View style={styles.revenueTextContainer}>
                    <Text style={styles.revenueLabel}>Revenue Level {levelInfo.currentLevel}</Text>
                    <Text style={styles.revenueAmount}>
                      KES {allTimeRevenue.toLocaleString()}
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${levelInfo.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>
                        {levelInfo.currentLevel < targets.length
                          ? `${levelInfo.progress.toFixed(1)}% towards Level ${levelInfo.currentLevel + 1}`
                          : "Max level achieved"}
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

            {/* Updated Metrics Section */}
            <View style={styles.metricCardsContainer}>
              <MetricCard
                label="Total Transactions"
                value={totalTransactions.toString()}
                icon="shopping-cart"
                bgColor="#4C60F5"
              />
              <MetricCard
                label="Today's Revenue"
                value={`KES ${todayRevenue.toLocaleString()}`}
                icon="calendar"
                bgColor="#33BBCF"
              />
              <MetricCard
                label="This Week's Revenue"
                value={`KES ${weekRevenue.toLocaleString()}`}
                icon="trending-up"
                bgColor="#5E35B1"
              />
              <MetricCard
                label="This Month's Revenue"
                value={`KES ${monthRevenue.toLocaleString()}`}
                icon="bar-chart-2"
                bgColor="#00C853"
              />
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatCard}>
                <View style={styles.quickStatIconContainer}>
                  <Feather name="clock" size={16} color="#00C853" />
                </View>
                <Text style={styles.quickStatValue}>KES {todayRevenue.toLocaleString()}</Text>
                <Text style={styles.quickStatLabel}>Today’s Revenue</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatCard}>
                <View style={styles.quickStatIconContainer}>
                  <Feather name="users" size={16} color="#FF6D00" />
                </View>
                <Text style={styles.quickStatValue}>{totalTransactions} txns</Text>
                <Text style={styles.quickStatLabel}>All-Time Count</Text>
              </View>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={24} color="#2E3192" />
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>

            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    <Feather name="shopping-cart" size={16} color="#2E3192" />
                  </View>
                  <View>
                    <Text style={styles.transactionId}>{transaction.id}</Text>
                    <Text style={styles.transactionTime}>
                      {transaction.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionItems}>
                    {transaction.lineItems?.length || 0} items
                  </Text>
                  <Text style={styles.transactionAmount}>
                    KES {transaction.totalPrice.toLocaleString()}
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

          {/* Top Selling Items (Dynamic Calculation) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="award" size={24} color="#2E3192" />
              <Text style={styles.sectionTitle}>Top Selling Items</Text>
            </View>

            {topSellingItems.length > 0 ? (
              topSellingItems.map((item, index) => (
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
                    <Text style={styles.itemRevenue}>KES {item.revenue.toLocaleString()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>No data available</Text>
              </View>
            )}
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
                  <Text style={styles.actionButtonText}>{action.actionName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.lastUpdate}>
            Last updated: {new Date().toLocaleString()}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// Styles remain unchanged
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  dateText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  revenueCard: {
    marginHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(10px)",
  },
  revenueCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
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
    width: "47%",
    marginHorizontal: "1.5%",
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  metricContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatCard: {
    flex: 1,
    alignItems: "center",
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  quickStatIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#64748B",
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
    justifyContent: "center",
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