import { router } from "expo-router";
import LoginScreen from "../Screens/Auth/Login.Screen";

export default function Index() {
  return (
    <LoginScreen
      onLoginSuccess={() => {
        router.replace("/home" as any);
      }}
    />
  );
}
