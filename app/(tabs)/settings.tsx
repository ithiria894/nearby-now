import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

// :zap: CHANGE 1: Settings tab with Logout action
export default function SettingsScreen() {
  const router = useRouter();

  async function onLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Logout failed", e?.message ?? "Unknown error");
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Settings</Text>

      <Pressable
        onPress={onLogout}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800" }}>Log out</Text>
      </Pressable>
    </View>
  );
}
