import { useState } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { MenuButton, Sidebar } from "@/components/sidebar";
import { router } from "expo-router";

const BRAND = "#35116B";

const ACTIVE_TABLES = [
  {
    id: "1",
    tableNo: "02",
    price: "₹450",
    time: "45 mins",
    items: "3 Items",
    status: "Active",
  },
  {
    id: "2",
    tableNo: "04",
    price: "₹820",
    time: "1h 15m",
    items: "5 Items",
    status: "Active",
  },
  {
    id: "3",
    tableNo: "07",
    price: "₹300",
    time: "20 mins",
    items: "2 Items",
    status: "Active",
  },
];

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  const totalTables = 15;
  const occupiedTables = 9;
  const availableTables = totalTables - occupiedTables;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <View className="flex-row justify-between items-center px-5 py-3 border-b border-slate-200">
        <View className="flex-row items-center gap-3">
          <MenuButton onPress={() => setMenuOpen(true)} />
          <View>
            <Text className="text-[#35116B] text-xl font-extrabold tracking-tight">
              ZuZu Games Cafe
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-5">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
            Table Status
          </Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-[#35116B] p-5 rounded-2xl shadow-md shadow-purple-900/20 justify-between">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Available
                </Text>
                <View className="w-8 h-8 rounded-xl bg-white/10 items-center justify-center">
                  <Ionicons name="restaurant" size={16} color="#fff" />
                </View>
              </View>
              <View>
                <Text className="text-white text-3xl font-black tracking-tight">
                  {availableTables}
                  <Text className="text-white text-base font-medium">
                    /{totalTables}
                  </Text>
                </Text>
                <Text className="text-white text-[11px] font-semibold mt-1">
                  ● Free for Booking
                </Text>
              </View>
            </View>

            <View className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm justify-between">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Occupied
                </Text>
                <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center">
                  <Ionicons name="people" size={16} color={BRAND} />
                </View>
              </View>
              <View>
                <Text className="text-black text-3xl font-black tracking-tight">
                  {occupiedTables}
                  <Text className="text-black text-base font-medium">
                    /{totalTables}
                  </Text>
                </Text>
                <Text className="text-amber-500 text-[11px] font-semibold mt-1">
                  ● Currently Active
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-1 mb-6">
            <Pressable
              onPress={() => {}}
              className="bg-emerald-50 border border-[#059669] p-4 rounded-2xl flex-row items-center justify-between active:bg-emerald-100"
            >
              <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                <View className="w-10 h-10 rounded-xl bg-emerald-500 items-center justify-center shadow-sm">
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-emerald-900 font-bold text-base">
                    Add More Tables
                  </Text>
                  <Text
                    className="text-emerald-700/80 text-xs"
                    numberOfLines={1}
                  >
                    Expand capacity and configure new spots.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#059669" />
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-slate-500 text-base font-extrabold tracking-tight">
              Active Table Sessions
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                router.push("/tables");
              }}
              accessibilityRole="button"
              accessibilityLabel="View all active table sessions"
              className="flex-row items-center gap-1.5"
            >
              <Text className="text-[#35116B] text-sm font-bold">View All</Text>

              <Ionicons name="arrow-forward" size={16} color="#35116B" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
          className="gap-3"
        >
          {ACTIVE_TABLES.map((item) => (
            <View
              key={item.id}
              className="w-56 h-52 bg-white border border-slate-200/80 p-4 rounded-3xl justify-between shadow-md shadow-slate-200/40 border-t-4 border-t-[#35116B] mr-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="bg-purple-100 w-12 h-12 rounded-xl flex-row items-center justify-center">
                  <Text className="text-slate-900 font-black text-2xl tracking-tight">
                    {item.tableNo}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200/80">
                  <Ionicons name="time-outline" size={13} color="#D97706" />
                  <Text className="text-amber-800 font-bold text-xs">
                    {item.time}
                  </Text>
                </View>
              </View>

              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center">
                    <Ionicons
                      name="receipt-outline"
                      size={16}
                      color="#35116B"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-700 text-sm font-bold">
                      {item.items} items
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      Ordered items
                    </Text>
                  </View>
                </View>
              </View>

              <View className="pt-3 border-t border-slate-100 flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Total Bill
                  </Text>

                  <Text
                    className="text-[#35116B] font-black text-xl tracking-tight"
                    numberOfLines={1}
                  >
                    {item.price}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    router.push("/orders");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`View order for table ${item.tableNo}`}
                  className="w-10 h-10 rounded-2xl bg-[#35116B] items-center justify-center shadow-md shadow-purple-900/20"
                >
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}
