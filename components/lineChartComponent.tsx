import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const LineChartComponent: React.FC = () => {
    // Sample data for the chart
    const data = {
      labels: ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Today'],
      datasets: [
        {
          data: [6400, 7500, 8878, 8000, 8100, 9900],
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // Optional
          strokeWidth: 3, // Optional
        },
      ],
      legend: ['Revenue'], // Optional
    };
  
    const chartConfig = {
        backgroundGradientFrom: '#ffffff', // White background
        backgroundGradientFromOpacity: 1,
        backgroundGradientTo: '#ffffff', // White background
        backgroundGradientToOpacity: 1,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Black lines and labels
        strokeWidth: 2, // Keep it clean and minimal
        barPercentage: 0.5,
        decimalPlaces: 0, // No decimal places for a cleaner look
        propsForDots: {
          r: '4', // Small dots for a subtle effect
          strokeWidth: '1',
          stroke: '#000000',
        },
        useShadowColorFromDataset: false, // Remove unnecessary shadows
      };
      
  
    // Get device width for responsive design
    const screenWidth = Dimensions.get('window').width;
  
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Way to go, we are having positive revenue growth</Text>
        <LineChart
          data={data}
          width={0.9*screenWidth}
          height={0.6*screenWidth}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };
  
  export default LineChartComponent;

  
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

    },
    chart: {
      marginVertical: 3,
      borderRadius: 16,

    },
  });
  