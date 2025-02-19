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
  status: string;
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

  const convertToSaleMetadata = (transaction: any, dateStr?: string): SaleMetadata => {
    return {
      id: transaction.id || Date.now().toString(), // Default to timestamp if no ID
      lineItems: transaction.lineItems || [],
      timestamp: (() => {
        if (transaction.timestamp instanceof Timestamp) return transaction.timestamp.toDate();
        if (transaction.timestamp instanceof Date) return transaction.timestamp;
        if (typeof transaction.timestamp === 'string') return new Date(transaction.timestamp);
        if (typeof transaction.timestamp === 'number') return new Date(transaction.timestamp * 1000); // Assuming UNIX timestamp in seconds
        return new Date(); // Fallback
      })(),
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
          interface TransactionData {
            id: string;
            lineItems: Array<{
              price: number;
              productId: string;
              quantity: number;
              status?: string;
            }>;
            timestamp: Timestamp;
            paymentMethod?: string;
            status?: string;
            totalPrice?: number;
          }
          
          const transactions: getSaleMetadata[] = (data.transactions as TransactionData[]).map((transaction) => ({
            id: transaction.id,
            totalPrice: transaction.totalPrice || 0,
            timestamp: transaction.timestamp ? transaction.timestamp.toDate() : new Date(),
            lineItems: [],
            paymentMethod: transaction.paymentMethod || 'unknown',
            status: transaction.status || 'unknown'
          }));
          
          const groupByHour = (transactions: getSaleMetadata[]) => {
            // Initialize an array with 24 elements, all set to 0
            const hourlyRevenue = new Array(24).fill(0);
            
            // Iterate over each transaction and sum up the revenue for the corresponding hour
            transactions.forEach((transaction) => {
              const hour = transaction.timestamp.getHours();
              hourlyRevenue[hour] += transaction.totalPrice;
            });
            
            return hourlyRevenue;
          };
      
          // Calculate hourly revenue
          const hourlyData = groupByHour(transactions);
      
          // Return the sales data with hours in order
          return {
            totalRevenue,
            salesCount: transactions.length,
            hourlyRevenue: hourlyData // This will naturally order from 0 to 23, with the latest hour on the right
          };
        } else {
          // If no sales data exists for today
          return {
            totalRevenue: 0,
            salesCount: 0,
            hourlyRevenue: Array(24).fill(0)
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
        startDate.setDate(now.getDate() - (daysBack - 1)); // Adjust for the number of days including today
    
        // Convert dates to Firestore timestamps
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);
    
        // Fetch all sales documents within this range
        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(salesRef, where('__name__', '>=', startTimestamp.toDate().toISOString().split('T')[0]), where('__name__', '<=', endTimestamp.toDate().toISOString().split('T')[0]));
        const querySnapshot = await getDocs(q);
    
        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;
    
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.transactions) {
            // Mapping transactions with less detail since we're not calculating revenue or count
            interface TransactionData {
              id: string;
              lineItems: Array<{
                price: number;
                productId: string;
                quantity: number;
                status?: string;
              }>;
              timestamp: Timestamp;
              paymentMethod?: string;
              status?: string;
              totalPrice?: number;
            }
            const filteredTransactions: TransactionData[] = (data.transactions as TransactionData[]).filter(transaction => {
              // Check if transaction.timestamp exists before calling toDate()
              if (transaction.timestamp) {
                const transactionDate = transaction.timestamp.toDate();
                return transactionDate >= startDate && transactionDate <= endDate;
              }
              return false; // Filter out transactions without a timestamp
            });
    
            const transactions: getSaleMetadata[] = filteredTransactions.map((transaction) => ({
              id: transaction.id,
              totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              timestamp: transaction.timestamp ? transaction.timestamp.toDate() : new Date(),
              lineItems: [],
              paymentMethod: transaction.paymentMethod,
              status: transaction.status
            }));
    
            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
          }
        });
    
        // Group by day
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
          weeklyRevenue: daysData.slice(0, daysBack) // Slice to only include the number of days back we're looking for
        };
      } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
      }
    },
    
    async getMonthlySalesData(daysBack: number = 30): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (daysBack - 1)); // Adjust for the number of days including today
    
        // Convert dates to Firestore timestamps
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);
    
        // Fetch all sales documents within this range
        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(salesRef, where('__name__', '>=', startTimestamp.toDate().toISOString().split('T')[0]), where('__name__', '<=', endTimestamp.toDate().toISOString().split('T')[0]));
        const querySnapshot = await getDocs(q);
    
        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;
    
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.transactions) {
            // Mapping transactions with less detail since we're not calculating revenue or count
            interface TransactionData {
              id: string;
              lineItems: Array<{
                price: number;
                productId: string;
                quantity: number;
                status?: string;
              }>;
              timestamp: Timestamp;
              paymentMethod?: string;
              status?: string;
              totalPrice?: number;
            }
            const filteredTransactions: TransactionData[] = (data.transactions as TransactionData[]).filter(transaction => {
              if (transaction.timestamp) {
                const transactionDate = transaction.timestamp.toDate();
                return transactionDate >= startDate && transactionDate <= endDate;
              }
              return false;
            });
    
            const transactions: getSaleMetadata[] = filteredTransactions.map((transaction) => ({
              id: transaction.id,
              totalPrice: transaction.totalPrice || transaction.lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              timestamp: transaction.timestamp ? transaction.timestamp.toDate() : new Date(),
              lineItems: [],
              paymentMethod: transaction.paymentMethod,
              status: transaction.status
            }));
    
            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
          }
        });
    
        // Group by week or day, depending on the number of days
        if (daysBack <= 7) {
          // If less than or equal to 7 days, group by day
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
            weeklyRevenue: daysData.slice(0, daysBack)
          };
        } else {
          // Group by week for more than 7 days
          const groupByWeek = (transactions: getSaleMetadata[]) => {
            return transactions.reduce((acc, transaction) => {
              const daysFromStart = Math.floor((transaction.timestamp.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const week = Math.floor(daysFromStart / 7);
              acc[week] = (acc[week] || 0) + transaction.totalPrice;
              return acc;
            }, {} as { [key: number]: number });
          };
    
          const weeklyRevenue = groupByWeek(allTransactions);
          // Adjust the number of weeks based on daysBack
          const numOfWeeks = Math.ceil(daysBack / 7);
          const monthlyData = Array.from({ length: numOfWeeks }, (_, i) => weeklyRevenue[i] || 0);
    
          return {
            totalRevenue,
            salesCount: allTransactions.length,
            monthlyRevenue: monthlyData
          };
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
      }
    },
    async getTransactions(options?: TransactionListOptions): Promise<TransactionListResult> {
      // Query all sales documents (e.g., by date) under shops/${shopId}/sales
      let q = query(collection(firestore, `shops/${shopId}/sales`));
    
      // Apply date range filters if provided (assuming sales documents are named by date)
      if (options?.startDate || options?.endDate) {
        const startStr = options.startDate?.toISOString().split('T')[0];
        const endStr = options.endDate?.toISOString().split('T')[0];
    
        if (startStr) {
          q = query(q, where('__name__', '>=', startStr));
        }
        if (endStr) {
          q = query(q, where('__name__', '<=', endStr));
        }
      }
    
      // No status or timestamp filtering at the document level since those are in transactions array
      // Limit can still be applied, but it will limit the number of sales documents, not transactions
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
    
      const querySnapshot = await getDocs(q);
    
      // Collect all transactions from all sales documents
      let allTransactions: SaleMetadata[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const transactionsArray = data.transactions || []; // Get the transactions array from each sales document
    
        // Convert each transaction in the array to SaleMetadata
        transactionsArray.forEach((transaction: any) => {
          allTransactions.push(convertToSaleMetadata(transaction));
        });
      });
    
      // If no transactions found, return early with defaults
      if (allTransactions.length === 0) {
        return {
          transactions: [],
          totalCount: 0,
          totalRevenue: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          completionRate: 0,
          averageTransactionValue: 0,
        };
      }
    
      // Calculate metrics
      const totalRevenue = allTransactions.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
      const totalCount = allTransactions.length;
      const completedCount = allTransactions.filter(t => t.status === 'completed').length;
      const pendingCount = allTransactions.filter(t => t.status === 'pending').length;
      const failedCount = allTransactions.filter(t => t.status === 'failed').length;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      const averageTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0;
    
      return {
        transactions: allTransactions,
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