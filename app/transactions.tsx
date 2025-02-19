import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSalesService, SaleMetadata, TransactionListResult } from '../services/sales';

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

const TransactionItem = ({ 
  transaction, 
  index, 
  onStatusUpdate 
}: { 
  transaction: SaleMetadata; 
  index: number;
  onStatusUpdate?: (id: string, newStatus: 'completed' | 'pending' | 'failed') => void;
}) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 100)}
    style={styles.transactionCard}
  >
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onStatusUpdate) {
          const nextStatus = 
            transaction.status === 'pending' ? 'completed' : 
            transaction.status === 'completed' ? 'failed' : 'pending';
          onStatusUpdate(transaction.id, nextStatus);
        }
      }}
      activeOpacity={0.7}
      style={styles.transactionContent}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.idContainer}>
          <View 
            style={[
              styles.statusDot,
              { 
                backgroundColor: 
                  transaction.status === 'completed' ? '#22C55E' : 
                  transaction.status === 'pending' ? '#EAB308' : '#EF4444'
              }
            ]}
          />
          <Text style={styles.transactionId}>#{transaction.id}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Feather name="clock" size={14} color="#64748B" style={styles.clockIcon} />
          <Text style={styles.timeText}>
            {new Date(transaction.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemsContainer}>
        {transaction.lineItems.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.productId || 'Unknown Product'}</Text>
              <View style={styles.itemMetrics}>
                <Text style={styles.itemMetricText}>Qty: {item.quantity || 0}</Text>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemMetricText}>KES {item.price || 0}/unit</Text>
              </View>
            </View>
            <Text style={styles.itemTotal}>
              KES {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.footer}>
        <View style={styles.paymentMethod}>
          <Text style={styles.footerLabel}>Payment Method</Text>
          <View style={styles.paymentInfo}>
            <Feather 
              name={transaction.paymentMethod === 'card' ? 'credit-card' : 'smartphone'} 
              size={14} 
              color="#64748B" 
              style={styles.paymentIcon}
            />
            <Text style={styles.paymentText}>{transaction.paymentMethod || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.totalAmount}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            KES {transaction.totalPrice.toLocaleString() || '0'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

export default function TransactionsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [transactionData, setTransactionData] = useState<TransactionListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const salesService = useSalesService();

  const loadTransactions = async (filter: StatusFilter = 'all') => {
    console.log('Loading transactions with filter:', filter);
    setIsLoading(true);
    try {
      const data = await salesService.getTransactions({
        status: filter === 'all' ? undefined : filter,
        limit: 20
      });
      console.log('Received transaction data:', data);
      setTransactionData(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions(activeFilter);
  }, [activeFilter]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTransactions(activeFilter).then(() => {
      setRefreshing(false);
    });
  }, [activeFilter]);

  const handleStatusUpdate = async (id: string, newStatus: 'completed' | 'pending' | 'failed') => {
    try {
      const success = await salesService.updateTransactionStatus(id, newStatus);
      if (success) {
        loadTransactions(activeFilter);
      }
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFilterPress = (filter: StatusFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const calculateMetrics = (transactions: SaleMetadata[]) => {
    const totalCount = transactions.length;
    const completedCount = transactions.filter(t => t.status === 'completed').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const failedCount = transactions.filter(t => t.status === 'failed').length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const averageTransactionValue = totalCount > 0 ? transactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0) / totalCount : 0;

    return { totalCount, completedCount, pendingCount, failedCount, completionRate, averageTransactionValue };
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <LinearGradient
          colors={['#2E3192', '#1BFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transactions</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
      </View>
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#2E3192', '#1BFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.dateContainer}>
              <Feather name="trending-up" size={24} color="white" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={styles.filterButton}
            >
              <Feather name="filter" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.revenueContainer}>
            <Text style={styles.revenueLabel}>
              Today's Total Revenue
            </Text>
            <Text style={styles.revenueAmount}>
              KES {transactionData?.totalRevenue.toLocaleString() || "0"}
            </Text>
          </View>
          
          <View style={styles.metricsContainer}>
            {transactionData && transactionData.transactions && (
              <View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>
                    Transactions
                  </Text>
                  <Text style={styles.metricValue}>
                    {transactionData.totalCount || 0}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>
                    Completion Rate
                  </Text>
                  <Text style={styles.metricValue}>
                    {Math.round(transactionData.completionRate || 0)}%
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>
                    Avg. Transaction
                  </Text>
                  <Text style={styles.metricValue}>
                    KES {transactionData.averageTransactionValue?.toLocaleString() || "0"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Filter tabs */}
        <View style={styles.filterTabs}>
          {(['all', 'completed', 'pending', 'failed'] as StatusFilter[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => handleFilterPress(filter)}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
            >
              <Text 
                style={[
                  styles.filterTabText,
                  activeFilter === filter && styles.activeFilterTabText
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== 'all' && transactionData ? ` (${filter === 'completed' ? transactionData.completedCount : filter === 'pending' ? transactionData.pendingCount : transactionData.failedCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.transactionsList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : !transactionData || transactionData.transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#CBD5E1" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>Try changing filters or check back later</Text>
            </View>
          ) : (
            transactionData.transactions.map((transaction: SaleMetadata, index: number) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction}
                index={index}
                onStatusUpdate={handleStatusUpdate}
              />
            ))
          )}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  // Keep all existing styles...
  
  // Add new styles for filters and empty states
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  // Add any additional styles you need
  
  // Ensure existing styles from the original component are included here
  // ...existing styles from TransactionsPage...
  header: {
    width: '100%',
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  summaryCard: {
    padding: 24,
    margin: 16,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  revenueContainer: {
    marginTop: 32,
  },
  revenueLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
  },
  revenueAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    color: 'white',
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  transactionsList: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  transactionContent: {
    padding: 20,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 4,
  },
  timeText: {
    color: '#64748B',
    fontSize: 14,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMetricText: {
    color: '#64748B',
    fontSize: 14,
  },
  bulletPoint: {
    color: '#64748B',
    marginHorizontal: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    marginRight: 6,
  },
  paymentText: {
    color: '#1E293B',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  totalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  bottomSpacing: {
    height: 24,
  },
});