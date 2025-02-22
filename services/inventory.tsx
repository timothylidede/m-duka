import { firestore } from '../config/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

interface InventoryItem {
  productId: string;
  productName: string;
  unitPrice: number;
  stockAmount: number;
  unit: string;
  lastUpdated: Date;
}

interface InventoryData {
  totalItems: number;
  totalValue: number;
  items: InventoryItem[];
}

interface AddInventoryOptions {
  productName: string;
  unitPrice: number;
  stockAmount: number;
  unit: string;
}

interface InventoryService {
  addInventoryItem: (options: AddInventoryOptions) => Promise<string>;
  updateInventoryItem: (productId: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  getInventoryItem: (productId: string) => Promise<InventoryItem | null>;
  getAllInventory: () => Promise<InventoryData>;
}

export const useInventoryService = (): InventoryService => {
  const { shopData, isInitialized } = useContext(AuthContext);

  if (!isInitialized || !shopData) {
    return {
      addInventoryItem: async () => "",
      updateInventoryItem: async () => false,
      getInventoryItem: async () => null,
      getAllInventory: async () => ({ totalItems: 0, totalValue: 0, items: [] }),
    };
  }

  const shopId = shopData.contact;

  const generateProductId = (productName: string): string => {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const convertTimestampToDate = (timestamp: unknown): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date();
  };

  return {
    async addInventoryItem(options: AddInventoryOptions): Promise<string> {
      try {
        const productId = generateProductId(options.productName);
        const inventoryItem: InventoryItem = {
          productId,
          productName: options.productName,
          unitPrice: options.unitPrice,
          stockAmount: options.stockAmount,
          unit: options.unit,
          lastUpdated: new Date(),
        };

        const itemRef = doc(firestore, `shops/${shopId}/inventory/${productId}`);
        await setDoc(itemRef, {
          ...inventoryItem,
          lastUpdated: Timestamp.fromDate(inventoryItem.lastUpdated),
        });

        return productId;
      } catch (error) {
        console.error('Error adding inventory item:', error);
        throw error;
      }
    },

    async updateInventoryItem(productId: string, updates: Partial<InventoryItem>): Promise<boolean> {
      try {
        const itemRef = doc(firestore, `shops/${shopId}/inventory/${productId}`);
        const updateData = {
          ...updates,
          lastUpdated: Timestamp.fromDate(new Date()),
        };
        await updateDoc(itemRef, updateData);
        return true;
      } catch (error) {
        console.error('Error updating inventory item:', error);
        return false;
      }
    },

    async getInventoryItem(productId: string): Promise<InventoryItem | null> {
      try {
        const itemRef = doc(firestore, `shops/${shopId}/inventory/${productId}`);
        const docSnap = await getDoc(itemRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            ...data,
            lastUpdated: convertTimestampToDate(data.lastUpdated),
          } as InventoryItem;
        }
        return null;
      } catch (error) {
        console.error('Error fetching inventory item:', error);
        throw error;
      }
    },

    async getAllInventory(): Promise<InventoryData> {
      try {
        const inventoryRef = collection(firestore, `shops/${shopId}/inventory`);
        const querySnapshot = await getDocs(inventoryRef);

        const items: InventoryItem[] = [];
        let totalValue = 0;

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const item = {
            ...data,
            lastUpdated: convertTimestampToDate(data.lastUpdated),
          } as InventoryItem;
          
          items.push(item);
          totalValue += item.unitPrice * item.stockAmount;
        });

        return {
          totalItems: items.length,
          totalValue,
          items,
        };
      } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
    },
  };
};

export type { InventoryItem, InventoryData, AddInventoryOptions, InventoryService };