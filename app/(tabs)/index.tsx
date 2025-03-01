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
  Platform,
//   BlurView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  // Sample data - would normally come from API or storage
  const [salesData, setSalesData] = useState<SalesDataType>({
    daily: { total: 1250, count: 15, average: 83.33 },
    weekly: { total: 8750, count: 87, average: 100.57 },
    monthly: { total: 35400, count: 312, average: 113.46 }
  });
  
  // Add new sale function
  const handleAddSale = (): void => {
    // Validation
    if (!newSale.amount || !newSale.product || !newSale.customer) {
      alert('Please fill all fields');
      return;
    }
    
    // In a real app, you would update your database here
    // For demo purposes, we'll just update the salesData state
    const amount = parseFloat(newSale.amount);
    
    if (isNaN(amount)) {
      alert('Please enter a valid amount');
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
  
  // Render the toggle buttons with glassmorphic design
  const renderToggle = (): JSX.Element => (
    <View style={styles.toggleOuterContainer}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, timeFrame === 'daily' && styles.toggleActive]}
          onPress={() => setTimeFrame('daily')}
        >
          <Text style={[styles.toggleText, timeFrame === 'daily' && styles.toggleActiveText]}>Daily</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, timeFrame === 'weekly' && styles.toggleActive]}
          onPress={() => setTimeFrame('weekly')}
        >
          <Text style={[styles.toggleText, timeFrame === 'weekly' && styles.toggleActiveText]}>Weekly</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, timeFrame === 'monthly' && styles.toggleActive]}
          onPress={() => setTimeFrame('monthly')}
        >
          <Text style={[styles.toggleText, timeFrame === 'monthly' && styles.toggleActiveText]}>Monthly</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render the sales data card with glassmorphic design
  const renderSalesCard = (): JSX.Element => {
    const data: SalesStats = salesData[timeFrame];
    return (
      <View style={styles.cardOuterContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.2)']}
          style={styles.cardContainer}
        >
          <Text style={styles.cardTitle}>{timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Sales Summary</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#36d1dc', '#5b86e5']}
                style={styles.statIconContainer}
              >
                <Text style={styles.statIcon}>$</Text>
              </LinearGradient>
              <Text style={styles.statValue}>${data.total.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
            </View>
            
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#ff9966', '#ff5e62']}
                style={styles.statIconContainer}
              >
                <Text style={styles.statIcon}>#</Text>
              </LinearGradient>
              <Text style={styles.statValue}>{data.count}</Text>
              <Text style={styles.statLabel}>Number of Sales</Text>
            </View>
            
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#56ab2f', '#a8e063']}
                style={styles.statIconContainer}
              >
                <Text style={styles.statIcon}>≈</Text>
              </LinearGradient>
              <Text style={styles.statValue}>${data.average.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Average Sale</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };
  
  // Render the "Add Sale" button with modern design
  const renderAddButton = (): JSX.Element => (
    <TouchableOpacity 
      onPress={() => setModalVisible(true)}
    >
      <LinearGradient
        colors={['#4776E6', '#8E54E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+ Add New Sale</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
  
  // Render the add sale modal with glassmorphic design
  const renderModal = (): JSX.Element => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          style={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Add New Sale</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              keyboardType="decimal-pad"
              value={newSale.amount}
              onChangeText={(text: string) => setNewSale({...newSale, amount: text})}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              value={newSale.product}
              onChangeText={(text: string) => setNewSale({...newSale, product: text})}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Customer</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              value={newSale.customer}
              onChangeText={(text: string) => setNewSale({...newSale, customer: text})}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              value={newSale.date}
              onChangeText={(text: string) => setNewSale({...newSale, date: text})}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleAddSale}>
              <LinearGradient
                colors={['#4776E6', '#8E54E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
  
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#ECE9E6', '#FFFFFF']}
        style={styles.background}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.header}>Sales Tracker</Text>
          {renderToggle()}
          {renderSalesCard()}
          {renderAddButton()}
          {renderModal()}
        </ScrollView>
      </LinearGradient>
    </>
  );
};

// Modern glassmorphic styles
const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 20,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  toggleOuterContainer: {
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    overflow: 'hidden',
    width: width - 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(71, 118, 230, 0.9)',
  },
  toggleText: {
    fontWeight: '600',
    color: '#1A1A2E',
    fontSize: 16,
  },
  toggleActiveText: {
    color: 'white',
  },
  cardOuterContainer: {
    marginBottom: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardContainer: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    width: (width - 96) / 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SalesTrackerPage;