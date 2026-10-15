import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
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

import { productPrice } from "@/api/products";
import { fetchTables, type ApiTable } from "@/api/tables";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";

const BRAND = "#35116B";

interface LocalBooking {
  itemsCount: string;
  price: string;
  bookedAt: number;
}

/** API sends "2026-10-15 14:32:02" — normalize so every engine parses it. */
function parseApiDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.replace(" ", "T"));
  return Number.isNaN(parsed) ? null : parsed;
}

export default function TablesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [apiTables, setApiTables] = useState<ApiTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Booking API isn't available yet — confirmed bookings are applied
  // locally on top of the server data until the next refresh.
  const [localBookings, setLocalBookings] = useState<
    Record<number, LocalBooking>
  >({});
  const [, setTick] = useState(0);

  const loadTables = useCallback(
    async (showSpinner = true) => {
      if (!token) return;
      if (showSpinner) setIsLoadingTables(true);
      setTablesError(null);
      try {
        const data = await fetchTables(token);
        console.log("[tables]", data);
        setApiTables(data);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load tables.";
        console.log("[tables] failed:", message);
        setTablesError(message);
      } finally {
        setIsLoadingTables(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadTables(true);
  }, [loadTables]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTables(false);
  };

  const isTableFree = (table: ApiTable) =>
    !localBookings[table.id] && !table.booking;

  const getTableBookedAt = (table: ApiTable): number | null =>
    localBookings[table.id]?.bookedAt ?? parseApiDate(table.booking?.start_at);

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
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [menuSearch, setMenuSearch] = useState("");

  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts(isModalOpen);

  const handleTablePress = (table: ApiTable) => {
    setSelectedTable(table);
    setCustomerName(table.booking?.contact_name?.trim() ?? "");
    setQuantities({});
    setMenuSearch("");
    setIsModalOpen(true);
  };

  const changeQty = (productId: number, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[productId];
      } else {
        copy[productId] = next;
      }
      return copy;
    });
  };

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(menuSearch.trim().toLowerCase()),
  );

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);

  const calculateTotal = () => {
    return products.reduce(
      (sum, p) => sum + (quantities[p.product_id] ?? 0) * productPrice(p),
      0,
    );
  };

  const handleConfirmBooking = () => {
    if (!selectedTable) return;

    const total = calculateTotal();

    setLocalBookings((prev) => ({
      ...prev,
      [selectedTable.id]: {
        itemsCount: `${totalItems} Items`,
        price: `₹${total}`,
        bookedAt: Date.now(),
      },
    }));

    setIsModalOpen(false);
  };

  const occupiedTables = apiTables.filter((t) => !isTableFree(t));
  const selectedIsOccupied = !!selectedTable && !isTableFree(selectedTable);

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
              Rooms
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND}
          />
        }
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Occupied Rooms ({occupiedTables.length})
          </Text>
        </View>

        {isLoadingTables && apiTables.length === 0 ? (
          <View className="items-center py-16 gap-2">
            <ActivityIndicator size="large" color={BRAND} />
            <Text className="text-slate-400 text-xs font-semibold">
              Loading rooms...
            </Text>
          </View>
        ) : tablesError && apiTables.length === 0 ? (
          <View className="items-center py-10 px-4 bg-red-50 border border-red-200/60 rounded-3xl gap-2">
            <Ionicons name="cloud-offline-outline" size={28} color="#DC2626" />
            <Text className="text-red-700 text-xs font-semibold text-center">
              {tablesError}
            </Text>
            <TouchableOpacity
              onPress={() => loadTables(true)}
              activeOpacity={0.8}
              className="bg-[#35116B] px-5 py-2.5 rounded-xl mt-1"
            >
              <Text className="text-white font-bold text-xs">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : occupiedTables.length === 0 ? (
          <View className="items-center py-16 gap-1.5">
            <Ionicons
              name="game-controller-outline"
              size={30}
              color="#CBD5E1"
            />
            <Text className="text-slate-500 font-bold text-sm">
              No occupied rooms
            </Text>
            <Text className="text-slate-400 text-xs">
              All rooms are currently free.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {occupiedTables.map((table) => {
              const override = localBookings[table.id];
              const liveTime = getElapsedTime(getTableBookedAt(table));
              const guestName = table.booking?.contact_name?.trim() || "Guest";
              const guestCount =
                table.booking?.total_head_count ??
                table.booking?.head_count ??
                0;

              return (
                <Pressable
                  key={table.id}
                  onPress={() => handleTablePress(table)}
                  className="w-[48%] h-52 p-4 rounded-3xl justify-between border shadow-sm transition-all active:scale-95 bg-[#35116B] border-[#35116B] shadow-purple-900/20"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="px-3 py-1 rounded-xl flex-row items-center gap-1 bg-white/10 border border-white/20">
                      <Ionicons name="restaurant" size={12} color="#FFFFFF" />
                      <Text
                        className="font-black text-sm text-white"
                        numberOfLines={1}
                      >
                        {table.name}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      <Ionicons name="time-outline" size={11} color="#FBBF24" />
                      <Text className="text-amber-300 font-bold text-[11px]">
                        {liveTime}
                      </Text>
                    </View>
                  </View>

                  <View className="my-1">
                    {override ? (
                      <View>
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <Ionicons
                            name="fast-food-outline"
                            size={14}
                            color="#D8B4FE"
                          />
                          <Text className="text-purple-200 text-xs font-bold">
                            {override.itemsCount}
                          </Text>
                        </View>
                        <Text className="text-purple-300 text-[10px] font-semibold uppercase tracking-wider">
                          Total Amount
                        </Text>
                        <Text className="text-white font-black text-2xl tracking-tight">
                          {override.price}
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <Ionicons
                            name="person-outline"
                            size={14}
                            color="#D8B4FE"
                          />
                          <Text
                            className="text-purple-200 text-xs font-bold flex-1"
                            numberOfLines={1}
                          >
                            {guestName}
                          </Text>
                        </View>
                        <Text className="text-purple-300 text-[10px] font-semibold uppercase tracking-wider">
                          Guests
                        </Text>
                        <Text className="text-white font-black text-2xl tracking-tight">
                          {guestCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="pt-2 border-t flex-row items-center justify-between border-white/10">
                    <Text className="text-[11px] font-bold text-purple-300">
                      Add Items
                    </Text>

                    <View className="w-7 h-7 rounded-xl items-center justify-center bg-white">
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#35116B"
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
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
                  {selectedIsOccupied ? "Running Order" : "New Reservation"}
                </Text>
                <Text className="text-xl font-extrabold text-[#35116B]">
                  {selectedIsOccupied
                    ? `Add Items — ${selectedTable?.name}`
                    : `Book ${selectedTable?.name}`}
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
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-700 font-bold text-xs uppercase">
                    Select Items / Orders
                  </Text>
                  {totalItems > 0 && (
                    <View className="bg-[#35116B] px-2.5 py-1 rounded-full">
                      <Text className="text-white text-[11px] font-bold">
                        {totalItems} selected
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 mb-2.5">
                  <Ionicons name="search-outline" size={17} color="#94A3B8" />
                  <TextInput
                    placeholder="Search menu..."
                    placeholderTextColor="#94A3B8"
                    value={menuSearch}
                    onChangeText={setMenuSearch}
                    className="flex-1 ml-2 py-3 text-slate-900 text-sm font-medium"
                  />
                  {menuSearch.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setMenuSearch("")}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {productsLoading ? (
                  <View className="items-center py-8 gap-2">
                    <ActivityIndicator size="large" color={BRAND} />
                    <Text className="text-slate-400 text-xs font-semibold">
                      Loading menu...
                    </Text>
                  </View>
                ) : productsError ? (
                  <View className="items-center py-6 px-4 bg-red-50 border border-red-200/60 rounded-2xl gap-2">
                    <Ionicons
                      name="cloud-offline-outline"
                      size={26}
                      color="#DC2626"
                    />
                    <Text className="text-red-700 text-xs font-semibold text-center">
                      {productsError}
                    </Text>
                    <TouchableOpacity
                      onPress={refetchProducts}
                      activeOpacity={0.8}
                      className="bg-[#35116B] px-5 py-2.5 rounded-xl mt-1"
                    >
                      <Text className="text-white font-bold text-xs">
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View className="items-center py-6 gap-1.5">
                    <Ionicons
                      name="fast-food-outline"
                      size={26}
                      color="#CBD5E1"
                    />
                    <Text className="text-slate-400 text-xs font-semibold">
                      {products.length === 0
                        ? "No items available right now."
                        : "No items match your search."}
                    </Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {filteredProducts.map((item) => {
                      const qty = quantities[item.product_id] ?? 0;
                      const isSelected = qty > 0;
                      return (
                        <View
                          key={item.product_id}
                          className={`flex-row items-center justify-between p-3 rounded-2xl border ${
                            isSelected
                              ? "bg-purple-50/70 border-[#35116B]"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <View className="flex-row items-center gap-3 flex-1 pr-2">
                            <View
                              className={`w-10 h-10 rounded-xl items-center justify-center ${
                                isSelected
                                  ? "bg-[#35116B]"
                                  : "bg-white border border-slate-200"
                              }`}
                            >
                              <Ionicons
                                name="fast-food"
                                size={17}
                                color={isSelected ? "#FFFFFF" : BRAND}
                              />
                            </View>
                            <View className="flex-1">
                              <Text
                                className="text-slate-900 font-bold text-sm"
                                numberOfLines={1}
                              >
                                {item.product_name}
                              </Text>
                              <Text className="text-[#35116B] font-extrabold text-xs mt-0.5">
                                ₹{productPrice(item)}
                              </Text>
                            </View>
                          </View>

                          {isSelected ? (
                            <View className="flex-row items-center gap-2.5 bg-white px-2 py-1.5 rounded-xl border border-slate-200">
                              <TouchableOpacity
                                onPress={() => changeQty(item.product_id, -1)}
                                activeOpacity={0.7}
                                className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center"
                              >
                                <Ionicons
                                  name="remove"
                                  size={15}
                                  color={BRAND}
                                />
                              </TouchableOpacity>
                              <Text className="font-extrabold text-slate-900 text-sm min-w-[18px] text-center">
                                {qty}
                              </Text>
                              <TouchableOpacity
                                onPress={() => changeQty(item.product_id, 1)}
                                activeOpacity={0.7}
                                className="w-7 h-7 rounded-lg bg-[#35116B] items-center justify-center"
                              >
                                <Ionicons
                                  name="add"
                                  size={15}
                                  color="#FFFFFF"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => changeQty(item.product_id, 1)}
                              activeOpacity={0.8}
                              className="flex-row items-center gap-1 bg-[#35116B] px-3.5 py-2 rounded-xl"
                            >
                              <Ionicons name="add" size={15} color="#FFFFFF" />
                              <Text className="text-white font-bold text-xs">
                                Add
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="pt-2 border-t mb-3 border-slate-100 flex-row items-center justify-between">
              <View>
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  {totalItems} Item{totalItems === 1 ? "" : "s"} · Total
                </Text>
                <Text className="text-[#35116B] font-black text-2xl">
                  ₹{calculateTotal()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleConfirmBooking}
                activeOpacity={0.85}
                disabled={totalItems === 0}
                className="bg-emerald-500 px-6 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
