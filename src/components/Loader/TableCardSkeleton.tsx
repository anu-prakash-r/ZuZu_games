import { View } from "react-native";

export default function TableCardSkeleton() {
  return (
    <View className="w-[48%] h-64 bg-zinc-100 p-5 rounded-[28px] justify-between border border-zinc-200 shadow-sm overflow-hidden animate-pulse">
      <View className="flex-row items-center justify-between">
        <View className="w-24 h-7 bg-zinc-200 rounded-full" />
        <View className="w-16 h-6 bg-zinc-200 rounded-full" />
      </View>

      <View className="my-auto gap-1">
        <View className="flex-row items-center justify-between mb-1">
          <View className="w-20 h-6 bg-zinc-200 rounded-full" />
          <View className="w-16 h-5 bg-zinc-200 rounded-full" />
        </View>

        <View className="w-16 h-3 bg-zinc-200 rounded-full mt-2" />
        <View className="w-28 h-8 bg-zinc-300 rounded-full mt-1" />
      </View>

      <View className="pt-3 border-t border-zinc-200 flex-row items-center justify-between">
        <View className="gap-1">
          <View className="w-16 h-4 bg-zinc-300 rounded-full" />
          <View className="w-12 h-3 bg-zinc-200 rounded-full" />
        </View>

        <View className="w-8 h-8 rounded-full bg-zinc-300" />
      </View>
    </View>
  );
}
