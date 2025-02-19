import { firestore } from '../config/firebase';
import { collection, query, doc, getDoc, updateDoc, setDoc, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
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
  status: 'completed' | 'pending' | 'failed';
  totalPrice: number;
}

interface getSaleMetadata {
  id: string;
  totalPrice: number;
  timestamp: Date;
  lineItems?: []; // Keep as an array to maintain structure, but empty
  paymentMethod?: string; // Could be kept or removed depending on future needs
  status?: string; // Could be kept or removed depending on future needs
}

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  transactions?: SaleMetadata[];
  hourlyRevenue?: number[];
  weeklyRevenue?: number[];
  monthlyRevenue?: number[];
}

interface TransactionListOptions {
  status?: 'completed' | 'pending' | 'failed' | 'all';
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

interface TransactionListResult {
  transactions: SaleMetadata[];
  totalCount: number;
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  completionRate: number;
  averageTransactionValue: number;
}

interface SalesService {
  addNewSale: (amount: number) => Promise<void>;
  getTodaysSalesData: () => Promise<SalesData>;
  getWeeklySalesData: () => Promise<SalesData>;
  getMonthlySalesData: () => Promise<SalesData>;
  getTransactions: (options?: TransactionListOptions) => Promise<TransactionListResult>;
  updateTransactionStatus: (transactionId: string, newStatus: 'completed' | 'pending' | 'failed') => Promise<boolean>;
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
      getTransactions: async () => ({
        transactions: [],
        totalCount: 0,
        totalRevenue: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        completionRate: 0,
        averageTransactionValue: 0,
      }),
      updateTransactionStatus: async () => false,
    };
  }

  const shopId = shopData.contact;

  // Helper function to convert Firestore transaction to SaleMetadata
  const convertToSaleMetadata = (transaction: any, dateStr?: string): SaleMetadata => {
    return {
      id: transaction.id || Date.now().toString(), // Default to timestamp if no ID
      lineItems: transaction.lineItems || [],
      timestamp: transaction.timestamp?.toDate() || new Date(),
      paymentMethod: transaction.paymentMethod || 'unknown',
      status: (transaction.status as 'completed' | 'pending' | 'failed') || 'pending',
      totalPrice: transaction.totalPrice || 
                  (transaction.lineItems ? 
                   transaction.lineItems.reduce((sum: number, item: any) => 
                     sum + (item.price * item.quantity), 0) : 0),
    };
  };

  return {
    async addNewSale(amount: number): Promise<void> {
      try {
        // Create the sale metadata
        const sale: SaleMetadata = {
          id: Date.now().toString(),
          lineItems: [{
            price: amount,
            productId: 'No product ID',
            quantity: 0,
          }],
          timestamp: new Date(),
          paymentMethod: 'cash',
          status: 'pending',
          totalPrice: amount // Adding totalPrice to match the SaleMetadata interface
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
            ...sale,
            timestamp: Timestamp.fromDate(sale.timestamp) // Convert Date to Firestore Timestamp
          }];
    
          await updateDoc(dateDocRef, {
            salesCount: updatedTransactions.length,
            totalRevenue: currentData.totalRevenue + sale.totalPrice,
            transactions: updatedTransactions
          });
        } else {
          // Create new date document
          await setDoc(dateDocRef, {
            salesCount: 1,
            totalRevenue: sale.totalPrice,
            transactions: [{
              ...sale,
              timestamp: Timestamp.fromDate(sale.timestamp) // Convert Date to Firestore Timestamp
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
          
          // Directly fetching totalRevenue and salesCount
          const totalRevenue = data.totalRevenue;
          const salesCount = data.salesCount;
          
          // Mapping transactions with less detail since we're not calculating revenue or count
          const transactions: getSaleMetadata[] = (data.transactions as any[]).map((transaction) => ({
            id: transaction.id,
            totalPrice: transaction.totalPrice || 0,
            timestamp: transaction.timestamp ? transaction.timestamp.toDate() : new Date(),
            lineItems: [],
            paymentMethod: transaction.paymentMethod || 'unknown',
            status: transaction.status || 'unknown'
          }));
          
          const groupByHour = (transactions: getSaleMetadata[]) => {
            const hourlyRevenue = new Array(24).fill(0);
            transactions.forEach((transaction) => {
              const hour = transaction.timestamp.getHours();
              hourlyRevenue[hour] += transaction.totalPrice;
            });
            return hourlyRevenue;
          };
      
          const hourlyData = groupByHour(transactions);
      
          return {
            totalRevenue,
            salesCount: transactions.length,
            transactions: transactions.map(t => convertToSaleMetadata(t, dateStr)), // Convert back to SaleMetadata for consistency
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
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of the current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(salesRef, where('__name__', '>=', startOfWeek.toISOString().split('T')[0]));
        const querySnapshot = await getDocs(q);

        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;

        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.transactions) {
            const transactions: getSaleMetadata[] = (data.transactions as any[]).map((transaction) => ({
              id: transaction.id,
              totalPrice: transaction.totalPrice || 0,
              timestamp: transaction.timestamp ? transaction.timestamp.toDate() : new Date(),
              lineItems: [],
              paymentMethod: transaction.paymentMethod,
              status: transaction.status
            }));

            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
          }
        });

        const groupByDay = (transactions: getSaleMetadata[]) => {
          return transactions.reduce((acc, transaction) => {
            const day = transaction.timestamp.getDay();
            acc[day] = (acc[day] || 0) + transaction.totalPrice;
            return acc;
          }, {} as { [key: number]: number });
        };

        const dailyRevenue = groupByDay(allTransactions);
        const daysData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i) => dailyRevenue[i] || 0);

        return {
          totalRevenue,
          salesCount: allTransactions.length,
          transactions: allTransactions.map(t => convertToSaleMetadata(t)),
          weeklyRevenue: daysData
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

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(salesRef, where('__name__', '>=', startOfMonth.toISOString().split('T')[0]));
        const querySnapshot = await getDocs(q);

        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;

        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.transactions) {
            const transactions: getSaleMetadata[] = (data.transactions as any[]).map((transaction) => ({
              id: transaction.id,
              totalPrice: transaction.totalPrice || 0,
              timestamp: transaction.timestamp ? transaction.timestamp.toDate() : new Date(),
              lineItems: [],
              paymentMethod: transaction.paymentMethod,
              status: transaction.status
            }));

            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
          }
        });

        const groupByWeek = (transactions: getSaleMetadata[]) => {
          return transactions.reduce((acc, transaction) => {
            const week = Math.floor((transaction.timestamp.getTime() - startOfMonth.getTime()) / (7 * 24 * 60 * 60 * 1000));
            acc[week] = (acc[week] || 0) + transaction.totalPrice;
            return acc;
          }, {} as { [key: number]: number });
        };

        const weeklyRevenue = groupByWeek(allTransactions);
        const monthlyData = Array.from({ length: 4 }, (_, i) => weeklyRevenue[i] || 0); // Assuming 4 weeks in a month

        return {
          totalRevenue,
          salesCount: allTransactions.length,
          transactions: allTransactions.map(t => convertToSaleMetadata(t)),
          monthlyRevenue: monthlyData
        };
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
        throw error;
      }
    },

    // New functions
    async getTransactions(options?: TransactionListOptions): Promise<TransactionListResult> {
      let q = query(collection(firestore, `shops/${shopId}/sales`), orderBy('timestamp', 'desc'));

      if (options) {
        if (options.status && options.status !== 'all') {
          q = query(q, where('status', '==', options.status));
        }
        if (options.limit) {
          q = query(q, limit(options.limit));
        }
        if (options.offset) {
          console.warn('Offset is not directly supported by Firestore. Consider using startAfter for pagination.');
        }
        if (options.startDate) {
          q = query(q, where('timestamp', '>=', options.startDate));
        }
        if (options.endDate) {
          q = query(q, where('timestamp', '<=', options.endDate));
        }
      }

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = querySnapshot.docs.map(doc => convertToSaleMetadata(doc.data()));

      const totalRevenue = transactions.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const totalCount = transactions.length;
      const completedCount = transactions.filter(t => t.status === 'completed').length;
      const pendingCount = transactions.filter(t => t.status === 'pending').length;
      const failedCount = transactions.filter(t => t.status === 'failed').length;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      const averageTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0;

      return {
        transactions,
        totalCount,
        totalRevenue,
        completedCount,
        pendingCount,
        failedCount,
        completionRate,
        averageTransactionValue,
      };
    },

    async updateTransactionStatus(transactionId: string, newStatus: 'completed' | 'pending' | 'failed'): Promise<boolean> {
      try {
        const transactionRef = doc(collection(firestore, `shops/${shopId}/sales`), transactionId);
        const docSnap = await getDoc(transactionRef);

        if (docSnap.exists()) {
          await updateDoc(transactionRef, { status: newStatus });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error updating transaction status:', error);
        return false;
      }
    },
  };
};

export type { SaleMetadata, SalesData, SalesService, TransactionListOptions, TransactionListResult, getSaleMetadata };