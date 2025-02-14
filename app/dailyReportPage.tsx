import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Feather } from "@expo/vector-icons";

// Mock data for daily report
const dailyReport = {
  totalSales: 1250.75,
  totalTransactions: 24,
  averageSale: 52.11,
  salesByHour: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600],
  salesByCategory: [
    { name: "Electronics", sales: 400, color: "#FF6384" },
    { name: "Clothing", sales: 300, color: "#36A2EB" },
    { name: "Accessories", sales: 200, color: "#FFCE56" },
    { name: "Home Goods", sales: 150, color: "#4BC0C0" },
  ],
};

export default function DailyReport() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Daily Report",
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
              ${dailyReport.totalSales.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Transactions</Text>
            <Text style={styles.metricValue}>
              {dailyReport.totalTransactions}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Sale</Text>
            <Text style={styles.metricValue}>
              ${dailyReport.averageSale.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Sales by Hour - Line Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales by Hour</Text>
          <LineChart
            data={{
              labels: [
                "6AM",
                "8AM",
                "10AM",
                "12PM",
                "2PM",
                "4PM",
                "6PM",
                "8PM",
                "10PM",
              ],
              datasets: [
                {
                  data: dailyReport.salesByHour,
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

        {/* Sales by Category - Pie Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales by Category</Text>
          <PieChart
            data={dailyReport.salesByCategory}
            width={350}
            height={200}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="sales"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
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
