import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BRAND = "#35116B";

const DUMMY_FOOD_ITEMS = [
  { id: "f1", name: "Cold Coffee", price: 120 },
  { id: "f2", name: "Cheese Pizza", price: 280 },
  { id: "f3", name: "Veg Burger", price: 150 },
  { id: "f4", name: "PS5 Hour Pass", price: 200 },
  { id: "f5", name: "French Fries", price: 110 },
];

const INITIAL_TABLES = [
  {
    id: "T1",
    seats: 2,
    status: "Free",
    bookedAt: null,
  },
  {
    id: "T2",
    seats: 4,
    status: "Occupied",
    itemsCount: "4 Items",
    price: "₹650",
    bookedAt: Date.now() - 35 * 60 * 1000,
  },
  {
    id: "T3",
    seats: 4,
    status: "Free",
    bookedAt: null,
  },
  {
    id: "T4",
    seats: 6,
    status: "Occupied",
    itemsCount: "6 Items",
    price: "₹1,250",
    bookedAt: Date.now() - 70 * 60 * 1000,
  },
];

export default function TablesScreen() {
  const router = useRouter();
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (bookedAt: number | null) => {
    if (!bookedAt) return "Just now";
    const diffMs = Date.now() - bookedAt;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);

  const handleTablePress = (table: any) => {
    if (table.status === "Free") {
      setSelectedTable(table);
      setCustomerName("");
      setSelectedFoods([]);
      setIsModalOpen(true);
    } else {
      router.push("/orders" as any);
    }
  };

  const toggleFoodItem = (foodName: string) => {
    if (selectedFoods.includes(foodName)) {
      setSelectedFoods(selectedFoods.filter((item) => item !== foodName));
    } else {
      setSelectedFoods([...selectedFoods, foodName]);
    }
  };

  const calculateTotal = () => {
    return selectedFoods.reduce((sum, foodName) => {
      const item = DUMMY_FOOD_ITEMS.find((f) => f.name === foodName);
      return sum + (item ? item.price : 0);
    }, 0);
  };

  const handleConfirmBooking = () => {
    if (!selectedTable) return;

    const total = calculateTotal();

    setTables((prevTables) =>
      prevTables.map((t) =>
        t.id === selectedTable.id
          ? {
              ...t,
              status: "Occupied",
              itemsCount: `${selectedFoods.length} Items`,
              price: `₹${total}`,
              bookedAt: Date.now(),
            }
          : t,
      ),
    );

    setIsModalOpen(false);
  };

  const freeCount = tables.filter((t) => t.status === "Free").length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-200">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/home" as any);
              }
            }}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-2xl items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color={BRAND} />
          </TouchableOpacity>

          <View>
            <Text className="text-[#35116B] text-xl font-extrabold tracking-tight">
              Tables
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            All Tables ({tables.length})
          </Text>
          <View className="flex-row items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-emerald-700 text-[11px] font-bold">
              {freeCount} Free
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {tables.map((table) => {
            const isFree = table.status === "Free";
            const liveTime = getElapsedTime(table.bookedAt);

            return (
              <Pressable
                key={table.id}
                onPress={() => handleTablePress(table)}
                className={`w-[48%] h-52 p-4 rounded-3xl justify-between border shadow-sm transition-all active:scale-95 ${
                  isFree
                    ? "bg-emerald-50/80 border-emerald-300/80 shadow-emerald-500/10"
                    : "bg-[#35116B] border-[#35116B] shadow-purple-900/20"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View
                    className={`px-3 py-1 rounded-xl flex-row items-center gap-1 ${
                      isFree
                        ? "bg-emerald-500"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    <Ionicons name="restaurant" size={12} color="#FFFFFF" />
                    <Text className="font-black text-sm text-white">
                      {table.id}
                    </Text>
                  </View>

                  {isFree ? (
                    <Text className="text-emerald-700 font-bold text-xs">
                      {table.seats} Seats
                    </Text>
                  ) : (
                    <View className="flex-row items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      <Ionicons name="time-outline" size={11} color="#FBBF24" />
                      <Text className="text-amber-300 font-bold text-[11px]">
                        {liveTime}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="my-1">
                  {isFree ? (
                    <View>
                      <Text className="text-emerald-900 font-extrabold text-lg tracking-tight">
                        Available
                      </Text>
                      <Text className="text-emerald-700/80 text-xs font-medium mt-0.5">
                        Ready for order
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Ionicons
                          name="fast-food-outline"
                          size={14}
                          color="#D8B4FE"
                        />
                        <Text className="text-purple-200 text-xs font-bold">
                          {table.itemsCount}
                        </Text>
                      </View>
                      <Text className="text-purple-300 text-[10px] font-semibold uppercase tracking-wider">
                        Total Amount
                      </Text>
                      <Text className="text-white font-black text-2xl tracking-tight">
                        {table.price}
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  className={`pt-2 border-t flex-row items-center justify-between ${
                    isFree ? "border-emerald-200/80" : "border-white/10"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isFree ? "text-emerald-700" : "text-purple-300"
                    }`}
                  >
                    {isFree ? "Tap to Book" : "View Order"}
                  </Text>

                  <View
                    className={`w-7 h-7 rounded-xl items-center justify-center ${
                      isFree ? "bg-emerald-600" : "bg-white"
                    }`}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={isFree ? "#FFFFFF" : "#35116B"}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[32px] p-6 border-t border-slate-100 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <View>
                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  New Reservation
                </Text>
                <Text className="text-xl font-extrabold text-[#35116B]">
                  Book {selectedTable?.id}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-slate-700 font-bold text-xs uppercase mb-1.5">
                  Customer Name
                </Text>
                <TextInput
                  placeholder="Enter guest name"
                  placeholderTextColor="#94A3B8"
                  value={customerName}
                  onChangeText={setCustomerName}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold"
                />
              </View>

              <View className="mb-5">
                <Text className="text-slate-700 font-bold text-xs uppercase mb-2">
                  Select Items / Orders
                </Text>
                <View className="gap-2">
                  {DUMMY_FOOD_ITEMS.map((item) => {
                    const isSelected = selectedFoods.includes(item.name);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleFoodItem(item.name)}
                        className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                          isSelected
                            ? "bg-[#35116B] border-[#35116B]"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <View className="flex-row items-center gap-3">
                          <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={20}
                            color={isSelected ? "#fff" : "#94A3B8"}
                          />
                          <Text
                            className={`font-bold text-sm ${
                              isSelected ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <Text
                          className={`font-black text-sm ${
                            isSelected ? "text-white" : "text-[#35116B]"
                          }`}
                        >
                          ₹{item.price}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View className="pt-3 border-t border-slate-100 flex-row items-center justify-between">
              <View>
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  Estimated Total
                </Text>
                <Text className="text-[#35116B] font-black text-2xl">
                  ₹{calculateTotal()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleConfirmBooking}
                activeOpacity={0.85}
                className="bg-emerald-500 px-6 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Text className="text-white font-bold text-sm">
                  Confirm Booking
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
