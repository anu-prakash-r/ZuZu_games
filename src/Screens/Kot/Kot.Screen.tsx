import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BRAND = "#35116B";

export default function KotScreen() {
  const router = useRouter();

  // Separate Printer IP States
  const [kotPrinterIp, setKotPrinterIp] = useState("192.168.1.150");
  const [billingPrinterIp, setBillingPrinterIp] = useState("192.168.1.200");

  const handleSaveKotPrinter = () => {
    Alert.alert(
      "KOT Printer Saved",
      `KOT Kitchen Printer IP updated to: ${kotPrinterIp}`,
    );
  };

  const handleSaveBillingPrinter = () => {
    Alert.alert(
      "Billing Printer Saved",
      `Billing Printer IP updated to: ${billingPrinterIp}`,
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of ZuZu Games Cafe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => router.replace("/" as any),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* TOP HEADER: BACK ARROW (LEFT) | SETTINGS (CENTER) */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-200">
        {/* LEFT: BACK ARROW */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-2xl items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color={BRAND} />
        </TouchableOpacity>

        <Text className="text-[#35116B] text-lg font-black tracking-tight">
          ZuZu Games Cafe
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mb-5">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            Kitchen Printer Setup
          </Text>

          <View className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm gap-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center">
                <Ionicons name="print" size={16} color={BRAND} />
              </View>
              <Text className="text-slate-900 font-extrabold text-sm">
                KOT Printer IP Address
              </Text>
            </View>

            <TextInput
              placeholder="e.g. 192.168.1.150"
              placeholderTextColor="#94A3B8"
              value={kotPrinterIp}
              onChangeText={setKotPrinterIp}
              keyboardType="numeric"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold"
            />

            <TouchableOpacity
              onPress={handleSaveKotPrinter}
              activeOpacity={0.85}
              className="bg-[#35116B] py-3 rounded-2xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-bold text-xs">
                Save KOT Printer IP
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            Billing Counter Printer Setup
          </Text>

          <View className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm gap-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center">
                <Ionicons name="receipt" size={16} color={BRAND} />
              </View>
              <Text className="text-slate-900 font-extrabold text-sm">
                Billing Printer IP Address
              </Text>
            </View>

            <TextInput
              placeholder="e.g. 192.168.1.200"
              placeholderTextColor="#94A3B8"
              value={billingPrinterIp}
              onChangeText={setBillingPrinterIp}
              keyboardType="numeric"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold"
            />

            <TouchableOpacity
              onPress={handleSaveBillingPrinter}
              activeOpacity={0.85}
              className="bg-[#35116B] py-3 rounded-2xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-bold text-xs">
                Save Billing Printer IP
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-2">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="bg-red-50 border border-red-200 p-4 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-2xl bg-red-100 items-center justify-center">
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <View>
                <Text className="text-red-700 font-extrabold text-base">
                  Log Out
                </Text>
                <Text className="text-red-500 text-xs">
                  End current workstation session
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
