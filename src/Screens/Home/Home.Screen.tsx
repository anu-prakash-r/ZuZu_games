import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [createTableVisible, setCreateTableVisible] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [seatCount, setSeatCount] = useState("4");
  const [tableType, setTableType] = useState("Standard");
  const [createdTables, setCreatedTables] = useState<
    { id: string; tableNo: string; seats: number; type: string }[]
  >([]);
  const [tableError, setTableError] = useState("");
  const totalTables = 15;
  const occupiedTables = 9;
  const availableTables = totalTables - occupiedTables;
  const handleCreateTable = () => {
    const number = tableNumber.trim();
    const seats = Number(seatCount);

    if (!number) {
      setTableError("Please enter a table number.");
      return;
    }

    if (!/^\d+$/.test(number) || Number(number) < 1) {
      setTableError("Enter a valid positive table number.");
      return;
    }

    const duplicate = createdTables.some((table) => table.tableNo === number);

    const existingTable = ACTIVE_TABLES.some(
      (table) => Number(table.tableNo) === Number(number),
    );

    if (duplicate || existingTable) {
      setTableError("This table number already exists.");
      return;
    }

    if (!Number.isInteger(seats) || seats < 1 || seats > 50) {
      setTableError("Enter between 1 and 50 seats.");
      return;
    }

    setCreatedTables((previous) => [
      ...previous,
      {
        id: Date.now().toString(),
        tableNo: number,
        seats,
        type: tableType,
      },
    ]);

    setTableNumber("");
    setSeatCount("4");
    setTableType("Standard");
    setTableError("");
    setCreateTableVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of ZuZu Games Cafe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => router.replace("/" as any),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <View className="w-11 h-11 rounded-2xl bg-[#35116B] items-center justify-center shadow-md shadow-[#35116B]/30">
              <Ionicons name="game-controller" size={20} color="#fff" />
            </View>

            <View className="justify-center ml-3">
              <View className="flex-row items-center space-x-1.5">
                <Text className="text-slate-500 text-xs font-medium tracking-wide">
                  Hello, Welcome back!
                </Text>
                <Text className="text-xs">👋</Text>
              </View>
              <Text className="text-[#35116B] text-xl font-black tracking-tight mt-0.5">
                ZuZu Games Cafe
              </Text>
            </View>
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
              onPress={() => {
                setTableError("");
                setCreateTableVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Add more tables"
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

      <Modal
        visible={createTableVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCreateTableVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-center items-center px-5"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Backdrop */}
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => setCreateTableVisible(false)}
          />

          {/* Modal Container */}
          <View className="w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl border border-slate-100">
            {/* Header */}
            <View className="bg-[#35116B] px-6 py-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3.5">
                  <View className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 items-center justify-center">
                    <Ionicons name="grid-sharp" size={22} color="#FFD700" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-black tracking-tight">
                      Add New Table
                    </Text>
                    <Text className="text-purple-200/90 text-xs font-medium mt-0.5">
                      Configure table details for your cafe floor
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setCreateTableVisible(false)}
                  activeOpacity={0.7}
                  className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Body Content */}
            <View className="p-6">
              {/* Table Number Input */}
              <View className="mb-4">
                <Text className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
                  Table Number
                </Text>
                <View className="flex-row items-center border border-slate-200/80 rounded-2xl px-4 h-14 bg-slate-50/50">
                  {/* FIX 1: Replaced invalid "hashtag" icon with "pricetag-outline" */}
                  <Ionicons name="pricetag-outline" size={18} color="#35116B" />
                  <TextInput
                    className="flex-1 ml-3 text-slate-900 font-semibold text-base"
                    placeholder="e.g. 10 or T-04"
                    placeholderTextColor="#94A3B8"
                    value={tableNumber}
                    onChangeText={(value) => {
                      setTableNumber(value);
                      setTableError("");
                    }}
                    maxLength={6}
                  />
                </View>
              </View>

              {/* Number of Seats Input */}
              <View className="mb-5">
                <Text className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
                  Number of Seats
                </Text>
                <View className="flex-row items-center border border-slate-200/80 rounded-2xl px-4 h-14 bg-slate-50/50">
                  <Ionicons name="people-outline" size={19} color="#35116B" />
                  <TextInput
                    className="flex-1 ml-3 text-slate-900 font-semibold text-base"
                    placeholder="e.g. 4"
                    placeholderTextColor="#94A3B8"
                    value={seatCount}
                    onChangeText={setSeatCount}
                    /* FIX 2: Corrected keyboardDataType to keyboardType */
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>

              {/* Table Type Selector */}
              <View className="mb-6">
                <Text className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
                  Table Category
                </Text>
                <View className="flex-row gap-2.5">
                  {[
                    { id: "Standard", icon: "restaurant-outline" },
                    { id: "VIP", icon: "star-outline" },
                    { id: "Outdoor", icon: "sunny-outline" },
                  ].map((item) => {
                    const selected = tableType === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setTableType(item.id)}
                        /* FIX 3: Removed activeOpacity prop from Pressable */
                        className={`flex-1 py-3.5 px-2 rounded-2xl border items-center justify-center ${
                          selected
                            ? "bg-purple-50/80 border-[#35116B]"
                            : "bg-white border-slate-200/80"
                        }`}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={selected ? "#35116B" : "#64748B"}
                        />
                        <Text
                          className={`text-xs font-bold mt-1.5 ${
                            selected ? "text-[#35116B]" : "text-slate-600"
                          }`}
                        >
                          {item.id}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Error Message */}
              {tableError ? (
                <View className="flex-row items-center bg-red-50 border border-red-200/60 p-3 rounded-xl mb-4 gap-2">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#DC2626"
                  />
                  <Text className="text-red-700 text-xs font-medium flex-1">
                    {tableError}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-1">
                <TouchableOpacity
                  onPress={() => {
                    setCreateTableVisible(false);
                    setTableError("");
                  }}
                  activeOpacity={0.75}
                  className="flex-1 h-12 rounded-2xl border border-slate-200 bg-slate-50 items-center justify-center"
                >
                  <Text className="text-slate-700 font-bold text-sm">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateTable}
                  activeOpacity={0.85}
                  className="flex-1 h-12 rounded-2xl bg-[#35116B] items-center justify-center flex-row gap-2 shadow-md"
                >
                  <Ionicons name="add-circle" size={19} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm tracking-wide">
                    Create Table
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
