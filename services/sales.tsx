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

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  transactions?: SaleMetadata[];
  hourlyRevenue?: number[];
  weeklyRevenue?: number[];
  monthlyRevenue?: number[];
}

// Simplified TransactionResult type for getTransactions
interface TransactionResult {
  totalRevenue: number;
  salesCount: number;
  transactions: SaleMetadata[];
}

// Remove getSaleMetadata as it's redundant or not used
interface SalesService {
  addNewSale: (amount: number) => Promise<void>;
  getTodaysSalesData: () => Promise<SalesData>;
  getWeeklySalesData: () => Promise<SalesData>;
  getMonthlySalesData: () => Promise<SalesData>;
  getTransactions: (options?: TransactionListOptions) => Promise<TransactionResult>;
  updateTransactionStatus: (transactionId: string, newStatus: 'completed' | 'pending' | 'failed') => Promise<boolean>;
}

interface TransactionListOptions {
  status?: 'completed' | 'pending' | 'failed' | 'all';
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
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
        totalRevenue: 0,
        salesCount: 0,
        transactions: [],
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
            quantity: 1, // Changed from 0 to 1 for a valid sale
          }],
          timestamp: new Date(),
          paymentMethod: 'cash',
          status: 'pending',
          totalPrice: amount,
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
          
          return {
            totalRevenue: data.totalRevenue || 0,
            salesCount: data.salesCount || 0,
            transactions: (data.transactions || []).map((t: any) => convertToSaleMetadata(t)),
          };
        } else {
          return {
            totalRevenue: 0,
            salesCount: 0,
            transactions: [],
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

        let totalRevenue = 0;
        let salesCount = 0;
        let transactions: SaleMetadata[] = [];

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const docTransactions = (data.transactions || []).map((t: any) => convertToSaleMetadata(t));
          transactions = transactions.concat(docTransactions);
          totalRevenue += data.totalRevenue || 0;
          salesCount += data.salesCount || 0;
        });

        return {
          totalRevenue,
          salesCount,
          transactions,
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

        let totalRevenue = 0;
        let salesCount = 0;
        let transactions: SaleMetadata[] = [];

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const docTransactions = (data.transactions || []).map((t: any) => convertToSaleMetadata(t));
          transactions = transactions.concat(docTransactions);
          totalRevenue += data.totalRevenue || 0;
          salesCount += data.salesCount || 0;
        });

        return {
          totalRevenue,
          salesCount,
          transactions,
        };
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
        throw error;
      }
    },

    async getTransactions(options?: TransactionListOptions): Promise<TransactionResult> {
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
      const salesCount = transactions.length;

      return {
        totalRevenue,
        salesCount,
        transactions,
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

export type { SaleMetadata, SalesData, SalesService, TransactionListOptions, TransactionResult };