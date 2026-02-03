import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useT } from "../../lib/i18n/useT";
import { Screen } from "../../src/ui/common";
import { useTheme } from "../../src/ui/theme/ThemeProvider";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const accent = theme.colors.pageTitle;

  return (
    <Screen>
      <View style={{ flex: 1, gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "800", color: accent }}>
            {t("notifications.title")}
          </Text>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: pressed
                ? theme.colors.otherBg
                : theme.colors.surface,
            })}
          >
            <Ionicons name="settings" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.isDark
              ? theme.colors.surface
              : theme.colors.brandSurface,
            padding: 16,
          }}
        >
          <Text style={{ color: theme.colors.subtext }}>
            {t("notifications.empty")}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
