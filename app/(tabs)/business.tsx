import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

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

const SalesPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('Today');

  // Mock data - in production, this would come from an API
  const salesData: SalesSummary = {
    topSellingItems: [
      { id: 'SKU001', name: 'Bread', quantity: 45, revenue: 2250.00 },
      { id: 'SKU002', name: 'Sugar', quantity: 32, revenue: 1600.00 },
      { id: 'SKU003', name: 'Mandazi', quantity: 28, revenue: 1400.00 },
    ],
    metrics: {
      dailySales: 5850.00,
      weeklySales: 32450.00,
      monthlySales: 124680.00,
      targetAchieved: 85,
      averageOrderValue: 78.50,
      totalTransactions: 142,
    },
    lastUpdate: '2025-02-09 15:30:00',
  };

  const MetricCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Sales Dashboard</Text>
          <View style={styles.dateSelector}>
            {['Today', 'Week', 'Month'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.dateButton,
                  dateRange === period && styles.activeDateButton,
                ]}
                onPress={() => setDateRange(period)}
              >
                <Text style={[
                  styles.dateButtonText,
                  dateRange === period && styles.activeDateButtonText,
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.mainMetrics}>
          <MetricCard
            label="Total Sales"
            value={`Ksh ${salesData.metrics.dailySales.toLocaleString()}`}
          />
          <MetricCard
            label="Transactions"
            value={salesData.metrics.totalTransactions}
          />
          <MetricCard
            label="Avg Order Value"
            value={`Ksh ${salesData.metrics.averageOrderValue}`}
          />
          <MetricCard
            label="Target Achieved"
            value={`${salesData.metrics.targetAchieved}%`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          {salesData.topSellingItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemId}>{item.id}</Text>
              </View>
              <View style={styles.itemStats}>
                <Text style={styles.itemQuantity}>{item.quantity} units</Text>
                <Text style={styles.itemRevenue}>${item.revenue}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>New Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Generate Sales Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Detailed Analytics</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.lastUpdate}>
          Last updated: {salesData.lastUpdate}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeDateButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButtonText: {
    color: '#666',
    fontSize: 14,
  },
  activeDateButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  mainMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    margin: '1%',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemStats: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemRevenue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196f3',
  },
  actionButton: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  lastUpdate: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontSize: 12,
  },
});

export default SalesPage;