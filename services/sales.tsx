import { firestore } from '../config/firebase';
import { collection, query, doc, getDoc, updateDoc, setDoc, where, getDocs, Timestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

// Define the interfaces
interface SaleMetadata {
  id: string;
  lineItems: Array<{
    price: number;
    productId: string;
    quantity: number;
  }>;
  timestamp: Date;
  paymentMethod: string;
  status: string;
  totalPrice: number;
}

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  transactions: SaleMetadata[];
  hourlyRevenue?: number[];
  weeklyRevenue?: number[];
  monthlyRevenue?: number[];
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
      try {
        // Create the sale metadata
        const sale: SaleMetadata = {
          id: Date.now().toString(),
          lineItems: [{
            price: amount,
            productId: 'Sale',
            quantity: 1,
          }],
          timestamp: new Date(),
          paymentMethod: 'cash'
        };

        // Format the date for the document ID (YYYY-MM-DD)
        const dateStr = sale.timestamp.toISOString().split('T')[0];
        
        // Reference to the date document
        const dateDocRef = doc(firestore, `shops/${shopId}/sales/${dateStr}`);
        
        // Get the current date document if it exists
        const dateDoc = await getDoc(dateDocRef);
        
        if (dateDoc.exists()) {
          // Update existing date document
          const currentData = dateDoc.data();
          const updatedTransactions = [...(currentData.transactions || []), {
            id: sale.id,
            lineItems: sale.lineItems.map(item => ({
              ...item,
              status: 'completed'
            })),
            timestamp: Timestamp.fromDate(sale.timestamp)
          }];

          await updateDoc(dateDocRef, {
            salesCount: updatedTransactions.length,
            totalRevenue: currentData.totalRevenue + amount,
            transactions: updatedTransactions
          });
        } else {
          // Create new date document
          await setDoc(dateDocRef, {
            salesCount: 1,
            totalRevenue: amount,
            transactions: [{
              id: sale.id,
              lineItems: sale.lineItems.map(item => ({
                ...item,
                status: 'completed'
              })),
              timestamp: Timestamp.fromDate(sale.timestamp)
            }]
          });
        }
      } catch (error) {
        console.error('Error adding new sale:', error);
        throw error;
      }
    },

    async getTodaysSalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const salesRef = doc(firestore, `shops/${shopId}/sales/${dateStr}`);
        
        const dateDoc = await getDoc(salesRef);
        if (dateDoc.exists()) {
          const data = dateDoc.data();
          const transactions: SaleMetadata[] = data.transactions.map((transaction: any) => ({
            id: transaction.id,
            lineItems: transaction.lineItems,
            timestamp: transaction.timestamp.toDate(),
            paymentMethod: transaction.paymentMethod || 'cash', // Assuming 'cash' if not specified
            status: transaction.status || 'completed', // Assuming 'completed' if not specified
            totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          }));
          
          const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
          
          const groupByHour = (transactions: SaleMetadata[]) => { 
            return transactions.reduce((acc, transaction) => {
              const hour = transaction.timestamp.getHours();
              acc[hour] = (acc[hour] || 0) + transaction.totalPrice;
              return acc;
            }, {} as { [key: number]: number });
          };
    
          const hourlyRevenue = groupByHour(transactions);
          const hourlyData = Array.from({ length: 24 }, (_, i) => hourlyRevenue[i] || 0);

          return {
            totalRevenue,
            salesCount: transactions.length,
            transactions,
            hourlyRevenue: hourlyData
          };
        } else {
          return {
            totalRevenue: 0,
            salesCount: 0,
            transactions: [],
            hourlyRevenue: Array(24).fill(0)
          };
        }
      } catch (error) {
        console.error('Error fetching today\'s sales:', error);
        throw error;
      }
    },

    async getWeeklySalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // 7 days including today
        
        let allTransactions: SaleMetadata[] = [];
        let totalRevenue = 0;

        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const salesRef = doc(firestore, `shops/${shopId}/sales/${dateStr}`);
          const dateDoc = await getDoc(salesRef);
          
          if (dateDoc.exists()) {
            const data = dateDoc.data();
            const transactions = data.transactions.map((transaction: any) => ({
              id: transaction.id,
              lineItems: transaction.lineItems,
              timestamp: transaction.timestamp.toDate(),
              paymentMethod: transaction.paymentMethod || 'cash',
              status: transaction.status || 'completed',
              totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }));
            allTransactions = allTransactions.concat(transactions);
            totalRevenue += data.totalRevenue;
          }
        }

        const groupByDay = (transactions: SaleMetadata[]) => {
          return transactions.reduce((acc, transaction) => {
            const day = transaction.timestamp.getDay();
            acc[day] = (acc[day] || 0) + transaction.totalPrice;
            return acc;
          }, {} as { [key: number]: number });
        };
  
        const dailyRevenue = groupByDay(allTransactions);
        const weeklyData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i) => dailyRevenue[i] || 0);

        return {
          totalRevenue,
          salesCount: allTransactions.length,
          transactions: allTransactions,
          weeklyRevenue: weeklyData
        };
      } catch (error) {
        console.error('Error fetching weekly sales:', error);
        throw error;
      }
    },

    async getMonthlySalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); // 31 days including today
        
        let allTransactions: SaleMetadata[] = [];
        let totalRevenue = 0;
    
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const salesRef = doc(firestore, `shops/${shopId}/sales/${dateStr}`);
          const dateDoc = await getDoc(salesRef);
          
          if (dateDoc.exists()) {
            const data = dateDoc.data();
            const transactions = data.transactions.map((transaction: any) => ({
              id: transaction.id,
              lineItems: transaction.lineItems,
              timestamp: transaction.timestamp.toDate(),
              paymentMethod: transaction.paymentMethod || 'cash',
              status: transaction.status || 'completed',
              totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }));
            allTransactions = allTransactions.concat(transactions);
            totalRevenue += data.totalRevenue;
          }
        }
    
        const groupByWeek = (transactions: SaleMetadata[]) => {
          return transactions.reduce((acc, transaction) => {
            const week = Math.floor((transaction.timestamp.getDate() - 1) / 7);
            acc[week] = (acc[week] || 0) + transaction.totalPrice;
            return acc;
          }, {} as { [key: number]: number });
        };
    
        const weeklyRevenue = groupByWeek(allTransactions);
        const monthlyData = Array.from({ length: 5 }, (_, i) => weeklyRevenue[i] || 0); // Assuming up to 5 weeks in a month
    
        return {
          totalRevenue,
          salesCount: allTransactions.length,
          transactions: allTransactions,
          monthlyRevenue: monthlyData
        };
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
        throw error;
      }
    }
  };
};

export type { SaleMetadata, SalesData, SalesService };