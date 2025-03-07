import { useContext } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { firestore } from '../config/firebase';

interface SaleMetadata {
  id: string;
  timestamp: Date;
  lineItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
}

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  transactions: SaleMetadata[];
}

interface TransactionListOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface TransactionListResult {
  transactions: SaleMetadata[];
  totalRevenue: number;
  salesCount: number;
}

interface SalesService {
  addNewSale: (totalAmount: number) => Promise<void>;
  getTodaysSalesData: () => Promise<SalesData>;
  getWeeklySalesData: () => Promise<SalesData>;
  getMonthlySalesData: () => Promise<SalesData>;
  getAllTimeSalesData: () => Promise<{ totalRevenue: number; totalTransactions: number }>;
  getTransactions: (options?: TransactionListOptions) => Promise<TransactionListResult>;
  updateTransaction: (transactionId: string, updates: Partial<SaleMetadata>) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
}

interface SalesDocument {
  totalRevenue: number;
  salesCount: number;
  transactions: Array<{
    id: string;
    timestamp: Timestamp;
    lineItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    totalPrice: number;
  }>;
}

export const useSalesService = (): SalesService => {
  const { shopData, isInitialized } = useContext(AuthContext);

  if (!isInitialized || !shopData) {
    return {
      addNewSale: async () => {},
      getTodaysSalesData: async () => ({ totalRevenue: 0, salesCount: 0, transactions: [] }),
      getWeeklySalesData: async () => ({ totalRevenue: 0, salesCount: 0, transactions: [] }),
      getMonthlySalesData: async () => ({ totalRevenue: 0, salesCount: 0, transactions: [] }),
      getAllTimeSalesData: async () => ({ totalRevenue: 0, totalTransactions: 0 }),
      getTransactions: async () => ({ transactions: [], totalRevenue: 0, salesCount: 0 }),
      updateTransaction: async () => false,
      deleteTransaction: async () => false,
    };
  }

  const shopId = shopData.contact;

  const cleanTransaction = (data: SalesDocument['transactions'][number]): SaleMetadata => ({
    id: data.id || Date.now().toString(),
    timestamp: data.timestamp instanceof Timestamp
      ? data.timestamp.toDate()
      : new Date(data.timestamp || Date.now()),
    lineItems: Array.isArray(data.lineItems)
      ? data.lineItems.map((item) => ({
          productId: item.productId || 'unknown',
          productName: item.productName || 'Unknown Product',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        }))
      : [],
    totalPrice: Number(data.totalPrice) || 0,
  });

  const addNewSale = async (totalAmount: number): Promise<void> => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const salesDocRef = doc(firestore, `shops/${shopId}/sales`, dateStr);
      const sale: SaleMetadata = {
        id: Date.now().toString(),
        timestamp: new Date(),
        lineItems: [],
        totalPrice: totalAmount,
      };

      await setDoc(
        salesDocRef,
        {
          totalRevenue: increment(totalAmount),
          salesCount: increment(1),
          transactions: arrayUnion({
            ...sale,
            timestamp: Timestamp.fromDate(sale.timestamp),
          }),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error adding new sale:', error);
      throw error;
    }
  };

  const getTodaysSalesData = async (): Promise<SalesData> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const salesDocRef = doc(firestore, `shops/${shopId}/sales`, today);
      const salesDoc = await getDoc(salesDocRef);

      if (salesDoc.exists()) {
        const data = salesDoc.data() as SalesDocument;
        return {
          totalRevenue: Number(data.totalRevenue) || 0,
          salesCount: Number(data.salesCount) || 0,
          transactions: data.transactions?.map(cleanTransaction) || [],
        };
      }
      return { totalRevenue: 0, salesCount: 0, transactions: [] };
    } catch (error) {
      console.error('Error fetching today’s sales data:', error);
      throw error;
    }
  };

  const getWeeklySalesData = async (): Promise<SalesData> => {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      const q = query(
        salesCollectionRef,
        where('__name__', '>=', weekAgo.toISOString().split('T')[0]),
        where('__name__', '<=', today.toISOString().split('T')[0])
      );
      const querySnapshot = await getDocs(q);

      let totalRevenue = 0;
      let salesCount = 0;
      const transactions: SaleMetadata[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as SalesDocument;
        totalRevenue += Number(data.totalRevenue) || 0;
        salesCount += Number(data.salesCount) || 0;
        if (data.transactions) {
          transactions.push(...data.transactions.map(cleanTransaction));
        }
      });

      return { totalRevenue, salesCount, transactions };
    } catch (error) {
      console.error('Error fetching weekly sales data:', error);
      throw error;
    }
  };

  const getMonthlySalesData = async (): Promise<SalesData> => {
    try {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      const q = query(
        salesCollectionRef,
        where('__name__', '>=', monthAgo.toISOString().split('T')[0]),
        where('__name__', '<=', today.toISOString().split('T')[0])
      );
      const querySnapshot = await getDocs(q);

      let totalRevenue = 0;
      let salesCount = 0;
      const transactions: SaleMetadata[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as SalesDocument;
        totalRevenue += Number(data.totalRevenue) || 0;
        salesCount += Number(data.salesCount) || 0;
        if (data.transactions) {
          transactions.push(...data.transactions.map(cleanTransaction));
        }
      });

      return { totalRevenue, salesCount, transactions };
    } catch (error) {
      console.error('Error fetching monthly sales data:', error);
      throw error;
    }
  };

  const getAllTimeSalesData = async (): Promise<{ totalRevenue: number; totalTransactions: number }> => {
    try {
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      const querySnapshot = await getDocs(salesCollectionRef);

      let totalRevenue = 0;
      let totalTransactions = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data() as SalesDocument;
        totalRevenue += Number(data.totalRevenue) || 0;
        totalTransactions += Number(data.salesCount) || 0;
      });

      return { totalRevenue, totalTransactions };
    } catch (error) {
      console.error('Error fetching all-time sales data:', error);
      throw error;
    }
  };

  const getTransactions = async (options?: TransactionListOptions): Promise<TransactionListResult> => {
    try {
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      let q: any = salesCollectionRef;

      if (options?.startDate && options?.endDate) {
        q = query(
          salesCollectionRef,
          where('__name__', '>=', options.startDate.toISOString().split('T')[0]),
          where('__name__', '<=', options.endDate.toISOString().split('T')[0])
        );
      }

      const querySnapshot = await getDocs(q);
      let transactions: SaleMetadata[] = [];
      let totalRevenue = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data() as SalesDocument;
        totalRevenue += Number(data.totalRevenue) || 0;
        if (data.transactions) {
          transactions.push(...data.transactions.map(cleanTransaction));
        }
      });

      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (options?.limit) {
        transactions = transactions.slice(0, options.limit);
      }

      return {
        transactions,
        totalRevenue,
        salesCount: transactions.length,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const updateTransaction = async (transactionId: string, updates: Partial<SaleMetadata>): Promise<boolean> => {
    try {
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      const querySnapshot = await getDocs(salesCollectionRef);

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as SalesDocument;
        const transactionIndex = data.transactions?.findIndex((t) => t.id === transactionId);

        if (transactionIndex !== -1) {
          const updatedTransactions = [...data.transactions];
          const originalTransaction = cleanTransaction(updatedTransactions[transactionIndex]);
          updatedTransactions[transactionIndex] = {
            ...updatedTransactions[transactionIndex],
            ...updates,
            timestamp: updates.timestamp
              ? Timestamp.fromDate(updates.timestamp)
              : updatedTransactions[transactionIndex].timestamp,
            totalPrice: updates.lineItems && updates.lineItems[0]?.quantity && updates.lineItems[0]?.price
              ? updates.lineItems[0].quantity * updates.lineItems[0].price
              : updates.totalPrice || originalTransaction.totalPrice,
          };

          const newTotalRevenue = updatedTransactions.reduce(
            (sum: number, t) => sum + (Number(t.totalPrice) || 0),
            0
          );

          await updateDoc(docSnap.ref, {
            transactions: updatedTransactions,
            totalRevenue: newTotalRevenue,
            salesCount: updatedTransactions.length,
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  };

  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      const querySnapshot = await getDocs(salesCollectionRef);

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as SalesDocument;
        const transactionIndex = data.transactions?.findIndex((t) => t.id === transactionId);

        if (transactionIndex !== -1) {
          const updatedTransactions = data.transactions.filter((t) => t.id !== transactionId);
          const newTotalRevenue = updatedTransactions.reduce(
            (sum: number, t) => sum + (Number(t.totalPrice) || 0),
            0
          );

          await updateDoc(docSnap.ref, {
            transactions: updatedTransactions,
            totalRevenue: newTotalRevenue,
            salesCount: updatedTransactions.length,
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  };

  return {
    addNewSale,
    getTodaysSalesData,
    getWeeklySalesData,
    getMonthlySalesData,
    getAllTimeSalesData,
    getTransactions,
    updateTransaction,
    deleteTransaction,
  };
};