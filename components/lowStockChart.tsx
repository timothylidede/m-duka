import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const LowStockChart: React.FC = () => {
  // Sample data for the chart
  const data = {
    labels: ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Today'],
    datasets: [
      {
        data: [120, 70, 65, 50, 29, 35], // Stock levels decreasing over months
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // Red line for warning
        strokeWidth: 3, // Thick line for visibility
      },
    ],
    legend: ['Low Stock'], // Label for the chart
  };

  const chartConfig = {
    backgroundGradientFrom: '#F5F7FA', // Light, neutral background
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: '#E4E7EB', // Slight gradient for depth
    backgroundGradientToOpacity: 1,
    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`, // Dark gray-blue for a modern look
    strokeWidth: 3, // Clean, strong line
    barPercentage: 0.5,
    decimalPlaces: 0, // No decimals for clean numbers
    propsForDots: {
      r: '6', // Medium-sized dots for readability
      strokeWidth: '2',
      stroke: '#3498DB', // Vibrant blue accent
    },
    propsForLabels: {
      fontSize: 14, // Larger text for readability
      fontWeight: '600',
    },
    useShadowColorFromDataset: false, // Keep it crisp without shadow clutter
    propsForBackgroundLines: {
      stroke: 'rgba(44, 62, 80, 0.1)', // Faint grid lines for guidance
    },
  };
  

  // Get device width for responsive design
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>⚠️ Warning: Stock Levels Dropping</Text>
      <LineChart
        data={data}
        width={0.9 * screenWidth}
        height={0.6 * screenWidth}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

export default LowStockChart;

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
  },
  header: {
    textAlign: 'center',
    fontSize: 18,
    padding: 16,
    fontWeight: 'bold',
    color: '#ff0000', // Red text to indicate urgency
  },
  chart: {
    marginVertical: 3,
    borderRadius: 16,
  },
    glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Frosted glass effect
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5, // For Android shadow
  },
});
