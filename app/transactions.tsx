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

  const loadTransactions = async (filter: StatusFilter = 'all', page: number = 1) => {
    setIsLoading(true);
    console.log(`Fetching transactions for filter: ${filter}, page: ${page}`);

    try {
      const data = await salesService.getTransactions({
        status: filter === 'all' ? 'all' : filter,
        limit: 100,
      });

      console.log('Fetched Transactions Data:', data);

      if (data && data.transactions) {
        const totalPagesCalc = Math.ceil(data.transactions.length / itemsPerPage);
        setTotalPages(totalPagesCalc > 0 ? totalPagesCalc : 1);

        const startIndex = (page - 1) * itemsPerPage;
        const paginatedTransactions = data.transactions.slice(startIndex, startIndex + itemsPerPage);

        setTransactionData({
          ...data,
          transactions: paginatedTransactions,
        });

        console.log('Paginated Transactions:', paginatedTransactions);
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
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('Refreshing transactions...');
    loadTransactions(activeFilter, 1).then(() => {
      setCurrentPage(1);
      setRefreshing(false);
    });
  }, [activeFilter]);

  const handleStatusUpdate = async (id: string, newStatus: 'completed' | 'pending' | 'failed') => {
    try {
      console.log(`Updating transaction ${id} to ${newStatus}`);
      const success = await salesService.updateTransactionStatus(id, newStatus);
      if (success) {
        loadTransactions(activeFilter, currentPage);
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
    setCurrentPage(1);
    loadTransactions(filter, 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E3192', '#1BFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        {['all', 'completed', 'pending', 'failed'].map((filter) => (
          <TouchableOpacity key={filter} onPress={() => handleFilterPress(filter as StatusFilter)} style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}>
            <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={styles.transactionsList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E3192" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactionData.transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={56} color="#CBD5E1" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          transactionData.transactions.map((transaction, index) => {
            console.log('Rendering Transaction:', transaction);
            return <TransactionItem key={transaction.id} transaction={transaction} index={index} onStatusUpdate={handleStatusUpdate} />;
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  headerRight: { width: 36 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FAFC' },
  filterTab: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderRadius: 24, backgroundColor: '#F1F5F9' },
  activeFilterTab: { backgroundColor: '#E0E7FF' },
  filterTabText: { fontSize: 14, fontWeight: '500', color: '#475569' },  
  activeFilterTabText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },  
  transactionsList: { flex: 1 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  emptyContainer: { padding: 48, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#334155', marginBottom: 8 },
});

export { TransactionsPage };
