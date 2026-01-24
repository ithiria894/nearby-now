import { Stack } from "expo-router";
import { Pressable, Text } from "react-native";
import { router } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Nearby Now",
          headerRight: () => (
            <Pressable onPress={() => router.push("/create")} style={{ paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 18 }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="create" options={{ title: "Create" }} />
      <Stack.Screen name="room/[id]" options={{ title: "Room" }} />
    </Stack>
  );
}
