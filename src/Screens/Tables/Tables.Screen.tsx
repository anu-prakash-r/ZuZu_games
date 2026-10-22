import { closeTable } from "@/api/bill";
import {
  fetchKotDetailsBundle,
  storeKotOrder,
  type KotDetailsItem,
  type KotStorePayload,
} from "@/api/kot";
import { fetchProducts, productPrice, type Product } from "@/api/products";
import { fetchTables, type ApiTable } from "@/api/tables";
import {
  replaceWaiterOrderItems,
  syncWaiterOrderItems,
  type WaiterOrderLine,
} from "@/api/waiterOrders";
import TableCardSkeleton from "@/components/Loader/TableCardSkeleton";
import MenuModal from "@/components/Tables/MenuModal";
import NoteModal from "@/components/Tables/NoteModal";
import TableActionsModal from "@/components/Tables/TableActionsModal";
import TableCard, { type LocalBooking } from "@/components/Tables/TableCard";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useItemNotes } from "@/hooks/useItemNotes";
import { useProducts } from "@/hooks/useProducts";
import {
  buildEditPrefill,
  buildSyncLines,
  matchLineToProduct,
} from "@/utils/orderLines";
import {
  isValidIPv4,
  loadPrinterConfig,
  printBill,
  printServerKot,
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
  const [tableTotals, setTableTotals] = useState<Record<number, number>>({});
  const [waiterOrderIds, setWaiterOrderIds] = useState<Record<number, number>>(
    {},
  );
  const [, setTick] = useState(0);

  const rememberWaiterOrderId = useCallback(
    (
      bookingId: number | null | undefined,
      waiterOrderId: number | null | undefined,
    ) => {
      if (bookingId === null || bookingId === undefined || !waiterOrderId)
        return;
      setWaiterOrderIds((prev) =>
        prev[bookingId] === waiterOrderId
          ? prev
          : { ...prev, [bookingId]: waiterOrderId },
      );
    },
    [],
  );

  const loadTableTotals = useCallback(
    async (tables: ApiTable[]) => {
      if (!token) return;
      const booked = tables.filter((t) => t.booking?.id != null);
      if (booked.length === 0) {
        setTableTotals({});
        return;
      }

      const entries = await Promise.all(
        booked.map(async (t) => {
          try {
            const bundle = await fetchKotDetailsBundle(
              token,
              t.id,
              t.booking!.id,
            );
            rememberWaiterOrderId(t.booking!.id, bundle.waiterOrderId);
            const total = bundle.items.reduce(
              (sum, it) =>
                sum + (it.totalPrice ?? (it.unitPrice ?? 0) * it.qty),
              0,
            );
            return [t.id, total] as const;
          } catch {
            return [t.id, 0] as const;
          }
        }),
      );

      setTableTotals((prev) => {
        const next: Record<number, number> = {};
        for (const [id, total] of entries) next[id] = total;
        return next;
      });
    },
    [token, rememberWaiterOrderId],
  );

  const loadTables = useCallback(
    async (showSpinner = true) => {
      if (!token) return;
      if (showSpinner) setIsLoadingTables(true);
      setTablesError(null);
      try {
        const data = await fetchTables(token);
        setApiTables(data);
        loadTableTotals(data);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load tables.";
        setTablesError(message);
      } finally {
        setIsLoadingTables(false);
        setRefreshing(false);
      }
    },
    [token, loadTableTotals],
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
  const [deletingItemIndex, setDeletingItemIndex] = useState<number | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);
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
    setIsEditMode(false);
    notes.reset();
    setIsNoteModalOpen(false);
    setIsModalOpen(true);
  };

  const waiterOrderIdFor = (
    bookingId: number | null | undefined,
  ): number | null =>
    bookingId === null || bookingId === undefined
      ? null
      : (waiterOrderIds[bookingId] ?? null);

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
        const bundle = await fetchKotDetailsBundle(token, table.id, bookingId);
        setKotDetails(bundle.items);
        rememberWaiterOrderId(bookingId, bundle.waiterOrderId);
      } catch (e) {
        setKotDetailsError(
          e instanceof Error ? e.message : "Failed to load food details.",
        );
      } finally {
        setIsLoadingKotDetails(false);
      }
    },
    [token, rememberWaiterOrderId],
  );

  const openActionModal = (table: ApiTable) => {
    setActionTable(table);
    setIsActionModalOpen(true);
    loadKotDetails(table);
  };

  const runDeleteItems = async (table: ApiTable, bookingId: number) => {
    if (!token || isDeletingItems) return;

    setIsDeletingItems(true);
    try {
      await replaceWaiterOrderItems(token, bookingId, []);

      setIsActionModalOpen(false);
      setActionTable(null);
      await loadTables(false);
      await loadKotDetails(table);
    } catch (e) {
      Alert.alert(
        "Could not delete items",
        e instanceof Error ? e.message : "Failed to delete the items.",
      );
    } finally {
      setIsDeletingItems(false);
    }
  };

  const handleDeleteItems = () => {
    if (!actionTable || !token || isDeletingItems) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) {
      return;
    }

    if (kotDetails.length === 0) {
      Alert.alert(
        "Nothing to delete",
        "No food items were found for this room.",
      );
      return;
    }

    const table = actionTable;
    Alert.alert(
      "Delete items",
      `Remove all ${kotDetails.length} item${
        kotDetails.length === 1 ? "" : "s"
      } from ${table.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => runDeleteItems(table, bookingId),
        },
      ],
    );
  };

  const runDeleteItem = async (
    table: ApiTable,
    bookingId: number,
    index: number,
  ) => {
    if (!token || deletingItemIndex !== null || isDeletingItems) return;

    const lines: WaiterOrderLine[] = kotDetails.map((line, i) => ({
      rowId: line.rowId,
      productId: line.productId,
      variationId: line.variationId,
      name: line.name,
      desiredQty: i === index ? 0 : line.qty,
    }));

    setDeletingItemIndex(index);
    try {
      await syncWaiterOrderItems(
        token,
        bookingId,
        waiterOrderIdFor(bookingId),
        lines,
      );
      await loadKotDetails(table);
      await loadTables(false);
    } catch (e) {
      Alert.alert(
        "Could not remove item",
        e instanceof Error ? e.message : "Failed to remove the item.",
      );
    } finally {
      setDeletingItemIndex(null);
    }
  };

  const handleDeleteItem = (index: number) => {
    if (!actionTable || !token) return;
    if (deletingItemIndex !== null || isDeletingItems) return;

    const bookingId = actionTable.booking?.id;
    if (bookingId === null || bookingId === undefined) return;

    const target = kotDetails[index];
    if (!target) return;

    const table = actionTable;
    Alert.alert("Remove item", `Remove ${target.name} from ${table.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => runDeleteItem(table, bookingId, index),
      },
    ]);
  };

  const handleOpenEditItems = async () => {
    if (!actionTable || !token) return;

    const table = actionTable;
    const bookingId = table.booking?.id ?? null;

    let lines = kotDetails;
    if (lines.length === 0 && bookingId !== null) {
      const bundle = await fetchKotDetailsBundle(
        token,
        table.id,
        bookingId,
      ).catch(() => null);
      if (bundle) {
        lines = bundle.items;
        rememberWaiterOrderId(bookingId, bundle.waiterOrderId);
      }
    }

    const catalogue =
      products.length > 0
        ? products
        : await fetchProducts(token).catch(() => [] as Product[]);

    setSelectedTable(table);
    setQuantities(buildEditPrefill(lines, catalogue));
    setMenuSearch("");
    setSelectedCategoryId(null);
    setIsActionModalOpen(false);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const buildKotPayload = (
    table: ApiTable,
    selected: Product[],
  ): KotStorePayload => ({
    location_id: table.location_id ?? locations[0]?.location_id ?? 1,
    res_table_id: table.id,
    booking_id: table.booking?.id ?? null,
    contact_id: table.booking?.contact_id ?? null,
    res_waiter_id: null,
    order_type: "separate",
    chair_no: "1",
    staff_note: null,
    types_of_service_id: null,
    products: selected.map((p) => {
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
  });

  const handleSaveEditItems = async () => {
    if (!actionTable || !token || isSavingEdit) return;

    const table = actionTable;
    const bookingId = table.booking?.id;
    if (bookingId === null || bookingId === undefined) return;

    const catalogue =
      products.length > 0
        ? products
        : await fetchProducts(token).catch(() => [] as Product[]);

    if (catalogue.length === 0 && kotDetails.length > 0) {
      Alert.alert(
        "Menu unavailable",
        "The menu could not be loaded, so the ordered items cannot be matched for editing. Please try again.",
      );
      return;
    }

    const syncLines =
      kotDetails.length > 0
        ? buildSyncLines(kotDetails, catalogue, quantities)
        : [];

    const orderedProductIds = new Set<number>();
    for (const line of kotDetails) {
      const product = matchLineToProduct(line, catalogue);
      if (product) orderedProductIds.add(product.product_id);
    }
    const additions = catalogue.filter(
      (p) =>
        !orderedProductIds.has(p.product_id) &&
        (quantities[p.product_id] ?? 0) > 0,
    );

    if (syncLines.length === 0 && additions.length === 0) return;

    setIsSavingEdit(true);
    try {
      if (syncLines.length > 0) {
        await syncWaiterOrderItems(
          token,
          bookingId,
          waiterOrderIdFor(bookingId),
          syncLines,
        );
      }

      if (additions.length > 0) {
        const response = await storeKotOrder(
          token,
          buildKotPayload(table, additions),
        );
        rememberWaiterOrderId(bookingId, response.waiter_order_id);
      }

      setIsModalOpen(false);
      setIsEditMode(false);
      setQuantities({});
      await loadKotDetails(table);
      await loadTables(false);
    } catch (e) {
      Alert.alert(
        "Could not save changes",
        e instanceof Error ? e.message : "Failed to save the item changes.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const closeMenuModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
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
    const payload = buildKotPayload(
      selectedTable,
      products.filter((p) => (quantities[p.product_id] ?? 0) > 0),
    );

    setIsSubmittingKot(true);
    try {
      const response = await storeKotOrder(token, payload);
      rememberWaiterOrderId(
        selectedTable.booking?.id,
        response.waiter_order_id,
      );

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
                price={tableTotals[table.id] ?? null}
                onPress={() => handleTablePress(table)}
                onActionsPress={() => openActionModal(table)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <MenuModal
        visible={isModalOpen}
        onClose={closeMenuModal}
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
        isSubmittingKot={isSubmittingKot || isSavingEdit}
        isEditMode={isEditMode}
        onSaveEdit={handleSaveEditItems}
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
        deletingItemIndex={deletingItemIndex}
        onEditItems={handleOpenEditItems}
        onCloseTable={handleCloseTable}
        onDeleteItems={handleDeleteItems}
        onDeleteItem={handleDeleteItem}
      />
    </SafeAreaView>
  );
}
