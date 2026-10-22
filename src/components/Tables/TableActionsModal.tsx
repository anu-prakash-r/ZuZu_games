import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { KotDetailsItem } from "@/api/kot";
import type { ApiTable } from "@/api/tables";
import SessionChargeSummary from "@/components/Tables/SessionChargeSummary";
import { BRAND } from "@/constants/theme";

interface TableActionsModalProps {
  visible: boolean;
  onClose: () => void;
  table: ApiTable | null;
  kotDetails: KotDetailsItem[];
  isLoadingKotDetails: boolean;
  kotDetailsError: string | null;
  onRetryKotDetails: () => void;
  isClosingTable: boolean;
  isDeletingItems: boolean;
  deletingItemIndex: number | null;
  onEditItems: () => void;
  onCloseTable: () => void;
  onDeleteItems: () => void;
  onDeleteItem: (index: number) => void;
}

export default function TableActionsModal({
  visible,
  onClose,
  table,
  kotDetails,
  isLoadingKotDetails,
  kotDetailsError,
  onRetryKotDetails,
  isClosingTable,
  isDeletingItems,
  deletingItemIndex,
  onEditItems,
  onCloseTable,
  onDeleteItems,
  onDeleteItem,
}: TableActionsModalProps) {
  const kotDetailsTotal = kotDetails.reduce(
    (sum, item) => sum + (item.totalPrice ?? (item.unitPrice ?? 0) * item.qty),
    0,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center items-center bg-black/60 px-5"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85%]"
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {table && (
              <>
                <View className="items-center mb-5">
                  <Text className="text-xl font-black text-[#35116B]">
                    {table.name}
                  </Text>
                  <Text className="text-slate-400 text-xs font-semibold mt-1">
                    {table.booking?.contact_name?.trim() || "Guest"} ·{" "}
                    {table.booking?.total_head_count ??
                      table.booking?.head_count ??
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

                  {!table.booking ? (
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
                      onPress={onRetryKotDetails}
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
                            item.totalPrice ?? (item.unitPrice ?? 0) * item.qty;
                          return (
                            <View
                              key={`${item.name}-${index}`}
                              className={`flex-row items-center justify-between py-2 ${
                                index < kotDetails.length - 1
                                  ? "border-b border-slate-100"
                                  : ""
                              }`}
                            >
                              <View className="flex-1 pr-2">
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
                                <TouchableOpacity
                                  onPress={() => onDeleteItem(index)}
                                  disabled={
                                    isDeletingItems || deletingItemIndex !== null
                                  }
                                  hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 10,
                                    right: 10,
                                  }}
                                  className="w-7 h-7 rounded-full bg-red-50 items-center justify-center disabled:opacity-50"
                                  accessibilityRole="button"
                                  accessibilityLabel={`Remove ${item.name}`}
                                >
                                  {deletingItemIndex === index ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#DC2626"
                                    />
                                  ) : (
                                    <Ionicons
                                      name="trash-outline"
                                      size={14}
                                      color="#DC2626"
                                    />
                                  )}
                                </TouchableOpacity>
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

                  {table.booking ? (
                    <SessionChargeSummary
                      booking={table.booking}
                      items={kotDetails}
                    />
                  ) : null}
                </View>

                <View className="gap-2.5">
                  <TouchableOpacity
                    onPress={onEditItems}
                    activeOpacity={0.8}
                    className="bg-purple-50 border border-purple-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name="create-outline" size={18} color={BRAND} />
                    <Text className="text-[#35116B] font-bold text-sm">
                      Edit Items
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onCloseTable}
                    activeOpacity={0.85}
                    disabled={isClosingTable}
                    className="bg-emerald-500 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                  >
                    {isClosingTable ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                    )}
                    <Text className="text-white font-bold text-sm">
                      {isClosingTable ? "Closing..." : "Close Table"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onDeleteItems}
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
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-100 items-center justify-center z-10"
          >
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
