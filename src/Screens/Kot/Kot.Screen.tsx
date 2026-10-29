import { useEffect, useState } from "react";
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

import {
  DEFAULT_PRINTER_CONFIG,
  isValidIPv4,
  loadPrinterConfig,
  savePrinterConfig,
} from "@/utils/printer";
import { useAuth } from "@/context/AuthContext";

const BRAND = "#35116B";

export default function KotScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [kotPrinterIp, setKotPrinterIp] = useState(
    DEFAULT_PRINTER_CONFIG.kotIp,
  );
  const [billingPrinterIp, setBillingPrinterIp] = useState(
    DEFAULT_PRINTER_CONFIG.billingIp,
  );

  const [savedKotIp, setSavedKotIp] = useState(DEFAULT_PRINTER_CONFIG.kotIp);
  const [savedBillingIp, setSavedBillingIp] = useState(
    DEFAULT_PRINTER_CONFIG.billingIp,
  );

  const [isEditingKot, setIsEditingKot] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);

  useEffect(() => {
    loadPrinterConfig().then((config) => {
      setKotPrinterIp(config.kotIp);
      setBillingPrinterIp(config.billingIp);
      setSavedKotIp(config.kotIp);
      setSavedBillingIp(config.billingIp);
    });
  }, []);

  const handleSaveKotPrinter = async () => {
    const ip = kotPrinterIp.trim();

    if (!isValidIPv4(ip)) {
      Alert.alert("Invalid IP", "Please enter a valid IPv4 address.");
      return;
    }

    try {
      const current = await loadPrinterConfig();

      await savePrinterConfig({
        ...current,
        kotIp: ip,
      });

      setKotPrinterIp(ip);
      setSavedKotIp(ip);
      setIsEditingKot(false);

      Alert.alert(
        "KOT Printer Saved",
        `KOT Kitchen Printer IP updated to: ${ip}`,
      );
    } catch {
      Alert.alert("Error", "Unable to save the KOT printer IP.");
    }
  };

  const handleSaveBillingPrinter = async () => {
    const ip = billingPrinterIp.trim();

    if (!isValidIPv4(ip)) {
      Alert.alert("Invalid IP", "Please enter a valid IPv4 address.");
      return;
    }

    try {
      const current = await loadPrinterConfig();

      await savePrinterConfig({
        ...current,
        billingIp: ip,
      });

      setBillingPrinterIp(ip);
      setSavedBillingIp(ip);
      setIsEditingBilling(false);

      Alert.alert(
        "Billing Printer Saved",
        `Billing Printer IP updated to: ${ip}`,
      );
    } catch {
      Alert.alert("Error", "Unable to save the billing printer IP.");
    }
  };

  const handleCancelKotEdit = () => {
    setKotPrinterIp(savedKotIp);
    setIsEditingKot(false);
  };

  const handleCancelBillingEdit = () => {
    setBillingPrinterIp(savedBillingIp);
    setIsEditingBilling(false);
  };
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of SaraS Waiter App?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/" as any);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-200">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/home" as any);
            }
          }}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-2xl items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color={BRAND} />
        </TouchableOpacity>

        <Text className="text-[#35116B] text-lg font-black tracking-tight">
          SaraS Waiter App
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
              <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center">
                <Ionicons name="print" size={18} color={BRAND} />
              </View>

              <View className="flex-1">
                <Text className="text-slate-900 font-extrabold text-sm">
                  KOT Kitchen Printer
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Kitchen order ticket printer
                </Text>
              </View>
            </View>

            {!isEditingKot ? (
              <>
                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-1.5">
                    Printer IP Address
                  </Text>

                  <Text className="text-slate-900 text-base font-bold">
                    {savedKotIp || "Not configured"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setKotPrinterIp(savedKotIp);
                    setIsEditingKot(true);
                  }}
                  activeOpacity={0.85}
                  className="border border-[#35116B] py-3 rounded-2xl items-center justify-center flex-row gap-2"
                >
                  <Ionicons name="create-outline" size={17} color={BRAND} />
                  <Text className="text-[#35116B] font-bold text-sm">
                    Edit KOT Printer IP
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="gap-2">
                  <Text className="text-slate-700 text-xs font-bold">
                    Enter Printer IP Address
                  </Text>

                  <TextInput
                    placeholder="e.g. 192.168.1.100"
                    placeholderTextColor="#94A3B8"
                    value={kotPrinterIp}
                    onChangeText={setKotPrinterIp}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold"
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleCancelKotEdit}
                    activeOpacity={0.85}
                    className="flex-1 bg-slate-100 py-3 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-slate-600 font-bold text-xs">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveKotPrinter}
                    activeOpacity={0.85}
                    className="flex-1 bg-[#35116B] py-3 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-white font-bold text-xs">
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            Billing Counter Printer Setup
          </Text>

          <View className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm gap-4">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center">
                <Ionicons name="receipt" size={18} color={BRAND} />
              </View>

              <View className="flex-1">
                <Text className="text-slate-900 font-extrabold text-sm">
                  Billing Counter Printer
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Customer billing receipt printer
                </Text>
              </View>
            </View>

            {!isEditingBilling ? (
              <>
                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-1.5">
                    Printer IP Address
                  </Text>

                  <Text className="text-slate-900 text-base font-bold">
                    {savedBillingIp || "Not configured"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setBillingPrinterIp(savedBillingIp);
                    setIsEditingBilling(true);
                  }}
                  activeOpacity={0.85}
                  className="border border-[#35116B] py-3 rounded-2xl items-center justify-center flex-row gap-2"
                >
                  <Ionicons name="create-outline" size={17} color={BRAND} />
                  <Text className="text-[#35116B] font-bold text-sm">
                    Edit Billing Printer IP
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="gap-2">
                  <Text className="text-slate-700 text-xs font-bold">
                    Enter Printer IP Address
                  </Text>

                  <TextInput
                    placeholder="e.g. 192.168.1.101"
                    placeholderTextColor="#94A3B8"
                    value={billingPrinterIp}
                    onChangeText={setBillingPrinterIp}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold"
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleCancelBillingEdit}
                    activeOpacity={0.85}
                    className="flex-1 bg-slate-100 py-3 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-slate-600 font-bold text-xs">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveBillingPrinter}
                    activeOpacity={0.85}
                    className="flex-1 bg-[#35116B] py-3 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-white font-bold text-xs">
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
