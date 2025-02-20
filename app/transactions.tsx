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
import { useSalesService, TransactionListResult } from '../services/sales';
import TransactionItem from '../components/transactionsComponent';

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

export default function TransactionsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [transactionData, setTransactionData] = useState<TransactionListResult>({
    transactions: [],
    totalRevenue: 0,
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    completionRate: 0,
    averageTransactionValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const salesService = useSalesService();
  console.log('Sales service initialized:', !!salesService.getTransactions);

  const loadTransactions = async (filter: StatusFilter = 'all', page: number = 1) => {
    console.log('loadTransactions called with filter:', filter, 'page:', page);
    setIsLoading(true);
    try {
      console.log('Fetching transactions from salesService...');
      const data = await salesService.getTransactions({
        status: filter,
        limit: 100,
      });
      console.log('Data received from salesService:', {
        transactions: data.transactions?.length || 0,
        totalRevenue: data.totalRevenue,
        totalCount: data.totalCount,
      });

      if (data && Array.isArray(data.transactions)) {
        console.log('Transactions length:', data.transactions.length);
        const totalPagesCalc = Math.ceil(data.transactions.length / itemsPerPage);
        setTotalPages(totalPagesCalc > 0 ? totalPagesCalc : 1);
        console.log('totalPages set to:', totalPagesCalc > 0 ? totalPagesCalc : 1);

        const startIndex = (page - 1) * itemsPerPage;
        const paginatedTransactions = data.transactions.slice(startIndex, startIndex + itemsPerPage);
        console.log('Paginated transactions:', paginatedTransactions.map(t => t.id));

        setTransactionData({
          ...data,
          transactions: paginatedTransactions,
        });
        console.log('transactionData updated:', {
          transactions: paginatedTransactions.length,
          totalRevenue: data.totalRevenue,
        });
      } else {
        console.log('No valid data or transactions received, setting empty state');
        setTransactionData({
          transactions: [],
          totalRevenue: 0,
          totalCount: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          completionRate: 0,
          averageTransactionValue: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactionData({
        transactions: [],
        totalRevenue: 0,
        totalCount: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        completionRate: 0,
        averageTransactionValue: 0,
      });
    } finally {
      setIsLoading(false);
      console.log('isLoading set to false after fetch or error');
    }
  };

  // Fetch transactions on mount and when filter/page changes
  useEffect(() => {
    console.log('Initial loadTransactions useEffect, activeFilter:', activeFilter, 'currentPage:', currentPage);
    loadTransactions(activeFilter, currentPage);
  }, [activeFilter, currentPage]);

  const onRefresh = useCallback(() => {
    console.log('onRefresh triggered');
    setRefreshing(true);
    loadTransactions(activeFilter, 1).then(() => {
      setCurrentPage(1);
      setRefreshing(false);
      console.log('Refresh completed');
    });
  }, [activeFilter]);

  const handleStatusUpdate = async (id: string, newStatus: 'completed' | 'pending' | 'failed') => {
    console.log('handleStatusUpdate:', id, newStatus);
    try {
      const success = await salesService.updateTransactionStatus(id, newStatus);
      console.log('Update status success:', success);
      if (success) {
        loadTransactions(activeFilter, currentPage);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleBackPress = () => {
    console.log('handleBackPress');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFilterPress = (filter: StatusFilter) => {
    console.log('handleFilterPress:', filter);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  console.log('Rendering TransactionsPage, state:', {
    isLoading,
    activeFilter,
    currentPage,
    totalPages,
    transactions: transactionData.transactions?.length || 0,
  });

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
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.dateContainer}>
              <Feather name="activity" size={18} color="white" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={styles.revenueContainer}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>
              KES {(transactionData?.totalRevenue || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{transactionData?.totalCount || 0}</Text>
              <Text style={styles.metricLabel}>Transactions</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(transactionData?.completionRate || 0)}%</Text>
              <Text style={styles.metricLabel}>Completion Rate</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                KES {Math.round(transactionData?.averageTransactionValue || 0).toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Avg. Value</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        {['all', 'completed', 'pending', 'failed'].map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => handleFilterPress(filter as StatusFilter)}
            style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
          >
            <Text
              style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter !== 'all'
                ? ` (${
                    filter === 'completed'
                      ? transactionData?.completedCount
                      : filter === 'pending'
                      ? transactionData?.pendingCount
                      : transactionData?.failedCount
                  })`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.transactionsList}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E3192" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactionData.transactions?.length > 0 ? (
          <>
            {console.log('Rendering TransactionItems, count:', transactionData.transactions.length)}
            {console.log('Rendering TransactionItems: ', transactionData.transactions)}
            {transactionData.transactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                index={index}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={56} color="#CBD5E1" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>Try changing filters or check back later</Text>
            
          </View>
        )}
      </ScrollView>

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => {
            console.log('Prev page, currentPage:', currentPage);
            setCurrentPage((p) => Math.max(1, p - 1));
          }}
          disabled={currentPage === 1}
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
        >
          <Feather name="chevron-left" size={20} color={currentPage === 1 ? '#94A3B8' : '#1E293B'} />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Next page, currentPage:', currentPage, 'totalPages:', totalPages);
            setCurrentPage((p) => Math.min(totalPages, p + 1));
          }}
          disabled={currentPage === totalPages}
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
        >
          <Feather name="chevron-right" size={20} color={currentPage === totalPages ? '#94A3B8' : '#1E293B'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 36,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  revenueContainer: {
    marginBottom: 20,
  },
  revenueLabel: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 6,
  },
  revenueAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: 'white',
    opacity: 0.8,
    fontSize: 12,
    marginTop: 2,
  },
  metricValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  activeFilterTab: {
    backgroundColor: '#E0E7FF',
  },
  filterTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#4338CA',
    fontWeight: '600',
  },
  transactionsList: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.78)', // Temporary red background for debugging
  },
  contentContainer: {
    paddingBottom: 24,
    paddingTop: 8,
    flexGrow: 1,
    backgroundColor: 'rgba(0, 255, 0, 0.66)', // Temporary green background for debugging
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 255, 0.1)', // Temporary blue background for debugging
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    backgroundColor: 'rgba(255, 255, 0, 0.79)', // Temporary yellow background for debugging
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
    maxWidth: '80%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  paginationText: {
    marginHorizontal: 16,
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
  },
});

export { TransactionsPage };