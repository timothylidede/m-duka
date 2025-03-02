import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSalesService, TransactionListResult, SaleMetadata } from '../services/sales';
import TransactionItem from '../components/transactionsComponent';

export default function TransactionsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionListResult>({
    transactions: [],
    totalRevenue: 0,
    salesCount: 0,
    averageTransactionValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const salesService = useSalesService();

  const loadTransactions = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const data = await salesService.getTransactions({
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
      });

      if (data && Array.isArray(data.transactions)) {
        const totalPagesCalc = Math.ceil(data.salesCount / itemsPerPage);
        setTotalPages(totalPagesCalc > 0 ? totalPagesCalc : 1);
        setTransactionData(data);
      } else {
        setTransactionData({
          transactions: [],
          totalRevenue: 0,
          salesCount: 0,
          averageTransactionValue: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactionData({
        transactions: [],
        totalRevenue: 0,
        salesCount: 0,
        averageTransactionValue: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(currentPage);
  }, [currentPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions(1).then(() => {
      setCurrentPage(1);
      setRefreshing(false);
    });
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    try {
      const success = await salesService.deleteTransaction(id);
      if (success) {
        // Recalculate current page if this was the last item on the page
        if (transactionData.transactions.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          loadTransactions(currentPage);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2E3192', '#1BFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.summaryCardContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.dateContainer}>
              <Feather name="calendar" size={16} color="#2E3192" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Feather name="refresh-cw" size={14} color="#2E3192" />
            </TouchableOpacity>
          </View>
          <View style={styles.revenueContainer}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>
              {formatCurrency(transactionData?.totalRevenue || 0)}
            </Text>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconContainer}>
                <Feather name="shopping-bag" size={14} color="#2E3192" />
              </View>
              <Text style={styles.metricValue}>{transactionData?.salesCount || 0}</Text>
              <Text style={styles.metricLabel}>Transactions</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={styles.metricIconContainer}>
                <Feather name="trending-up" size={14} color="#2E3192" />
              </View>
              <Text style={styles.metricValue}>
                {formatCurrency(Math.round(transactionData?.averageTransactionValue || 0))}
              </Text>
              <Text style={styles.metricLabel}>Avg. Value</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.listHeaderContainer}>
        <Text style={styles.listTitle}>Transaction History</Text>
        <LinearGradient
          colors={['#2E3192', '#1BFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.listDivider}
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#2E3192']} 
            tintColor="#2E3192"
          />
        }
        style={styles.transactionsList}
        contentContainerStyle={[
          styles.contentContainer,
          !isLoading && transactionData.transactions.length === 0 && styles.emptyContentContainer,
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E3192" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactionData.transactions.length > 0 ? (
          transactionData.transactions.map((transaction: SaleMetadata, index: number) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              index={index}
              onDelete={handleDeleteTransaction}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="inbox" size={32} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>Pull to refresh or check back later</Text>
          </View>
        )}
      </ScrollView>

      {!isLoading && transactionData.transactions.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={() => {
              if (currentPage > 1) {
                setCurrentPage((p) => p - 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            disabled={currentPage === 1}
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          >
            <Feather name="chevron-left" size={18} color={currentPage === 1 ? '#94A3B8' : '#2E3192'} />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (currentPage < totalPages) {
                setCurrentPage((p) => p + 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            disabled={currentPage === totalPages}
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          >
            <Feather name="chevron-right" size={18} color={currentPage === totalPages ? '#94A3B8' : '#2E3192'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
  },
  summaryCardContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#4B5563',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  revenueContainer: {
    marginBottom: 20,
  },
  revenueLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  revenueAmount: {
    color: '#111827',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    justifyContent: 'space-around',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  metricValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
  },
  listHeaderContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  listDivider: {
    height: 4,
    width: 40,
    borderRadius: 2,
  },
  transactionsList: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  paginationText: {
    marginHorizontal: 16,
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});

export { TransactionsPage };