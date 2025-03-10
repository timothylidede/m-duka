import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { triggerSimpleAndroidVibration } from '@/components/androidVibrate';
import { RelativePathString, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSalesService } from '../../services/sales';
import { useInventoryService, InventoryItem } from '../../services/inventory';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const SalesTrackerPage: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newSale, setNewSale] = useState({
    productName: '',
    quantity: '',
    amount: 0,
  });
  const [productSuggestions, setProductSuggestions] = useState<InventoryItem[]>([]);
  const [salesData, setSalesData] = useState<{
    daily: { totalRevenue: number; salesCount: number; average: number };
    weekly: { totalRevenue: number; salesCount: number; average: number };
    monthly: { totalRevenue: number; salesCount: number; average: number };
  }>({
    daily: { totalRevenue: 0, salesCount: 0, average: 0 },
    weekly: { totalRevenue: 0, salesCount: 0, average: 0 },
    monthly: { totalRevenue: 0, salesCount: 0, average: 0 },
  });

  const router = useRouter();
  const salesService = useSalesService();
  const inventoryService = useInventoryService();
  const { shopData, isInitialized } = useContext(AuthContext);

  useEffect(() => {
    if (!isInitialized || !shopData) return;

    const fetchData = async () => {
      try {
        const [dailyData, weeklyData, monthlyData] = await Promise.all([
          salesService.getTodaysSalesData(),
          salesService.getWeeklySalesData(),
          salesService.getMonthlySalesData(),
        ]);

        setSalesData({
          daily: {
            totalRevenue: dailyData.totalRevenue,
            salesCount: dailyData.salesCount,
            average: dailyData.salesCount ? dailyData.totalRevenue / dailyData.salesCount : 0,
          },
          weekly: {
            totalRevenue: weeklyData.totalRevenue,
            salesCount: weeklyData.salesCount,
            average: weeklyData.salesCount ? weeklyData.totalRevenue / weeklyData.salesCount : 0,
          },
          monthly: {
            totalRevenue: monthlyData.totalRevenue,
            salesCount: monthlyData.salesCount,
            average: monthlyData.salesCount ? monthlyData.totalRevenue / monthlyData.salesCount : 0,
          },
        });
      } catch (error) {
        console.error('Error fetching sales data:', error);
        Alert.alert('Error', 'Failed to load sales data');
      }
    };

    fetchData();
  }, [isInitialized, shopData, salesService]);

  const routeInventoryQuickAction = (nextPagePath: RelativePathString) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(nextPagePath);
  };

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

  const selectProduct = (item: InventoryItem) => {
    setNewSale({
      ...newSale,
      productName: item.productName,
      amount: item.unitPrice,
    });
    setProductSuggestions([]);
  };

  const handleAddSale = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerSimpleAndroidVibration();
  
    if (!newSale.productName || !newSale.quantity) {
      Alert.alert('Missing Information', 'Please fill all required fields');
      return;
    }
  
    const quantity = parseInt(newSale.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }
  
    try {
      setIsSaving(true);
      
      // Fetch the selected product's inventory data
      const inventoryData = await inventoryService.getAllInventory();
      const selectedProduct = inventoryData.items.find(
        item => item.productName === newSale.productName
      );
  
      if (!selectedProduct) {
        Alert.alert('Error', 'Selected product not found in inventory');
        setIsSaving(false);
        return;
      }
  
      const availableStock = selectedProduct.stockAmount;
  
      // Check if product is out of stock or quantity exceeds available stock
      if (availableStock === 0) {
        Alert.alert('Out of Stock', `${newSale.productName} is currently out of stock.`);
        setIsSaving(false);
        return;
      }
      if (quantity > availableStock) {
        Alert.alert(
          'Insufficient Stock',
          `Only ${availableStock} units of ${newSale.productName} are available. You requested ${quantity}.`
        );
        setIsSaving(false);
        return;
      }
  
      // Construct the sale input object
      const saleInput = {
        productName: newSale.productName,
        quantity: quantity, // Already parsed to number
        unitPrice: newSale.amount, // Unit price from selected product
      };
      await salesService.addNewSale(saleInput);
  
      // Fetch updated sales data
      const [dailyData, weeklyData, monthlyData] = await Promise.all([
        salesService.getTodaysSalesData(),
        salesService.getWeeklySalesData(),
        salesService.getMonthlySalesData(),
      ]);
  
      setSalesData({
        daily: {
          totalRevenue: dailyData.totalRevenue,
          salesCount: dailyData.salesCount,
          average: dailyData.salesCount ? dailyData.totalRevenue / dailyData.salesCount : 0,
        },
        weekly: {
          totalRevenue: weeklyData.totalRevenue,
          salesCount: weeklyData.salesCount,
          average: weeklyData.salesCount ? weeklyData.totalRevenue / weeklyData.salesCount : 0,
        },
        monthly: {
          totalRevenue: monthlyData.totalRevenue,
          salesCount: monthlyData.salesCount,
          average: monthlyData.salesCount ? monthlyData.totalRevenue / monthlyData.salesCount : 0,
        },
      });
  
      // Show success dialog
      Alert.alert(
        'Success',
        'Sale recorded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setNewSale({ productName: '', quantity: '', amount: 0 });
              setModalVisible(false);
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error adding sale:', error);
      Alert.alert('Error', 'Failed to add sale');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeFrameChange = (newTimeFrame: 'daily' | 'weekly' | 'monthly') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeFrame(newTimeFrame);
  };

  const openAddSaleModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  if (!isInitialized || !shopData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Welcome, ${shopData?.name || '!'}`,
          headerStyle: { backgroundColor: "#2E3192" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={["#2E3192", "#1BFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.timeFrameSelector}>
                <TouchableOpacity
                  style={[styles.timeFrameButton, timeFrame === 'daily' && styles.activeTimeFrame]}
                  onPress={() => handleTimeFrameChange('daily')}
                >
                  <Text style={[styles.timeFrameText, timeFrame === 'daily' && styles.activeTimeFrameText]}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeFrameButton, timeFrame === 'weekly' && styles.activeTimeFrame]}
                  onPress={() => handleTimeFrameChange('weekly')}
                >
                  <Text style={[styles.timeFrameText, timeFrame === 'weekly' && styles.activeTimeFrameText]}>Weekly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeFrameButton, timeFrame === 'monthly' && styles.activeTimeFrame]}
                  onPress={() => handleTimeFrameChange('monthly')}
                >
                  <Text style={[styles.timeFrameText, timeFrame === 'monthly' && styles.activeTimeFrameText]}>Monthly</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="zap" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Quick Actions</Text>
              </View>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={[styles.quickActionButton, styles.highlightedAction]}
                  onPress={openAddSaleModal}
                >
                  <View style={[styles.quickActionIcon, styles.highlightedActionIcon]}>
                    <Feather name="plus-circle" size={24} color="white" />
                  </View>
                  <Text style={[styles.quickActionText, styles.highlightedActionText]}>
                    Add New Sale
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => routeInventoryQuickAction('../transactions')}
                >
                  <View style={styles.quickActionIcon}>
                    <Feather name="list" size={24} color="#2E3192" />
                  </View>
                  <Text style={styles.quickActionText}>
                    View Recent Sales
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="bar-chart-2" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>
                  {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Sales Summary
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statsCard}>
                  <Feather name="dollar-sign" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    KES {salesData[timeFrame].totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.statsLabel}>Total Sales</Text>
                </View>
                <View style={styles.statsCard}>
                  <Feather name="shopping-cart" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    {salesData[timeFrame].salesCount}
                  </Text>
                  <Text style={styles.statsLabel}>Number of Sales</Text>
                </View>
                <View style={[styles.statsCard, styles.fullWidthCard]}>
                  <Feather name="trending-up" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    KES {salesData[timeFrame].average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.statsLabel}>Average Sale Value</Text>
                </View>
              </View>
            </View>

            <Text style={styles.lastUpdate}>
              Last updated: {new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add New Sale</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Feather name="x" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Product Name</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="package" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter product name"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        value={newSale.productName}
                        onChangeText={(text) => {
                          setNewSale({ ...newSale, productName: text });
                          fetchProductSuggestions(text);
                        }}
                      />
                    </View>
                    {productSuggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <ScrollView>
                          {productSuggestions.map((item) => (
                            <TouchableOpacity
                              key={item.productId}
                              style={styles.suggestionItem}
                              onPress={() => selectProduct(item)}
                            >
                              <Text>{item.productName}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="hash" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter quantity"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        keyboardType="numeric"
                        value={newSale.quantity}
                        onChangeText={(text) => setNewSale({ ...newSale, quantity: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Total Amount (KES)</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="dollar-sign" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={(newSale.amount * (parseInt(newSale.quantity) || 0)).toFixed(2)}
                        editable={false}
                      />
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleAddSale} 
                      disabled={isSaving}
                    >
                      <LinearGradient
                        colors={["#2E3192", "#1BFFFF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                      >
                        {isSaving ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Saving...</Text>
                          </View>
                        ) : (
                          <Text style={styles.saveButtonText}>Save Sale</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    alignItems: "center",
    marginVertical: 16,
  },
  timeFrameSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    padding: 4,
    width: "90%",
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 25,
  },
  activeTimeFrame: {
    backgroundColor: "#fff",
  },
  timeFrameText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  activeTimeFrameText: {
    color: "#2E3192",
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    color: "#1E293B",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  statsCard: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  fullWidthCard: {
    width: "100%",
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E3192",
    marginTop: 8,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  highlightedAction: {
    backgroundColor: "#2E3192",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(46, 49, 146, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  highlightedActionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  highlightedActionText: {
    color: "white",
  },
  lastUpdate: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginBottom: 60,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: width,
    alignSelf: 'stretch',
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    alignSelf: 'stretch',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  suggestionsContainer: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    width: '100%',
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  cancelButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SalesTrackerPage;