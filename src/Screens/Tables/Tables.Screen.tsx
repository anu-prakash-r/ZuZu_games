import { closeTable } from "@/api/bill";
import {
  fetchKotDetails,
  storeKotOrder,
  type KotDetailsItem,
  type KotStorePayload,
} from "@/api/kot";
import { productPrice, type Product } from "@/api/products";
import { fetchTables, type ApiTable } from "@/api/tables";
import {
  fetchWaiterOrderItems,
  storeWaiterOrderItems,
  type WaiterOrderItemInput,
} from "@/api/waiterOrderItems";
import TableCardSkeleton from "@/components/Loader/TableCardSkeleton";
import EditItemsModal from "@/components/Tables/EditItemsModal";
import MenuModal from "@/components/Tables/MenuModal";
import NoteModal from "@/components/Tables/NoteModal";
import TableActionsModal from "@/components/Tables/TableActionsModal";
import TableCard, { type LocalBooking } from "@/components/Tables/TableCard";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useItemNotes } from "@/hooks/useItemNotes";
import { useProducts } from "@/hooks/useProducts";
import {
  printBill,
  printServerKot,
  loadPrinterConfig,
  isValidIPv4,
} from "@/utils/printer";
import {
  formatElapsed,
  HOURLY_RATE,
  sessionCharges,
} from "@/utils/sessionCharges";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isSubmittingKot, setIsSubmittingKot] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
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

  const notes = useItemNotes();

  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts(isModalOpen);

  const { categories, refetch: refetchCategories } = useCategories(isModalOpen);
  const handleTablePress = (table: ApiTable) => {
    setSelectedTable(table);
    setQuantities({});
    setMenuSearch("");
    setSelectedCategoryId(null);
    notes.reset();
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
      return;
    }

    setIsDeletingItems(true);
    try {
      const res = await fetchWaiterOrderItems(token, bookingId);
      const lines = extractWaiterLines(res);

      if (lines.length === 0) {
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
    } finally {
      setIsDeletingItems(false);
    }
  };

  const handleOpenEditItems = async () => {
    if (!actionTable || !token) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) {
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
        setIsEditModalOpen(false);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load the items.";
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
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCloseTable = async () => {
    if (!actionTable || !token || isClosingTable) return;

    const booking = actionTable.booking;
    if (!booking) {
      return;
    }

    setIsClosingTable(true);
    const tableName = actionTable.name;
    try {
      const response = await closeTable(token, booking.id);
      const charges = sessionCharges(booking);
      setLocalBookings((prev) => {
        if (!(actionTable.id in prev)) return prev;
        const copy = { ...prev };
        delete copy[actionTable.id];
        return copy;
      });
      setIsActionModalOpen(false);
      setActionTable(null);
      await loadTables(false);
      await printSessionBill(tableName, booking.id, charges, response);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to close the table.";
    } finally {
      setIsClosingTable(false);
    }
  };

  const printSessionBill = async (
    tableName: string,
    bookingId: number,
    charges: ReturnType<typeof sessionCharges>,
    response: Record<string, unknown> | null,
  ) => {
    const config = await loadPrinterConfig();
    const host = config.billingIp;
    if (!isValidIPv4(host)) {
      Alert.alert(
        "Bill not printed",
        "No billing printer IP is configured. Set one on the KOT tab.",
      );
      return;
    }

    const data = (response?.data ?? response) as Record<string, unknown> | null;
    const invoiceNo =
      typeof data?.invoice_no === "string" ? data.invoice_no : undefined;

    try {
      await printBill(
        host.trim(),
        {
          table: tableName,
          orderId: String(bookingId),
          items: kotDetails.map((k) => ({
            name: k.name,
            qty: k.qty,
            price: k.unitPrice ?? 0,
          })),
          elapsed: formatElapsed(charges.elapsedMinutes),
          roomCharge: charges.roomCharge,
          extraPersons: charges.extraPersons,
          extraPersonCharge: charges.extraPersonCharge,
          hourlyRate: HOURLY_RATE,
          invoiceNo,
        },
        config.port,
      );
    } catch (e) {
      const printMsg =
        e instanceof Error ? e.message : "Failed to print the bill.";
      Alert.alert("Print Failed", printMsg);
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

  const selectedProducts: Product[] = products.filter(
    (p) => (quantities[p.product_id] ?? 0) > 0,
  );

  const hasAnyNote = selectedProducts.some(
    (p) => notes.composeNote(p.product_id) !== null,
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
            sell_line_note: notes.composeNote(p.product_id),
          };
        }),
    };

    setIsSubmittingKot(true);
    try {
      const response = await storeKotOrder(token, payload);

      setLocalBookings((prev) => ({
        ...prev,
        [selectedTable.id]: {
          itemsCount: `${totalItems} Items`,
          price: `₹${total}`,
          bookedAt: Date.now(),
        },
      }));

      setIsNoteModalOpen(false);
      notes.reset();
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
          }
        } else if (response.print_kot) {
        }
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to send the KOT.";
    } finally {
      setIsSubmittingKot(false);
    }
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
            <Ionicons name="arrow-back" size={20} color="#35116B" />
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
            tintColor="#35116B"
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
          <View className="items-center py-10 px-6">
            <View className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 items-center justify-center mb-4">
              <Ionicons
                name="game-controller-outline"
                size={30}
                color="#35116B"
              />
            </View>

            <Text className="text-slate-800 font-bold text-base mb-1">
              No Active Rooms Yet
            </Text>

            <Text className="text-slate-500 text-xs text-center leading-5 max-w-[240px]">
              Your booked game rooms will appear here. Book a room to get
              started!
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {occupiedTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                liveTime={getElapsedTime(getTableBookedAt(table))}
                override={localBookings[table.id]}
                onPress={() => handleTablePress(table)}
                onActionsPress={() => openActionModal(table)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <MenuModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tableName={selectedTable?.name}
        isOccupied={selectedIsOccupied}
        products={products}
        productsLoading={productsLoading}
        productsError={productsError}
        onRetryProducts={() => {
          refetchProducts();
          refetchCategories();
        }}
        categories={categories}
        quantities={quantities}
        onQuantityChange={changeQty}
        search={menuSearch}
        onSearchChange={setMenuSearch}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        totalItems={totalItems}
        totalPrice={calculateTotal()}
        onPrintKot={() => setIsNoteModalOpen(true)}
        isSubmittingKot={isSubmittingKot}
      />

      <NoteModal
        visible={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        tableName={selectedTable?.name}
        selectedProducts={selectedProducts}
        quantities={quantities}
        totalItems={totalItems}
        totalPrice={calculateTotal()}
        hasAnyNote={hasAnyNote}
        itemNoteText={notes.itemNoteText}
        expandedNotePid={notes.expandedNotePid}
        onToggleExpand={notes.setExpandedNotePid}
        onNoteChange={notes.setNoteText}
        onToggleChip={notes.toggleChip}
        isChipActive={notes.isChipActive}
        composeNote={notes.composeNote}
        onConfirm={handleConfirmBooking}
        isSubmittingKot={isSubmittingKot}
      />

      <TableActionsModal
        visible={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setActionTable(null);
        }}
        table={actionTable}
        kotDetails={kotDetails}
        isLoadingKotDetails={isLoadingKotDetails}
        kotDetailsError={kotDetailsError}
        onRetryKotDetails={() => actionTable && loadKotDetails(actionTable)}
        isClosingTable={isClosingTable}
        isDeletingItems={isDeletingItems}
        onEditItems={handleOpenEditItems}
        onCloseTable={handleCloseTable}
        onDeleteItems={handleDeleteItems}
      />

      <EditItemsModal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tableName={actionTable?.name}
        lines={editLines}
        isLoading={isLoadingEditLines}
        isSaving={isSavingEdit}
        onQtyChange={changeEditQty}
        onSave={handleSaveEditItems}
      />
    </SafeAreaView>
  );
}
