import React, { useState } from 'react';
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
} from 'react-native';

import * as Haptics from "expo-haptics";
import { RelativePathString,Stack, useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from "@expo/vector-icons";
import { AuthContext } from '@/context/AuthContext';
// import * as Haptics from "expo-haptics";

// Define types for our data structures
interface SalesStats {
  total: number;
  count: number;
  average: number;
}

interface SalesDataType {
  daily: SalesStats;
  weekly: SalesStats;
  monthly: SalesStats;
}

interface NewSaleType {
  amount: string;
  product: string;
  customer: string;
  date: string;
}

type TimeFrameType = 'daily' | 'weekly' | 'monthly';

const { width } = Dimensions.get('window');

const SalesTrackerPage: React.FC = () => {
  // State management with proper typing
  const [timeFrame, setTimeFrame] = useState<TimeFrameType>('daily');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newSale, setNewSale] = useState<NewSaleType>({
    amount: '',
    product: '',
    customer: '',
    date: new Date().toISOString().split('T')[0]
  });
  const {shopData} = React.useContext(AuthContext);
  
  // Sample data - would normally come from API or storage
  const [salesData, setSalesData] = useState<SalesDataType>({
    daily: { total: 1250, count: 15, average: 83.33 },
    weekly: { total: 8750, count: 87, average: 100.57 },
    monthly: { total: 35400, count: 312, average: 113.46 }
  });

//   const navigation = useNavigation();
const router = useRouter();
const routeInventoryQuickAction = (nextPagePath: RelativePathString) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(nextPagePath);
};
  
  // Add new sale function
  const handleAddSale = (): void => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Validation
    if (!newSale.amount || !newSale.product || !newSale.customer) {
      Alert.alert('Missing Information', 'Please fill all required fields');
      return;
    }
    
    // In a real app, you would update your database here
    // For demo purposes, we'll just update the salesData state
    const amount = parseFloat(newSale.amount);
    
    if (isNaN(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      return;
    }
    
    const updatedSalesData: SalesDataType = { ...salesData };
    
    // Update all timeframes (simplified for demo)
    (['daily', 'weekly', 'monthly'] as TimeFrameType[]).forEach(period => {
      const currentData = updatedSalesData[period];
      currentData.total += amount;
      currentData.count += 1;
      currentData.average = currentData.total / currentData.count;
    });
    
    setSalesData(updatedSalesData);
    setNewSale({
      amount: '',
      product: '',
      customer: '',
      date: new Date().toISOString().split('T')[0]
    });
    setModalVisible(false);
  };
  
  // Handle time frame selection
  const handleTimeFrameChange = (newTimeFrame: TimeFrameType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeFrame(newTimeFrame);
  };

  // Open modal with haptic feedback
  const openAddSaleModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: `Welcome, ${shopData?.name || 'Shopkeeper'}`,
          headerStyle: {
            backgroundColor: "#2E3192",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
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
              {/* <View style={styles.iconContainer}>
                <Feather name="dollar-sign" size={32} color="white" />
              </View>
              <Text style={styles.headerTitle}>Sales Dashboard</Text> */}
              
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

            
            {/* Quick Actions Section */}
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
                {/*the touch opaity navigate to transactions page */}
                <TouchableOpacity style={styles.quickActionButton} onPress={() => routeInventoryQuickAction("../transactions")}>
                  <View style={styles.quickActionIcon}>
                    <Feather name="list" size={24} color="#2E3192" />
                  </View>
                  <Text style={styles.quickActionText}>
                    View Recent Sales
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionButton}>
                  <View style={styles.quickActionIcon}>
                    <Feather name="users" size={24} color="#2E3192" />
                  </View>
                  <Text style={styles.quickActionText}>
                    Customer Analysis
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionButton}>
                  <View style={styles.quickActionIcon}>
                    <Feather name="pie-chart" size={24} color="#2E3192" />
                  </View>
                  <Text style={styles.quickActionText}>
                    Sales Reports
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

                        {/* Sales Summary Section */}
                        <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="bar-chart-2" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>
                  Here is your {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Sales Summary
                </Text>
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statsCard}>
                  <Feather name="dollar-sign" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    ${salesData[timeFrame].total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Text>
                  <Text style={styles.statsLabel}>Total Sales</Text>
                </View>
                
                <View style={styles.statsCard}>
                  <Feather name="shopping-cart" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    {salesData[timeFrame].count}
                  </Text>
                  <Text style={styles.statsLabel}>Number of Sales</Text>
                </View>
                
                <View style={[styles.statsCard, styles.fullWidthCard]}>
                  <Feather name="trending-up" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    ${salesData[timeFrame].average.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Text>
                  <Text style={styles.statsLabel}>Average Sale Value</Text>
                </View>
              </View>
            </View>
            
            {/* Top Performers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="award" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Top Performers</Text>
              </View>
              
              <View style={styles.performanceRow}>
                <View style={styles.performanceIcon}>
                  <Feather name="package" size={20} color="#64748B" />
                </View>
                <View style={styles.performanceContent}>
                  <Text style={styles.performanceLabel}>Top Product</Text>
                  <Text style={styles.performanceValue}>Watermelon Juice (500ml)</Text>
                  <Text style={styles.performanceSubtext}>$420 in sales this {timeFrame.replace('ly', '')}</Text>
                </View>
              </View>
              
              <View style={styles.performanceRow}>
                <View style={styles.performanceIcon}>
                  <Feather name="user" size={20} color="#64748B" />
                </View>
                <View style={styles.performanceContent}>
                  <Text style={styles.performanceLabel}>Top Customer</Text>
                  <Text style={styles.performanceValue}>John Muthaiga</Text>
                  <Text style={styles.performanceSubtext}>5 purchases this {timeFrame.replace('ly', '')}</Text>
                </View>
              </View>
              
              <View style={styles.performanceRow}>
                <View style={styles.performanceIcon}>
                  <Feather name="clock" size={20} color="#64748B" />
                </View>
                <View style={styles.performanceContent}>
                  <Text style={styles.performanceLabel}>Best Selling Time</Text>
                  <Text style={styles.performanceValue}>2:00 PM - 4:00 PM</Text>
                  <Text style={styles.performanceSubtext}>32% of {timeFrame} sales</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.lastUpdate}>
              Last updated: Today, 2:30 PM
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* Add New Sale Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Sale</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <View style={styles.inputWrapper}>
                <Feather name="dollar-sign" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="decimal-pad"
                  value={newSale.amount}
                  onChangeText={(text: string) => setNewSale({...newSale, amount: text})}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Product Name</Text>
              <View style={styles.inputWrapper}>
                <Feather name="package" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter product name"
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  value={newSale.product}
                  onChangeText={(text: string) => setNewSale({...newSale, product: text})}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Customer</Text>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter customer name"
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  value={newSale.customer}
                  onChangeText={(text: string) => setNewSale({...newSale, customer: text})}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date</Text>
              <View style={styles.inputWrapper}>
                <Feather name="calendar" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  value={newSale.date}
                  onChangeText={(text: string) => setNewSale({...newSale, date: text})}
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleAddSale}>
                <LinearGradient
                  colors={["#2E3192", "#1BFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save Sale</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Redesigned styles to match profile page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
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
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
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
  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  performanceContent: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  performanceSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default SalesTrackerPage;