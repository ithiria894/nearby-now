import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function NearbyScreen() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Nearby invites</Text>

      <Pressable
        onPress={() => router.push("/create")}
        style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
      >
        <Text>Create an invite</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/room/demo")}
        style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
      >
        <Text>Open a demo room</Text>
      </Pressable>

      <Text style={{ opacity: 0.7 }}>
        Next: add location + Supabase to show real nearby invites.
      </Text>
    </View>
  );
}
