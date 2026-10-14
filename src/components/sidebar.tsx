import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type RouteType = "/home" | "/tables" | "/orders" | "/kot";

const BRAND = "#35116B";

const LINKS: readonly {
  label: string;
  route: RouteType;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Home", route: "/home", icon: "grid-outline" },
  { label: "Tables", route: "/tables", icon: "restaurant-outline" },
  { label: "Orders", route: "/orders", icon: "receipt-outline" },
  { label: "Settings", route: "/kot", icon: "newspaper-outline" },
] as const;

const PANEL_WIDTH = 285;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(open);

  const slide = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: -PANEL_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }
  }, [open, slide, opacity]);

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50" style={{ elevation: 50 }}>
      <Animated.View
        className="absolute inset-0 bg-black/50"
        style={{ opacity }}
      >
        <Pressable onPress={onClose} className="flex-1" />
      </Animated.View>

      <Animated.View
        className="absolute bottom-0 left-0 top-0 bg-slate-50 shadow-2xl border-r border-slate-200"
        style={{ width: PANEL_WIDTH, transform: [{ translateX: slide }] }}
      >
        <SafeAreaView className="flex-1 justify-between px-5 py-4">
          <View>
            <View className="mb-8 flex-row items-center justify-between pt-2">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-xl bg-[#35116B] items-center justify-center shadow-md shadow-purple-900/30">
                  <Ionicons name="flash-sharp" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-xl font-extrabold tracking-tight text-[#35116B]">
                    ZuZu Games cafe
                  </Text>
                </View>
              </View>
            </View>

            <Text className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Main Navigation
            </Text>

            <View className="gap-2">
              {LINKS.map((link) => {
                const active = pathname === link.route;
                return (
                  <Pressable
                    key={link.route}
                    onPress={() => {
                      onClose();
                      if (pathname !== link.route) {
                        router.replace(link.route as any);
                      }
                    }}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3.5 border transition-all ${
                      active
                        ? "bg-[#35116B] border-[#35116B] shadow-lg shadow-purple-900/20"
                        : "bg-white border-slate-200/80 active:bg-slate-100"
                    }`}
                  >
                    <View className="flex-row items-center gap-3.5">
                      <Ionicons
                        name={link.icon}
                        size={20}
                        color={active ? "#FFFFFF" : BRAND}
                      />
                      <Text
                        className={`text-base font-bold ${
                          active ? "text-white" : "text-[#35116B]"
                        }`}
                      >
                        {link.label}
                      </Text>
                    </View>

                    {active && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="pt-4 border-t border-slate-200">
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.replace("/");
              }}
              activeOpacity={0.8}
              className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-200/80 p-3.5 rounded-2xl active:bg-red-100"
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="text-red-600 font-bold text-sm tracking-wide">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

export function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-11 w-11 items-center justify-center"
    >
      <Ionicons name="menu-outline" size={32} color="#35116B" />
    </Pressable>
  );
}
