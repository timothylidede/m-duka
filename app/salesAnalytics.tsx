import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Types
interface SalesData {
  id: string;
  date: string;
  amount: number;
  product: string;
  region: string;
  salesperson: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: string;
}

interface FilterOption {
  value: string;
  label: string;
}

// Sample Data
const sampleSalesData: SalesData[] = [
  {
    id: "1",
    date: "2025-02-01",
    amount: 3200,
    product: "Product A",
    region: "North",
    salesperson: "John Doe",
  },
  {
    id: "2",
    date: "2025-02-03",
    amount: 4500,
    product: "Product B",
    region: "South",
    salesperson: "Jane Smith",
  },
  {
    id: "3",
    date: "2025-02-05",
    amount: 2800,
    product: "Product A",
    region: "East",
    salesperson: "Bob Johnson",
  },
  {
    id: "4",
    date: "2025-02-08",
    amount: 5100,
    product: "Product C",
    region: "West",
    salesperson: "Alice Brown",
  },
  {
    id: "5",
    date: "2025-02-10",
    amount: 3700,
    product: "Product B",
    region: "North",
    salesperson: "John Doe",
  },
  {
    id: "6",
    date: "2025-02-12",
    amount: 4200,
    product: "Product A",
    region: "South",
    salesperson: "Jane Smith",
  },
  {
    id: "7",
    date: "2025-02-15",
    amount: 2900,
    product: "Product C",
    region: "East",
    salesperson: "Bob Johnson",
  },
  {
    id: "8",
    date: "2025-02-18",
    amount: 4800,
    product: "Product B",
    region: "West",
    salesperson: "Alice Brown",
  },
  {
    id: "9",
    date: "2025-02-20",
    amount: 3500,
    product: "Product A",
    region: "North",
    salesperson: "John Doe",
  },
  {
    id: "10",
    date: "2025-02-22",
    amount: 5300,
    product: "Product C",
    region: "South",
    salesperson: "Jane Smith",
  },
  {
    id: "11",
    date: "2025-02-24",
    amount: 3100,
    product: "Product B",
    region: "East",
    salesperson: "Bob Johnson",
  },
  {
    id: "12",
    date: "2025-02-26",
    amount: 4600,
    product: "Product A",
    region: "West",
    salesperson: "Alice Brown",
  },
];

// Constants
const screenWidth = Dimensions.get("window").width;

// Components
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  percentage,
  icon,
}) => {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconContainer}>
        {/* <FontAwesome name={icon} size={24} color="#3498db" /> */}
        <FontAwesome size={24} color="#3498db" />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.percentageContainer}>
        <FontAwesome
          name={percentage >= 0 ? "arrow-up" : "arrow-down"}
          size={14}
          color={percentage >= 0 ? "#2ecc71" : "#e74c3c"}
        />
        <Text
          style={[
            styles.percentageText,
            { color: percentage >= 0 ? "#2ecc71" : "#e74c3c" },
          ]}
        >
          {Math.abs(percentage)}%
        </Text>
      </View>
    </View>
  );
};

