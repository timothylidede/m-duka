import { SQLiteDatabase } from 'expo-sqlite';
import { Product } from './types';
import { productsTableName } from './database';
import { Alert } from 'react-native';

export const loadProductsData = async (database: SQLiteDatabase): Promise<Product[] | null> => {
  const result = await database.getAllAsync<Product>(`SELECT * FROM ${productsTableName}`);
  return result;
  // setData(result);
};

export const handleSaveProduct = async (product:Product, database:SQLiteDatabase) => {
  try {
    const insertQuery = `
      INSERT INTO ${productsTableName} (
        id, name, price, unit, quantity, description,
        isNearlyStockedOut, isStockedOut,
        movingFast, dailySales, weeklySales, 
        monthlySales, yearlySales,
        dailyRevenue, weeklyRevenue, 
        monthlyRevenue, yearlyRevenue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Prepare the values array
    const values = [
      product.id,
      product.name,
      product.price,
      product.unit,
      product.quantity,
      product.description,
      product.isNearlyStockedOut, // Handle optional fields
      product.isStockedOut,
      product.movingFast,
      product.dailySales,
      product.weeklySales,
      product.monthlySales,
      product.yearlySales,
      product.dailyRevenue,
      product.weeklyRevenue,
      product.monthlyRevenue,
      product.yearlyRevenue,
    ];

    // Execute the query
    const response = await database.runAsync(insertQuery, values);
    console.log("Item saved successfully:", response?.changes!);
    // router.back();
  } catch (error) {
    console.error("Error saving item:", error);
    // Alert.alert("Error saving item:", error.toString());
  }
};

export const handleDeleteProduct = async (product: Product, database: SQLiteDatabase) => {
  try {
    const deleteQuery = `DELETE FROM ${productsTableName} WHERE id = ?`;
    const response = await database.runAsync(deleteQuery, [product.id]);
    // console.log("Item deleted successfully:", response?.changes!);
    Alert.alert(`We are sorry to see you delete a product. `,`The product ${product.id} has been deleted successfully with ${product.yearlyRevenue?product.yearlyRevenue:0} yearly revenue and ${product.yearlySales?product.yearlySales:0} yearly sales`);
  } catch (error) {
    console.error("Error deleting item:", error);
    // Alert.alert("Error deleting item:", error.toString());
  }
}
