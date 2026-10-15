import { View } from "react-native";

export default function ProductItemSkeleton() {
  return (
    <View className="flex-row items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse mb-3">
      <View className="flex-row items-center gap-3 flex-1 pr-2">
        <View className="w-10 h-10 rounded-xl bg-slate-200" />
        <View className="flex-1 gap-1.5">
          <View className="w-32 h-4 bg-slate-200 rounded-md" />
          <View className="w-16 h-3 bg-slate-200 rounded-md" />
        </View>
      </View>

      <View className="w-16 h-9 bg-slate-200 rounded-xl" />
    </View>
  );
}
