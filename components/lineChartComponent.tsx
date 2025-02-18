import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Dimensions, StyleSheet, Animated, FlatList } from 'react-native';
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

interface LegendItem {
  label: string;
  index: number;
}

const LineChartComponent: React.FC<Props> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [], color: () => '', strokeWidth: 2 }],
  });
  const [legendData, setLegendData] = useState<LegendItem[]>([]);

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
        let timeLabels: LegendItem[] = [];

        switch (timeRange) {
          case 'week':
            data = await salesService.getWeeklySalesData();
            labels = Array.from({ length: 7 }, (_, i) => (i + 1).toString());
            dataset = data.weeklyRevenue || [];
            color = (opacity = 1) => `rgba(0, 188, 212, ${opacity})`; // Cyan for week
            timeLabels = ['Today', 'Yesterday', '2 Days Ago', '3 Days Ago', '4 Days Ago', '5 Days Ago', '6 Days Ago'].map((label, index) => ({ label, index }));
            break;
          case 'month':
            data = await salesService.getMonthlySalesData();
            labels = Array.from({ length: 4 }, (_, i) => (i + 1).toString());
            dataset = data.monthlyRevenue || [];
            color = (opacity = 1) => `rgba(255, 152, 0, ${opacity})`; // Orange for month
            timeLabels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'].map((label, index) => ({ label, index }));
            break;
          default:
            data = await salesService.getTodaysSalesData();
            labels = ['0', '4', '8', '12', '16', '20'];
            dataset = data.hourlyRevenue ? data.hourlyRevenue.filter((_, i) => i % 4 === 0) : [];
            timeLabels = ['Now', '4 hrs ago', '8 hrs ago', '12 hrs ago', '16 hrs ago', '20 hrs ago'].map((label, index) => ({ label, index }));
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
        setLegendData(timeLabels);

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
        setLegendData([{ label: 'Error', index: 0 }]);
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

  const screenWidth = Dimensions.get('window').width - 32; // Subtracting padding on both sides
  const chartWidth = screenWidth;

  const renderLegendItem = ({ item }: { item: LegendItem }) => (
    <View style={styles.legendItem}>
      <Text style={styles.legendText}>{item.index + 1}. {item.label}</Text>
    </View>
  );

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
        withHorizontalLabels={false}
        withDots={true}
        withShadow={false}
        withInnerLines={false}
        withOuterLines={true}
        segments={4}
      />
      <FlatList
        data={legendData}
        renderItem={renderLegendItem}
        keyExtractor={item => item.label}
        style={styles.legendContainer}
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
  legendContainer: {
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#3f51b5',
  },
});

export default LineChartComponent;