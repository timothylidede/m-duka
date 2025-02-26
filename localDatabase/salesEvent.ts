import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { SalesEvent} from './types';
import { salesHistoryTable} from './database';
import { Alert } from 'react-native';

export const getSalesHistory = async (database: SQLiteDatabase): Promise<SalesEvent[] | null> => {
    const result = await database.getAllAsync<SalesEvent>(`SELECT * FROM ${salesHistoryTable}`);
    return result;
    // setData(result);
};




export const handleSaveSalesEvent = async (database: SQLiteDatabase, saleEvent: SalesEvent) => {
    try {
        const insertQuery = `
          INSERT INTO ${salesHistoryTable} (
            productID, quantity, revenue, year, month, day, hour, minute
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    
        // Prepare the values array
        const values = [
            saleEvent.productID,
            saleEvent.quantity,
            saleEvent.revenue,
            saleEvent.year,
            saleEvent.month,
            saleEvent.day,
            saleEvent.hour,
            saleEvent.minute
        ];
    
        // Execute the query
        const response = await database.runAsync(insertQuery, values);
        // console.log("Item saved successfully:", response?.changes!);
        // router.back();
      } catch (error) {
        console.error("Error saving item:", error);
        // Alert.alert("Error saving item:", error.toString());
      }
}

//can also be used to get dailt revenue
export const getTodaysSalesEvents = async (database: SQLiteDatabase): Promise<SalesEvent[]> => {
    const result = await database.getAllSync<SalesEvent>(`SELECT * FROM ${salesHistoryTable} WHERE day = ?`, [new Date().getDay()]);
    return result;
}