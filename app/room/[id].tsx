import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Room: {id}</Text>
      <Text style={{ opacity: 0.7 }}>No chatting. Only coordination buttons.</Text>

      <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}>
        <Text>✅ I'm here</Text>
      </Pressable>

      <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}>
        <Text>⏱️ 10 min late</Text>
      </Pressable>

      <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}>
        <Text>❌ Cancel</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ padding: 12 }}>
        <Text style={{ color: "blue" }}>Back</Text>
      </Pressable>
    </View>
  );
}
