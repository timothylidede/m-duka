import { Stack, router } from 'expo-router';
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Animated, 
  Alert,
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import LineChartComponent from '@/components/lineChartComponent';
import LowStockChart from '@/components/lowStockChart';
import { useNavigation } from '@react-navigation/native';

// Import animations
const loadingAnimation = require('../../assets/animations/loading-animation.json');
const successAnimation = require('../../assets/animations/success-animation.json');

export default function Index() {
  const navigation = useNavigation();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(125840); // Example static balance
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;

  // Initial animations
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSalePress = () => {
    setIsFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(formSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('../transactions'); // Update the path to match your file structure
  };

  const handleDoneClick = async () => {
    if (!saleAmount || isNaN(Number(saleAmount)) || parseFloat(saleAmount) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid sale amount.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAmount = parseFloat(saleAmount);
      setBalanceAmount(prev => prev + newAmount);
      setTransactionComplete(true);
      setIsFormVisible(false);
      setSaleAmount('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        setTransactionComplete(false);
      }, 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to process sale. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Sales Dashboard',
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

      <ScrollView>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleCardPress}
          >
            <LinearGradient
              colors={['#2E3192', '#1BFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardContainer}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Feather name="trending-up" size={24} color="white" />
                  </View>
                  <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Today's Revenue:</Text>
                  <Animated.Text style={[styles.balanceAmount, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.currency}>KES </Text>
                    {balanceAmount.toLocaleString()}
                  </Animated.Text>
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={styles.statsContainer}>
                    <Text style={styles.statsLabel}>Today's Sales</Text>
                    <Text style={styles.statsValue}>12</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statsContainer}>
                    <Text style={styles.statsLabel}>Avg. Sale</Text>
                    <Text style={styles.statsValue}>
                      KES {Math.round(balanceAmount / 12).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <LottieView
                source={loadingAnimation}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          ) : transactionComplete ? (
            <View style={styles.successContainer}>
              <LottieView
                source={successAnimation}
                autoPlay
                loop={false}
                style={styles.lottieAnimation}
              />
              <Text style={styles.successText}>Sale Recorded Successfully</Text>
            </View>
          ) : !isFormVisible ? (
            <TouchableOpacity
              style={styles.addSaleButton}
              onPress={handleSalePress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2E3192', '#1BFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Feather name="plus-circle" size={24} color="white" />
                <Text style={styles.addSaleText}>Record New Sale</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Animated.View 
              style={[styles.formContainer, {
                transform: [{
                  translateY: formSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              }]}
            >
              <Text style={styles.formLabel}>Enter Sale Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={saleAmount}
                onChangeText={setSaleAmount}
                placeholder="KES 0.00"
                placeholderTextColor="#94A3B8"
                autoFocus
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setIsFormVisible(false);
                    setSaleAmount('');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={handleDoneClick}
                >
                  <Text style={styles.buttonText}>Complete Sale</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        <View style={styles.lineChartView}>
          <LineChartComponent />
        </View>

        <View style={styles.lineChartView}>
          <LowStockChart />
        </View>

        <View style={styles.bottomMargin}>
          <Text style={styles.buttonText}> terms and conditions </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  cardContainer: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  cardContent: {
    height: 220,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
  },
  balanceContainer: {
    marginTop: 32,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  currency: {
    fontSize: 20,
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsContainer: {
    flex: 1,
  },
  statsLabel: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 4,
  },
  statsValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  addSaleButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addSaleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  formLabel: {
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 16,
    fontSize: 24,
    textAlign: 'center',
    color: '#1E293B',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#2E3192',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelText: {
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  successText: {
    color: '#2E3192',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  lineChartView: {
    backgroundColor: 'white',
    padding: 10,
    marginTop: 50,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 20,
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  bottomMargin: {
    marginBottom: 100,
    alignItems: 'center',
  },
});