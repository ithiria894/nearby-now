import { Tabs, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

// :zap: CHANGE 1: Shared header button for navigating to Create screen
function HeaderCreateButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/create")}
      hitSlop={8}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
    >
      <Text style={{ fontSize: 20, fontWeight: "900" }}>＋</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      {/* :zap: CHANGE 2: Show Create button only on these tabs */}
      <Tabs.Screen
        name="browse"
        options={{ title: "Browse", headerRight: () => <HeaderCreateButton /> }}
      />
      <Tabs.Screen
        name="joined"
        options={{ title: "Joined", headerRight: () => <HeaderCreateButton /> }}
      />
      <Tabs.Screen
        name="created"
        options={{
          title: "Created",
          headerRight: () => <HeaderCreateButton />,
        }}
      />

      {/* :zap: CHANGE 3: Hide Create button on History/Settings */}
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", headerRight: () => null }}
      />
    </Tabs>
  );
}
