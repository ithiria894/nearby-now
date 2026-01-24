import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Nearby Now" }} />
      <Stack.Screen name="create" options={{ title: "Create" }} />
      <Stack.Screen name="room/[id]" options={{ title: "Room" }} />
    </Stack>
  );
}
