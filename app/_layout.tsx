import React, { useEffect, useState, useCallback } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AnimatedSplashScreen from "./splash";
import { View } from "react-native";

// Import AuthProvider from your context folder
import { AuthProvider } from "../context/AuthContext";

const ONE_HOUR = 60 * 60 * 1000;

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const checkLoginStatus = useCallback(async () => {
    try {
      const lastOpened = await AsyncStorage.getItem("lastOpenedTime");
      const now = Date.now();
      if (lastOpened && now - parseInt(lastOpened, 10) <= ONE_HOUR) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Perform any additional initialization here
        await checkLoginStatus();
        
        // Simulate some loading time (remove in production)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        setIsReady(true);
      } catch (e) {
        console.warn(e);
      } finally {
        // Consider the app ready when all resources are loaded
        setAppIsReady(true);
      }
    };

    prepare();
  }, [checkLoginStatus]);

  const onAnimationComplete = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
      setShowSplash(false);
    }
  }, [isReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (showSplash) {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedSplashScreen 
          onAnimationComplete={onAnimationComplete}
          isAppReady={appIsReady && isReady}
        />
      </View>
    );
  }

  return (
    // Wrap your navigation stack with the AuthProvider
    <AuthProvider>
    <Stack screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </>
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  </AuthProvider>
  );
}
