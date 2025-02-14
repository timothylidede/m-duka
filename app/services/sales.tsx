import { 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    Timestamp,
    runTransaction,
    DocumentReference
  } from 'firebase/firestore';
  import { firestore } from '../../config/firebase';
  import { useContext } from 'react';
  import { AuthContext } from '../../context/AuthContext';
  
  export interface SaleMetadata {
    id: string;
    timeStamp: Timestamp;
    totalPrice: number;
    status: 'completed' | 'pending' | 'failed';
    paymentMethod: string;
    lineItems: {
      productId: string;
      price: number;
      quantity: number;
    }[];
  }
  
  // Custom hook to get shop ID from AuthContext
  export const useShopId = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useShopId must be used within an AuthProvider');
    }
    return context.shopData?.contact;
  };
  
  export const salesService = {
    async addNewSale(amount: number, shopId: string): Promise<void> {
      if (!shopId) {
        throw new Error('Shop ID is required');
      }
  
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      
      const shopRef = doc(firestore, 'shops', shopId);
      const salesRef = doc(shopRef, 'sales', dateString);
      
      const transactionId = `T${Date.now().toString().slice(-6)}`;
      
      const saleMetadata: SaleMetadata = {
        id: transactionId,
        timeStamp: Timestamp.fromDate(currentDate),
        totalPrice: amount,
        status: 'completed',
        paymentMethod: 'cash',
        lineItems: [
          {
            productId: 'Sale',
            price: amount,
            quantity: 1
          }
        ]
      };
  
      try {
        await runTransaction(firestore, async (transaction) => {
          const salesDoc = await transaction.get(salesRef);
          
          if (!salesDoc.exists()) {
            await transaction.set(salesRef, {
              totalRevenue: amount,
              salesCount: 1,
              transactions: [saleMetadata]
            });
          } else {
            const currentData = salesDoc.data();
            await transaction.update(salesRef, {
              totalRevenue: currentData.totalRevenue + amount,
              salesCount: currentData.salesCount + 1,
              transactions: [...currentData.transactions, saleMetadata]
            });
          }
        });
      } catch (error) {
        console.error('Error adding sale:', error);
        throw error;
      }
    },
  
    async getTodaysSalesData(shopId: string): Promise<{
      totalRevenue: number;
      salesCount: number;
      transactions: SaleMetadata[];
    }> {
      if (!shopId) {
        throw new Error('Shop ID is required');
      }
  
      const dateString = new Date().toISOString().split('T')[0];
      const salesRef = doc(firestore, 'shops', shopId, 'sales', dateString);
  
      try {
        const salesDoc = await getDocs(query(collection(firestore, `shops/${shopId}/sales`)));
        
        if (!salesDoc.empty) {
          const data = salesDoc.docs[0].data();
          return {
            totalRevenue: data.totalRevenue || 0,
            salesCount: data.salesCount || 0,
            transactions: data.transactions || []
          };
        }
        
        return {
          totalRevenue: 0,
          salesCount: 0,
          transactions: []
        };
      } catch (error) {
        console.error('Error getting sales data:', error);
        throw error;
      }
    }
  };