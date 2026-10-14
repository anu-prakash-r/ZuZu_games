import { useRouter } from "expo-router";
import LoginScreen from "../Screens/Auth/Login.Screen";

export default function Index() {
  const router = useRouter();

  return <LoginScreen onLoginSuccess={() => router.replace("/home")} />;
}
