import { Stack } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Pressable,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

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

interface QuickAction {
  actionName: string;
  iconName: string;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();

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
      totalValue: 156750.0,
    },
  };

  const QuickActions: QuickAction[] = [
    // { actionName: 'Add New Item', iconName: 'plus' },
    { actionName: 'Supplier Management', iconName: 'file-text' },
    { actionName: 'Stock Restock Alerts', iconName: 'bar-chart-2' },
    { actionName: 'Demand Forecast', iconName: 'box' },
    { actionName: 'Add a new Good', iconName: 'users' },
  ];

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('lastOpenedTime');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Inventory',
          headerStyle: {
            backgroundColor: '#2E3192',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }} 
      />
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <LinearGradient
            colors={['#2E3192', '#1BFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.storeInfo}>
              <Feather name="shopping-bag" size={40} color="white" style={styles.storeIcon} />
              <Text style={styles.storeName}>{storeProfile.storeName}</Text>
              <Text style={styles.storeId}>ID: {storeProfile.storeId}</Text>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#2E3192" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="info" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Store Details</Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="map-pin" size={20} color="#64748B" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{storeProfile.location}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="user" size={20} color="#64748B" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Manager</Text>
                  <Text style={styles.detailValue}>{storeProfile.managerName}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="phone" size={20} color="#64748B" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{storeProfile.contactNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="box" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Inventory Overview</Text>
              </View>
              <View style={styles.statsGrid}>

                <View style={styles.statsCard}>
                <Pressable
                  onPress={() => Alert.alert('Button Pressed', 'You pressed the view!')}
                  style={({ pressed }) => [
                    styles.pressableView,
                    { backgroundColor: pressed ? '#ddd' : '#fff' }, // Change background color when pressed
                  ]}
                >
                  {/* <Text style={styles.text}>Press Me</Text> */}
                  <Feather name="package" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>{storeProfile.inventoryStats.totalItems}</Text>
                  <Text style={styles.statsLabel}>Total Items</Text>
                </Pressable>
                </View>

                <View style={[styles.statsCard, styles.alertCard]}>
                  <Feather name="alert-circle" size={24} color="#DC2626" />
                  <Text style={[styles.statsValue, styles.alertValue]}>
                    {storeProfile.inventoryStats.lowStock}
                  </Text>
                  <Text style={styles.statsLabel}>Low Stock</Text>
                </View>

                <View style={[styles.statsCard, styles.criticalCard]}>
                  <Feather name="x-circle" size={24} color="#DC2626" />
                  <Text style={[styles.statsValue, styles.alertValue]}>
                    {storeProfile.inventoryStats.outOfStock}
                  </Text>
                  <Text style={styles.statsLabel}>Out of Stock</Text>
                </View>

                <View style={styles.statsCard}>
                  <Feather name="dollar-sign" size={24} color="#2E3192" />
                  <Text style={styles.statsValue}>
                    KES {storeProfile.inventoryStats.totalValue.toLocaleString()}
                  </Text>
                  <Text style={styles.statsLabel}>Total Value</Text>
                </View>

              </View>
            </View>

            <View style={styles.section}>
              
              <View style={styles.sectionHeader}>
                <Feather name="zap" size={24} color="#2E3192" />
                <Text style={styles.sectionTitle}>Quick Actions</Text>
              </View>

              {QuickActions.map((action, index) => (
                <TouchableOpacity style={styles.actionButton} key={index}>
                  <LinearGradient
                    colors={['#2E3192', '#1BFFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionGradient}
                  >
                    <Feather name={action.iconName as any} size={24} color="white" />
                    <Text style={styles.actionButtonText}>{action.actionName}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}

            </View>

            <Text style={styles.lastUpdate}>
              Last updated: {storeProfile.lastStockUpdate}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    // borderBottomLeftRadius: 24,
    // borderBottomRightRadius: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 20,
    marginLeft: 9,
    marginRight: 9,

  },
  storeInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIcon: {
    marginBottom: 12,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  storeId: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,

  },
  logoutButtonText: {
    color: '#2E3192',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#1E293B',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',

  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',

  },
  statsCard: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,

  },
  alertCard: {
    backgroundColor: '#FEF2F2',
  },
  criticalCard: {
    backgroundColor: '#FEE2E2',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3192',
    marginTop: 8,
    marginBottom: 4,
  },
  alertValue: {
    color: '#DC2626',
  },
  statsLabel: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  lastUpdate: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginBottom: 60,
  },
  // add pressable styling
  pressableView: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfilePage;