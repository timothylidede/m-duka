import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SaleMetadata } from '../services/sales';

const TransactionItem = ({
  transaction,
  index,
  onStatusUpdate,
  onDelete,
}: {
  transaction: SaleMetadata;
  index: number;
  onStatusUpdate?: (id: string, newStatus: 'completed' | 'pending' | 'failed') => void;
  onDelete?: (id: string) => void;
}) => {
  console.log('Rendering TransactionItem with data:', JSON.stringify(transaction));

  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(transaction.totalPrice.toString());

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

  // Determine status based on productId
  const derivedStatus = transaction.lineItems?.[0]?.productId && transaction.lineItems[0].productId !== 'No product ID'
    ? 'completed'
    : 'pending';

  const displayStatus = transaction.status || derivedStatus;

  const handleStatusToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onStatusUpdate) {
      const nextStatus =
        displayStatus === 'pending'
          ? 'completed'
          : displayStatus === 'completed'
          ? 'failed'
          : 'pending';
      onStatusUpdate(transaction.id, nextStatus);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onDelete) {
      onDelete(transaction.id);
    }
  };

  const handleEditToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save edited amount
      const newTotalPrice = parseFloat(editedAmount) || transaction.totalPrice;
      // Update Firestore or trigger an update function if provided
      if (onStatusUpdate) {
        onStatusUpdate(transaction.id, displayStatus); // Trigger refresh with current status
      }
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>Transaction #{transaction.id.slice(-6)}</Text>
        <Text style={[styles.status, { color: statusColors[displayStatus as keyof typeof statusColors] || '#94A3B8' }]}>
          {statusNames[displayStatus as keyof typeof statusNames] || 'Unknown'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Amount:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editedAmount}
            onChangeText={setEditedAmount}
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.value}>KES {transaction.totalPrice.toLocaleString()}</Text>
        )}
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>
          {new Date(transaction.timestamp).toLocaleDateString()} {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Payment:</Text>
        <Text style={styles.value}>{transaction.paymentMethod || 'Cash'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Items:</Text>
        <Text style={styles.value}>
          {transaction.lineItems?.[0]?.productId && transaction.lineItems[0].productId !== 'No product ID'
            ? `${transaction.lineItems[0].productId} (x${transaction.lineItems[0].quantity})`
            : 'No items'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleEditToggle} style={styles.actionButton}>
          <Feather name={isEditing ? "check" : "edit-2"} size={16} color="#4338CA" />
          <Text style={styles.actionText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleStatusToggle} style={styles.actionButton}>
          <Feather name="refresh-cw" size={16} color="#4338CA" />
          <Text style={styles.actionText}>Change Status</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Feather name="trash-2" size={16} color="#EF4444" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  id: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
  },
  value: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 4,
    fontSize: 14,
    color: '#1E293B',
    width: 100,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
});

export default TransactionItem;