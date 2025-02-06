import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const lastOpened = await AsyncStorage.getItem("lastOpenedTime");
      const now = Date.now();

      if (lastOpened && now - parseInt(lastOpened, 10) <= ONE_HOUR) {
        setIsLoggedIn(true); // User is logged in
      } else {
        setIsLoggedIn(false); // User is not logged in
      }

      if (loaded) {
        SplashScreen.hideAsync();
      }
    };

    checkLoginStatus();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      {/* Show Passcode Screen (index.tsx) if not logged in */}
      {!isLoggedIn && (
        <Stack.Screen
          name="index" // This refers to app/index.tsx
          options={{ headerShown: false }}
        />
      )}
      {/* Show Main App Screens if logged in */}
      {isLoggedIn && (
        <Stack.Screen
          name="(tabs)" // This refers to app/(tabs)/index.tsx
          options={{ headerShown: false }}
        />
      )}
    </Stack>
  );
}