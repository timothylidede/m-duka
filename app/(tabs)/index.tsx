import { Stack } from "expo-router";
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSalesService } from "../../services/sales";
import { AuthContext } from "../../context/AuthContext";
import LineChartComponent from "@/components/lineChartComponent";
import DebuggingAlert from "@/components/debugging";
import { logMessage } from "@/components/debugging";
import { Audio } from 'expo-av';
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";

// Define SalesData type
interface SalesData {
  totalRevenue: number;
  salesCount: number;
}

// Import animations
const loadingAnimation = require("../../assets/animations/loading-animation.json");
const successAnimation = require("../../assets/animations/success-animation.json");

// Define TimeRangeButton props type
interface TimeRangeButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({
  title,
  isActive,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.dateButton, isActive && styles.activeDateButton]}
  >
    <Text
      style={[styles.dateButtonText, isActive && styles.activeDateButtonText]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

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
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today"
  );

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
  //datbase
  const database = useSQLiteContext();

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
        require("../(tabs)/assets/cash-register.mp3") // Make sure this asset exists
      );
      await sound.playAsync();
      // Unload after playing
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
  const fetchSalesData = async (
    range: "today" | "week" | "month" = timeRange,
    isUpdate = false
  ) => {
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

      // Store previous data for animations if this is an update
      if (isUpdate) {
        setPrevSalesData({...salesData});
      }

      const newData = {
        totalRevenue: data.totalRevenue || 0,
        salesCount: data.salesCount || 0,
        averageSale: data.salesCount ? data.totalRevenue / data.salesCount : 0,
      };
      
      setSalesData(newData);
      
      // Animate the change if this is an update
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
    await playCashRegisterSound(); // Play sound when button is pressed
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
  
    // Store the sale amount in a temporary state variable
    const amount = parseFloat(saleAmount);
    setSaleAmountValue(amount);
  
    try {
      // Process sale
      await salesService.addNewSale(amount);
  
      // Animate form exit
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsFormVisible(false);
        setIsLoading(false); // Reset loading state here after form animation completes
  
        // Show success indicator
        setTransactionComplete(true);
        successFadeAnim.setValue(0);
        Animated.timing(successFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
  
        // Play success animation and sound
        if (successAnimationRef.current) {
          successAnimationRef.current.play();
        }
        playSuccessSound();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  
        // Update data with animation
        fetchSalesData(timeRange, true);
  
        // Reset and hide success after animation completes
        setTimeout(() => {
          Animated.timing(successFadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setTransactionComplete(false);
            setSaleAmountValue(null); // Reset the temporary sale amount value
          });
        }, 2500);
      });
  
      // Reset the sale amount input
      setSaleAmount("");
    } catch (error) {
      Alert.alert("Error", "Failed to process sale. Please try again.");
      setIsLoading(false); // Make sure to reset loading state here too in case of error
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
          headerStyle: {
            backgroundColor: "#2E3192",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView ref={scrollViewRef} style={styles.container}>
        <View style={styles.timeRangeContainer}>
          {["today", "week", "month"].map((range) => (
            <TimeRangeButton
              key={range}
              title={
                range === "today"
                  ? "Today"
                  : range === "week"
                  ? "This Week"
                  : "This Month"
              }
              isActive={timeRange === range}
              onPress={() =>
                handleTimeRangeChange(range as "today" | "week" | "month")
              }
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
                onPress={() => router.push("/transactions")}
              >
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
                        {timeRange === "today"
                          ? "Today's"
                          : timeRange === "week"
                          ? "This Week's"
                          : "This Month's"}{" "}
                        Revenue:
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <Text style={[styles.currency]}>KES </Text>
                        
                        {/* Animated revenue value */}
                        <Animated.View
                          style={[
                            { transform: [{ scale: scaleAnim }] }
                          ]}
                        >
                          <AnimatedNumber
                            value={salesData.totalRevenue}
                            style={styles.balanceAmount}
                          />
                        </Animated.View>
                        
                        {/* Change indicator for revenue */}
                        {prevSalesData.totalRevenue > 0 && 
                         salesData.totalRevenue > prevSalesData.totalRevenue && (
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <AnimatedNumber
                            value={salesData.salesCount}
                            style={styles.statsValue}
                          />
                          
                          {/* Change indicator for count */}
                          {prevSalesData.salesCount > 0 && 
                           salesData.salesCount > prevSalesData.salesCount && (
                            <Animated.View
                              style={[
                                styles.countChangeIndicator,
                                {
                                  opacity: countChangeAnim,
                                },
                              ]}
                            >
                              <Feather name="arrow-up" size={8} color="#4ade80" />
                              <Text style={styles.countChangeText}>
                                +{salesData.salesCount - prevSalesData.salesCount}
                              </Text>
                            </Animated.View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.statsContainer}>
                        <Text style={styles.statsLabel}>Avg. Sale</Text>
                        <Text style={styles.statsValue}>
                          KES{" "}
                          {Math.round(salesData.averageSale).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Floating success notification */}
              {transactionComplete && saleAmountValue !== null && (
                <Animated.View 
                  style={[
                    styles.successToast,
                    { opacity: successFadeAnim }
                  ]}
                >
                  <LottieView
                    ref={successAnimationRef}
                    source={successAnimation}
                    autoPlay={false}
                    loop={false}
                    style={styles.toastAnimation}
                  />
                  <Text style={styles.successToastText}>
                    Sale of KES {saleAmountValue.toFixed(2)} Added!
                  </Text>
                </Animated.View>
              )}

              {isLoading ? (
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
              ) : !isFormVisible ? (
                <TouchableOpacity
                  style={styles.addSaleButton}
                  onPress={handleSalePress}
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
              ) : (
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
                      onPress={() => {
                        Animated.timing(formSlideAnim, {
                          toValue: 0,
                          duration: 300,
                          useNativeDriver: true,
                        }).start(() => {
                          setIsFormVisible(false);
                          setSaleAmount("");
                        });
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.buttonText, styles.cancelText]}>
                        Cancel
                      </Text>
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

              <View
                style={[
                  styles.lineChartContainer,
                  { display: isLoadingData ? "none" : "flex" },
                ]}
              >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeDateButton: {
    backgroundColor: "#2E3192",
  },
  dateButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  activeDateButtonText: {
    color: "#fff",
  },
  cardContainer: {
    borderRadius: 24,
    margin: 20,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  cardContent: {
    height: 220,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    fontWeight: "500",
  },
  balanceContainer: {
    marginTop: 32,
  },
  balanceLabel: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  currency: {
    fontSize: 20,
    opacity: 0.9,
    color: "#fff",
    fontWeight: "normal",
  },
  cardFooter: {
    flexDirection: "row",
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  statsContainer: {
    flex: 1,
  },
  statsLabel: {
    color: "#fff",
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 4,
  },
  statsValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 16,
  },
  addSaleButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  addSaleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    margin: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  formLabel: {
    fontSize: 18,
    color: "#1E293B",
    marginBottom: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    borderRadius: 16,
    fontSize: 24,
    textAlign: "center",
    color: "#1E293B",
    marginBottom: 24,
    backgroundColor: "#F8FAFC",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  confirmButton: {
    backgroundColor: "#2E3192",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cancelText: {
    color: "#64748B",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
  loadingText: {
    color: "#2E3192",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  successText: {
    color: "#2E3192",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  lineChartContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  lastUpdate: {
    textAlign: "center",
    color: "#64748B",
    padding: 20,
    fontSize: 12,
    marginBottom: 100,
  },
  // New styles for enhanced UX
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
  toastAnimation: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  successToastText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3192',
    flex: 1,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 6,
  },
  changeText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  countChangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  countChangeText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
});