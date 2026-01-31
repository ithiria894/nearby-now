import { Tabs, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/i18n/useT";
import { useTheme } from "../../src/ui/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { t } = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBg = theme.isDark ? theme.colors.surface : "#F7F2EA";
  const tabBorder = theme.isDark ? theme.colors.border : "#E7DFD2";
  const activeTint = theme.isDark ? theme.colors.text : "#5E8C55";
  const inactiveTint = theme.isDark ? theme.colors.subtext : "#9C9388";
  const TAB_HEIGHT = 64;
  const TAB_BOTTOM = 8 + insets.bottom;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "KalamBold",
        },
        tabBarIcon: ({ color, size }) => {
          const iconSize = size ?? 22;
          if (route.name === "browse") {
            return <Ionicons name="heart" size={iconSize} color={color} />;
          }
          if (route.name === "joined") {
            return <Ionicons name="people" size={iconSize} color={color} />;
          }
          if (route.name === "created") {
            return <Ionicons name="add-circle" size={iconSize} color={color} />;
          }
          return <Ionicons name="settings" size={iconSize} color={color} />;
        },
      })}
    >
      {/* :zap: CHANGE 2: Show Create button only on these tabs */}
      <Tabs.Screen
        name="browse"
        options={{
          title: t("tabs.browse"),
          headerRight: () => <HeaderCreateButton />,
        }}
      />
      <Tabs.Screen
        name="joined"
        options={{
          title: t("tabs.joined"),
          headerRight: () => <HeaderCreateButton />,
        }}
      />
      <Tabs.Screen
        name="created"
        options={{
          title: t("tabs.created"),
          headerRight: () => <HeaderCreateButton />,
        }}
      />

      {/* :zap: CHANGE 3: Hide Create button on History/Settings */}
      <Tabs.Screen
        name="settings"
        options={{ title: t("tabs.settings"), headerRight: () => null }}
      />
    </Tabs>
  );
}
