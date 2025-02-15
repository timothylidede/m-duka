import React, { createContext, useState, useEffect, ReactNode } from "react";
import { getFirestore, getDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { app } from "../config/firebase";

const db = getFirestore(app);

interface ShopData {
  contact: string;
  county: string;
  emailAddress: string;
  name: string;
  password: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  shopData: ShopData | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean; // Add this flag
}

export const AuthContext = createContext<AuthContextType>({
  shopData: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
  isInitialized: false, // Add default value
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchShopDataByEmail = async (email: string) => {
    try {
      const shopsRef = collection(db, "shops");
      const q = query(shopsRef, where("emailAddress", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const shopDoc = querySnapshot.docs[0];
        const data = shopDoc.data() as ShopData;
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching shop data:", error);
      return null;
    }
  };

  const login = async (email: string) => {
    try {
      setIsLoading(true);
      const data = await fetchShopDataByEmail(email);
      
      if (data) {
        setShopData(data);
        await AsyncStorage.setItem("loggedInUser", email);
        await AsyncStorage.setItem("shopData", JSON.stringify(data));
      } else {
        throw new Error("Shop not found");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "loggedInUser",
        "shopData",
        "lastOpenedTime"
      ]);
      setShopData(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const loadShopData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("loggedInUser");
        const storedShopData = await AsyncStorage.getItem("shopData");

        if (storedEmail && storedShopData) {
          setShopData(JSON.parse(storedShopData));
        }
      } catch (error) {
        console.error("Error loading stored shop data:", error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true); // Mark as initialized after initial load
      }
    };

    loadShopData();
  }, []);

  return (
    <AuthContext.Provider value={{ shopData, login, logout, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};