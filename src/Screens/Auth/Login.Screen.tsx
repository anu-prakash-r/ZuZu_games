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
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null,
  );

  const isSmallScreen = height < 700;
  const isWideScreen = width >= 600;

  const handleLogin = () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    Keyboard.dismiss();
    onLoginSuccess?.();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F5F7FB]">
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
              style={{
                height: isSmallScreen ? 180 : 240,
              }}
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

            <View
              className="flex-1 bg-[#35116B] rounded-t-[40px] px-6 pt-8 justify-between shadow-2xl"
              style={{ paddingBottom: Math.max(insets.bottom, 32) }}
            >
              <View>
                <View className="mb-7">
                  <Text className="text-purple-300 text-xs font-bold tracking-widest uppercase mb-2">
                    Welcome Back
                  </Text>
                  <Text className="text-3xl font-extrabold text-white tracking-tight mb-2">
                    Sign In
                  </Text>
                  <Text className="text-purple-200/90 text-sm leading-5">
                    Enter your credentials below to access your workspace.
                  </Text>
                </View>

                <View className="mb-5">
                  <Text className="text-white text-sm font-semibold mb-2">
                    Email Address
                  </Text>
                  <View
                    className={`flex-row items-center h-14 rounded-2xl px-4 border ${
                      focusedInput === "email"
                        ? "border-purple-300 bg-white"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={21}
                      color={focusedInput === "email" ? "#35116B" : "#D8C9F4"}
                    />
                    <TextInput
                      className={`flex-1 ml-3 text-base ${
                        focusedInput === "email"
                          ? "text-[#35116B]"
                          : "text-white"
                      }`}
                      placeholder="Enter your email"
                      placeholderTextColor={
                        focusedInput === "email" ? "#999999" : "#C4B5D9"
                      }
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      returnKeyType="next"
                      accessibilityLabel="Email address"
                    />
                  </View>
                </View>

                <View className="mb-5">
                  <Text className="text-white text-sm font-semibold mb-2">
                    Password
                  </Text>
                  <View
                    className={`flex-row items-center h-14 rounded-2xl px-4 border ${
                      focusedInput === "password"
                        ? "border-purple-300 bg-white"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color={
                        focusedInput === "password" ? "#35116B" : "#D8C9F4"
                      }
                    />
                    <TextInput
                      className={`flex-1 ml-3 text-base ${
                        focusedInput === "password"
                          ? "text-[#35116B]"
                          : "text-white"
                      }`}
                      placeholder="Enter your password"
                      placeholderTextColor={
                        focusedInput === "password" ? "#999999" : "#C4B5D9"
                      }
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="current-password"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      accessibilityLabel="Password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="ml-2 p-1"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={
                          focusedInput === "password" ? "#35116B" : "#D8C9F4"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      "Forgot Password",
                      "Please connect your password reset flow here.",
                    )
                  }
                  className="self-end mb-7"
                >
                  <Text className="text-purple-200 text-sm font-semibold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  className="bg-white h-14 rounded-2xl items-center justify-center shadow-lg shadow-black/20 mb-7"
                >
                  <View className="flex-row items-center">
                    <Text className="text-[#35116B] font-bold text-base tracking-wide mr-2">
                      Sign In
                    </Text>
                    <Ionicons name="arrow-forward" size={19} color="#35116B" />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="pt-2">
                <View className="flex-row justify-around items-center bg-white/10 rounded-2xl p-3.5 mb-5 border border-white/10">
                  <View className="items-center flex-1">
                    <Ionicons
                      name="shield-checkmark-sharp"
                      size={20}
                      color="#38BDF8"
                    />
                    <Text className="text-white font-semibold text-[10px] mt-1 text-center">
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
                    <Text className="text-white font-semibold text-[10px] mt-1 text-center">
                      Cloud Sync
                    </Text>
                  </View>

                  <View className="w-[1px] h-6 bg-white/20" />

                  <View className="items-center flex-1">
                    <Ionicons name="headset-sharp" size={20} color="#F472B6" />
                    <Text className="text-white font-semibold text-[10px] mt-1 text-center">
                      24/7 Support
                    </Text>
                  </View>
                </View>

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
    </SafeAreaView>
  );
}
