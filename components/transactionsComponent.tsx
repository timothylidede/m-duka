import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SaleMetadata } from '../services/sales';

const TransactionItem = ({
  transaction,
  index,
  onStatusUpdate,
}: {
  transaction: SaleMetadata;
  index: number;
  onStatusUpdate?: (id: string, newStatus: 'completed' | 'pending' | 'failed') => void;
}) => {
  console.log('Rendering TransactionItem:', {
    id: transaction.id,
    status: transaction.status,
    totalPrice: transaction.totalPrice,
    lineItems: transaction.lineItems,
    paymentMethod: transaction.paymentMethod,
    timestamp: transaction.timestamp,
  });

  const statusColors = {
    completed: '#10B981',
    pending: '#F59E0B',
    failed: '#EF4444',
  };

  const statusNames = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
  };

  const handleStatusToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onStatusUpdate) {
      const nextStatus =
        transaction.status === 'pending'
          ? 'completed'
          : transaction.status === 'completed'
          ? 'failed'
          : 'pending';
      onStatusUpdate(transaction.id, nextStatus);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[styles.transactionCard, { backgroundColor: 'rgba(255, 0, 255, 0.1)' }]} // Temporary magenta for debugging
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.idContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: statusColors[transaction.status as keyof typeof statusColors] || '#94A3B8' },
            ]}
          >
            <Text style={styles.statusText}>
              {statusNames[transaction.status as keyof typeof statusNames] || 'Unknown'}
            </Text>
          </View>
          <Text style={styles.transactionId}>#{transaction.id.slice(-6)}</Text>
        </View>
        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={14} color="#64748B" style={styles.iconSpacing} />
          <Text style={styles.timeText}>
            {new Date(transaction.timestamp).toLocaleDateString()} •{' '}
            {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsContainer}>
        {Array.isArray(transaction.lineItems) && transaction.lineItems.length > 0 ? (
          transaction.lineItems.map((item, idx) => (
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
          ))
        ) : (
          <Text style={styles.noItemsText}>No items</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.paymentMethodContainer}>
            <Feather
              name={transaction.paymentMethod === 'card' ? 'credit-card' : 'smartphone'}
              size={16}
              color="#64748B"
            />
            <Text style={styles.paymentMethodText}>
              {transaction.paymentMethod || 'Unknown'}
            </Text>
          </View>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            KES {(transaction.totalPrice || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Status Update Button */}
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

const styles = StyleSheet.create({
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16, // Ensure padding for visibility
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    overflow: 'visible',
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
  statusToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#4338CA',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  statusToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  noItemsText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
});

export default TransactionItem;