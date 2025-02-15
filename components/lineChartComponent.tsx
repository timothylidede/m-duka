import React, { useEffect, useState } from 'react';
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
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
}

const LineChartComponent: React.FC<Props> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [''],
    datasets: [{ data: [0] }],
  });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Call useSalesService outside of any conditional rendering
  const salesService = useSalesService();

  // Error handling moved outside of hook declaration
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
        
        // Fetch data based on timeRange
        switch (timeRange) {
          case 'week':
            data = await salesService.getWeeklySalesData();
            break;
          case 'month':
            data = await salesService.getMonthlySalesData();
            break;
          default:
            data = await salesService.getTodaysSalesData();
        }

        // Sort transactions by timestamp
        const sortedTransactions = [...data.transactions].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        // Format labels based on timeRange
        const labels = sortedTransactions.map(t => {
          const date = new Date(t.timestamp);
          switch (timeRange) {
            case 'today':
              return date.getHours().toString().padStart(2, '0') + ':00';
            case 'week':
              return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            case 'month':
              return date.getDate().toString();
            default:
              return '';
          }
        }).slice(-6);

        // Calculate revenue values
        const values = sortedTransactions.map(t =>
          t.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        ).slice(-6);

        // Ensure we have at least one data point
        const transformedData = {
          labels: labels.length > 0 ? labels : ['No data'],
          datasets: [{
            data: values.length > 0 ? values : [0],
            color: (opacity = 1) => `rgba(46, 49, 146, ${opacity})`,
            strokeWidth: 3, // Increased stroke width
          }],
        };

        setChartData(transformedData);
        
        // Animate the chart in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Set default data in case of error
        setChartData({
          labels: ['Error'],
          datasets: [{ data: [0] }],
        });
      }
    };

    fetchChartData();
  }, [timeRange, salesService, fadeAnim]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(46, 49, 146, ${opacity})`,
    strokeWidth: 3, // Increased for better visibility
    decimalPlaces: 0,
    propsForDots: {
      r: '6', // Larger dots
      strokeWidth: '2',
      stroke: '#2E3192',
    },
    propsForLabels: {
      fontSize: 14, // Larger font size for labels
      fontWeight: 'bold',
    },
    fillShadowGradient: '#2E3192', // Adds a subtle fill under the line
    fillShadowGradientOpacity: 0.1, // Makes the fill semi-transparent
  };

  const screenWidth = Dimensions.get('window').width - 40;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.header}>Revenue Trends</Text>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={250} // Increased height for better visibility
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        withDots={true}
        withShadow={false}
        withInnerLines={false}
        withOuterLines={true}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff', // Added background color
    padding: 16, // Added padding
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 20, // Larger font size for header
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center', // Center align the title
  },
  chart: {
    borderRadius: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LineChartComponent;