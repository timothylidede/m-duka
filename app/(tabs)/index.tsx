import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Button, ToggleButton, Dialog, Portal, TextInput } from 'react-native-paper';

// Type for the sale details
interface SaleDetails {
  product: string;
  amount: string;
}

// InfographicCard Component
interface InfographicCardProps {
  state: 'daily' | 'weekly' | 'monthly';
}

const InfographicCard: React.FC<InfographicCardProps> = ({ state }) => {
  const data = {
    daily: 150,
    weekly: 1050,
    monthly: 4500,
  };

  return (
    <View style={styles.infographicCard}>
      <Text style={styles.cardTitle}>Sales Snapshot</Text>
      <Text style={styles.cardData}>
        {state === 'daily' ? `${data.daily} Sales (Daily)` : ''}
        {state === 'weekly' ? `${data.weekly} Sales (Weekly)` : ''}
        {state === 'monthly' ? `${data.monthly} Sales (Monthly)` : ''}
      </Text>
    </View>
  );
};

const SalesPage: React.FC = () => {
  const [state, setState] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [visible, setVisible] = useState<boolean>(false);
  const [saleDetails, setSaleDetails] = useState<SaleDetails>({
    product: '',
    amount: '',
  });

  const showDialog = (): void => setVisible(true);
  const hideDialog = (): void => setVisible(false);

  const handleAddSale = (): void => {
    console.log('New Sale Details:', saleDetails);
    hideDialog();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Toggle Button */}
      <View style={styles.toggleContainer}>
        <ToggleButton.Row onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setState(value )} value={state}>
          <ToggleButton icon="calendar-day" value="daily" />
          <ToggleButton icon="calendar-week" value="weekly" />
          <ToggleButton icon="calendar-month" value="monthly" />
        </ToggleButton.Row>
      </View>

      {/* Infographic Card */}
      <InfographicCard state={state} />

      {/* Add Sale Button */}
      <Button mode="contained" onPress={showDialog} style={styles.button}>
        Add New Sale
      </Button>

      {/* Sale Dialog */}
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Add New Sale</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Product"
              value={saleDetails.product}
              onChangeText={(text:string) => setSaleDetails({ ...saleDetails, product: text })}
              style={styles.input}
            />
            <TextInput
              label="Amount"
              value={saleDetails.amount}
              onChangeText={(text:string ) => setSaleDetails({ ...saleDetails, amount: text })}
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={handleAddSale}>Add Sale</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  toggleContainer: {
    marginBottom: 20,
  },
  infographicCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardData: {
    fontSize: 18,
    marginTop: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#4caf50',
  },
  input: {
    marginBottom: 10,
  },
});

export default SalesPage;
