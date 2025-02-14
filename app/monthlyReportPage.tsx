import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
// import { Feather } from "@expo/vector-icons";

// Mock data for monthly report
const monthlyReport = {
  totalSales: 12500.75,
  totalTransactions: 240,
  averageSale: 52.11,
  salesByDay: [
    500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500,
    7000, 7500, 8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000,
    12500,
  ],
  salesByCategory: [
    { name: "Electronics", sales: 4000, color: "#FF6384" },
    { name: "Clothing", sales: 3000, color: "#36A2EB" },
    { name: "Accessories", sales: 2000, color: "#FFCE56" },
    { name: "Home Goods", sales: 1500, color: "#4BC0C0" },
  ],
};

export default function MonthlyReport() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Monthly Report",
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
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <Text style={styles.metricValue}>
              ${monthlyReport.totalSales.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Transactions</Text>
            <Text style={styles.metricValue}>
              {monthlyReport.totalTransactions}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Sale</Text>
            <Text style={styles.metricValue}>
              ${monthlyReport.averageSale.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Sales by Day - Line Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales by Day</Text>
          <LineChart
            data={{
              labels: ["1", "5", "10", "15", "20", "25", "30"],
              datasets: [
                {
                  data: monthlyReport.salesByDay,
                },
              ],
            }}
            width={350}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 49, 146, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#2E3192",
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        {/* Sales by Category - Bar Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales by Category</Text>
          <BarChart
            data={{
              labels: monthlyReport.salesByCategory.map(
                (category) => category.name
              ),
              datasets: [
                {
                  data: monthlyReport.salesByCategory.map(
                    (category) => category.sales
                  ),
                },
              ],
            }}
            width={350}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 49, 146, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

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
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  bottomMargin: {
    marginBottom: 100,
  },
});
