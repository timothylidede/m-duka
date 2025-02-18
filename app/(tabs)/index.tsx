import { Stack } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSalesService } from '../../services/sales';
import { AuthContext } from '../../context/AuthContext';
import LineChartComponent from '@/components/lineChartComponent';

// Define SalesData type
interface SalesData {
  totalRevenue: number;
  salesCount: number;
}

// Import animations
const loadingAnimation = require('../../assets/animations/loading-animation.json');
const successAnimation = require('../../assets/animations/success-animation.json');

// Define TimeRangeButton props type
interface TimeRangeButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.dateButton,
      isActive && styles.activeDateButton
    ]}
  >
    <Text style={[
      styles.dateButtonText,
      isActive && styles.activeDateButtonText
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function Index() {
  // Authentication state
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [currentFetchId, setCurrentFetchId] = useState(0);
  
  // UI state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  
  // Sales data state
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    salesCount: 0,
    averageSale: 0
  });
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Context
  const authContext = useContext(AuthContext);
  const shopData = authContext ? authContext.shopData : null;


  // Sales service
  const salesService = useSalesService();

  // Fetch sales data based on time range
  const fetchSalesData = async (range: 'today' | 'week' | 'month' = timeRange) => {
    const fetchId = currentFetchId + 1;
    setCurrentFetchId(fetchId);
    setIsLoadingData(true);
    try {
      let data: SalesData;
      switch (range) {
        case 'week':
          data = await salesService.getWeeklySalesData();
          break;
        case 'month':
          data = await salesService.getMonthlySalesData();
          break;
        default:
          data = await salesService.getTodaysSalesData();
      }
      
      // Only update if this is the most recent fetch
      if (fetchId === currentFetchId) {
        setSalesData({
          totalRevenue: data.totalRevenue || 0,
          salesCount: data.salesCount || 0,
          averageSale: data.salesCount ? (data.totalRevenue / data.salesCount) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      Alert.alert('Error', 'Failed to fetch sales data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSalesData(timeRange);
  }, [timeRange]);

  // Check authentication and fetch initial data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedInUser = await AsyncStorage.getItem('loggedInUser');
        const lastOpenedTime = await AsyncStorage.getItem('lastOpenedTime');
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;

        if (!loggedInUser || !lastOpenedTime || now - parseInt(lastOpenedTime, 10) > ONE_HOUR) {
          router.replace('/login');
        } else {
          setIsLoggedIn(true);
          fetchSalesData();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/login');
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Initial animations
  useEffect(() => {
    if (isLoggedIn) {
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
    }
  }, [isLoggedIn]);

  const handleTimeRangeChange = (range: 'today' | 'week' | 'month') => {
    setTimeRange(range);
    fetchSalesData(range); // Pass the new range directly
  };

  const handleSalePress = () => {
    setIsFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(formSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDoneClick = async () => {
    if (!saleAmount || isNaN(Number(saleAmount))) {
      Alert.alert('Invalid Input', 'Please enter a valid sale amount.');
      return;
    }

    setIsLoading(true);
    
    try {
      await salesService.addNewSale(parseFloat(saleAmount));
      await fetchSalesData();
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
  // Render based on authContext initialization and auth state
  if (!authContext?.isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E3192" />
      </View>
    );
  }

  if (!authChecked || !isLoggedIn) return null;

  const lastUpdated = new Date().toLocaleString();

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
  
      <ScrollView style={styles.container}>
        <View style={styles.timeRangeContainer}>
          {['today', 'week', 'month'].map((range) => (
            <TimeRangeButton 
              key={range}
              title={range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'} 
              isActive={timeRange === range} 
              onPress={() => handleTimeRangeChange(range as 'today' | 'week' | 'month')}
            />
          ))}
        </View>
  
        <Animated.View style={{ opacity: fadeAnim }}>
          {isLoadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E3192" />
              <Text style={styles.loadingText}>Fetching Data...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => router.push('/transactions')}
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
                      <Text style={styles.balanceLabel}>
                        {timeRange === 'today' ? "Today's" : 
                         timeRange === 'week' ? "This Week's" : 
                         "This Month's"} Revenue:
                      </Text>
                      <Animated.Text style={[styles.balanceAmount, { transform: [{ scale: scaleAnim }] }]}>
                        <Text style={styles.currency}>KES </Text>
                        {salesData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Animated.Text>
                    </View>
                    
                    <View style={styles.cardFooter}>
                      <View style={styles.statsContainer}>
                        <Text style={styles.statsLabel}>Total Sales</Text>
                        <Text style={styles.statsValue}>{salesData.salesCount}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.statsContainer}>
                        <Text style={styles.statsLabel}>Avg. Sale</Text>
                        <Text style={styles.statsValue}>
                          KES {Math.round(salesData.averageSale).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <Text style={styles.loadingText}>Processing Sale...</Text>
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
  
              {/* LineChartComponent and Last Updated will be shown only when data is fetched */}
              <View style={[styles.lineChartContainer, { display: isLoadingData ? 'none' : 'flex' }]}>
                <LineChartComponent 
                  timeRange={timeRange}
                />
              </View> 
  
              <View style={[styles.lastUpdatedContainer, { display: isLoadingData ? 'none' : 'flex' }]}>
                <Text style={styles.lastUpdatedText}>Last Updated: {lastUpdated}</Text>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeDateButton: {
    backgroundColor: '#2E3192',
  },
  dateButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  activeDateButtonText: {
    color: '#fff',
  },
  cardContainer: {
    borderRadius: 24,
    margin: 20,
    padding: 24,
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
    marginHorizontal: 20,
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
    margin: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#2E3192',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  lineChartContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  lastUpdatedContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lastUpdatedText: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 50,
  },
});