import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useTables } from "@/hooks/useTables";

const BRAND = "#35116B";

function parseApiDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.replace(" ", "T"));
  return Number.isNaN(parsed) ? null : parsed;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [createTableVisible, setCreateTableVisible] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [seatCount, setSeatCount] = useState("4");
  const [tableType, setTableType] = useState("Standard");
  const [createdTables, setCreatedTables] = useState<
    { id: string; tableNo: string; seats: number; type: string }[]
  >([]);
  const [tableError, setTableError] = useState("");
  const { tables, isLoading: tablesLoading } = useTables();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => !!t.booking).length;
  const availableTables = totalTables - occupiedTables;
  const countsReady = !tablesLoading || tables.length > 0;
  const displayTotal = countsReady ? totalTables : "–";
  const displayOccupied = countsReady ? occupiedTables : "–";
  const displayAvailable = countsReady ? availableTables : "–";

  const activeSessions = tables.filter((t) => !!t.booking);

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

    const existingTable = tables.some(
      (table) =>
        table.name.trim() === number || table.name.trim() === `0${number}`,
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
      <View className="px-5 pt-4 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <View className="w-11 h-11 rounded-2xl bg-[#35116B] items-center justify-center shadow-md shadow-[#35116B]/30">
              <Ionicons name="game-controller" size={20} color="#fff" />
            </View>

            <View className="justify-center ml-3">
              <View className="flex-row items-center space-x-1.5">
                <Text className="text-slate-500 text-xs font-medium tracking-wide">
                  Hello{user?.name ? `, ${user.name.trim()}` : ""}! Welcome
                  back!
                </Text>
                <Text className="text-xs">👋</Text>
              </View>
              <Text className="text-[#35116B] text-xl font-black tracking-tight mt-0.5">
                SaraS Waiter App
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-5">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
            Room Status
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
                  {displayAvailable}
                  <Text className="text-white text-base font-medium">
                    /{displayTotal}
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
                  {displayOccupied}
                  <Text className="text-black text-base font-medium">
                    /{displayTotal}
                  </Text>
                </Text>
                <Text className="text-black text-[11px] font-semibold mt-1">
                  ● Currently Active
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-slate-500 text-base font-extrabold tracking-tight">
              Active Room Sessions
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
        <View className="px-4 py-3 gap-4">
          {tablesLoading && activeSessions.length === 0 ? (
            <View className="items-center py-10 gap-2">
              <Ionicons name="hourglass-outline" size={28} color="#CBD5E1" />
              <Text className="text-slate-400 text-xs font-semibold">
                Loading sessions...
              </Text>
            </View>
          ) : activeSessions.length === 0 ? (
            <View className="items-center py-10 gap-1.5">
              <Ionicons
                name="game-controller-outline"
                size={28}
                color="#CBD5E1"
              />
              <Text className="text-slate-500 font-bold text-sm">
                No active sessions
              </Text>
              <Text className="text-slate-400 text-xs text-center px-8">
                Booked rooms will appear here.
              </Text>
            </View>
          ) : (
            activeSessions.map((table) => {
              const booking = table.booking!;
              const bookedAt = parseApiDate(booking.start_at);
              const guestName = booking.contact_name?.trim() || "Guest";
              const extraCount =
                booking.extra_head_count ?? booking.extra_persons?.length ?? 0;
              const guestCount =
                booking.head_count ??
                Math.max(0, (booking.total_head_count ?? 0) - extraCount);
              const status = (booking.status ?? "occupied").replace("_", " ");

              return (
                <View
                  key={table.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xl shadow-slate-200/50"
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                      <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center border border-purple-100">
                        <Ionicons
                          name="game-controller"
                          size={20}
                          color="#35116B"
                        />
                      </View>
                      <View>
                        <Text className="text-slate-900 text-lg font-black tracking-tight mt-0.5">
                          Room {table.name}
                        </Text>
                        <Text className="text-slate-400 text-[11px] font-semibold capitalize">
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/80">
                      <Ionicons name="time-outline" size={13} color="#D97706" />
                      <Text className="text-amber-800 font-bold text-xs">
                        {getElapsedTime(bookedAt)}
                      </Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-slate-100 mb-4" />
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60">
                        <Ionicons
                          name="person-outline"
                          size={16}
                          color="#64748B"
                        />
                      </View>
                      <View>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase">
                          Guest
                        </Text>
                        <Text className="text-slate-800 text-xs font-extrabold mt-0.5">
                          {guestName}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-slate-400 text-[10px] font-bold uppercase">
                        Guests
                      </Text>
                      <Text className="text-[#35116B] text-lg font-black tracking-tight mt-0.5">
                        {guestCount}
                        {extraCount > 0 && (
                          <Text className="text-slate-400 text-xs font-bold">
                            {" "}
                            +{extraCount}
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      router.push("/orders");
                    }}
                    className="mt-4 bg-[#35116B] rounded-2xl py-3.5 flex-row items-center justify-center gap-2 shadow-md shadow-purple-900/20"
                  >
                    <Text className="text-white font-bold text-xs tracking-wide">
                      View Order & KOT
                    </Text>
                    <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
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
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => setCreateTableVisible(false)}
          />

          <View className="w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl border border-slate-100">
            <View className="bg-[#35116B] px-6 py-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3.5">
                  <View className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 items-center justify-center">
                    <Ionicons name="grid-sharp" size={22} color="#FFD700" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-black tracking-tight">
                      Create New Room
                    </Text>
                    <Text className="text-purple-200/90 text-xs font-medium mt-0.5">
                      Configure Room details for your cafe
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

            <View className="p-6">
              <View className="mb-4">
                <Text className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
                  Room Number
                </Text>
                <View className="flex-row items-center border border-slate-200/80 rounded-2xl px-4 h-14 bg-slate-50/50">
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

                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>

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
                    Create Room
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
