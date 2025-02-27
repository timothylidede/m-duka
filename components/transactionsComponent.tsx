import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, FlatList, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { SaleMetadata, useSalesService } from '../services/sales';
import { useInventoryService, InventoryItem } from '../services/inventory';

// Debounce utility function
const debounce = (func: (name: string) => Promise<void>, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (name: string) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(name), wait);
  };
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(transaction.totalPrice.toString());
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [productNameInput, setProductNameInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [matchingProducts, setMatchingProducts] = useState<InventoryItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod || 'Cash');
  const [currentLineItems, setCurrentLineItems] = useState(transaction.lineItems || []);

  const inventoryService = useInventoryService();
  const salesService = useSalesService();

  const statusColors = {
    completed: '#10B981',
    pending: '#F59E0B',
    failed: '#EF4444',
  };

  const statusBackgrounds = {
    completed: '#ECFDF5',
    pending: '#FEF3C7',
    failed: '#FEE2E2',
  };

  const statusNames = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
  };

  const derivedStatus = currentLineItems && currentLineItems.length > 0 && currentLineItems.every(item => item.productId !== 'No product ID')
    ? 'completed'
    : 'pending';
  const displayStatus = transaction.status || derivedStatus;

  const paymentOptions = ['Cash', 'M-Pesa'];

  // Debounced fetch function
  const fetchMatchingProducts = debounce(async (name) => {
    if (name.length > 1) {
      try {
        const inventory = await inventoryService.getAllInventory();
        const filtered = inventory.items.filter(item =>
          item.productName.toLowerCase().includes(name.toLowerCase())
        );
        setMatchingProducts(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (error) {
        console.error('Error fetching matching products:', error);
      }
    } else {
      setMatchingProducts([]);
      setShowDropdown(false);
    }
  }, 300);

  useEffect(() => {
    fetchMatchingProducts(productNameInput);
  }, [productNameInput]);

  useEffect(() => {
    if (isAddingItem) {
      fetchInventoryItems();
    }
  }, [isAddingItem]);

  // Sync local state with transaction prop
  useEffect(() => {
    setCurrentLineItems(transaction.lineItems || []);
    setEditedAmount(transaction.totalPrice.toString());
    setPaymentMethod(transaction.paymentMethod || 'Cash');
  }, [transaction]);

  const fetchInventoryItems = async () => {
    try {
      const inventory = await inventoryService.getAllInventory();
      setInventoryItems(inventory.items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const handleEditToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isEditing) {
      // Save changes (only totalPrice and paymentMethod, date is not editable)
      const newTotalPrice = parseFloat(editedAmount) || transaction.totalPrice;
      const calculatedTotalPrice = currentLineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const newStatus = Math.abs(newTotalPrice - calculatedTotalPrice) < 0.001 ? 'completed' : 'failed';

      try {
        await salesService.updateTransaction(transaction.id, {
          totalPrice: newTotalPrice,
          paymentMethod: paymentMethod,
          status: newStatus,
          lineItems: currentLineItems,
        });
        
        if (onStatusUpdate) {
          onStatusUpdate(transaction.id, newStatus);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Error updating transaction:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onDelete) {
      onDelete(transaction.id);
    }
  };

  const selectProduct = (product: InventoryItem) => {
    setSelectedProduct(product);
    setProductNameInput(product.productName);
    setShowDropdown(false);
  };

  const resetAddItemForm = () => {
    setSelectedProduct(null);
    setProductNameInput('');
    setQuantity('');
  };

  const updateInventoryStock = async (productId: string, quantityChange: number) => {
    try {
      const inventoryItem = await inventoryService.getInventoryItem(productId);
      if (inventoryItem) {
        const newStockAmount = Math.max(0, inventoryItem.stockAmount + quantityChange); // Prevent negative stock
        await inventoryService.updateInventoryItem(productId, { stockAmount: newStockAmount });
      }
    } catch (error) {
      console.error(`Error updating inventory stock for ${productId}:`, error);
      throw error;
    }
  };

  const handleAddItemSave = async () => {
    if (!selectedProduct || !quantity) {
      Alert.alert('Invalid Input', 'Please select a product and enter a quantity.');
      return;
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Quantity must be a positive number.');
      return;
    }

    const newLineItem = {
      productId: selectedProduct.productName.charAt(0).toUpperCase() + selectedProduct.productName.slice(1),
      price: selectedProduct.unitPrice,
      quantity: parsedQuantity,
    };

    const updatedLineItems = [...currentLineItems, newLineItem];
    const calculatedTotalPrice = updatedLineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newStatus = Math.abs(calculatedTotalPrice - transaction.totalPrice) < 0.001 ? 'completed' : 'failed';

    try {
      // Update inventory: decrease stock by the added quantity
      await updateInventoryStock(selectedProduct.productId, -parsedQuantity);

      // Update transaction in Firestore
      await salesService.updateTransaction(transaction.id, {
        lineItems: updatedLineItems,
        status: newStatus,
      });

      // Update local state
      setCurrentLineItems(updatedLineItems);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Success',
        `Item added successfully!\n${newStatus === 'completed' ? 'Transaction marked as completed.' : 'Transaction marked as failed due to price mismatch.'}`,
        [
          { text: 'Add Another', onPress: resetAddItemForm, style: 'default' },
          { text: 'Close', onPress: () => setIsAddingItem(false), style: 'cancel' },
        ]
      );
      
      if (onStatusUpdate) {
        onStatusUpdate(transaction.id, newStatus);
      }
    } catch (error) {
      console.error('Error updating transaction or inventory:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRemoveItem = async (indexToRemove: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const itemToRemove = currentLineItems[indexToRemove];
    const updatedLineItems = currentLineItems.filter((_, idx) => idx !== indexToRemove);
    const calculatedTotalPrice = updatedLineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newStatus = updatedLineItems.length === 0 
      ? 'pending' 
      : Math.abs(calculatedTotalPrice - transaction.totalPrice) < 0.001 
        ? 'completed' 
        : 'failed';

    try {
      // Update inventory: increase stock by the removed quantity
      const productId = generateProductId(itemToRemove.productId);
      await updateInventoryStock(productId, itemToRemove.quantity);

      // Update transaction in Firestore
      await salesService.updateTransaction(transaction.id, {
        lineItems: updatedLineItems,
        status: newStatus,
      });

      // Update local state
      setCurrentLineItems(updatedLineItems);

      if (onStatusUpdate) {
        onStatusUpdate(transaction.id, newStatus);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error updating transaction or inventory:', error);
      Alert.alert('Error', 'Failed to remove item. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const formatProductId = (productId: string) => {
    if (!productId || productId === 'No product ID') return 'No product';
    return productId.charAt(0).toUpperCase() + productId.slice(1);
  };

  // Helper to match productId from lineItems to inventory productId
  const generateProductId = (productName: string): string => {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[
        styles.card,
        { borderLeftWidth: 4, borderLeftColor: statusColors[displayStatus] || '#94A3B8' },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.id}>Transaction #{transaction.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBackgrounds[displayStatus] || '#F1F5F9' }]}>
          <Text style={[styles.status, { color: statusColors[displayStatus] || '#94A3B8' }]}>
            {statusNames[displayStatus] || 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>Items:</Text>
        <View style={styles.itemsList}>
          {currentLineItems && currentLineItems.length > 0 && currentLineItems.some(item => item.productId !== 'No product ID') ? (
            currentLineItems
              .filter(item => item.productId !== 'No product ID')
              .map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemNameContainer}>
                    <Text style={styles.itemName}>{formatProductId(item.productId)}</Text>
                    {isEditing && (
                      <TouchableOpacity 
                        onPress={() => handleRemoveItem(idx)}
                        style={styles.removeItemButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="x-circle" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemPrice}>KES {item.price.toLocaleString()} x </Text>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                    <Text style={styles.itemTotal}> = KES {(item.price * item.quantity).toLocaleString()}</Text>
                  </View>
                </View>
              ))
          ) : (
            <Text style={styles.noItems}>No items added yet</Text>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
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
          {isEditing ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={paymentMethod}
                onValueChange={setPaymentMethod}
                style={styles.picker}
                dropdownIconColor="#2E3192"
              >
                {paymentOptions.map((option, idx) => (
                  <Picker.Item key={idx} label={option} value={option} color="#1E293B" />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.value}>{paymentMethod}</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleEditToggle} style={styles.actionButton}>
          <Feather name={isEditing ? "check" : "edit-2"} size={16} color="#4338CA" />
          <Text style={styles.actionText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsAddingItem(true)} style={[styles.actionButton, styles.addItemsButton]}>
          <Feather name="plus-circle" size={16} color="#10B981" />
          <Text style={[styles.actionText, styles.addItemsText]}>Add Items</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Feather name="trash-2" size={16} color="#EF4444" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isAddingItem} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#2E3192", "#1BFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              onPress={() => setIsAddingItem(false)}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Add Item to Transaction</Text>
          </LinearGradient>
          
          <View style={styles.modalContent}>
            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Product Name</Text>
                <View style={styles.dropdownWrapper}>
                  <TextInput
                    style={styles.input}
                    value={productNameInput}
                    onChangeText={setProductNameInput}
                    placeholder="Enter or select product name"
                    placeholderTextColor="#94A3B8"
                  />
                  {showDropdown && (
                    <View style={styles.dropdownContainer}>
                      <FlatList
                        data={matchingProducts}
                        keyExtractor={(item) => item.productId}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => selectProduct(item)}
                          >
                            <Text style={styles.dropdownItemText}>{item.productName}</Text>
                          </TouchableOpacity>
                        )}
                        style={styles.dropdown}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={<Text style={styles.noItems}>No products available</Text>}
                      />
                    </View>
                  )}
                </View>
                {selectedProduct && (
                  <Text style={styles.selectedProduct}>Selected: {selectedProduct.productName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Price (KES)</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.currencySymbol}>KES</Text>
                  <TextInput
                    style={[styles.input, styles.priceTextInput]}
                    value={selectedProduct ? selectedProduct.unitPrice.toString() : ''}
                    editable={false}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  placeholderTextColor="#94A3B8"
                  editable={!!selectedProduct} // Only editable if a product is selected
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddItemSave}>
                <LinearGradient
                  colors={["#2E3192", "#1BFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Feather name="check-circle" size={24} color="white" />
                  <Text style={styles.submitButtonText}>Save Item</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddingItem(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  id: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  removeItemButton: {
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#64748B',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  noItems: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  addItemsButton: {
    backgroundColor: '#ECFDF5',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  addItemsText: {
    color: '#10B981',
  },
  deleteText: {
    color: '#EF4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    height: 100,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 24,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalForm: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dropdown: {
    maxHeight: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
  },
  selectedProduct: {
    marginTop: 8,
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
  },
  currencySymbol: {
    paddingLeft: 16,
    fontSize: 16,
    color: "#64748B",
  },
  priceTextInput: {
    flex: 1,
    borderWidth: 0,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    width: 120,
    overflow: "hidden",
    height: 40,
    justifyContent: 'center',
  },
  picker: {
    width: "100%",
    color: "#1E293B",
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#E2E8F0",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TransactionItem;