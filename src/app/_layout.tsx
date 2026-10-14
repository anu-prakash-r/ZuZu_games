import { useEffect } from "react";
import { DefaultTheme, ThemeProvider, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { configureReanimatedLogger } from "react-native-reanimated";

import "../global.css";

// Silence Reanimated strict-mode warnings triggered by third-party
// navigators (native-stack/gesture-handler) reading shared values during
// render. Our code does not use Reanimated directly.
configureReanimatedLogger({ strict: false });

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="tables" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="kot" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
