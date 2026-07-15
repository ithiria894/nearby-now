import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useT } from "../lib/i18n/useT";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { fonts, radius } from "../src/ui/theme/uikit";

// Mirrors the tab list in app/(tabs)/_layout.tsx. Kept here so full-screen
// stack routes (the chat room, etc.) can keep the bottom nav visible even
// though they live outside the Tabs navigator.
const ITEMS = [
  {
    route: "/(tabs)/browse",
    match: "/browse",
    lib: "ion",
    name: "heart",
    labelKey: "tabs.browse",
  },
  {
    route: "/(tabs)/joined",
    match: "/joined",
    lib: "ion",
    name: "people",
    labelKey: "tabs.joined",
  },
  {
    route: "/(tabs)/created",
    match: "/created",
    lib: "mci",
    name: "pencil-box",
    labelKey: "tabs.created",
  },
  {
    route: "/(tabs)/notifications",
    match: "/notifications",
    lib: "ion",
    name: "notifications",
    labelKey: "tabs.notifications",
  },
] as const;

/**
 * A standalone copy of the tab bar for screens that sit outside the Tabs
 * navigator (e.g. the chat room), so the bottom nav stays visible everywhere.
 * Styling matches app/(tabs)/_layout.tsx.
 */
export function BottomNav() {
  const c = useUIKit();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.surface,
        borderTopColor: c.border,
        borderTopWidth: 2,
        paddingBottom: insets.bottom + 4,
        paddingTop: 6,
      }}
    >
      {ITEMS.map((item) => {
        const focused = pathname.startsWith(item.match);
        const Cmp = item.lib === "mci" ? MaterialCommunityIcons : Ionicons;
        return (
          <Pressable
            key={item.route}
            onPress={() => router.navigate(item.route)}
            accessibilityRole="button"
            accessibilityLabel={t(item.labelKey)}
            style={{ flex: 1, alignItems: "center", gap: 2 }}
          >
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? c.brand : "transparent",
              }}
            >
              <Cmp
                name={item.name as any}
                size={22}
                color={focused ? c.onBright : c.subtext}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.bodyStrong,
                color: focused ? c.brand : c.subtext,
              }}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
