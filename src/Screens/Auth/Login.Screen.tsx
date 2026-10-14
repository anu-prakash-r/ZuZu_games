import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null,
  );

  const isSmallScreen = height < 700;
  const isWideScreen = width >= 600;

  const handleLogin = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{ height: 300 }}
              className="items-center justify-center px-6 pt-4"
            >
              <Image
                source={require("@/assets/images/SaraS-Web-Solution.png")}
                style={{
                  width: isWideScreen ? 280 : 240,
                  height: 80,
                }}
                contentFit="contain"
              />
            </View>

            <View className="flex-1 bg-[#35116B] rounded-t-[40px] px-6 pt-8 pb-8 justify-between shadow-2xl">
              <View>
                <View className="mb-6">
                  <Text className="text-purple-300 text-xs font-bold tracking-widest uppercase mb-1">
                    Welcome Back
                  </Text>
                  <Text className="text-3xl font-extrabold text-white tracking-tight mb-1.5">
                    Sign In
                  </Text>
                  <Text className="text-purple-200/90 text-sm leading-5">
                    Enter your credentials below to access your workspace.
                  </Text>
                </View>

                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-white font-semibold mb-1.5 text-sm">
                    Email Address
                  </Text>
                  <View
                    className={`h-14 px-4 rounded-2xl flex-row items-center border bg-white ${
                      focusedInput === "email"
                        ? "border-[#0066FF] shadow-md shadow-blue-500/20"
                        : "border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={focusedInput === "email" ? "#0066FF" : "#94A3B8"}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-900 text-base h-full"
                      placeholder="name@company.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{ textAlignVertical: "center" }}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-2">
                  <Text className="text-white font-semibold mb-1.5 text-sm">
                    Password
                  </Text>
                  <View
                    className={`h-14 px-4 rounded-2xl flex-row items-center border bg-white ${
                      focusedInput === "password"
                        ? "border-[#0066FF] shadow-md shadow-blue-500/20"
                        : "border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        focusedInput === "password" ? "#0066FF" : "#94A3B8"
                      }
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-900 text-base h-full pr-2"
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                      style={{ textAlignVertical: "center" }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="h-full justify-center pl-2"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Bottom Action Section */}
              <View className="pt-2">
                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  className="bg-white h-14 rounded-2xl items-center justify-center shadow-lg shadow-black/20 mb-6"
                >
                  <Text className="text-[#35116B] font-bold text-base tracking-wide">
                    Sign In
                  </Text>
                </TouchableOpacity>

                {/* Trust & Feature Badges */}
                <View className="flex-row justify-around items-center bg-white/10 rounded-2xl p-3.5 mb-5 border border-white/10">
                  <View className="items-center flex-1">
                    <Ionicons
                      name="shield-checkmark-sharp"
                      size={20}
                      color="#38BDF8"
                    />
                    <Text className="text-white font-semibold text-[11px] mt-1">
                      256-bit Encryption
                    </Text>
                  </View>

                  <View className="w-[1px] h-6 bg-white/20" />

                  <View className="items-center flex-1">
                    <Ionicons
                      name="cloud-done-sharp"
                      size={20}
                      color="#34D399"
                    />
                    <Text className="text-white font-semibold text-[11px] mt-1">
                      Cloud Sync
                    </Text>
                  </View>

                  <View className="w-[1px] h-6 bg-white/20" />

                  <View className="items-center flex-1">
                    <Ionicons name="headset-sharp" size={20} color="#F472B6" />
                    <Text className="text-white font-semibold text-[11px] mt-1">
                      24/7 Support
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View className="items-center justify-center">
                  <View className="flex-row items-center mb-1">
                    <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    <Text className="text-purple-200/90 text-xs font-medium">
                      All Systems Operational
                    </Text>
                  </View>
                  <Text className="text-purple-300/50 text-[10px] font-semibold tracking-wider uppercase">
                    SaraS Web Solutions
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
