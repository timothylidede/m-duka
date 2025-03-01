import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput
} from 'react-native';

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
  
  // Render the toggle buttons
  const renderToggle = (): JSX.Element => (
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
  );
  
  // Render the sales data card
  const renderSalesCard = (): JSX.Element => {
    const data: SalesStats = salesData[timeFrame];
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>{timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Sales Summary</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${data.total.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.count}</Text>
            <Text style={styles.statLabel}>Number of Sales</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${data.average.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Average Sale</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render the "Add Sale" button
  const renderAddButton = (): JSX.Element => (
    <TouchableOpacity 
      style={styles.addButton}
      onPress={() => setModalVisible(true)}
    >
      <Text style={styles.addButtonText}>+ Add New Sale</Text>
    </TouchableOpacity>
  );
  
  // Render the add sale modal
  const renderModal = (): JSX.Element => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Sale</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Amount ($)"
            keyboardType="decimal-pad"
            value={newSale.amount}
            onChangeText={(text: string) => setNewSale({...newSale, amount: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={newSale.product}
            onChangeText={(text: string) => setNewSale({...newSale, product: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Customer"
            value={newSale.customer}
            onChangeText={(text: string) => setNewSale({...newSale, customer: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={newSale.date}
            onChangeText={(text: string) => setNewSale({...newSale, date: text})}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleAddSale}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sales Tracker</Text>
      {renderToggle()}
      {renderSalesCard()}
      {renderAddButton()}
      {renderModal()}
    </ScrollView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#3498db',
  },
  toggleText: {
    fontWeight: '500',
    color: '#555',
  },
  toggleActiveText: {
    color: 'white',
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  addButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SalesTrackerPage;