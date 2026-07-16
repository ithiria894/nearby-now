import { Tabs } from "expo-router";
import { useEffect } from "react";
import { AppState, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useT } from "../../lib/i18n/useT";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { fonts, motion, radius, type UIColors } from "../../src/ui/theme/uikit";
import { requireUserId } from "../../lib/domain/auth";
import { registerForPush } from "../../lib/push/registerPush";
import { refreshBadge } from "../../lib/push/badge";

// Active tab = a color-only brand pill behind the icon (no border/shadow).
function TabIcon({
  lib,
  name,
  focused,
  c,
}: {
  lib: "ion" | "mci";
  name: string;
  focused: boolean;
  c: UIColors;
}) {
  const Cmp = lib === "mci" ? MaterialCommunityIcons : Ionicons;
  // Spring the brand pill in/out behind the icon instead of hard-cutting the
  // background color when the active tab changes.
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(focused ? 1 : 0, motion.springSpatial);
  }, [focused, p]);
  const pillStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.7 + 0.3 * p.value }],
  }));
  return (
    <View
      style={{
        width: 52,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: radius.pill,
            backgroundColor: c.brand,
          },
          pillStyle,
        ]}
      />
      <Cmp
        name={name as any}
        size={22}
        color={focused ? c.onBrand : c.subtext}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useT();
  const c = useUIKit();
  const insets = useSafeAreaInsets();

  // Once the user is in the app: register this device for push (permission +
  // token store) and sync the app-icon badge to total unread. Also refresh the
  // badge whenever the app returns to the foreground. No-op on web/simulator.
  useEffect(() => {
    let alive = true;
    async function sync() {
      try {
        const userId = await requireUserId();
        if (!alive) return;
        void registerForPush(userId);
        void refreshBadge(userId);
      } catch {
        // not authenticated yet — skip
      }
    }
    void sync();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void sync();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "shift",
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.subtext,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 2,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.bodyStrong },
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: t("tabs.browse"),
          tabBarIcon: ({ focused }) => (
            <TabIcon lib="ion" name="heart" focused={focused} c={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="joined"
        options={{
          title: t("tabs.joined"),
          tabBarIcon: ({ focused }) => (
            <TabIcon lib="ion" name="people" focused={focused} c={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="created"
        options={{
          title: t("tabs.created"),
          tabBarIcon: ({ focused }) => (
            <TabIcon lib="mci" name="pencil-box" focused={focused} c={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("tabs.notifications"),
          tabBarIcon: ({ focused }) => (
            <TabIcon lib="ion" name="notifications" focused={focused} c={c} />
          ),
        }}
      />
      {/* Settings stays reachable by route but hidden from the tab bar. */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
