import {
  storeKotOrder,
  fetchKotDetails,
  type KotStorePayload,
  type KotDetailsItem,
} from "@/api/kot";
import { closeTable } from "@/api/bill";
import {
  fetchWaiterOrderItems,
  storeWaiterOrderItems,
  type WaiterOrderItemInput,
} from "@/api/waiterOrderItems";
import { productPrice } from "@/api/products";
import { fetchTables, type ApiTable } from "@/api/tables";
import ProductItemSkeleton from "@/components/Loader/ProductItemSkeleton";
import TableCardSkeleton from "@/components/Loader/TableCardSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import {
  printServerKot,
  loadPrinterConfig,
  isValidIPv4,
} from "@/utils/printer";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND = "#35116B";

const NOTE_CHIPS = [
  "No Onion",
  "Less Oil",
  "Less Spicy",
  "No Spice",
  "Extra Salt",
  "No Garlic",
  "Well Done",
  "Take Away",
];

interface LocalBooking {
  itemsCount: string;
  price: string;
  bookedAt: number;
}

function parseApiDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.replace(" ", "T"));
  return Number.isNaN(parsed) ? null : parsed;
}

export default function TablesScreen() {
  const router = useRouter();
  const { token, locations } = useAuth();
  const [apiTables, setApiTables] = useState<ApiTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
        console.log("table data", data);
        setApiTables(data);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load tables.";
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTable, setDetailTable] = useState<ApiTable | null>(null);
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [isSubmittingKot, setIsSubmittingKot] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [expandedNotePid, setExpandedNotePid] = useState<number | null>(null);
  const [itemNoteText, setItemNoteText] = useState<Record<number, string>>({});
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionTable, setActionTable] = useState<ApiTable | null>(null);
  const [isClosingTable, setIsClosingTable] = useState(false);
  const [isDeletingItems, setIsDeletingItems] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLines, setEditLines] = useState<WaiterOrderItemInput[]>([]);
  const [isLoadingEditLines, setIsLoadingEditLines] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [kotDetails, setKotDetails] = useState<KotDetailsItem[]>([]);
  const [isLoadingKotDetails, setIsLoadingKotDetails] = useState(false);
  const [kotDetailsError, setKotDetailsError] = useState<string | null>(null);

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
    setItemNoteText({});
    setExpandedNotePid(null);
    setIsNoteModalOpen(false);
    setIsModalOpen(true);
  };

  const loadKotDetails = useCallback(
    async (table: ApiTable) => {
      const bookingId = table.booking?.id ?? null;
      if (!token || bookingId === null) {
        setKotDetails([]);
        setKotDetailsError(null);
        setIsLoadingKotDetails(false);
        return;
      }
      setIsLoadingKotDetails(true);
      setKotDetailsError(null);
      setKotDetails([]);
      try {
        const items = await fetchKotDetails(token, table.id, bookingId);
        setKotDetails(items);
      } catch (e) {
        setKotDetailsError(
          e instanceof Error ? e.message : "Failed to load food details.",
        );
      } finally {
        setIsLoadingKotDetails(false);
      }
    },
    [token],
  );

  const openActionModal = (table: ApiTable) => {
    setActionTable(table);
    setIsActionModalOpen(true);
    loadKotDetails(table);
  };

  const extractWaiterLines = (res: any): WaiterOrderItemInput[] => {
    const candidates = [
      res?.data,
      res?.data?.items,
      res?.data?.waiter_order_items,
      res?.items,
      res?.waiter_order_items,
    ];
    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0 && typeof c[0] === "object") {
        return c
          .filter(
            (l: any) =>
              l && l.id != null && l.waiter_order_id != null && l.qty != null,
          )
          .map((l: any) => ({
            id: Number(l.id),
            waiter_order_id: Number(l.waiter_order_id),
            qty: Number(l.qty),
          }));
      }
    }
    return [];
  };

  const handleDeleteItems = async () => {
    if (!actionTable || !token || isDeletingItems) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) {
      Alert.alert("Cannot delete", "This room has no active session.");
      return;
    }

    setIsDeletingItems(true);
    try {
      const res = await fetchWaiterOrderItems(token, bookingId);
      const lines = extractWaiterLines(res);

      if (lines.length === 0) {
        Alert.alert(
          "No items found",
          "Could not find any order lines for this room to delete.",
        );
        return;
      }

      await storeWaiterOrderItems(token, bookingId, {
        items: lines.map((l) => ({ ...l, qty: 0 })),
      });

      setIsActionModalOpen(false);
      setActionTable(null);
      await loadTables(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to delete the items.";
      Alert.alert("Delete Failed", message);
    } finally {
      setIsDeletingItems(false);
    }
  };

  const handleOpenEditItems = async () => {
    if (!actionTable || !token) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) {
      Alert.alert("Cannot edit", "This room has no active session.");
      return;
    }

    setIsLoadingEditLines(true);
    setEditLines([]);
    setIsActionModalOpen(false);
    setIsEditModalOpen(true);
    try {
      const res = await fetchWaiterOrderItems(token, bookingId);
      const lines = extractWaiterLines(res);
      setEditLines(lines);
      if (lines.length === 0) {
        Alert.alert(
          "No items found",
          "Could not find any order lines for this room to edit.",
        );
        setIsEditModalOpen(false);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load the items.";
      Alert.alert("Load Failed", message);
      setIsEditModalOpen(false);
    } finally {
      setIsLoadingEditLines(false);
    }
  };

  const changeEditQty = (index: number, delta: number) => {
    setEditLines((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
      ),
    );
  };

  const handleSaveEditItems = async () => {
    if (!actionTable || !token || isSavingEdit) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) return;

    setIsSavingEdit(true);
    try {
      await storeWaiterOrderItems(token, bookingId, { items: editLines });
      setIsEditModalOpen(false);
      setEditLines([]);
      await loadTables(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to save the items.";
      Alert.alert("Save Failed", message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCloseTable = async () => {
    if (!actionTable || !token || isClosingTable) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) {
      Alert.alert("Cannot close table", "This room has no active session.");
      return;
    }

    setIsClosingTable(true);
    try {
      await closeTable(token, bookingId);
      setLocalBookings((prev) => {
        if (!(actionTable.id in prev)) return prev;
        const copy = { ...prev };
        delete copy[actionTable.id];
        return copy;
      });
      setIsActionModalOpen(false);
      setActionTable(null);
      await loadTables(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to close the table.";
      Alert.alert("Close Table Failed", message);
    } finally {
      setIsClosingTable(false);
    }
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

  const toggleNoteChip = (productId: number, chip: string) => {
    setItemNoteText((prev) => {
      const current = (prev[productId] ?? "").trim();
      const parts = current
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const exists = parts.some((p) => p.toLowerCase() === chip.toLowerCase());
      const next = exists
        ? parts.filter((p) => p.toLowerCase() !== chip.toLowerCase())
        : [...parts, chip];
      return { ...prev, [productId]: next.join(", ") };
    });
  };

  const isChipActive = (productId: number, chip: string): boolean => {
    const current = (itemNoteText[productId] ?? "").trim().toLowerCase();
    if (!current) return false;
    return current
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .some((p) => p === chip.toLowerCase());
  };

  const composeNote = (productId: number): string | null => {
    const text = (itemNoteText[productId] ?? "").trim();
    return text.length > 0 ? text : null;
  };

  const kotDetailsTotal = kotDetails.reduce(
    (sum, item) => sum + (item.totalPrice ?? (item.unitPrice ?? 0) * item.qty),
    0,
  );

  const selectedProducts = products.filter(
    (p) => (quantities[p.product_id] ?? 0) > 0,
  );

  const hasAnyNote = selectedProducts.some(
    (p) => composeNote(p.product_id) !== null,
  );

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(menuSearch.trim().toLowerCase()),
  );

  const visibleProducts = [...filteredProducts].sort(
    (a, b) =>
      Number((quantities[b.product_id] ?? 0) > 0) -
      Number((quantities[a.product_id] ?? 0) > 0),
  );

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);

  const calculateTotal = () => {
    return products.reduce(
      (sum, p) => sum + (quantities[p.product_id] ?? 0) * productPrice(p),
      0,
    );
  };

  const handleConfirmBooking = async () => {
    if (!selectedTable || !token || isSubmittingKot) return;

    const total = calculateTotal();
    const locationId =
      selectedTable.location_id ?? locations[0]?.location_id ?? 1;

    const payload: KotStorePayload = {
      location_id: locationId,
      res_table_id: selectedTable.id,
      booking_id: selectedTable.booking?.id ?? null,
      contact_id: selectedTable.booking?.contact_id ?? null,
      res_waiter_id: null,
      order_type: "separate",
      chair_no: "1",
      staff_note: null,
      types_of_service_id: null,
      products: products
        .filter((p) => (quantities[p.product_id] ?? 0) > 0)
        .map((p) => {
          const price = productPrice(p);
          return {
            product_id: p.product_id,
            variation_id: p.variation_id,
            quantity: quantities[p.product_id] ?? 0,
            unit_price: price,
            unit_price_inc_tax: price,
            item_tax: 0,
            tax_id: null,
            sell_line_note: composeNote(p.product_id),
          };
        }),
    };

    setIsSubmittingKot(true);
    try {
      console.log("KOT payload:", JSON.stringify(payload, null, 2));
      const response = await storeKotOrder(token, payload);
      console.log("KOT response:", JSON.stringify(response, null, 2));

      setLocalBookings((prev) => ({
        ...prev,
        [selectedTable.id]: {
          itemsCount: `${totalItems} Items`,
          price: `₹${total}`,
          bookedAt: Date.now(),
        },
      }));

      setIsNoteModalOpen(false);
      setExpandedNotePid(null);
      setIsModalOpen(false);

      if (response.kot) {
        const config = await loadPrinterConfig();
        const useLocalIp = isValidIPv4(config.kotIp);
        const host = useLocalIp ? config.kotIp.trim() : response.kot_printer;
        const port = useLocalIp
          ? config.port
          : (response.kot_printer_port ?? config.port);

        if (host) {
          try {
            await printServerKot(host, response.kot!, port);
          } catch (e) {
            const printMsg =
              e instanceof Error ? e.message : "Failed to print the KOT.";
            Alert.alert("Print Failed", printMsg);
          }
        } else if (response.print_kot) {
          Alert.alert(
            "No Printer",
            "No printer IP is configured. Set one on the KOT tab, or ask the server to send a printer.",
          );
        }
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to send the KOT.";
      Alert.alert("KOT Failed", message);
    } finally {
      setIsSubmittingKot(false);
    }
  };

  const occupiedTables = apiTables.filter((t) => !isTableFree(t));
  const selectedIsOccupied = !!selectedTable && !isTableFree(selectedTable);

  const detailExtraCount =
    detailTable?.booking?.extra_head_count ??
    detailTable?.booking?.extra_persons?.length ??
    0;
  const detailGuestCount =
    detailTable?.booking?.head_count ??
    Math.max(
      0,
      (detailTable?.booking?.total_head_count ?? 0) - detailExtraCount,
    );
  const detailTotalCount =
    detailTable?.booking?.total_head_count ??
    detailGuestCount + detailExtraCount;

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

        {isLoadingTables ? (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {[0, 1, 2, 3].map((i) => (
              <TableCardSkeleton key={i} />
            ))}
          </View>
        ) : tablesError ? (
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
              const extraCount =
                table.booking?.extra_head_count ??
                table.booking?.extra_persons?.length ??
                0;
              const guestCount =
                table.booking?.head_count ??
                Math.max(
                  0,
                  (table.booking?.total_head_count ?? 0) - extraCount,
                );
              const totalCount =
                table.booking?.total_head_count ?? guestCount + extraCount;

              return (
                <View key={table.id} className="w-[48%] mb-2">
                  <View className="h-60 px-3 py-4 rounded-3xl justify-between border shadow-sm bg-[#35116B] border-[#35116B] shadow-purple-900/20">
                    <Pressable
                      className="flex-1"
                      onPress={() => {
                        openActionModal(table);
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="px-3 py-1 rounded-xl flex-row items-center gap-1 bg-white/10 border border-white/20">
                          <Text
                            className="font-black text-sm text-white"
                            numberOfLines={1}
                          >
                            {table.name}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                          <Ionicons
                            name="time-outline"
                            size={11}
                            color="#FBBF24"
                          />
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
                        ) : null}

                        <View>
                          <View className="flex-row items-center gap-1.5 mb-1 mt-2">
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
                          <Text className="text-purple-300 mt-2 text-[10px] font-semibold uppercase tracking-wider">
                            Guests
                          </Text>
                          <Text className="text-white font-black text-2xl tracking-tight">
                            {guestCount}
                            {extraCount > 0 && (
                              <Text className="text-purple-200 text-sm font-bold">
                                {"  "}+{extraCount} Extra Person
                                {extraCount === 1 ? "" : "s"}
                              </Text>
                            )}
                          </Text>
                          {extraCount > 0 && (
                            <Text className="text-white mt-2 text-[13px] font-bold">
                              Total: {totalCount} Person
                              {totalCount === 1 ? "" : "s"}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  </View>
                  <View className="mt-1 h-3 w-full">
                    <View className="absolute left-[22%] top-0 bottom-0 w-[1.5px] rounded-full bg-black" />
                    <View className="absolute right-[22%] top-0 bottom-0 w-[1.5px] rounded-full bg-black" />
                  </View>
                  <Pressable
                    onPress={() => handleTablePress(table)}
                    className="bg-[#35116B] border border-slate-200 rounded-2xl px-4 py-2.5 flex-row items-center justify-between shadow-lg shadow-purple-900/20"
                  >
                    <Text className="text-[11px] font-bold text-white">
                      Add Items
                    </Text>

                    <View className="w-7 h-7 rounded-xl items-center justify-center bg-white">
                      <Ionicons name="add" size={20} color="#35116B" />
                    </View>
                  </Pressable>
                </View>
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
          <View className="bg-white rounded-t-[32px] p-6 border-t border-slate-100 h-[85%] justify-between">
            <View className="flex-row items-center justify-between mb-2 pb-1">
              <View>
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

            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-700 font-bold text-xs uppercase">
                  Select Items
                </Text>
                {totalItems > 0 && (
                  <View className="bg-[#35116B] px-2.5 py-1 rounded-full">
                    <Text className="text-white text-[11px] font-bold">
                      {totalItems} selected
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">
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
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="mb-5">
                {productsLoading ? (
                  <View className="mt-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <ProductItemSkeleton key={i} />
                    ))}
                  </View>
                ) : productsError ? (
                  <View className="items-center py-6 px-4 bg-red-50 border border-red-200/60 rounded-2xl gap-2">
                    <Ionicons
                      name="cloud-offline-outline"
                      size={26}
                      color="#DC2626"
                    />

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
                    {visibleProducts.map((item) => {
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

            {totalItems > 0 ? (
              <View className="pt-3 border-t mb-3 border-slate-100 flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  activeOpacity={0.7}
                  className="bg-red-500 px-5 py-3.5 rounded-2xl shadow-lg shadow-red-500/20 items-center justify-center"
                >
                  <Text className="text-white font-bold text-sm">Cancel</Text>
                </TouchableOpacity>

                <View className="flex-row items-center gap-3">
                  <View className="items-end">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      {totalItems} Item{totalItems === 1 ? "" : "s"} · Total
                    </Text>
                    <Text className="text-[#35116B] font-black text-xl">
                      ₹{calculateTotal()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsNoteModalOpen(true)}
                    activeOpacity={0.85}
                    disabled={totalItems === 0 || isSubmittingKot}
                    className="bg-emerald-500 px-5 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Text className="text-white font-bold text-sm">
                      {isSubmittingKot ? "Sending..." : "Print KOT"}
                    </Text>
                    <AntDesign name="printer" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isNoteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNoteModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/20">
          <View className="bg-white rounded-t-[32px] p-6 border-t border-slate-100 h-[85%] justify-between">
            <View className="flex-row items-center justify-between mb-2 pb-1">
              <View>
                <Text className="text-xl font-extrabold text-[#35116B]">
                  Add Notes — {selectedTable?.name}
                </Text>
                <Text className="text-slate-400 text-xs font-semibold mt-0.5">
                  Tap a food to add its note.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsNoteModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ flexGrow: 1, paddingVertical: 8 }}
            >
              {selectedProducts.length === 0 ? (
                <View className="items-center py-10 gap-1.5">
                  <Ionicons
                    name="fast-food-outline"
                    size={28}
                    color="#CBD5E1"
                  />
                  <Text className="text-slate-400 text-xs font-semibold">
                    No items selected.
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {selectedProducts.map((item) => {
                    const pid = item.product_id;
                    const qty = quantities[pid] ?? 0;
                    const isExpanded = expandedNotePid === pid;
                    const notePreview = composeNote(pid);
                    const lineTotal = productPrice(item) * qty;
                    return (
                      <View
                        key={pid}
                        className={`rounded-2xl border bg-slate-50 overflow-hidden ${
                          isExpanded
                            ? "border-[#35116B]"
                            : notePreview
                              ? "border-purple-300"
                              : "border-slate-200"
                        }`}
                      >
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() =>
                            setExpandedNotePid(isExpanded ? null : pid)
                          }
                          className="flex-row items-center p-3.5"
                        >
                          <View
                            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                              isExpanded || notePreview
                                ? "bg-[#35116B]"
                                : "bg-white border border-slate-200"
                            }`}
                          >
                            <Ionicons
                              name="fast-food"
                              size={17}
                              color={
                                isExpanded || notePreview ? "#FFFFFF" : BRAND
                              }
                            />
                          </View>

                          <View className="flex-1 pr-2">
                            <Text
                              className="text-slate-900 font-extrabold text-sm"
                              numberOfLines={1}
                            >
                              {item.product_name}
                            </Text>
                            <Text className="text-slate-400 text-[11px] font-semibold mt-0.5">
                              {item.sku_no ? `${item.sku_no} · ` : ""}₹
                              {productPrice(item)} × {qty} = ₹{lineTotal}
                            </Text>
                            {notePreview && !isExpanded ? (
                              <Text
                                className="text-[#35116B] text-[11px] font-bold mt-1"
                                numberOfLines={1}
                              >
                                📝 {notePreview}
                              </Text>
                            ) : null}
                          </View>

                          <View className="flex-row items-center gap-2">
                            <View className="bg-[#35116B] px-2.5 py-1 rounded-lg">
                              <Text className="text-white font-bold text-[11px]">
                                {qty}x
                              </Text>
                            </View>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={18}
                              color="#64748B"
                            />
                          </View>
                        </TouchableOpacity>

                        {isExpanded ? (
                          <View className="px-3.5 pb-3.5 pt-0.5 border-t border-slate-200">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5 mb-2">
                              Quick tags
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-2.5">
                              {NOTE_CHIPS.map((chip) => {
                                const active = isChipActive(pid, chip);
                                return (
                                  <TouchableOpacity
                                    key={chip}
                                    onPress={() => toggleNoteChip(pid, chip)}
                                    activeOpacity={0.8}
                                    className={`px-3 py-1.5 rounded-full border ${
                                      active
                                        ? "bg-[#35116B] border-[#35116B]"
                                        : "bg-white border-slate-200"
                                    }`}
                                  >
                                    <Text
                                      className={`text-[11px] font-bold ${
                                        active ? "text-white" : "text-slate-600"
                                      }`}
                                    >
                                      {chip}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                              Custom note
                            </Text>
                            <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3">
                              <Ionicons
                                name="create-outline"
                                size={16}
                                color="#94A3B8"
                              />
                              <TextInput
                                placeholder="e.g. extra crispy, less salt"
                                placeholderTextColor="#94A3B8"
                                value={itemNoteText[pid] ?? ""}
                                onChangeText={(t) =>
                                  setItemNoteText((prev) => ({
                                    ...prev,
                                    [pid]: t,
                                  }))
                                }
                                className="flex-1 ml-2 py-2.5 text-slate-900 text-sm font-medium"
                              />
                              {(itemNoteText[pid]?.length ?? 0) > 0 ? (
                                <TouchableOpacity
                                  onPress={() => {
                                    setItemNoteText((prev) => ({
                                      ...prev,
                                      [pid]: "",
                                    }));
                                  }}
                                  activeOpacity={0.7}
                                  className="ml-1"
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View className="pt-3 border-t mb-1 border-slate-100 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setIsNoteModalOpen(false)}
                activeOpacity={0.7}
                className="bg-slate-200 px-5 py-3.5 rounded-2xl items-center justify-center"
              >
                <Text className="text-black font-bold text-sm">Back</Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-3">
                {hasAnyNote ? (
                  <View className="items-end">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      {totalItems} Item{totalItems === 1 ? "" : "s"} · Total
                    </Text>
                    <Text className="text-[#35116B] font-black text-xl">
                      ₹{calculateTotal()}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleConfirmBooking}
                  activeOpacity={0.85}
                  disabled={isSubmittingKot}
                  className="bg-emerald-500 px-5 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Text className="text-white font-bold text-sm">
                    {isSubmittingKot ? "Sending..." : "Confirm & Print KOT"}
                  </Text>
                  <AntDesign name="printer" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isActionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsActionModalOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/60 px-5"
          onPress={() => setIsActionModalOpen(false)}
        >
          <Pressable
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85%]"
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {actionTable && (
                <>
                  <View className="items-center mb-5">
                    <Text className="text-xl font-black text-[#35116B]">
                      {actionTable.name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-semibold mt-1">
                      {actionTable.booking?.contact_name?.trim() || "Guest"} ·{" "}
                      {actionTable.booking?.total_head_count ??
                        actionTable.booking?.head_count ??
                        0}{" "}
                      Guests
                    </Text>
                  </View>

                  <View className="mb-4 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                    <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                      <Text className="text-slate-500 text-[11px] font-black uppercase tracking-wide">
                        Food Details
                      </Text>
                      {isLoadingKotDetails ? (
                        <ActivityIndicator size="small" color={BRAND} />
                      ) : (
                        <Text className="text-slate-400 text-[11px] font-bold">
                          {kotDetails.length} Item
                          {kotDetails.length === 1 ? "" : "s"}
                        </Text>
                      )}
                    </View>

                    {!actionTable.booking ? (
                      <Text className="text-slate-400 text-xs font-semibold py-1">
                        No active session for this room.
                      </Text>
                    ) : isLoadingKotDetails ? (
                      <View className="gap-2 py-1">
                        <View className="h-3.5 w-2/3 rounded bg-slate-200" />
                        <View className="h-3.5 w-1/2 rounded bg-slate-200" />
                        <View className="h-3.5 w-3/5 rounded bg-slate-200" />
                      </View>
                    ) : kotDetailsError ? (
                      <Pressable
                        onPress={() => loadKotDetails(actionTable)}
                        className="items-center py-1"
                      >
                        <Text className="text-red-500 text-xs font-semibold text-center">
                          {kotDetailsError}
                        </Text>
                        <Text className="text-[#35116B] text-xs font-bold mt-1">
                          Tap to retry
                        </Text>
                      </Pressable>
                    ) : kotDetails.length === 0 ? (
                      <Text className="text-slate-400 text-xs font-semibold py-1">
                        No food items ordered yet.
                      </Text>
                    ) : (
                      <>
                        <ScrollView
                          style={{ maxHeight: 180 }}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled
                        >
                          {kotDetails.map((item, index) => {
                            const lineTotal =
                              item.totalPrice ??
                              (item.unitPrice ?? 0) * item.qty;
                            return (
                              <View
                                key={`${item.name}-${index}`}
                                className={`flex-row items-center justify-between py-2 ${
                                  index < kotDetails.length - 1
                                    ? "border-b border-slate-100"
                                    : ""
                                }`}
                              >
                                <View className="flex-1 pr-3">
                                  <Text
                                    className="text-slate-900 text-xs font-bold"
                                    numberOfLines={1}
                                  >
                                    {item.name}
                                  </Text>
                                  {item.note ? (
                                    <Text className="text-slate-400 text-[10px] mt-0.5">
                                      {item.note}
                                    </Text>
                                  ) : null}
                                </View>

                                <View className="flex-row items-center gap-2">
                                  <Text className="text-slate-500 text-xs font-semibold">
                                    ×{item.qty}
                                  </Text>
                                  <Text className="text-[#35116B] font-black text-xs min-w-[45px] text-right">
                                    ₹{lineTotal.toFixed(2)}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>

                        <View className="flex-row items-center justify-between pt-2.5 mt-2 border-t border-slate-200/60">
                          <Text className="text-slate-600 text-xs font-bold">
                            Total Amount
                          </Text>
                          <Text className="text-[#35116B] font-black text-sm">
                            ₹{kotDetailsTotal.toFixed(2)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  <View className="gap-2.5">
                    <TouchableOpacity
                      onPress={handleOpenEditItems}
                      activeOpacity={0.8}
                      className="bg-purple-50 border border-purple-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                    >
                      <Ionicons name="create-outline" size={18} color={BRAND} />
                      <Text className="text-[#35116B] font-bold text-sm">
                        Edit Items
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCloseTable}
                      activeOpacity={0.85}
                      disabled={isClosingTable}
                      className="bg-emerald-500 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                    >
                      {isClosingTable ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons
                          name="lock-closed"
                          size={18}
                          color="#FFFFFF"
                        />
                      )}
                      <Text className="text-white font-bold text-sm">
                        {isClosingTable ? "Closing..." : "Close Table"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Delete Items",
                          "Remove all order items for this room? This updates the server.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: handleDeleteItems,
                            },
                          ],
                        );
                      }}
                      activeOpacity={0.8}
                      disabled={isDeletingItems}
                      className="bg-red-50 border border-red-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isDeletingItems ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#DC2626"
                        />
                      )}
                      <Text className="text-red-600 font-bold text-sm">
                        {isDeletingItems ? "Deleting..." : "Delete Items"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setIsActionModalOpen(false);
                setActionTable(null);
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-100 items-center justify-center z-10"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/60 px-5"
          onPress={() => setIsEditModalOpen(false)}
        >
          <Pressable
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <Text className="text-lg font-extrabold text-[#35116B]">
                Edit Items — Room {actionTable?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isLoadingEditLines ? (
              <View className="items-center py-8 gap-2">
                <ActivityIndicator size="small" color={BRAND} />
                <Text className="text-slate-400 text-xs font-semibold">
                  Loading items...
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {editLines.map((line, idx) => (
                  <View
                    key={`${line.id}-${idx}`}
                    className="flex-row items-center justify-between bg-slate-50 p-3.5 rounded-2xl mb-2.5 border border-slate-200"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-slate-900 font-bold text-sm">
                        Item #{line.id}
                      </Text>
                      <Text className="text-purple-900 font-extrabold text-xs">
                        Line {line.waiter_order_id}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200">
                      <TouchableOpacity
                        onPress={() => changeEditQty(idx, -1)}
                        activeOpacity={0.7}
                        className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
                      >
                        <Ionicons name="remove" size={16} color="#35116B" />
                      </TouchableOpacity>
                      <Text className="font-extrabold text-slate-900 text-md min-w-[16px] text-center">
                        {line.qty}
                      </Text>
                      <TouchableOpacity
                        onPress={() => changeEditQty(idx, 1)}
                        activeOpacity={0.7}
                        className="w-8 h-8 rounded-lg bg-[#35116B] items-center justify-center"
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View className="pt-4 border-t border-slate-100 mt-2">
              <TouchableOpacity
                onPress={handleSaveEditItems}
                disabled={isSavingEdit || isLoadingEditLines}
                activeOpacity={0.85}
                className="bg-[#35116B] py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md shadow-purple-900/20 disabled:opacity-60"
              >
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                )}
                <Text className="text-white font-bold text-sm">
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
