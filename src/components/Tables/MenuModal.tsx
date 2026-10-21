import { Ionicons, AntDesign } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { productPrice, type Category, type Product } from "@/api/products";
import CategoryChips from "@/components/Tables/CategoryChips";
import ProductItemSkeleton from "@/components/Loader/ProductItemSkeleton";
import { BRAND } from "@/constants/theme";

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  tableName?: string;

  isOccupied: boolean;
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  onRetryProducts: () => void;
  categories: Category[];
  quantities: Record<number, number>;
  onQuantityChange: (productId: number, delta: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  totalItems: number;
  totalPrice: number;
  onPrintKot: () => void;
  isSubmittingKot: boolean;
  isEditMode?: boolean;
  onSaveEdit?: () => void;
}

export default function MenuModal({
  visible,
  onClose,
  tableName,
  isOccupied,
  products,
  productsLoading,
  productsError,
  onRetryProducts,
  categories,
  quantities,
  onQuantityChange,
  search,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  totalItems,
  totalPrice,
  onPrintKot,
  isSubmittingKot,
  isEditMode = false,
  onSaveEdit,
}: MenuModalProps) {
  const filteredProducts = products.filter(
    (p) =>
      (selectedCategoryId === null ||
        p.category_id === selectedCategoryId ||
        p.sub_category_id === selectedCategoryId) &&
      p.product_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const matchedChips = categories.filter((c) =>
    products.some((p) => p.category_id === c.id || p.sub_category_id === c.id),
  );

  const chipCategories = matchedChips.length > 0 ? matchedChips : categories;

  const visibleProducts = [...filteredProducts].sort(
    (a, b) =>
      Number((quantities[b.product_id] ?? 0) > 0) -
      Number((quantities[a.product_id] ?? 0) > 0),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white rounded-t-[32px] p-6 border-t border-slate-100 h-[85%] justify-between">
          <View className="flex-row items-center justify-between mb-2 pb-1">
            <View>
              <Text className="text-xl font-extrabold text-[#35116B]">
                {isEditMode
                  ? `Edit Items — ${tableName}`
                  : isOccupied
                    ? `Add Items — ${tableName}`
                    : `Book ${tableName}`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
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
                value={search}
                onChangeText={onSearchChange}
                className="flex-1 ml-2 py-3 text-slate-900 text-sm font-medium"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => onSearchChange("")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {chipCategories.length > 0 && !productsLoading && !productsError ? (
              <CategoryChips
                categories={chipCategories}
                selectedId={selectedCategoryId}
                onSelect={onCategoryChange}
              />
            ) : null}
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
                    onPress={onRetryProducts}
                    activeOpacity={0.8}
                    className="bg-[#35116B] px-5 py-2.5 rounded-xl mt-1"
                  >
                    <Text className="text-white font-bold text-xs">Retry</Text>
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
                      : selectedCategoryId !== null
                        ? "No items in this category."
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
                              onPress={() =>
                                onQuantityChange(item.product_id, -1)
                              }
                              activeOpacity={0.7}
                              className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center"
                            >
                              <Ionicons name="remove" size={15} color={BRAND} />
                            </TouchableOpacity>
                            <Text className="font-extrabold text-slate-900 text-sm min-w-[18px] text-center">
                              {qty}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                onQuantityChange(item.product_id, 1)
                              }
                              activeOpacity={0.7}
                              className="w-7 h-7 rounded-lg bg-[#35116B] items-center justify-center"
                            >
                              <Ionicons name="add" size={15} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => onQuantityChange(item.product_id, 1)}
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

          {(totalItems > 0 || isEditMode) && (
            <View className="pt-3 border-t mb-3 border-slate-100 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={onClose}
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
                    ₹{totalPrice}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={isEditMode ? onSaveEdit : onPrintKot}
                  activeOpacity={0.85}
                  disabled={
                    isSubmittingKot || (!isEditMode && totalItems === 0)
                  }
                  className="bg-emerald-500 px-5 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Text className="text-white font-bold text-sm">
                    {isEditMode
                      ? isSubmittingKot
                        ? "Saving..."
                        : "Save Changes"
                      : isSubmittingKot
                        ? "Sending..."
                        : "Print KOT"}
                  </Text>
                  {isEditMode ? (
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  ) : (
                    <AntDesign name="printer" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
