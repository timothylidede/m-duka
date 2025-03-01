import { firestore, auth } from "../config/firebase";
import {
  collection,
  query,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  addDoc,
  limit as limitQuery,
  setDoc,
  where,
  getDocs,
  increment,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { logMessage } from "@/components/debugging";

// Define the interfaces
interface SaleMetadata {
  id: string;
  lineItems?: Array<{
    price: number;
    productId: string;
    quantity: number;
  }>;
  timestamp: Date;
  paymentMethod: string;
  status: "completed" | "pending" | "failed";
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
  status?: "completed" | "pending" | "failed" | "all";
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

interface TransactionListResult {
  transactions: SaleMetadata[];
  salesCount: number;
  totalRevenue: number;
  completedCount?: number;
  pendingCount?: number;
  failedCount?: number;
  completionRate?: number;
  averageTransactionValue?: number;
}

interface SalesService {
  addNewSale: (amount: number) => Promise<void>;
  getTodaysSalesData: () => Promise<SalesData>;
  getWeeklySalesData: (daysBack?: number) => Promise<SalesData>;
  getMonthlySalesData: (daysBack?: number) => Promise<SalesData>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  getAllTimeSalesData: () => Promise<{
    totalRevenue: number;
    totalTransactions: number;
  }>;
  getTransactions: (
    options?: TransactionListOptions
  ) => Promise<TransactionListResult>;
  updateTransactionStatus: (
    transactionId: string,
    newStatus: "completed" | "pending" | "failed"
  ) => Promise<boolean>;
  updateTransaction: (
    transactionId: string,
    updates: Partial<SaleMetadata>
  ) => Promise<boolean>;
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
        salesCount: 0,
        totalRevenue: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        completionRate: 0,
        averageTransactionValue: 0,
      }),
      updateTransactionStatus: async () => false,
      deleteTransaction: async () => false,
      getAllTimeSalesData: async () => ({
        totalRevenue: 0,
        totalTransactions: 0,
      }),
      updateTransaction: async () => false,
    };
  }

  const shopId = shopData.contact;

  const convertToSaleMetadata = (transaction: any): SaleMetadata => {
    return {
      id: transaction.id || Date.now().toString(),
      lineItems: Array.isArray(transaction.lineItems)
        ? transaction.lineItems
        : [],
      timestamp: (() => {
        if (transaction.timestamp instanceof Timestamp)
          return transaction.timestamp.toDate();
        if (transaction.timestamp instanceof Date) return transaction.timestamp;
        if (typeof transaction.timestamp === "string")
          return new Date(transaction.timestamp);
        if (typeof transaction.timestamp === "number")
          return new Date(transaction.timestamp * 1000);
        return new Date();
      })(),
      paymentMethod: transaction.paymentMethod || "unknown",
      status: transaction.status
        ? (transaction.status.toLowerCase() as
            | "completed"
            | "pending"
            | "failed")
        : "pending",
      totalPrice:
        transaction.totalPrice ||
        (Array.isArray(transaction.lineItems)
          ? transaction.lineItems.reduce(
              (sum: number, item: any) =>
                sum + item.price * (item.quantity || 1),
              0
            )
          : 0),
    };
  };

  return {
    async addNewSale(amount: number): Promise<void> {
      try {
        // Create the sale object
        const sale: SaleMetadata = {
          id: Date.now().toString(),
          lineItems: [
            {
              price: amount,
              productId: "No product ID",
              quantity: 0,
            },
          ],
          timestamp: new Date(),
          paymentMethod: "cash",
          status: "pending",
          totalPrice: amount,
        };
        logMessage("Timestamp: " + sale.timestamp);
        logMessage("Adding new sale in function addNewSale");
    
        // Generate date string from timestamp
        const dateStr = sale.timestamp.toISOString().split("T")[0];
        logMessage("dateStr created in function addNewSale: " + dateStr);
    
        // Reference to the sales subcollection
        const salesCollectionRef = collection(firestore, `shops/${shopId}/sales`);
        logMessage("salesCollectionRef created");
    
        // Create a query to find documents where the document ID equals dateStr
        const q = query(salesCollectionRef, where("__name__", "==", dateStr));
        logMessage("Query created for dateStr: " + dateStr);
    
        // Execute the query
        const querySnapshot = await getDocs(q);
        logMessage("Query snapshot retrieved");
    
        if (!querySnapshot.empty) {
          // Document exists
          logMessage("Document exists for dateStr: " + dateStr);
          const docSnapshot = querySnapshot.docs[0]; // Get the first (and only) document
          const currentData = docSnapshot.data();
          const updatedTransactions = [
            ...(currentData.transactions || []),
            {
              ...sale,
              timestamp: Timestamp.fromDate(sale.timestamp),
            },
          ];
          logMessage("Preparing to update document");
          await updateDoc(docSnapshot.ref, {
            salesCount: updatedTransactions.length,
            totalRevenue: currentData.totalRevenue + sale.totalPrice,
            transactions: updatedTransactions,
          });
          logMessage("Document updated");
        } else {
          // Document does not exist
          logMessage("Document does not exist for dateStr: " + dateStr);
          const newDocRef = doc(salesCollectionRef, dateStr);
          await setDoc(newDocRef, {
            salesCount: 1,
            totalRevenue: sale.totalPrice,
            transactions: [
              {
                ...sale,
                timestamp: Timestamp.fromDate(sale.timestamp),
              },
            ],
          });
          logMessage("New document created");
        }
        logMessage("the setdoc has been run");
        // const dateDoc = await getDoc(dateDocRef);
        // logMessage("dateDocRef created  in function add NewSAle");
        // if (dateDoc.exists()) {
        //   logMessage("dateDoc exists");
        //   const currentData = dateDoc.data();
        //   const updatedTransactions = [
        //     ...(currentData.transactions || []),
        //     {
        //       ...sale,
        //       timestamp: Timestamp.fromDate(sale.timestamp),
        //     },
        //   ];
        //   logMessage("preparing to update document created");
        //   await updateDoc(dateDocRef, {
        //     salesCount: updatedTransactions.length,
        //     totalRevenue: currentData.totalRevenue + sale.totalPrice,
        //     transactions: updatedTransactions,
        //   });
        //   logMessage("dateDoc updated");
        // } else {
        //   logMessage("dateDoc does not exist");
        //   await setDoc(dateDocRef, {
        //     salesCount: 1,
        //     totalRevenue: sale.totalPrice,
        //     transactions: [
        //       {
        //         ...sale,
        //         timestamp: Timestamp.fromDate(sale.timestamp),
        //       },
        //     ],
        //   });
        //   logMessage("dateDoc created or sth");
        // }
        logMessage("After the comment ");
      } catch (error) {
        console.error("Error adding new sale:", error);
        // throw error;
      }
    },

    async getTodaysSalesData(): Promise<SalesData> {
      try {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const salesRef = doc(firestore, `shops/${shopId}/sales/${dateStr}`);

        const dateDoc = await getDoc(salesRef);
        if (dateDoc.exists()) {
          const data = dateDoc.data();

          const totalRevenue = data.totalRevenue;
          const salesCount = data.salesCount;

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

          const transactions: getSaleMetadata[] = (
            data.transactions as TransactionData[]
          ).map((transaction) => ({
            id: transaction.id,
            totalPrice: transaction.totalPrice || 0,
            timestamp: transaction.timestamp
              ? transaction.timestamp.toDate()
              : new Date(),
            lineItems: [],
            paymentMethod: transaction.paymentMethod || "unknown",
            status: transaction.status || "unknown",
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
            hourlyRevenue: hourlyData,
          };
        } else {
          return {
            totalRevenue: 0,
            salesCount: 0,
            hourlyRevenue: Array(24).fill(0),
          };
        }
      } catch (error) {
        console.error("Error fetching today's sales:", error);
        throw error;
      }
    },

    async getWeeklySalesData(daysBack: number = 7): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (daysBack - 1));

        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(
          salesRef,
          where(
            "__name__",
            ">=",
            startTimestamp.toDate().toISOString().split("T")[0]
          ),
          where(
            "__name__",
            "<=",
            endTimestamp.toDate().toISOString().split("T")[0]
          )
        );
        const querySnapshot = await getDocs(q);

        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;

        querySnapshot.forEach((doc) => {
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
              timestamp: Timestamp;
              paymentMethod?: string;
              status?: string;
              totalPrice?: number;
            }
            const filteredTransactions: TransactionData[] = (
              data.transactions as TransactionData[]
            ).filter((transaction) => {
              if (transaction.timestamp) {
                const transactionDate = transaction.timestamp.toDate();
                return (
                  transactionDate >= startDate && transactionDate <= endDate
                );
              }
              return false;
            });

            const transactions: getSaleMetadata[] = filteredTransactions.map(
              (transaction) => ({
                id: transaction.id,
                totalPrice:
                  transaction.totalPrice ||
                  transaction.lineItems.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ),
                timestamp: transaction.timestamp
                  ? transaction.timestamp.toDate()
                  : new Date(),
                lineItems: [],
                paymentMethod: transaction.paymentMethod,
                status: transaction.status,
              })
            );

            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce(
              (sum, transaction) => sum + transaction.totalPrice,
              0
            );
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
        const daysData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (_, i) => dailyRevenue[i] || 0
        );

        return {
          totalRevenue,
          salesCount: allTransactions.length,
          weeklyRevenue: daysData.slice(0, daysBack),
        };
      } catch (error) {
        console.error("Error fetching chart data:", error);
        throw error;
      }
    },

    async getMonthlySalesData(daysBack: number = 30): Promise<SalesData> {
      try {
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (daysBack - 1));

        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        const salesRef = collection(firestore, `shops/${shopId}/sales`);
        const q = query(
          salesRef,
          where(
            "__name__",
            ">=",
            startTimestamp.toDate().toISOString().split("T")[0]
          ),
          where(
            "__name__",
            "<=",
            endTimestamp.toDate().toISOString().split("T")[0]
          )
        );
        const querySnapshot = await getDocs(q);

        let allTransactions: getSaleMetadata[] = [];
        let totalRevenue = 0;

        querySnapshot.forEach((doc) => {
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
              timestamp: Timestamp;
              paymentMethod?: string;
              status?: string;
              totalPrice?: number;
            }
            const filteredTransactions: TransactionData[] = (
              data.transactions as TransactionData[]
            ).filter((transaction) => {
              if (transaction.timestamp) {
                const transactionDate = transaction.timestamp.toDate();
                return (
                  transactionDate >= startDate && transactionDate <= endDate
                );
              }
              return false;
            });

            const transactions: getSaleMetadata[] = filteredTransactions.map(
              (transaction) => ({
                id: transaction.id,
                totalPrice:
                  transaction.totalPrice ||
                  transaction.lineItems.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ),
                timestamp: transaction.timestamp
                  ? transaction.timestamp.toDate()
                  : new Date(),
                lineItems: [],
                paymentMethod: transaction.paymentMethod,
                status: transaction.status,
              })
            );

            allTransactions = allTransactions.concat(transactions);
            totalRevenue += transactions.reduce(
              (sum, transaction) => sum + transaction.totalPrice,
              0
            );
          }
        });

        if (daysBack <= 7) {
          const groupByDay = (transactions: getSaleMetadata[]) => {
            return transactions.reduce((acc, transaction) => {
              const day = transaction.timestamp.getDay();
              acc[day] = (acc[day] || 0) + transaction.totalPrice;
              return acc;
            }, {} as { [key: number]: number });
          };

          const dailyRevenue = groupByDay(allTransactions);
          const daysData = [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((_, i) => dailyRevenue[i] || 0);

          return {
            totalRevenue,
            salesCount: allTransactions.length,
            weeklyRevenue: daysData.slice(0, daysBack),
          };
        } else {
          const groupByWeek = (transactions: getSaleMetadata[]) => {
            return transactions.reduce((acc, transaction) => {
              const daysFromStart = Math.floor(
                (transaction.timestamp.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const week = Math.floor(daysFromStart / 7);
              acc[week] = (acc[week] || 0) + transaction.totalPrice;
              return acc;
            }, {} as { [key: number]: number });
          };

          const weeklyRevenue = groupByWeek(allTransactions);
          const numOfWeeks = Math.ceil(daysBack / 7);
          const monthlyData = Array.from(
            { length: numOfWeeks },
            (_, i) => weeklyRevenue[i] || 0
          );

          return {
            totalRevenue,
            salesCount: allTransactions.length,
            monthlyRevenue: monthlyData,
          };
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        throw error;
      }
    },

    async getTransactions(
      options?: TransactionListOptions
    ): Promise<TransactionListResult> {
      console.log(
        "Starting getTransactions with shopId:",
        shopId,
        "options:",
        options
      );

      const page = options?.offset || 0; // Page number (0-based)
      const pageSize = options?.limit || 10; // Items per page

      let q = query(collection(firestore, `shops/${shopId}/sales`));
      if (options?.startDate || options?.endDate) {
        const startStr = options.startDate?.toISOString().split("T")[0];
        const endStr = options.endDate?.toISOString().split("T")[0];
        if (startStr) q = query(q, where("__name__", ">=", startStr));
        if (endStr) q = query(q, where("__name__", "<=", endStr));
      }

      const querySnapshot = await getDocs(q);

      let allTransactions: SaleMetadata[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const transactionsArray = data.transactions || [];
        transactionsArray.forEach((transaction: any) => {
          const saleMetadata = convertToSaleMetadata(transaction);
          allTransactions.push(saleMetadata);
        });
      });

      if (allTransactions.length === 0) {
        return {
          transactions: [],
          salesCount: 0,
          totalRevenue: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          completionRate: 0,
          averageTransactionValue: 0,
        };
      }

      allTransactions.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      let filteredTransactions = allTransactions;
      if (options?.status && options.status !== "all") {
        filteredTransactions = allTransactions.filter(
          (t) => t.status === options.status
        );
      }

      const totalCount = filteredTransactions.length;
      const startIndex = page * pageSize;
      const paginatedTransactions = filteredTransactions
        .slice(startIndex, startIndex + pageSize)
        .map((transaction) => ({
          id: transaction.id,
          status: transaction.status || "pending",
          totalPrice: transaction.totalPrice || 0,
          lineItems: transaction.lineItems || [],
          paymentMethod: transaction.paymentMethod || "cash",
          timestamp: transaction.timestamp || new Date(),
        }));

      return {
        transactions: paginatedTransactions,
        salesCount: totalCount,
        totalRevenue: filteredTransactions.reduce(
          (sum, t) => sum + t.totalPrice,
          0
        ),
        completedCount: allTransactions.filter((t) => t.status === "completed")
          .length,
        pendingCount: allTransactions.filter((t) => t.status === "pending")
          .length,
        failedCount: allTransactions.filter((t) => t.status === "failed")
          .length,
        completionRate: allTransactions.length
          ? (allTransactions.filter((t) => t.status === "completed").length /
              allTransactions.length) *
            100
          : 0,
        averageTransactionValue: filteredTransactions.length
          ? filteredTransactions.reduce((sum, t) => sum + t.totalPrice, 0) /
            filteredTransactions.length
          : 0,
      };
    },

    async updateTransaction(
      transactionId: string,
      updates: Partial<SaleMetadata>
    ): Promise<boolean> {
      try {
        const salesCollection = collection(firestore, `shops/${shopId}/sales`);
        const snapshot = await getDocs(salesCollection);

        let docToUpdateId: string | null = null;
        let transactions: any[] = [];
        let transactionIndex: number = -1;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.transactions) return;

          const idx = data.transactions.findIndex(
            (t: any) => t.id === transactionId
          );
          if (idx !== -1) {
            docToUpdateId = docSnap.id;
            transactions = [...data.transactions];
            transactionIndex = idx;
          }
        });

        if (!docToUpdateId || transactionIndex === -1) {
          console.warn("Transaction not found");
          return false;
        }

        // Merge updates while preserving the original timestamp
        transactions[transactionIndex] = {
          ...transactions[transactionIndex],
          ...updates,
          timestamp: transactions[transactionIndex].timestamp, // Ensure timestamp is unchanged
        };

        // Recalculate totalRevenue based on updated transactions
        const newTotalRevenue = transactions.reduce(
          (sum: number, t: any) => sum + (t.totalPrice || 0),
          0
        );

        const dateDocRef = doc(
          firestore,
          `shops/${shopId}/sales/${docToUpdateId}`
        );
        await updateDoc(dateDocRef, {
          transactions,
          totalRevenue: newTotalRevenue,
          salesCount: transactions.length,
        });

        return true;
      } catch (error) {
        console.error("Error updating transaction:", error);
        return false;
      }
    },

    async deleteTransaction(transactionId: string): Promise<boolean> {
      try {
        const salesCollection = collection(firestore, `shops/${shopId}/sales`);
        const snapshot = await getDocs(salesCollection);

        let docToUpdateId: string | null = null;
        let transactions: any[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.transactions) return;

          const idx = data.transactions.findIndex(
            (t: any) => t.id === transactionId
          );
          if (idx !== -1) {
            docToUpdateId = docSnap.id;
            transactions = [...data.transactions];
            transactions.splice(idx, 1); // Remove the transaction
          }
        });

        if (!docToUpdateId) {
          console.warn("Transaction not found");
          return false;
        }

        const dateDocRef = doc(
          firestore,
          `shops/${shopId}/sales/${docToUpdateId}`
        );
        await updateDoc(dateDocRef, {
          transactions,
          salesCount: transactions.length,
          totalRevenue: transactions.reduce(
            (sum: number, t: any) => sum + (t.totalPrice || 0),
            0
          ),
        });
        return true;
      } catch (error) {
        console.error("Error deleting transaction:", error);
        return false;
      }
    },

    async getAllTimeSalesData(): Promise<{
      totalRevenue: number;
      totalTransactions: number;
    }> {
      try {
        const salesCollection = collection(firestore, `shops/${shopId}/sales`);
        const snapshot = await getDocs(salesCollection);
        let totalRevenue = 0;
        let totalTransactions = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          totalRevenue += data.totalRevenue || 0;
          totalTransactions += data.salesCount || 0;
        });
        return { totalRevenue, totalTransactions };
      } catch (error) {
        console.error("Error fetching all-time sales data:", error);
        throw error;
      }
    },

    async updateTransactionStatus(
      transactionId: string,
      newStatus: "completed" | "pending" | "failed"
    ): Promise<boolean> {
      try {
        const salesCollection = collection(firestore, `shops/${shopId}/sales`);
        const snapshot = await getDocs(salesCollection);

        let docToUpdateId: string | null = null;
        let transactions: any[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.transactions) return;

          const idx = data.transactions.findIndex(
            (t: any) => t.id === transactionId
          );
          if (idx !== -1) {
            docToUpdateId = docSnap.id;
            transactions = [...data.transactions];
            transactions[idx].status = newStatus;
          }
        });

        if (!docToUpdateId) {
          console.warn("Transaction not found in any sales doc");
          return false;
        }

        const dateDocRef = doc(
          firestore,
          `shops/${shopId}/sales/${docToUpdateId}`
        );
        await updateDoc(dateDocRef, { transactions });
        return true;
      } catch (error) {
        console.error("Error updating transaction status:", error);
        return false;
      }
    },
  };
};

export type {
  SaleMetadata,
  SalesData,
  SalesService,
  TransactionListOptions,
  TransactionListResult,
  getSaleMetadata,
};
