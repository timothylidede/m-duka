import { firestore } from '../config/firebase';
import { collection, query, doc, getDoc, updateDoc, setDoc, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

// Use the interfaces from your proposal
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
  const convertToSaleMetadata = (transaction: any): SaleMetadata => {
    return {
      id: transaction.id,
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
        const sale: SaleMetadata = {
          id: Date.now().toString(),
          lineItems: [{
            price: amount,
            productId: 'No product ID',
            quantity: 1, // Adjusted to a non-zero quantity for clarity
          }],
          timestamp: new Date(),
          paymentMethod: 'cash',
          status: 'pending',
          totalPrice: amount,
        };

        const saleRef = doc(collection(firestore, `shops/${shopId}/sales`));
        await setDoc(saleRef, sale);
      } catch (error) {
        console.error('Error adding new sale:', error);
        throw error;
      }
    },

    async getTodaysSalesData(): Promise<SalesData> {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(firestore, `shops/${shopId}/sales`),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = querySnapshot.docs.map(doc => convertToSaleMetadata(doc.data()));

      const totalRevenue = transactions.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const salesCount = transactions.length;

      return { totalRevenue, salesCount, transactions };
    },

    async getWeeklySalesData(): Promise<SalesData> {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of the current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const q = query(
        collection(firestore, `shops/${shopId}/sales`),
        where('timestamp', '>=', startOfWeek),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = querySnapshot.docs.map(doc => convertToSaleMetadata(doc.data()));

      const totalRevenue = transactions.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const salesCount = transactions.length;

      return { totalRevenue, salesCount, transactions };
    },

    async getMonthlySalesData(): Promise<SalesData> {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const q = query(
        collection(firestore, `shops/${shopId}/sales`),
        where('timestamp', '>=', startOfMonth),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions: SaleMetadata[] = querySnapshot.docs.map(doc => convertToSaleMetadata(doc.data()));

      const totalRevenue = transactions.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const salesCount = transactions.length;

      return { totalRevenue, salesCount, transactions };
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
          // Firestore doesn't have a direct offset, so this would require pagination or skipping logic
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

export type { SaleMetadata, SalesData, SalesService, TransactionListOptions, TransactionListResult };