import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useT } from "../../lib/i18n/useT";
import { PageTitle, Screen } from "../../src/ui/common";
import { useTheme } from "../../src/ui/theme/ThemeProvider";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const accent = theme.colors.brand;

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.isDark
                  ? theme.colors.otherBg
                  : theme.colors.brandSoft,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.isDark
                  ? theme.colors.border
                  : theme.colors.brandBorder,
              }}
            >
              <Ionicons name="notifications" size={20} color={accent} />
            </View>
            <PageTitle>{t("notifications.title")}</PageTitle>
          </View>
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
              borderColor: theme.isDark
                ? theme.colors.border
                : theme.colors.brandBorder,
              backgroundColor: pressed
                ? theme.colors.brandSurfacePressed
                : theme.colors.brandSurfaceAlt,
            })}
          >
            <Ionicons name="settings" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.isDark
              ? theme.colors.border
              : theme.colors.brandBorder,
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
