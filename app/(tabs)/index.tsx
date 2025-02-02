import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CreditCard = () => {
  const [isTouched, setIsTouched] = useState(false);

  return (
    <View style={[styles.container, isTouched && styles.touchedContainer]}>
      <LinearGradient
        colors={['#1B3B5A', '#21748A']}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <Feather name="credit-card" size={30} color="white" />
          <Text style={styles.expiryDate}>05/26</Text>
        </View>
        
        <Text style={styles.balanceLabel}>Balance:</Text>
        <Text style={styles.balanceAmount}>25,700.00</Text>
      </LinearGradient>
      
      <TouchableOpacity 
        style={styles.addSaleContainer} 
        onPressIn={() => setIsTouched(true)} 
        onPressOut={() => setIsTouched(false)}
      >
        <MaterialCommunityIcons name="gesture-tap" size={80} color="grey" style={styles.handIcon} />
        <Text style={styles.addSaleText}>Click in this area to make a sale</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },
  touchedContainer: {
    borderWidth: 5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(144, 238, 144, 0.3)',
  },
  cardContainer: {
    width: '90%',
    height: 130,
    borderRadius: 15,
    padding: 15,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 1,
    shadowOffset: { width: 5, height: 4 },
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiryDate: {
    color: '#fff',
    fontSize: 14,
  },
  balanceLabel: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 10,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 10,
  },
  addSaleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  handIcon: {
    marginBottom: 8,
  },
  addSaleText: {
    color: 'grey',
    fontSize: 16,
  },
});

export default CreditCard;
