import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Navbar() {
  return (
    <SafeAreaView edges={["top"]} className="bg-slate-900">
      <View className="flex-row items-center justify-between bg-slate-900 px-4 py-3">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-500">
            <Text className="text-base font-bold text-white">Z</Text>
          </View>
          <Text className="text-lg font-bold text-white">Zuzu Games</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable className="rounded-full bg-slate-800 px-4 py-2 active:bg-slate-700">
            <Text className="text-sm font-semibold text-white">Home</Text>
          </Pressable>
          <Pressable className="rounded-full px-4 py-2 active:bg-slate-800">
            <Text className="text-sm font-semibold text-slate-300">
              Explore
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
