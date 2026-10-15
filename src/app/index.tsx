import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";

import LoginScreen from "../Screens/Auth/Login.Screen";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/home" as any);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F7FB]">
        <ActivityIndicator size="large" color="#35116B" />
      </View>
    );
  }

  if (isAuthenticated) return null;

  return (
    <LoginScreen
      onLoginSuccess={() => {
        router.replace("/home" as any);
      }}
    />
  );
}
