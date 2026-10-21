import { ScrollView, Text, TouchableOpacity } from "react-native";

import type { Category } from "@/api/products";

interface CategoryChipsProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryChips({
  categories,
  selectedId,
  onSelect,
}: CategoryChipsProps) {
  const chips = [
    { id: null, name: "All" },
    ...categories.map((c) => ({ id: c.id ?? null, name: c.name })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ gap: 8, paddingTop: 12 }}
    >
      {chips.map((chip, idx) => {
        const active = selectedId === chip.id;
        return (
          <TouchableOpacity
            key={
              chip.id === null && idx === 0 ? "all" : `cat-${chip.id ?? idx}`
            }
            onPress={() => onSelect(chip.id)}
            activeOpacity={0.8}
            className={`px-3.5 py-2 rounded-full border ${
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
              {chip.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
