import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { ApiTable } from "@/api/tables";
import { BRAND } from "@/constants/theme";

export interface LocalBooking {
  itemsCount: string;
  price: string;
  bookedAt: number;
}

interface TableCardProps {
  table: ApiTable;
  liveTime: string;
  override?: LocalBooking;
  price?: number | null;
  onPress: () => void;
  onActionsPress: () => void;
}

export default function TableCard({
  table,
  liveTime,
  override,
  price,
  onPress,
  onActionsPress,
}: TableCardProps) {
  const guestName = table.booking?.contact_name?.trim() || "Guest";
  const extraCount =
    table.booking?.extra_head_count ??
    table.booking?.extra_persons?.length ??
    0;
  const guestCount =
    table.booking?.head_count ??
    Math.max(0, (table.booking?.total_head_count ?? 0) - extraCount);
  const totalCount = table.booking?.total_head_count ?? guestCount + extraCount;

  return (
    <View className="w-[48%] mb-2">
      <View className="h-60 px-3 py-4 rounded-3xl justify-between border shadow-sm bg-[#35116B] border-[#35116B] shadow-purple-900/20">
        <Pressable className="flex-1" onPress={onPress}>
          <View className="flex-row items-center justify-between">
            <View className="px-3 py-1 rounded-xl flex-row items-center gap-1 bg-white/10 border border-white/20">
              <Text className="font-black text-sm text-white" numberOfLines={1}>
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
            {price != null && price > 0 ? (
              <View>
                <Text className="text-purple-300 text-[10px] font-semibold uppercase tracking-wider">
                  Total Amount
                </Text>
                <Text className="text-white font-black text-2xl tracking-tight">
                  ₹{price.toFixed(2)}
                </Text>
              </View>
            ) : override ? (
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
                <Ionicons name="person-outline" size={14} color="#D8B4FE" />
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
        onPress={onActionsPress}
        className="bg-[#35116B] border border-slate-200 rounded-2xl px-4 py-2.5 flex-row items-center justify-between shadow-lg shadow-purple-900/20"
      >
        <Text className="text-[11px] font-bold text-white">Table Actions</Text>

        <View className="w-7 h-7 rounded-xl items-center justify-center bg-white">
          <MaterialCommunityIcons
            name="view-grid-outline"
            size={20}
            color={BRAND}
          />
        </View>
      </Pressable>
    </View>
  );
}
