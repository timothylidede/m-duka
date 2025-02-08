import React from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [fontsLoaded] = useFonts({
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
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      checkLoginStatus();
    }
  }, [fontsLoaded, checkLoginStatus]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady || !fontsLoaded) {
    return null;
  }

  return (
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
  );
}