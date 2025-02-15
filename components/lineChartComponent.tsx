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
    color: (opacity?: number) => string;
    strokeWidth: number;
  }[];
}

const LineChartComponent: React.FC<Props> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [], color: () => '', strokeWidth: 2 }],
  });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
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
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
            dataset = data.hourlyRevenue ? data.hourlyRevenue.filter((_, i) => i % 4 === 0) : [];
        }

        const transformedData = {
          labels,
          datasets: [{
            data: dataset.length > 0 ? dataset : [0],
            color,
            strokeWidth: 2,
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
          datasets: [{ data: [0], color: () => '', strokeWidth: 2 }],
        });
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
      r: '4',
      strokeWidth: '2',
      stroke: '#3f51b5',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '400',
    },
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      stroke: 'rgba(63, 81, 181, 0.1)',
    },
  };

  // Adjust width to prevent x-axis cutoff
  const screenWidth = Dimensions.get('window').width - 32; // Subtracting padding on both sides
  const chartWidth = screenWidth;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.header}>Revenue Trends</Text>
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
        withShadow={false}
        withInnerLines={false}
        withOuterLines={true}
        segments={4}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'left',
  },
  chart: {
    marginLeft: -30, // Compensate for the padding
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