import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BRAND = "#35116B";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "transparent",
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingTop: 10,
          paddingBottom: 24,
          marginHorizontal: 16,
          marginBottom: 26,
          borderRadius: 24,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tables"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "game-controller" : "game-controller-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="kot"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
