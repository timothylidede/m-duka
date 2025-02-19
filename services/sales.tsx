import { firestore } from '../config/firebase';
import { collection, query, doc, getDoc, updateDoc, orderBy, limit, setDoc, where, getDocs, Timestamp } from 'firebase/firestore';
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

  const convertToSaleMetadata = (transaction: any, dateStr?: string): SaleMetadata => {
    // Safely handle timestamp, checking if it's a Firestore Timestamp or something else
    let timestamp: Date;
    if (transaction.timestamp instanceof Timestamp) {
      timestamp = transaction.timestamp.toDate(); // Convert Firestore Timestamp to Date
    } else if (transaction.timestamp instanceof Date) {
      timestamp = transaction.timestamp; // Already a Date, use as is
    } else if (typeof transaction.timestamp === 'string') {
      timestamp = new Date(transaction.timestamp); // Convert string to Date
    } else {
      timestamp = new Date(); // Default to current date if all else fails
    }

    return {
      id: transaction.id || Date.now().toString(),
      lineItems: transaction.lineItems || [],
      timestamp: timestamp,
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
          totalPrice: amount,
        };

        const dateStr = sale.timestamp.toISOString().split('T')[0];
        const dateDocRef = doc(firestore, `shops/${shopId}/sales/${dateStr}`);

        const dateDoc = await getDoc(dateDocRef);

        if (dateDoc.exists()) {
          const currentData = dateDoc.data();
          const updatedTransactions = [...(currentData.transactions || []), {
            ...sale,
            timestamp: Timestamp.fromDate(sale.timestamp),
          }];

          await updateDoc(dateDocRef, {
            salesCount: updatedTransactions.length,
            totalRevenue: currentData.totalRevenue + sale.totalPrice,
            transactions: updatedTransactions,
          });
        } else {
          await setDoc(dateDocRef, {
            salesCount: 1,
            totalRevenue: sale.totalPrice,
            transactions: [{
              ...sale,
              timestamp: Timestamp.fromDate(sale.timestamp),
            }],
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

          const totalRevenue = data.totalRevenue || 0;
          const salesCount = data.salesCount || 0;

          interface TransactionData {
            id: string;
            lineItems: Array<{
              price: number;
              productId: string;
              quantity: number;
              status?: string;
            }>;
            timestamp: any; // Could be Timestamp, Date, or string
            paymentMethod?: string;
            status?: string;
            totalPrice?: number;
          }

          const transactions: getSaleMetadata[] = (data.transactions as TransactionData[]).map((transaction) => ({
            id: transaction.id,
            totalPrice: transaction.totalPrice || 0,
            timestamp: transaction.timestamp instanceof Timestamp ? transaction.timestamp.toDate() : new Date(transaction.timestamp),
            lineItems: [],
            paymentMethod: transaction.paymentMethod || 'unknown',
            status: transaction.status || 'unknown',
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
            salesCount,
            transactions: transactions.map(t => convertToSaleMetadata(t, dateStr)),
            hourlyRevenue: hourlyData,
          };
        } else {
          return {
            totalRevenue: 0,
            salesCount: 0,
            transactions: [],
            hourlyRevenue: Array(24).fill(0),
          };
        }
      } catch (error) {
        console.error('Error fetching today\'s sales:', error);
        throw error;
      }
    },

    async getWeeklySalesData(daysBack: number = 7): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (daysBack - 1));

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(salesRef, where('__name__', '>=', startDate.toISOString().split('T')[0]), where('__name__', '<=', endDate.toISOString().split('T')[0]));
        const querySnapshot = await getDocs(q);

        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;

        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.transactions) {
            interface TransactionData {
              id: string;
              lineItems: Array<{
                price: number;
                productId: string;
                quantity: number;
                status?: string;
              }>;
              timestamp: any; // Could be Timestamp, Date, or string
              paymentMethod?: string;
              status?: string;
              totalPrice?: number;
            }

            const filteredTransactions: TransactionData[] = (data.transactions as TransactionData[]).filter(transaction => {
              if (transaction.timestamp) {
                let transactionDate: Date;
                if (transaction.timestamp instanceof Timestamp) {
                  transactionDate = transaction.timestamp.toDate();
                } else if (transaction.timestamp instanceof Date) {
                  transactionDate = transaction.timestamp;
                } else if (typeof transaction.timestamp === 'string') {
                  transactionDate = new Date(transaction.timestamp);
                } else {
                  transactionDate = new Date(); // Fallback
                }
                return transactionDate >= startDate && transactionDate <= endDate;
              }
              return false;
            });

            const transactions: getSaleMetadata[] = filteredTransactions.map((transaction) => ({
              id: transaction.id,
              totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              timestamp: transaction.timestamp instanceof Timestamp ? transaction.timestamp.toDate() : new Date(transaction.timestamp),
              lineItems: [],
              paymentMethod: transaction.paymentMethod,
              status: transaction.status,
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
          weeklyRevenue: daysData.slice(0, daysBack),
        };
      } catch (error) {
        console.error('Error fetching weekly sales:', error);
        throw error;
      }
    },

    async getMonthlySalesData(daysBack: number = 30): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (daysBack - 1));

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(salesRef, where('__name__', '>=', startDate.toISOString().split('T')[0]), where('__name__', '<=', endDate.toISOString().split('T')[0]));
        const querySnapshot = await getDocs(q);

        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;

        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.transactions) {
            interface TransactionData {
              id: string;
              lineItems: Array<{
                price: number;
                productId: string;
                quantity: number;
                status?: string;
              }>;
              timestamp: any; // Could be Timestamp, Date, or string
              paymentMethod?: string;
              status?: string;
              totalPrice?: number;
            }

            const filteredTransactions: TransactionData[] = (data.transactions as TransactionData[]).filter(transaction => {
              if (transaction.timestamp) {
                let transactionDate: Date;
                if (transaction.timestamp instanceof Timestamp) {
                  transactionDate = transaction.timestamp.toDate();
                } else if (transaction.timestamp instanceof Date) {
                  transactionDate = transaction.timestamp;
                } else if (typeof transaction.timestamp === 'string') {
                  transactionDate = new Date(transaction.timestamp);
                } else {
                  transactionDate = new Date(); // Fallback
                }
                return transactionDate >= startDate && transactionDate <= endDate;
              }
              return false;
            });

            const transactions: getSaleMetadata[] = filteredTransactions.map((transaction) => ({
              id: transaction.id,
              totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              timestamp: transaction.timestamp instanceof Timestamp ? transaction.timestamp.toDate() : new Date(transaction.timestamp),
              lineItems: [],
              paymentMethod: transaction.paymentMethod,
              status: transaction.status,
            }));

            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
          }
        });

        const groupByWeek = (transactions: getSaleMetadata[]) => {
          return transactions.reduce((acc, transaction) => {
            const daysFromStart = Math.floor((transaction.timestamp.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const week = Math.floor(daysFromStart / 7);
            acc[week] = (acc[week] || 0) + transaction.totalPrice;
            return acc;
          }, {} as { [key: number]: number });
        };

        const weeklyRevenue = groupByWeek(allTransactions);
        const numOfWeeks = Math.ceil(daysBack / 7);
        const monthlyData = Array.from({ length: numOfWeeks }, (_, i) => weeklyRevenue[i] || 0);

        return {
          totalRevenue,
          salesCount: allTransactions.length,
          transactions: allTransactions.map(t => convertToSaleMetadata(t)),
          monthlyRevenue: monthlyData,
        };
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
        throw error;
      }
    },

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