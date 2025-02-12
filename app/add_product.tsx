import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface ProductForm {
  sku: string;
  name: string;
  category: string;
  costPrice: string;
  sellingPrice: string;
  quantity: string;
  reorderLevel: string;
  description: string;
}

const AddProductPage: React.FC = () => {
  const [productForm, setProductForm] = useState<ProductForm>({
    sku: '',
    name: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: '',
    description: '',
  });

  const InputField: React.FC<{
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string;
    keyboardType?: 'default' | 'numeric';
    multiline?: boolean;
  }> = ({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabel}>
        <Feather name={icon as any} size={20} color="#2E3192" />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const handleSubmit = () => {
    // Validate form
    if (!productForm.name || !productForm.sku || !productForm.sellingPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Handle form submission
    console.log('Product Form:', productForm);
    Alert.alert('Success', 'Product added successfully');
    // Reset form
    setProductForm({
      sku: '',
      name: '',
      category: '',
      costPrice: '',
      sellingPrice: '',
      quantity: '',
      reorderLevel: '',
      description: '',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add New Product',
          headerStyle: {
            backgroundColor: '#2E3192',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: true,
        }}
      />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.formContainer}>

            <InputField
              label="Product Name"
              value={productForm.name}
              onChangeText={(text) => setProductForm({ ...productForm, name: text })}
              placeholder="Enter product name"
              icon="box"
            />

            <InputField
              label="Cost Price"
              value={productForm.costPrice}
              onChangeText={(text) => setProductForm({ ...productForm, costPrice: text })}
              placeholder="Enter cost price"
              icon="dollar-sign"
              keyboardType="numeric"
            />

            <InputField
              label="Selling Price"
              value={productForm.sellingPrice}
              onChangeText={(text) => setProductForm({ ...productForm, sellingPrice: text })}
              placeholder="Enter selling price"
              icon="credit-card"
              keyboardType="numeric"
            />

            <InputField
              label="Initial Quantity"
              value={productForm.quantity}
              onChangeText={(text) => setProductForm({ ...productForm, quantity: text })}
              placeholder="Enter initial quantity"
              icon="package"
              keyboardType="numeric"
            />

            <InputField
              label="Reorder Level"
              value={productForm.reorderLevel}
              onChangeText={(text) => setProductForm({ ...productForm, reorderLevel: text })}
              placeholder="Enter reorder level"
              icon="alert-circle"
              keyboardType="numeric"
            />


          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <LinearGradient
                colors={['#2E3192', '#1BFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Feather name="plus-circle" size={24} color="white" />
                <Text style={styles.submitButtonText}>Add Product</Text>
              </LinearGradient>
            </TouchableOpacity>
        </ScrollView>

      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default AddProductPage;