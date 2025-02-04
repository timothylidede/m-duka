import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Page = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  return (
    <View style={styles.container}>
      {/* My Business Portfolio Card */}
      <View style={styles.cardContainer}>
        <LinearGradient colors={['#1B3B5A', '#21748A']} style={styles.cardHeader}>
          <MaterialCommunityIcons name="briefcase" size={24} color="#fff" />
          <Text style={styles.cardTitle}>Sales</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </LinearGradient>
        <View style={styles.toggleContainer}>
          {['Today', 'Past Week', 'Past Month', 'Past Year'].map((period) => (
            <TouchableOpacity 
              key={period} 
              style={[styles.toggleButton, selectedPeriod === period && styles.selectedButton]} 
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.toggleText, selectedPeriod === period && styles.selectedText]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.yield}>Total revenue {selectedPeriod.toLowerCase()}</Text>
          <Text style={styles.value}>
            <Text style={styles.currency}>KES </Text>24,500.20
          </Text>
          <Text style={styles.percentage}>+ 2,893 (5.76%) for all time</Text>
          <Text style={styles.yield2}>Total profits {selectedPeriod.toLowerCase()}</Text>
          <Text style={styles.value}>
            <Text style={styles.currency}>KES </Text>2,500.00
          </Text>
          <Text style={styles.percentage}>88% Transactions Analyzed</Text>
        </View>
      </View>

      {/* Stock Market Card */}
      <TouchableOpacity style={styles.marketCard}>
        <Text style={styles.marketText}>More Details</Text>
        <Text style={styles.subText}>View business portfolio details</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },
  toggleButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: 'rgba(196, 196, 196, 0.2)',
    borderRadius: 5,
  },
  selectedButton: {
    backgroundColor: '#21748A',
  },
  toggleText: {
    color: '#555',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 10,
    backgroundColor: 'rgba(196, 196, 196, 0.2)',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  value: {
    color: '#1B3B5A',
    fontSize: 25,
    marginTop: 10,
  },
  currency: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(0, 193, 6, 0.2)',
  },
  percentage: {
    color: '#21748A',
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
  },
  yield: {
    color: '#555',
    fontSize: 16,
    marginTop: 5,
  },
  yield2: {
    color: '#555',
    fontSize: 16,
    marginTop: 30,
  },
  marketCard: {
    width: '100%',
    backgroundColor: '#1B3B5A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  marketText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subText: {
    color: '#A0E6FF',
    fontSize: 14,
  },
});
