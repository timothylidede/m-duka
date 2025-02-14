import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { salesService } from '../services/sales';

interface Props {
  timeRange: 'today' | 'week' | 'month';
  shopContact?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
}

const LineChartComponent: React.FC<Props> = ({ timeRange, shopContact }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }],
  });

  useEffect(() => {
    const fetchChartData = async () => {
      if (!shopContact) return;

      try {
        let data;
        switch (timeRange) {
          case 'week':
            data = await salesService.getWeeklySalesData(shopContact);
            break;
          case 'month':
            data = await salesService.getMonthlySalesData(shopContact);
            break;
          default:
            data = await salesService.getTodaysSalesData(shopContact);
        }

        // Transform the data for the chart
        const transformedData = {
          labels: data.transactions.map((t, i) => `Day ${i + 1}`).slice(-6),
          datasets: [{
            data: data.transactions.map(t => 
              t.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
            ).slice(-6),
            color: (opacity = 1) => `rgba(46, 49, 146, ${opacity})`, // Match your brand color
            strokeWidth: 2,
          }],
        };

        setChartData(transformedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [timeRange, shopContact]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(46, 49, 146, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForDots: {
      r: '4',
      strokeWidth: '1',
      stroke: '#2E3192',
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const screenWidth = Dimensions.get('window').width - 40; // Account for padding

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Revenue Trends</Text>
      <LineChart
        data={chartData}
        width={screenWidth}
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
});

export default LineChartComponent;