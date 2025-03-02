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
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { firestore } from '../config/firebase';
import { useInventoryService } from './inventory';

export interface SaleMetadata {
  id: string;
  timestamp: Date;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  transactions: SaleMetadata[];
}

export interface TransactionListOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'totalPrice' | 'productName';
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface TransactionListResult {
  transactions: SaleMetadata[];
  totalRevenue: number;
  salesCount: number;
  hasMore?: boolean;
  averageTransactionValue?: number;
}

export interface SalesUpdateInput {
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface SalesService {
  addNewSale: (saleInput: { productName: string; quantity: number; unitPrice: number }) => Promise<string>;
  getTodaysSalesData: () => Promise<SalesData>;
  getWeeklySalesData: () => Promise<SalesData>;
  getMonthlySalesData: () => Promise<SalesData>;
  getAllTimeSalesData: () => Promise<{ totalRevenue: number; totalTransactions: number }>;
  getTransactions: (options?: TransactionListOptions) => Promise<TransactionListResult>;
  updateTransaction: (transactionId: string, updates: SalesUpdateInput) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  getTransactionById: (transactionId: string) => Promise<SaleMetadata | null>;
}

interface SalesDocument {
  totalRevenue: number;
  salesCount: number;
  transactions: Array<{
    id: string;
    timestamp: Timestamp;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export const useSalesService = (): SalesService => {
  const { shopData, isInitialized } = useContext(AuthContext);
  const inventoryService = useInventoryService();

  if (!isInitialized || !shopData) {
    return {
      addNewSale: async () => "",
      getTodaysSalesData: async () => ({ totalRevenue: 0, salesCount: 0, transactions: [] }),
      getWeeklySalesData: async () => ({ totalRevenue: 0, salesCount: 0, transactions: [] }),
      getMonthlySalesData: async () => ({ totalRevenue: 0, salesCount: 0, transactions: [] }),
      getAllTimeSalesData: async () => ({ totalRevenue: 0, totalTransactions: 0 }),
      getTransactions: async () => ({ transactions: [], totalRevenue: 0, salesCount: 0 }),
      updateTransaction: async () => false,
      deleteTransaction: async () => false,
      getTransactionById: async () => null,
    };
  }

  const shopId = shopData.contact;

  const cleanTransaction = (data: SalesDocument['transactions'][number]): SaleMetadata => ({
    id: data.id || Date.now().toString(),
    timestamp: data.timestamp instanceof Timestamp
      ? data.timestamp.toDate()
      : new Date(data.timestamp || Date.now()),
    productName: data.productName || 'Unknown Product',
    quantity: Number(data.quantity) || 1,
    unitPrice: Number(data.unitPrice) || 0,
    totalPrice: Number(data.totalPrice) || 0,
  });

  const findTransactionDocument = async (transactionId: string): Promise<{ docRef: any, data: SalesDocument, transactionIndex: number } | null> => {
    try {
      const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
      const querySnapshot = await getDocs(salesCollectionRef);

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as SalesDocument;
        const transactionIndex = data.transactions?.findIndex((t) => t.id === transactionId);

        if (transactionIndex !== -1 && transactionIndex !== undefined) {
          return {
            docRef: docSnap.ref,
            data,
            transactionIndex
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding transaction document:', error);
      return null;
    }
  };

  const addNewSale = async (saleInput: { productName: string; quantity: number; unitPrice: number }): Promise<string> => {
    try {
      // Validate input
      if (!saleInput.productName || saleInput.quantity == null || saleInput.unitPrice == null) {
        throw new Error('All fields (productName, quantity, unitPrice) must be provided and non-null');
      }

      // Step 1: Fetch inventory data
      const inventoryData = await inventoryService.getAllInventory();

      // Step 2: Find the inventory item by productName
      const inventoryItem = inventoryData.items.find(item => item.productName === saleInput.productName);

      if (!inventoryItem) {
        throw new Error(`Product "${saleInput.productName}" not found in inventory`);
      }

      // Step 3: Check if there is sufficient stock
      if (inventoryItem.stockAmount < saleInput.quantity) {
        throw new Error(`Insufficient stock for "${saleInput.productName}". Available: ${inventoryItem.stockAmount}, Requested: ${saleInput.quantity}`);
      }

      // Step 4: Proceed with adding the sale
      const dateStr = new Date().toISOString().split('T')[0];
      const salesDocRef = doc(firestore, `shops/${shopId}/sales`, dateStr);
      const totalPrice = saleInput.quantity * saleInput.unitPrice;
      const saleId = Date.now().toString();
      const sale: SaleMetadata = {
        id: saleId,
        timestamp: new Date(),
        productName: saleInput.productName,
        quantity: saleInput.quantity,
        unitPrice: saleInput.unitPrice,
        totalPrice: totalPrice,
      };

      await setDoc(
        salesDocRef,
        {
          totalRevenue: increment(totalPrice),
          salesCount: increment(1),
          transactions: arrayUnion({
            ...sale,
            timestamp: Timestamp.fromDate(sale.timestamp),
          }),
        },
        { merge: true }
      );

      // Step 5: Update the inventory stock
      const updatedStockAmount = inventoryItem.stockAmount - saleInput.quantity;
      await inventoryService.updateInventoryItem(inventoryItem.productId, { stockAmount: updatedStockAmount });

      return saleId;
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
      console.error('Error fetching todays sales data:', error);
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

      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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

      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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
  
      if (options?.searchTerm) {
        const searchLower = options.searchTerm.toLowerCase();
        transactions = transactions.filter(t => 
          t.productName.toLowerCase().includes(searchLower) || 
          t.id.toLowerCase().includes(searchLower)
        );
      }
  
      if (options?.sortBy) {
        const direction = options?.sortDirection === 'asc' ? 1 : -1;
        transactions.sort((a, b) => {
          if (options.sortBy === 'timestamp') {
            return direction * (b.timestamp.getTime() - a.timestamp.getTime());
          } else if (options.sortBy === 'totalPrice') {
            return direction * (b.totalPrice - a.totalPrice);
          } else if (options.sortBy === 'productName') {
            return direction * a.productName.localeCompare(b.productName);
          }
          return 0;
        });
      } else {
        transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
  
      // Store the total number of transactions before pagination
      const totalSalesCount = transactions.length;
  
      // Apply pagination using offset and limit
      const offset = options?.offset || 0;
      const limit = options?.limit || transactions.length;
      const paginatedTransactions = transactions.slice(offset, offset + limit);
  
      // Determine if there are more transactions beyond this page
      const hasMore = offset + limit < totalSalesCount;
  
      return {
        transactions: paginatedTransactions,
        totalRevenue,
        salesCount: totalSalesCount,
        hasMore,
        averageTransactionValue: totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const getTransactionById = async (transactionId: string): Promise<SaleMetadata | null> => {
    try {
      const result = await findTransactionDocument(transactionId);
      if (result) {
        const { data, transactionIndex } = result;
        return cleanTransaction(data.transactions[transactionIndex]);
      }
      return null;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  };

  const updateTransaction = async (transactionId: string, updates: SalesUpdateInput): Promise<boolean> => {
    try {
      const result = await findTransactionDocument(transactionId);
      if (!result) return false;

      const { docRef, data, transactionIndex } = result;
      const updatedTransactions = [...data.transactions];
      const originalTransaction = updatedTransactions[transactionIndex];

      if (updates.productName !== undefined) {
        originalTransaction.productName = updates.productName;
      }
      if (updates.quantity !== undefined) {
        originalTransaction.quantity = updates.quantity;
      }
      if (updates.unitPrice !== undefined) {
        originalTransaction.unitPrice = updates.unitPrice;
      }
      originalTransaction.totalPrice = originalTransaction.quantity * originalTransaction.unitPrice;

      updatedTransactions[transactionIndex] = originalTransaction;

      const newTotalRevenue = updatedTransactions.reduce(
        (sum: number, t) => sum + (Number(t.totalPrice) || 0),
        0
      );

      await updateDoc(docRef, {
        transactions: updatedTransactions,
        totalRevenue: newTotalRevenue,
      });

      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  };

  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      const result = await findTransactionDocument(transactionId);
      if (!result) return false;

      const { docRef, data } = result;
      const updatedTransactions = data.transactions.filter(t => t.id !== transactionId);

      const newTotalRevenue = updatedTransactions.reduce(
        (sum: number, t) => sum + (Number(t.totalPrice) || 0),
        0
      );

      await updateDoc(docRef, {
        transactions: updatedTransactions,
        totalRevenue: newTotalRevenue,
        salesCount: updatedTransactions.length,
      });

      return true;
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
    getTransactionById,
  };
};