import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Dimensions, StyleSheet, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSalesService } from '../services/sales';
import { SalesData } from '../services/sales';

interface Props {
  timeRange: 'today' | 'week' | 'month';
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }[];
}

const LineChartComponent: React.FC<Props> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [], color: () => '', strokeWidth: 2 }],
  });
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const salesService = useSalesService();

  if (!salesService) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load sales data</Text>
      </View>
    );
  }

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        let data: SalesData;
        let labels: string[] = [];
        let dataset: number[] = [];
        let color = (opacity = 1) => `rgba(63, 81, 181, ${opacity})`; // Deep purple to match design

        switch (timeRange) {
          case 'week':
            data = await salesService.getWeeklySalesData();
            labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dataset = data.weeklyRevenue || [];
            color = (opacity = 1) => `rgba(0, 188, 212, ${opacity})`; // Cyan for week
            break;
          case 'month':
            data = await salesService.getMonthlySalesData();
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            dataset = data.monthlyRevenue || [];
            color = (opacity = 1) => `rgba(255, 152, 0, ${opacity})`; // Orange for month
            break;
          default:
            data = await salesService.getTodaysSalesData();
            const now = new Date();
            labels = [];
            for (let i = 0; i < 6; i++) {
              const hour = (now.getHours() - (i * 4) + 24) % 24;
              labels.unshift(`${hour}:00`);
            }
            const hourlyData = data.hourlyRevenue || [];
            dataset = [];
            for (let i = 0; i < 24; i += 4) {
              const sum = hourlyData.slice(i, i + 4).reduce((a, b) => a + b, 0);
              dataset.push(sum);
            }
        }

        // Log original dataset
        console.log('Original dataset:', dataset);

        // Ensure all data values are valid numbers
        dataset = dataset.map(val => {
          if (isNaN(val) || !isFinite(val) || val === null || val === undefined) return 0;
          return val;
        });

        // Log sanitized dataset
        console.log('Sanitized dataset:', dataset);

        setTotalRevenue(data.totalRevenue || 0);

        const transformedData = {
          labels,
          datasets: [{
            data: dataset.length > 0 ? dataset : [0],
            color,
            strokeWidth: 3, // Slightly thicker for better visibility
          }],
        };

        setChartData(transformedData);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData({
          labels: ['Error'],
          datasets: [{ data: [0], color: () => '#f44336', strokeWidth: 2 }],
        });
      }
    };

    fetchChartData();
  }, [timeRange, salesService, fadeAnim]);

  // Format currency for Y-axis labels with KES
  const formatYLabel = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return 'KES 0';
    
    if (num >= 1000) {
      return `KES ${(num / 1000).toFixed(1)}k`;
    }
    return `KES ${num}`;
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForDots: {
      r: '5', // Slightly larger dots
      strokeWidth: '2',
      stroke: '#3f51b5',
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: '400',
      rotation: timeRange === 'today' ? 25 : 0,
    },
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      stroke: 'rgba(63, 81, 181, 0.1)',
    },
    formatYLabel,
  };

  const screenWidth = Dimensions.get('window').width - 32; // Subtracting padding on both sides
  const chartWidth = screenWidth;

  // Get appropriate title based on time range
  const getChartTitle = () => {
    switch (timeRange) {
      case 'week':
        return 'Weekly Revenue';
      case 'month':
        return 'Monthly Revenue';
      default:
        return 'Today\'s Revenue';
    }
  };

  // Format total revenue with KES
  const formatTotalRevenue = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return 'KES 0';
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{getChartTitle()}</Text>
        <Text style={styles.totalRevenue}>
          {formatTotalRevenue(totalRevenue)}
        </Text>
      </View>
      <LineChart
        data={chartData}
        width={chartWidth}
        height={220}
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
        fromZero={true}
      />
      <Text style={styles.chartDescription}>
        {timeRange === 'today' 
          ? 'Revenue by 4-hour intervals' 
          : timeRange === 'week' 
            ? 'Revenue by day of week'
            : 'Revenue by week of month'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'left',
  },
  totalRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  chart: {
    marginLeft: -30, // Compensate for the padding
    borderRadius: 8,
  },
  chartDescription: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LineChartComponent;