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

import type { WaiterOrderItemInput } from "@/api/waiterOrderItems";
import { BRAND } from "@/constants/theme";

interface EditItemsModalProps {
  visible: boolean;
  onClose: () => void;
  tableName?: string;
  lines: WaiterOrderItemInput[];
  isLoading: boolean;
  isSaving: boolean;
  onQtyChange: (index: number, delta: number) => void;
  onSave: () => void;
}

export default function EditItemsModal({
  visible,
  onClose,
  tableName,
  lines,
  isLoading,
  isSaving,
  onQtyChange,
  onSave,
}: EditItemsModalProps) {
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
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <Text className="text-lg font-extrabold text-[#35116B]">
              Edit Items — Room {tableName}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="items-center py-8 gap-2">
              <ActivityIndicator size="small" color={BRAND} />
              <Text className="text-slate-400 text-xs font-semibold">
                Loading items...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {lines.map((line, idx) => (
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
                      onPress={() => onQtyChange(idx, -1)}
                      activeOpacity={0.7}
                      className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
                    >
                      <Ionicons name="remove" size={16} color="#35116B" />
                    </TouchableOpacity>
                    <Text className="font-extrabold text-slate-900 text-md min-w-[16px] text-center">
                      {line.qty}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onQtyChange(idx, 1)}
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
              onPress={onSave}
              disabled={isSaving || isLoading}
              activeOpacity={0.85}
              className="bg-[#35116B] py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md shadow-purple-900/20 disabled:opacity-60"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              )}
              <Text className="text-white font-bold text-sm">
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
