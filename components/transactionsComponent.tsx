import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SaleMetadata, useSalesService } from '../services/sales';
import { useInventoryService, InventoryItem } from '../services/inventory';
import { LinearGradient } from 'expo-linear-gradient';

const TransactionItem = ({
  transaction,
  index,
  onDelete,
}: {
  transaction: SaleMetadata;
  index: number;
  onDelete?: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editedProductName, setEditedProductName] = useState(transaction.productName);
  const [editedQuantity, setEditedQuantity] = useState(transaction.quantity.toString());
  const [productSuggestions, setProductSuggestions] = useState<InventoryItem[]>([]);
  const salesService = useSalesService();
  const inventoryService = useInventoryService();

  // Fetch product suggestions based on input
  const fetchProductSuggestions = async (input: string) => {
    if (input.length < 1) {
      setProductSuggestions([]);
      return;
    }
    try {
      const inventoryData = await inventoryService.getAllInventory();
      const filtered = inventoryData.items.filter(item =>
        item.productName.toLowerCase().includes(input.toLowerCase())
      );
      setProductSuggestions(filtered);
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
    }
  };

  const handleEditToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isEditing) {
      const quantity = parseInt(editedQuantity) || 1;

      if (quantity <= 0) {
        Alert.alert("Invalid Quantity", "Quantity must be at least 1.");
        return;
      }

      try {
        await salesService.updateTransaction(transaction.id, {
          productName: editedProductName,
          quantity,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowActions(false);
      } catch (error) {
        console.error('Error updating transaction:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    setIsEditing(!isEditing);
    setProductSuggestions([]);
  };

  const confirmDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            if (onDelete) {
              onDelete(transaction.id);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleQuantityChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setEditedQuantity(cleanText === '' ? '' : cleanText);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: Date) => {
    return timestamp.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActions(!showActions);
    // If we're closing the actions and were in edit mode, cancel edit mode
    if (showActions && isEditing) {
      setIsEditing(false);
      setEditedProductName(transaction.productName);
      setEditedQuantity(transaction.quantity.toString());
      setProductSuggestions([]);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(14)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>#{transaction.id.slice(-6)}</Text>
          </View>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.timestamp}>{formatDate(transaction.timestamp)}</Text>
          <TouchableOpacity onPress={toggleActions} style={styles.editToggleButton}>
            <Feather name={showActions ? "x" : "edit-3"} size={16} color="#2E3192" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.labelContainer}>
            <Feather name="package" size={14} color="#2E3192" style={styles.labelIcon} />
            <Text style={styles.label}>Product</Text>
          </View>
          {isEditing ? (
            <View style={styles.inputWithSuggestions}>
              <Animated.View entering={FadeIn}>
                <TextInput
                  style={styles.input}
                  value={editedProductName}
                  onChangeText={(text) => {
                    setEditedProductName(text);
                    fetchProductSuggestions(text);
                  }}
                  placeholder="Product Name"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </Animated.View>
              {productSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView>
                    {productSuggestions.map((item) => (
                      <TouchableOpacity
                        key={item.productId}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setEditedProductName(item.productName);
                          setProductSuggestions([]);
                        }}
                      >
                        <Text style={styles.suggestionText}>{item.productName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
              {transaction.productName}
            </Text>
          )}
        </View>

        <View style={styles.detailRow}>
          <View style={styles.labelContainer}>
            <Feather name="hash" size={14} color="#2E3192" style={styles.labelIcon} />
            <Text style={styles.label}>Quantity</Text>
          </View>
          {isEditing ? (
            <Animated.View entering={FadeIn} style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={editedQuantity}
                onChangeText={handleQuantityChange}
                keyboardType="numeric"
                placeholder="Quantity"
                placeholderTextColor="#9CA3AF"
              />
            </Animated.View>
          ) : (
            <Text style={styles.value}>{transaction.quantity}</Text>
          )}
        </View>

        <View style={styles.detailRow}>
          <View style={styles.labelContainer}>
            <Feather name="tag" size={14} color="#2E3192" style={styles.labelIcon} />
            <Text style={styles.label}>Unit Price</Text>
          </View>
          <Text style={styles.value}>{formatCurrency(transaction.unitPrice)}</Text>
        </View>

        <View style={[styles.detailRow, styles.totalRow]}>
          <View style={styles.labelContainer}>
            <Feather name="dollar-sign" size={14} color="#2E3192" style={styles.labelIcon} />
            <Text style={styles.totalLabel}>Total</Text>
          </View>
          <Text style={styles.totalValue}>
            {formatCurrency(
              isEditing
                ? (parseInt(editedQuantity) || 0) * transaction.unitPrice
                : transaction.totalPrice
            )}
          </Text>
        </View>
      </View>

      {showActions && (
        <Animated.View
          entering={FadeIn}
          style={styles.actions}
        >
          {isEditing ? (
            <>
              <TouchableOpacity onPress={handleEditToggle} style={styles.actionButtonGradient}>
                <LinearGradient
                  colors={['#2E3192', '#1BFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.saveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setEditedProductName(transaction.productName);
                  setEditedQuantity(transaction.quantity.toString());
                  setProductSuggestions([]);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.actionButton}
              >
                <Feather name="x" size={16} color="#64748B" />
                <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleEditToggle} style={styles.actionButton}>
                <Feather name="edit-2" size={16} color="#2E3192" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmDelete} style={styles.actionButton}>
                <Feather name="trash-2" size={16} color="#EF4444" />
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Completed styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E3192',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputContainer: {
    width: '60%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    maxWidth: '60%',
  },
  totalValue: {
    fontSize: 16,
    color: '#2E3192',
    fontWeight: '700',
  },
  inputWithSuggestions: {
    width: '60%',
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F1F5F9',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  suggestionText: {
    color: '#1E293B',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonGradient: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E3192',
  },
  saveText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    color: '#64748B',
  },
  deleteText: {
    color: '#EF4444',
  },
});

export default TransactionItem;