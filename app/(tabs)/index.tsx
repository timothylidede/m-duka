import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Audio } from 'expo-av';
import { firestore } from "../../config/firebase";
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';

const CreditCard = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0); // State for balance
  const borderAnimation = useState(new Animated.Value(0))[0];

  // Fetch sales data and calculate balance
  useEffect(() => {
    const salesCollection = collection(firestore, 'sales');
    const q = query(salesCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let totalBalance = 0;
      querySnapshot.forEach((doc) => {
        const sale = doc.data();
        totalBalance += sale.totalPrice || 0; // Sum up totalPrice
      });
      setBalanceAmount(totalBalance); // Update balanceAmount state
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const playCashRegisterSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/cash-register.mp3')
    );
    await sound.playAsync();
  };

  useEffect(() => {
    if (isTouched) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(borderAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          })
        ])
      ).start();
    } else {
      Animated.timing(borderAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [isTouched]);

  const animatedBorderColor = borderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.3)', 'rgba(114, 255, 114, 0.6)'],
  });

  const handleDoneClick = async () => {
    // Sanitize input
    if (!saleAmount || isNaN(Number(saleAmount)) || parseFloat(saleAmount) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid sale amount.');
      return;
    }

    const totalPrice = parseFloat(saleAmount);

    try {
      // Add new sale to Firestore
      // firestore, 'shops', shopId, 'sales'
      await addDoc(collection(firestore, 'sales'), {
        totalPrice,
        timestamp: new Date().toISOString(),
      });

      // Reset form and show success message
      setTransactionComplete(true);
      setIsFormVisible(false);
      setIsTouched(false);
      setSaleAmount('');

      // Reset to initial state after 4 seconds
      setTimeout(() => {
        setTransactionComplete(false);
      }, 4000); // Show message for 4 seconds
    } catch (error) {
      console.error('Error adding sale: ', error);
      Alert.alert('Error', 'Failed to add sale. Please try again.');
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: animatedBorderColor }]}>
      <LinearGradient colors={['#1B3B5A', '#21748A']} style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Feather name="credit-card" size={24} color="white" />
          <Text style={styles.expiryDate}>05/26</Text>
        </View>
        <Text style={styles.balanceLabel}>Revenue:</Text>
        <Text style={styles.balanceAmount}>
          <Text style={styles.currency}>KES </Text>
          {balanceAmount.toLocaleString()} {/* Display balanceAmount */}
        </Text>
      </LinearGradient>

      {transactionComplete ? (
        <View style={styles.addSaleContainer}>
          <MaterialCommunityIcons name="gesture-tap" size={80} color="grey" style={styles.handIcon} />
          <Text style={styles.addSaleText}>Transaction Complete</Text>
        </View>
      ) : !isFormVisible ? (
        <TouchableOpacity
          style={styles.addSaleContainer}
          onPress={() => {
            setIsFormVisible(true);
            setIsTouched(true);
            playCashRegisterSound();
          }}
        >
          <MaterialCommunityIcons name="gesture-tap" size={80} color="grey" style={styles.handIcon} />
          <Text style={styles.addSaleText}>Click in this area to make a sale</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Enter Sale Amount:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={saleAmount}
            onChangeText={setSaleAmount}
            placeholder="KES 0.00"
            placeholderTextColor="#ccc"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              setIsFormVisible(false);
              setIsTouched(false);
              setSaleAmount('');  // Reset saleAmount when going back
            }}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleDoneClick}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  cardContainer: {
    width: '90%',
    height: 140,
    borderRadius: 15,
    padding: 15,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 1,
    shadowOffset: { width: 5, height: 4 },
    shadowRadius: 10,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryDate: {
    color: '#fff',
    fontSize: 16,
  },
  balanceLabel: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 25,
    marginTop: 10,
  },
  currency: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  addSaleContainer: {
    flex: 1,
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
  formContainer: {
    width: '90%',
    backgroundColor: 'rgba(196, 196, 196, 0.2)',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  formLabel: {
    fontSize: 16,
    color: '#1B3B5A',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    width: '100%',
    borderRadius: 10,
    fontSize: 25,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CreditCard;