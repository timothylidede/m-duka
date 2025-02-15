import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Mock supplier data
const suppliers = [
  { id: 1, name: 'Supplier A', contact: '123-456-7890', email: 'supplierA@example.com', address: '123 Main St, City' },
  { id: 2, name: 'Supplier B', contact: '987-654-3210', email: 'supplierB@example.com', address: '456 Elm St, Town' },
  { id: 3, name: 'Supplier C', contact: '555-123-4567', email: 'supplierC@example.com', address: '789 Oak St, Village' },
];

export default function SupplierManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Supplier Management',
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

      <ScrollView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search suppliers..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        </View>

        {/* Supplier List */}
        {filteredSuppliers.map((supplier) => (
          <TouchableOpacity
            key={supplier.id}
            style={styles.supplierCard}
            activeOpacity={0.8}
          >
            <View style={styles.supplierHeader}>
              <Text style={styles.supplierName}>{supplier.name}</Text>
              <Feather name="chevron-right" size={20} color="#64748B" />
            </View>
            <View style={styles.supplierDetails}>
              <Text style={styles.detailText}>Contact: {supplier.contact}</Text>
              <Text style={styles.detailText}>Email: {supplier.email}</Text>
              <Text style={styles.detailText}>Address: {supplier.address}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Bottom Margin */}
        <View style={styles.bottomMargin} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  searchIcon: {
    marginLeft: 8,
  },
  supplierCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  supplierDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  bottomMargin: {
    marginBottom: 100,
  },
});