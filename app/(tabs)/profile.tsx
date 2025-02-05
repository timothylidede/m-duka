// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'

// const Page = () => {
//   return (
//     <View style={styles.container}>
//       <Text>Profile Screen</Text>
//     </View>
//   )
// }

// export default Page

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff',
//         alignItems: 'center',
//         justifyContent: 'center',
//     }
// })

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

interface StoreProfile {
  storeName: string;
  storeId: string;
  location: string;
  managerName: string;
  contactNumber: string;
  lastStockUpdate: string;
  inventoryStats: InventoryStats;
}

const RetailProfile: React.FC = () => {
  // Mock data - in production this would come from an API or store
  const storeProfile: StoreProfile = {
    storeName: 'Main Street Quick Mart',
    storeId: 'MSE-001',
    location: 'Carwash Street, Nairobi',
    managerName: 'John Muthaiga',
    contactNumber: '+254743891547',
    lastStockUpdate: '2025-02-05 09:30 AM',
    inventoryStats: {
      totalItems: 1247,
      lowStock: 23,
      outOfStock: 5,
      totalValue: 156750.00,
    },
  };

  const StockAlert: React.FC<{ count: number; label: string; urgent?: boolean }> = 
    ({ count, label, urgent }) => (
    <View style={[styles.alertBox, urgent && styles.urgentAlert]}>
      <Text style={styles.alertCount}>{count}</Text>
      <Text style={styles.alertLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{storeProfile.storeName}</Text>
            <Text style={styles.storeId}>ID: {storeProfile.storeId}</Text>
          </View>
          
          <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync Inventory</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{storeProfile.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Manager:</Text>
            <Text style={styles.value}>{storeProfile.managerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{storeProfile.contactNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <View style={styles.statsGrid}>
            <StockAlert 
              count={storeProfile.inventoryStats.lowStock} 
              label="Low Stock Items"
              urgent={storeProfile.inventoryStats.lowStock > 20}
            />
            <StockAlert 
              count={storeProfile.inventoryStats.outOfStock} 
              label="Out of Stock"
              urgent={true}
            />
            <View style={styles.statsBox}>
              <Text style={styles.statsValue}>
                {storeProfile.inventoryStats.totalItems}
              </Text>
              <Text style={styles.statsLabel}>Total Items</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={styles.statsValue}>
                ${storeProfile.inventoryStats.totalValue.toLocaleString()}
              </Text>
              <Text style={styles.statsLabel}>Inventory Value</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>New Stock Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Stock Count</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.lastUpdate}>
          Last updated: {storeProfile.lastStockUpdate}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  storeId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  value: {
    flex: 2,
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsBox: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  alertBox: {
    width: '48%',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  urgentAlert: {
    backgroundColor: '#ffebee',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'green',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  alertCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 4,
  },
  alertLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '90%',
    backgroundColor: 'rgb(200,200,200)',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'green',
    fontSize: 16,
    fontWeight: '900',
  },
  syncButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdate: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontSize: 12,
  },
});

export default RetailProfile;