import { Ionicons, AntDesign } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { productPrice, type Product } from "@/api/products";
import { BRAND } from "@/constants/theme";

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

interface NoteModalProps {
  visible: boolean;

  onClose: () => void;
  tableName?: string;
  selectedProducts: Product[];
  quantities: Record<number, number>;
  totalItems: number;
  totalPrice: number;
  hasAnyNote: boolean;
  itemNoteText: Record<number, string>;
  expandedNotePid: number | null;
  onToggleExpand: (productId: number | null) => void;
  onNoteChange: (productId: number, text: string) => void;
  onToggleChip: (productId: number, chip: string) => void;
  isChipActive: (productId: number, chip: string) => boolean;
  composeNote: (productId: number) => string | null;
  onConfirm: () => void;
  isSubmittingKot: boolean;
}

export default function NoteModal({
  visible,
  onClose,
  tableName,
  selectedProducts,
  quantities,
  totalItems,
  totalPrice,
  hasAnyNote,
  itemNoteText,
  expandedNotePid,
  onToggleExpand,
  onNoteChange,
  onToggleChip,
  isChipActive,
  composeNote,
  onConfirm,
  isSubmittingKot,
}: NoteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/20">
        <View className="bg-white rounded-t-[32px] p-6 border-t border-slate-100 h-[85%] justify-between">
          <View className="flex-row items-center justify-between mb-2 pb-1">
            <View>
              <Text className="text-xl font-extrabold text-[#35116B]">
                Add Notes — {tableName}
              </Text>
              <Text className="text-slate-400 text-xs font-semibold mt-0.5">
                Tap a food to add its note.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
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
                <Ionicons name="fast-food-outline" size={28} color="#CBD5E1" />
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
                        onPress={() => onToggleExpand(isExpanded ? null : pid)}
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
                                  onPress={() => onToggleChip(pid, chip)}
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
                              onChangeText={(t) => onNoteChange(pid, t)}
                              className="flex-1 ml-2 py-2.5 text-slate-900 text-sm font-medium"
                            />
                            {(itemNoteText[pid]?.length ?? 0) > 0 ? (
                              <TouchableOpacity
                                onPress={() => onNoteChange(pid, "")}
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
              onPress={onClose}
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
                    ₹{totalPrice}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={onConfirm}
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
  );
}