const FilterDropdown: React.FC<{
  options: FilterOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  label: string;
}> = ({ options, selectedValue, onValueChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text>
          {options.find((opt) => opt.value === selectedValue)?.label || "All"}
        </Text>
        <FontAwesome
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={14}
          color="#666"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownOption,
                selectedValue === option.value && styles.dropdownOptionSelected,
              ]}
              onPress={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
            >
              <Text
                style={
                  selectedValue === option.value
                    ? styles.dropdownOptionTextSelected
                    : styles.dropdownOptionText
                }
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Main Component
const SalesAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("month");
  const [productFilter, setProductFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [salesData, setSalesData] = useState<SalesData[]>([]);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      // In a real app, you would fetch data from an API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSalesData(sampleSalesData);
      setLoading(false);
    };

    fetchData();
  }, [timeFilter, productFilter, regionFilter]);

  // Calculate metrics
  const calculateTotalSales = () => {
    return salesData.reduce((total, item) => total + item.amount, 0);
  };

  const calculateAverageSale = () => {
    return salesData.length > 0 ? calculateTotalSales() / salesData.length : 0;
  };

  const getTopProduct = () => {
    const productSales: Record<string, number> = {};
    salesData.forEach((item) => {
      productSales[item.product] =
        (productSales[item.product] || 0) + item.amount;
    });

    let topProduct = "";
    let maxAmount = 0;

    Object.entries(productSales).forEach(([product, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topProduct = product;
      }
    });

    return topProduct;
  };

  // Prepare chart data
  const prepareLineChartData = () => {
    // Group by date
    const dateMap: Record<string, number> = {};
    salesData.forEach((item) => {
      const date = item.date.substring(8, 10); // Extract day part
      dateMap[date] = (dateMap[date] || 0) + item.amount;
    });

    const labels = Object.keys(dateMap).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
    const data = labels.map((label) => dateMap[label]);

    return {
      labels,
      datasets: [
        {
          data,
          color: () => "#3498db",
          strokeWidth: 2,
        },
      ],
    };
  };

  const prepareBarChartData = () => {
    // Group by product
    const productMap: Record<string, number> = {};
    salesData.forEach((item) => {
      productMap[item.product] = (productMap[item.product] || 0) + item.amount;
    });

    const labels = Object.keys(productMap);
    const data = labels.map((label) => productMap[label]);

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  };

  const preparePieChartData = () => {
    // Group by region
    const regionMap: Record<string, number> = {};
    salesData.forEach((item) => {
      regionMap[item.region] = (regionMap[item.region] || 0) + item.amount;
    });

    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"];

    return Object.entries(regionMap).map(([name, amount], index) => ({
      name,
      amount,
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    }));
  };

  // Prepare filter options
  const timeFilterOptions: FilterOption[] = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  const productFilterOptions: FilterOption[] = [
    { value: "all", label: "All Products" },
    { value: "Product A", label: "Product A" },
    { value: "Product B", label: "Product B" },
    { value: "Product C", label: "Product C" },
  ];

  const regionFilterOptions: FilterOption[] = [
    { value: "all", label: "All Regions" },
    { value: "North", label: "North" },
    { value: "South", label: "South" },
    { value: "East", label: "East" },
    { value: "West", label: "West" },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading sales data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales Analytics</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <FontAwesome name="refresh" size={18} color="#3498db" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Filters Section */}
        <View style={styles.filtersRow}>
          <FilterDropdown
            options={timeFilterOptions}
            selectedValue={timeFilter}
            onValueChange={setTimeFilter}
            label="Time Period"
          />

          <FilterDropdown
            options={productFilterOptions}
            selectedValue={productFilter}
            onValueChange={setProductFilter}
            label="Product"
          />

          <FilterDropdown
            options={regionFilterOptions}
            selectedValue={regionFilter}
            onValueChange={setRegionFilter}
            label="Region"
          />
        </View>

        {/* KPI Cards Section */}
        <View style={styles.metricsContainer}>
          <MetricCard
            title="Total Sales"
            value={`$${calculateTotalSales().toLocaleString()}`}
            percentage={12.5}
            icon="dollar"
          />

          <MetricCard
            title="Avg. Sale"
            value={`$${Math.round(calculateAverageSale()).toLocaleString()}`}
            percentage={5.2}
            icon="line-chart"
          />

          <MetricCard
            title="Transactions"
            value={salesData.length.toString()}
            percentage={-2.1}
            icon="shopping-cart"
          />

          <MetricCard
            title="Top Product"
            value={getTopProduct()}
            percentage={8.7}
            icon="trophy"
          />
        </View>

        {/* Charts Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales Trend (February 2025)</Text>
          <LineChart
            data={prepareLineChartData()}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#3498db",
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales by Product</Text>
          <BarChart
            data={prepareBarChartData()}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="$"
            yAxisSuffix="Suffix ahh"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales by Region</Text>
          <PieChart
            data={preparePieChartData()}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </View>

        {/* Recent Sales Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.chartTitle}>Recent Sales</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Product</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Region</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
              Salesperson
            </Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}
            >
              Amount
            </Text>
          </View>

          {salesData.slice(0, 5).map((sale) => (
            <View key={sale.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {sale.date.substring(5)}
              </Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {sale.product}
              </Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{sale.region}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {sale.salesperson}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                ${sale.amount}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllButtonText}>View All Transactions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  filterContainer: {
    width: "32%",
    marginBottom: 10,
    position: "relative",
    zIndex: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#fff",
  },
  dropdownOptions: {
    position: "absolute",
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 5,
    zIndex: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  dropdownOptionSelected: {
    backgroundColor: "#f0f8ff",
  },
  dropdownOptionText: {
    color: "#333",
  },
  dropdownOptionTextSelected: {
    color: "#3498db",
    fontWeight: "bold",
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  metricIconContainer: {
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 12,
    marginLeft: 5,
  },
  chartContainer: {
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  chart: {
    marginLeft: -15,
    borderRadius: 5,
  },
  tableContainer: {
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 20,
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
    paddingBottom: 10,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    color: "#666",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 10,
  },
  tableCell: {
    color: "#333",
    fontSize: 13,
  },
  viewAllButton: {
    alignItems: "center",
    padding: 10,
    marginTop: 10,
  },
  viewAllButtonText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default SalesAnalyticsDashboard;
