import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Dimensions, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSalesService } from '../services/sales';
import { SalesData } from '../services/sales';
import { formatCurrency } from '../utils/formatters'; // Assuming you have a formatter utility

interface Props {
  timeRange: 'today' | 'week' | 'month';
  onTimeRangeChange?: (range: 'today' | 'week' | 'month') => void;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }[];
}

const LineChartComponent: React.FC<Props> = ({ timeRange, onTimeRangeChange }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [], color: () => '', strokeWidth: 2 }],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [averageRevenue, setAverageRevenue] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const salesService = useSalesService();

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      fadeAnim.setValue(0);
      
      try {
        let data: SalesData;
        let labels: string[] = [];
        let dataset: number[] = [];
        let color = (opacity = 1) => `rgba(63, 81, 181, ${opacity})`; // Default deep purple

        switch (timeRange) {
          case 'week':
            data = await salesService.getWeeklySalesData();
            // Using day names for better readability
            labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dataset = data.weeklyRevenue || [];
            color = (opacity = 1) => `rgba(0, 188, 212, ${opacity})`; // Cyan for week
            break;
          case 'month':
            data = await salesService.getMonthlySalesData();
            // Label weeks for better context
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            dataset = data.monthlyRevenue || [];
            color = (opacity = 1) => `rgba(255, 152, 0, ${opacity})`; // Orange for month
            break;
          default:
            data = await salesService.getTodaysSalesData();
            // Create time-based labels for better context
            const hours = Array.from({ length: 6 }, (_, i) => {
              const hour = new Date().getHours() - (i * 4);
              return `${hour >= 0 ? hour : 24 + hour}:00`;
            }).reverse();
            labels = hours;
            
            // Get hourly revenue in 4-hour chunks
            const hourlyData = data.hourlyRevenue || [];
            dataset = [];
            for (let i = 0; i < 24; i += 4) {
              dataset.push(
                hourlyData.slice(i, i + 4).reduce((sum, val) => sum + val, 0)
              );
            }
            dataset.reverse(); // To match our time labels
        }

        // Save summary data
        setTotalRevenue(data.totalRevenue || 0);
        setSalesCount(data.salesCount || 0);
        setAverageRevenue(data.salesCount > 0 ? data.totalRevenue / data.salesCount : 0);

        // Handle empty data gracefully
        if (dataset.length === 0) {
          dataset = [0];
          labels = ['No data'];
        }

        const transformedData = {
          labels,
          datasets: [{
            data: dataset,
            color,
            strokeWidth: 3, // Thicker lines for better visibility
          }],
        };

        setChartData(transformedData);
        setIsLoading(false);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData({
          labels: ['Error'],
          datasets: [{ data: [0], color: () => '#f44336', strokeWidth: 2 }],
        });
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [timeRange, salesService, fadeAnim]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForDots: {
      r: '5', // Larger dots
      strokeWidth: '2',
      stroke: '#3f51b5',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '500',
      rotation: timeRange === 'today' ? 45 : 0, // Rotate labels for better fit
    },
    useShadowColorFromDataset: true,
    propsForBackgroundLines: {
      stroke: 'rgba(63, 81, 181, 0.1)',
    },
    fillShadowGradientFrom: timeRange === 'week' ? 'rgba(0, 188, 212, 0.5)' : 
                            timeRange === 'month' ? 'rgba(255, 152, 0, 0.5)' : 
                            'rgba(63, 81, 181, 0.5)',
    fillShadowGradientTo: '#ffffff',
    labelColor: () => 'rgba(0, 0, 0, 0.7)',
  };

  const screenWidth = Dimensions.get('window').width - 32; // Subtracting padding on both sides
  const chartHeight = 250; // Slightly taller for better visibility

  const renderTimeRangeSelector = () => {
    if (!onTimeRangeChange) return null;
    
    return (
      <View style={styles.timeRangeContainer}>
        {['today', 'week', 'month'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.activeTimeRange
            ]}
            onPress={() => onTimeRangeChange(range as 'today' | 'week' | 'month')}
          >
            <Text 
              style={[
                styles.timeRangeText,
                timeRange === range && styles.activeTimeRangeText
              ]}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSummary = () => {
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Sales Count</Text>
          <Text style={styles.summaryValue}>{salesCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average Sale</Text>
          <Text style={styles.summaryValue}>{formatCurrency(averageRevenue)}</Text>
        </View>
      </View>
    );
  };

  if (!salesService) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load sales data</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chart data...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Revenue Trends</Text>
        {renderTimeRangeSelector()}
      </View>
      
      {renderSummary()}
      
      <LineChart
        data={chartData}
        width={screenWidth}
        height={chartHeight}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        withDots={true}
        withShadow={true}
        withInnerLines={false}
        withOuterLines={true}
        segments={4}
        formatYLabel={(value) => formatCurrency(Number(value))}
      />
      
      <Text style={styles.timeRangeText}>
        {timeRange === 'today' ? 'Today\'s hourly revenue' : 
         timeRange === 'week' ? 'This week\'s daily revenue' : 
         'This month\'s weekly revenue'}
      </Text>
    </Animated.View>
  );
};

// Assuming there's a formatCurrency utility, if not we can create one
// For example:
// export const formatCurrency = (amount: number): string => {
//   return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
// };

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'left',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  activeTimeRange: {
    backgroundColor: '#3f51b5',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeTimeRangeText: {
    color: '#fff',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  chartHeader: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a237e',
    marginBottom: 4,
  },
  chart: {
    borderRadius: 8,
    paddingTop: 8,
  },
  timeRangeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
  },
  loadingText: {
    color: '#3f51b5',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LineChartComponent;