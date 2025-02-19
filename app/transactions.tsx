import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, RefreshControl, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
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
}) => {
  const statusColors = {
    completed: '#10B981',
    pending: '#F59E0B',
    failed: '#EF4444'
  };
  
  const statusNames = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed'
  };
  
  const handleStatusToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onStatusUpdate) {
      const nextStatus = 
        transaction.status === 'pending' ? 'completed' : 
        transaction.status === 'completed' ? 'failed' : 'pending';
      onStatusUpdate(transaction.id, nextStatus);
    }
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 60).springify()}
      style={styles.transactionCard}
    >
      <View style={styles.cardHeader}>
        <View style={styles.idContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColors[transaction.status as keyof typeof statusColors] || '#94A3B8' }]}>
            <Text style={styles.statusText}>{statusNames[transaction.status as keyof typeof statusNames] || 'Unknown'}</Text>
          </View>
          <Text style={styles.transactionId}>#{transaction.id.slice(-6)}</Text>
        </View>
        
        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={14} color="#64748B" style={styles.iconSpacing} />
          <Text style={styles.timeText}>
            {new Date(transaction.timestamp).toLocaleDateString()} • {new Date(transaction.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemsContainer}>
        {transaction.lineItems.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.productId || 'Product'}</Text>
              <View style={styles.itemMetrics}>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>×{item.quantity || 0}</Text>
                </View>
                <Text style={styles.itemPrice}>KES {item.price?.toLocaleString() || 0}/unit</Text>
              </View>
            </View>
            <Text style={styles.itemTotal}>
              KES {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.paymentMethodContainer}>
            <Feather 
              name={transaction.paymentMethod === 'card' ? 'credit-card' : 'smartphone'} 
              size={16} 
              color="#64748B" 
            />
            <Text style={styles.paymentMethodText}>{transaction.paymentMethod || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.footerRight}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            KES {transaction.totalPrice.toLocaleString() || '0'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        onPress={handleStatusToggle}
        style={styles.statusToggleButton}
        activeOpacity={0.7}
      >
        <Feather name="edit-2" size={16} color="#FFFFFF" />
        <Text style={styles.statusToggleText}>Change Status</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function TransactionsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [transactionData, setTransactionData] = useState<TransactionListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const salesService = useSalesService();

  const loadTransactions = async (filter: StatusFilter = 'all', page: number = 1) => {
    setIsLoading(true);
    try {
      const data = await salesService.getTransactions({
        status: filter === 'all' ? undefined : filter,
        limit: 100 // Get more than we need for pagination
      });
      
      if (data && data.transactions) {
        // Calculate total pages
        const totalPages = Math.ceil(data.transactions.length / itemsPerPage);
        setTotalPages(totalPages > 0 ? totalPages : 1);
        
        // Pagination logic
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedTransactions = {
          ...data,
          transactions: data.transactions.slice(startIndex, startIndex + itemsPerPage)
        };
        
        setTransactionData(paginatedTransactions);
      } else {
        setTransactionData(data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(activeFilter, currentPage);
  }, [activeFilter, currentPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions(activeFilter, 1).then(() => {
      setCurrentPage(1);
      setRefreshing(false);
    });
  }, [activeFilter]);

  const handleStatusUpdate = async (id: string, newStatus: 'completed' | 'pending' | 'failed') => {
    try {
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
    setCurrentPage(1); // Reset to first page on filter change
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      
      {/* Header Section */}
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
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
          >
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2E3192']}
            tintColor="#2E3192"
          />
        }
      >
        {/* Summary Card */}
        <LinearGradient
          colors={['#2E3192', '#1BFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.dateContainer}>
              <Feather name="activity" size={18} color="white" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString([], {month: 'long', day: 'numeric', year: 'numeric'})}
              </Text>
            </View>
          </View>
          
          <View style={styles.revenueContainer}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>
              KES {transactionData?.totalRevenue.toLocaleString() || "0"}
            </Text>
          </View>
          
          <View style={styles.metricsRow}>
            {transactionData && (
              <>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{transactionData.totalCount || 0}</Text>
                  <Text style={styles.metricLabel}>Transactions</Text>
                </View>
                
                <View style={styles.metricDivider} />
                
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{Math.round(transactionData.completionRate || 0)}%</Text>
                  <Text style={styles.metricLabel}>Completion Rate</Text>
                </View>
                
                <View style={styles.metricDivider} />
                
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>KES {Math.round(transactionData.averageTransactionValue || 0).toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Avg. Value</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabs}
          >
            {(['all', 'completed', 'pending', 'failed'] as StatusFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => handleFilterPress(filter)}
                style={[
                  styles.filterTab,
                  activeFilter === filter && styles.activeFilterTab
                ]}
              >
                {filter !== 'all' && (
                  <View style={[
                    styles.filterDot, 
                    { backgroundColor: 
                      filter === 'completed' ? '#10B981' : 
                      filter === 'pending' ? '#F59E0B' : '#EF4444' 
                    }
                  ]} />
                )}
                <Text 
                  style={[
                    styles.filterTabText,
                    activeFilter === filter && styles.activeFilterTabText
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && transactionData ? 
                    ` (${filter === 'completed' ? transactionData.completedCount : 
                       filter === 'pending' ? transactionData.pendingCount : 
                       transactionData.failedCount})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transaction List */}
        <View style={styles.transactionsList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E3192" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : transactionData === null || transactionData.transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={56} color="#CBD5E1" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>Try changing filters or check back later</Text>
            </View>
          ) : (
            <>
              {transactionData.transactions.map((transaction: SaleMetadata, index: number) => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction}
                  index={index}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
              
              {/* Pagination Controls */}
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={goToPrevPage}
                  disabled={currentPage <= 1}
                  style={[styles.paginationButton, currentPage <= 1 && styles.paginationButtonDisabled]}
                >
                  <Feather name="chevron-left" size={20} color={currentPage <= 1 ? "#94A3B8" : "#1E293B"} />
                </TouchableOpacity>
                
                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={goToNextPage}
                  disabled={currentPage >= totalPages}
                  style={[styles.paginationButton, currentPage >= totalPages && styles.paginationButtonDisabled]}
                >
                  <Feather name="chevron-right" size={20} color={currentPage >= totalPages ? "#94A3B8" : "#1E293B"} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 12,
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
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 36,
  },
  
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  
  // Summary Card Styles
  summaryCard: {
    marginTop: -12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
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
  
  // Filter Styles
  filterContainer: {
    marginBottom: 8,
  },
  filterTabs: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#E0E7FF',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
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
  
  // Transaction List Styles
  transactionsList: {
    paddingHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    letterSpacing: 0.2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#64748B',
    fontSize: 13,
  },
  iconSpacing: {
    marginRight: 5,
  },
  
  // Item List Styles
  itemsContainer: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    marginBottom: 6,
  },
  itemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  quantityText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
  },
  itemPrice: {
    color: '#64748B',
    fontSize: 13,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  
  // Card Footer Styles
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLeft: {
    flex: 1,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    marginLeft: 8,
    color: '#64748B',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  
  // Status Toggle Button
  statusToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#4338CA',
  },
  statusToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Loading & Empty States
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 12,
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
    maxWidth: '80%',
  },
  
  // Pagination Controls
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
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
  paginationInfo: {
    marginHorizontal: 16,
  },
  paginationText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Misc
  bottomSpacing: {
    height: 32,
  },
});