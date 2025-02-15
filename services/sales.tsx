import { firestore } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

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

interface SalesService {
  addNewSale: (amount: number) => Promise<void>;
  getTodaysSalesData: () => Promise<SalesData>;
  getWeeklySalesData: () => Promise<SalesData>;
  getMonthlySalesData: () => Promise<SalesData>;
}

export const useSalesService = (): SalesService => {
  const { shopData, isInitialized } = useContext(AuthContext);

  if (!isInitialized || !shopData) {
    // Return a no-op implementation so that the hook is always called.
    return {
      addNewSale: async () => {},
      getTodaysSalesData: async () => ({
        totalRevenue: 0,
        salesCount: 0,
        transactions: [],
      }),
      getWeeklySalesData: async () => ({
        totalRevenue: 0,
        salesCount: 0,
        transactions: [],
      }),
      getMonthlySalesData: async () => ({
        totalRevenue: 0,
        salesCount: 0,
        transactions: [],
      }),
    };
  }

  const shopId = shopData.contact;

  return {
    async addNewSale(amount: number): Promise<void> {
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
        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        await addDoc(salesRef, {
          ...sale,
          timestamp: Timestamp.fromDate(sale.timestamp)
        });
      } catch (error) {
        console.error('Error adding new sale:', error);
        throw error;
      }
    },

    async getTodaysSalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(
          salesRef,
          where('timestamp', '>=', Timestamp.fromDate(startOfToday)),
          where('timestamp', '<=', Timestamp.fromDate(endOfToday))
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

    async getWeeklySalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(
          salesRef,
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

    async getMonthlySalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(
          salesRef,
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
};

export type { SaleMetadata, SalesData, SalesService };