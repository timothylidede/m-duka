// services/sales.ts

import { firestore } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

// Define the interfaces
interface SaleMetadata {
  id: string;
  lineItems: Array<{
    price: number;
    productId: string;
    quantity: number;
    paymentMethod: string;
  }>;
  timestamp: Date;
}

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  transactions: SaleMetadata[];
}

// Define the service interface explicitly
interface SalesService {
  addNewSale: (amount: number, shopId: string) => Promise<void>;
  getTodaysSalesData: (shopId: string) => Promise<SalesData>;
  getWeeklySalesData: (shopId: string) => Promise<SalesData>;
  getMonthlySalesData: (shopId: string) => Promise<SalesData>;
}

// Implement the service
export const salesService: SalesService = {
  async addNewSale(amount: number, shopId: string): Promise<void> {
    const sale: SaleMetadata = {
      id: Date.now().toString(),
      lineItems: [{
        price: amount,
        productId: 'default',
        quantity: 1,
        paymentMethod: 'cash'
      }],
      timestamp: new Date()
    };

    try {
      const salesRef = collection(firestore, 'sales');
      await addDoc(salesRef, {
        ...sale,
        shopId,
        timestamp: Timestamp.fromDate(sale.timestamp)
      });
    } catch (error) {
      console.error('Error adding new sale:', error);
      throw error;
    }
  },

  async getTodaysSalesData(shopId: string): Promise<SalesData> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const salesRef = collection(firestore, 'sales');
      const q = query(
        salesRef,
        where('shopId', '==', shopId),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay))
      );

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = [];
      let totalRevenue = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const sale: SaleMetadata = {
          id: doc.id,
          lineItems: data.lineItems,
          timestamp: data.timestamp.toDate()
        };
        transactions.push(sale);
        totalRevenue += sale.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      });

      return {
        totalRevenue,
        salesCount: transactions.length,
        transactions
      };
    } catch (error) {
      console.error('Error fetching today\'s sales:', error);
      throw error;
    }
  },

  async getWeeklySalesData(shopId: string): Promise<SalesData> {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const salesRef = collection(firestore, 'sales');
      const q = query(
        salesRef,
        where('shopId', '==', shopId),
        where('timestamp', '>=', Timestamp.fromDate(startOfWeek))
      );

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = [];
      let totalRevenue = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const sale: SaleMetadata = {
          id: doc.id,
          lineItems: data.lineItems,
          timestamp: data.timestamp.toDate()
        };
        transactions.push(sale);
        totalRevenue += sale.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      });

      return {
        totalRevenue,
        salesCount: transactions.length,
        transactions
      };
    } catch (error) {
      console.error('Error fetching weekly sales:', error);
      throw error;
    }
  },

  async getMonthlySalesData(shopId: string): Promise<SalesData> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      startOfMonth.setHours(0, 0, 0, 0);

      const salesRef = collection(firestore, 'sales');
      const q = query(
        salesRef,
        where('shopId', '==', shopId),
        where('timestamp', '>=', Timestamp.fromDate(startOfMonth))
      );

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = [];
      let totalRevenue = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const sale: SaleMetadata = {
          id: doc.id,
          lineItems: data.lineItems,
          timestamp: data.timestamp.toDate()
        };
        transactions.push(sale);
        totalRevenue += sale.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      });

      return {
        totalRevenue,
        salesCount: transactions.length,
        transactions
      };
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
      throw error;
    }
  }
};

// Export types for external use
export type { SaleMetadata, SalesData, SalesService };