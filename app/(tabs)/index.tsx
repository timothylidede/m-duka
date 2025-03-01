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
  ActivityIndicator,
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
import { logMessage } from '@/components/debugging';
import { Audio } from 'expo-av';
import { Stack } from 'expo-router';

// Import animations
const loadingAnimation = require('../../assets/animations/loading-animation.json');
const successAnimation = require('../../assets/animations/success-animation.json');

// Define SalesData type
interface SalesData {
  totalRevenue: number;
  salesCount: number;
}

// TimeRangeButton Component
interface TimeRangeButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.dateButton, isActive && styles.activeDateButton]}
  >
    <Text style={[styles.dateButtonText, isActive && styles.activeDateButtonText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// LoadingOverlay Component
const LoadingOverlay = () => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContainer}>
      <LottieView
        source={loadingAnimation}
        autoPlay
        loop
        style={styles.lottieAnimation}
      />
      <Text style={styles.loadingText}>Processing Sale...</Text>
    </View>
  </View>
);

// RecordNewSaleButton Component
const RecordNewSaleButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.addSaleButton}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <LinearGradient
      colors={["#2E3192", "#1BFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.buttonGradient}
    >
      <Feather name="plus-circle" size={24} color="white" />
      <Text style={styles.addSaleText}>Record New Sale</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// SaleForm Component
const SaleForm: React.FC<{
  formSlideAnim: Animated.Value;
  saleAmount: string;
  setSaleAmount: React.Dispatch<React.SetStateAction<string>>;
  handleDoneClick: () => void;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  formSlideAnim,
  saleAmount,
  setSaleAmount,
  handleDoneClick,
  setIsFormVisible,
}) => {
  const cancelForm = () => {
    Animated.timing(formSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFormVisible(false);
      setSaleAmount("");
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View
      style={[
        styles.formContainer,
        {
          transform: [
            {
              translateY: formSlideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          opacity: formSlideAnim,
        },
      ]}
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
          onPress={cancelForm}
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
  );
};

// Main SaleComponent
interface SaleComponentProps {
  isLoading: boolean;
  isFormVisible: boolean;
  formSlideAnim: Animated.Value;
  saleAmount: string;
  setSaleAmount: React.Dispatch<React.SetStateAction<string>>;
  handleSalePress: () => void;
  handleDoneClick: () => void;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const SaleComponent: React.FC<SaleComponentProps> = ({
  isLoading,
  isFormVisible,
  formSlideAnim,
  saleAmount,
  setSaleAmount,
  handleSalePress,
  handleDoneClick,
  setIsFormVisible,
}) => {
  return (
    <>
      {isLoading ? (
        <LoadingOverlay />
      ) : !isFormVisible ? (
        <RecordNewSaleButton onPress={handleSalePress} />
      ) : (
        <SaleForm
          formSlideAnim={formSlideAnim}
          saleAmount={saleAmount}
          setSaleAmount={setSaleAmount}
          handleDoneClick={handleDoneClick}
          setIsFormVisible={setIsFormVisible}
        />
      )}
    </>
  );
};

export default function Index() {
  // Authentication state
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // UI state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [saleAmount, setSaleAmount] = useState("");
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");

  // Sales data state
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    salesCount: 0,
    averageSale: 0,
  });

  // Track previous sales data for animations
  const [prevSalesData, setPrevSalesData] = useState({
    totalRevenue: 0,
    salesCount: 0,
    averageSale: 0,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;
  const successFadeAnim = useRef(new Animated.Value(0)).current;
  const revenueChangeAnim = useRef(new Animated.Value(0)).current;
  const countChangeAnim = useRef(new Animated.Value(0)).current;

  // Audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Context
  const authContext = useContext(AuthContext);
  const shopData = authContext ? authContext.shopData : null;

  // Sales service
  const salesService = useSalesService();

  const scrollViewRef = useRef<ScrollView>(null);
  const successAnimationRef = useRef<LottieView>(null);

  const [saleAmountValue, setSaleAmountValue] = useState<number | null>(null);

  // Load and play sound function
  const playCashRegisterSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../(tabs)/assets/cash-register.mp3")
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing cash register sound:", error);
    }
  };

  // Play a success sound
  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../(tabs)/assets/cash-register.mp3")
      );
      await sound.playAsync();
      sound.unloadAsync();
    } catch (error) {
      console.error("Error playing success sound:", error);
    }
  };

  // Cleanup sound when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  interface AnimatedNumberProps {
    value: number;
    style: any;
    prefix?: string;
  }

  const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, style, prefix = "" }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value }) => {
        setDisplayValue(Math.floor(value));
      });

      return () => {
        animatedValue.removeListener(listener);
      };
    }, [value, animatedValue]);

    return (
      <Text style={style}>
        {prefix}
        {displayValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    );
  };

  // Fetch sales data based on time range
  const fetchSalesData = async (range: "today" | "week" | "month" = timeRange, isUpdate = false) => {
    setIsLoadingData(!isUpdate);
    try {
      let data: SalesData;
      switch (range) {
        case "week":
          data = await salesService.getWeeklySalesData();
          break;
        case "month":
          data = await salesService.getMonthlySalesData();
          break;
        default:
          data = await salesService.getTodaysSalesData();
      }

      if (isUpdate) {
        setPrevSalesData({ ...salesData });
      }

      const newData = {
        totalRevenue: data.totalRevenue || 0,
        salesCount: data.salesCount || 0,
        averageSale: data.salesCount ? data.totalRevenue / data.salesCount : 0,
      };

      setSalesData(newData);

      if (isUpdate) {
        revenueChangeAnim.setValue(0);
        countChangeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(revenueChangeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(countChangeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      Alert.alert("Error", "Failed to fetch sales data");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Check authentication and fetch initial data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedInUser = await AsyncStorage.getItem("loggedInUser");
        const lastOpenedTime = await AsyncStorage.getItem("lastOpenedTime");
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;

        if (
          !loggedInUser ||
          !lastOpenedTime ||
          now - parseInt(lastOpenedTime, 10) > ONE_HOUR
        ) {
          router.replace("/login");
        } else {
          setIsLoggedIn(true);
          fetchSalesData();
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/login");
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

  const handleTimeRangeChange = (range: "today" | "week" | "month") => {
    setTimeRange(range);
    fetchSalesData(range);
  };

  const handleSalePress = async () => {
    setIsFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playCashRegisterSound();
    Animated.spring(formSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleDoneClick = async () => {
    if (!saleAmount || isNaN(Number(saleAmount))) {
      Alert.alert("Invalid Input", "Please enter a valid sale amount.");
      return;
    }

    setIsLoading(true);
    const amount = parseFloat(saleAmount);
    setSaleAmountValue(amount);

    try {
      logMessage("Adding new sale...");
      logMessage(`Amount: ${amount}`);
      //await salesService.addNewSale(amount);
      logMessage("Function complete");

      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 3300,
        useNativeDriver: true,
      }).start(() => {
        setIsFormVisible(false);
        setIsLoading(false);

        setTransactionComplete(true);
        successFadeAnim.setValue(0);
        Animated.timing(successFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        try {
          playSuccessSound();
        } catch (soundError) {
          console.error("Error playing success sound:", soundError);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchSalesData(timeRange, true);

        setTimeout(() => {
          Animated.timing(successFadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setTransactionComplete(false);
            setSaleAmountValue(null);
          });
        }, 2500);
      });

      setSaleAmount("");
    } catch (error) {
      console.error("Error in handleDoneClick:", error);
      Alert.alert("Error", "Failed to process sale. Please try again.");
      setIsLoading(false);
    }
  };

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
          title: "Sales Dashboard",
          headerStyle: { backgroundColor: "#2E3192" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView ref={scrollViewRef} style={styles.container}>
        <View style={styles.timeRangeContainer}>
          {["today", "week", "month"].map((range) => (
            <TimeRangeButton
              key={range}
              title={range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}
              isActive={timeRange === range}
              onPress={() => handleTimeRangeChange(range as "today" | "week" | "month")}
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
              <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/transactions")}>
                <LinearGradient
                  colors={["#2E3192", "#1BFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardContainer}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconContainer}>
                        <Feather name="trending-up" size={24} color="white" />
                      </View>
                      <Text style={styles.dateText}>
                        {new Date().toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.balanceContainer}>
                      <Text style={styles.balanceLabel}>
                        {timeRange === "today" ? "Today's" : timeRange === "week" ? "This Week's" : "This Month's"} Revenue:
                      </Text>

                      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                        <Text style={[styles.currency]}>KES </Text>

                        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
                          <AnimatedNumber value={salesData.totalRevenue} style={styles.balanceAmount} />
                        </Animated.View>

                        {prevSalesData.totalRevenue > 0 && salesData.totalRevenue > prevSalesData.totalRevenue && (
                          <Animated.View
                            style={[
                              styles.changeIndicator,
                              {
                                opacity: revenueChangeAnim,
                                transform: [
                                  {
                                    translateY: revenueChangeAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, -10],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          >
                            <Feather name="arrow-up" size={12} color="#4ade80" />
                            <Text style={styles.changeText}>
                              +{(salesData.totalRevenue - prevSalesData.totalRevenue).toFixed(2)}
                            </Text>
                          </Animated.View>
                        )}
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.statsContainer}>
                        <Text style={styles.statsLabel}>Total Sales</Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <AnimatedNumber value={salesData.salesCount} style={styles.statsValue} />

                          {prevSalesData.salesCount > 0 && salesData.salesCount > prevSalesData.salesCount && (
                            <Animated.View style={[styles.countChangeIndicator, { opacity: countChangeAnim }]}>
                              <Feather name="arrow-up" size={8} color="#4ade80" />
                              <Text style={styles.countChangeText}>+{salesData.salesCount - prevSalesData.salesCount}</Text>
                            </Animated.View>
                          )}
                        </View>
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

              {transactionComplete && saleAmountValue !== null && (
                <Animated.View style={[styles.successToast, { opacity: successFadeAnim }]}>
                  <LottieView
                    ref={successAnimationRef}
                    source={successAnimation}
                    autoPlay={false}
                    loop={false}
                    style={styles.toastAnimation}
                  />
                  <Text style={styles.successToastText}>Sale of KES {saleAmountValue.toFixed(2)} Added!</Text>
                </Animated.View>
              )}

              <SaleComponent
                isLoading={isLoading}
                isFormVisible={isFormVisible}
                formSlideAnim={formSlideAnim}
                saleAmount={saleAmount}
                setSaleAmount={setSaleAmount}
                handleSalePress={handleSalePress}
                handleDoneClick={handleDoneClick}
                setIsFormVisible={setIsFormVisible}
              />

              <View style={[styles.lineChartContainer, { display: isLoadingData ? "none" : "flex" }]}>
                <LineChartComponent timeRange={timeRange} />
              </View>

              <Text style={styles.lastUpdate}>Last updated: {lastUpdated}</Text>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  loadingText: {
    color: '#2E3192',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
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
  cardContainer: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 12,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  currency: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  changeText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statsLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  statsValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  countChangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  countChangeText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  successToast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    zIndex: 100,
  },
  toastAnimation: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  successToastText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  lineChartContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  lastUpdate: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginBottom: 20,
  },
});