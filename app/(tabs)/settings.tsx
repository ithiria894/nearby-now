import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/api/supabase";
import {
  setLanguage,
  SUPPORTED_LANGS,
  type SupportedLang,
} from "../../lib/i18n/i18n";
import { useT } from "../../lib/i18n/useT";
import { Screen } from "../../src/ui/common";
import { useTheme, useThemeSettings } from "../../src/ui/theme/ThemeProvider";

// :zap: CHANGE 1: Settings tab with Logout action
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode, setMode } = useThemeSettings();
  const { t, i18n } = useT();

  async function onLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        t("settings.logoutErrorTitle"),
        e?.message ?? "Unknown error"
      );
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        {t("settings.title")}
      </Text>

      <Text style={{ fontWeight: "800" }}>{t("settings.language")}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {SUPPORTED_LANGS.map((lng) => {
          const selected = i18n.language === lng;
          return (
            <Pressable
              key={lng}
              onPress={() => setLanguage(lng as SupportedLang)}
              style={{
                padding: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                opacity: selected ? 1 : 0.6,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text style={{ fontWeight: "800" }}>
                {lng === "en"
                  ? t("settings.language_en")
                  : t("settings.language_zhHK")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontWeight: "800" }}>{t("settings.theme")}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {(["system", "light", "dark"] as const).map((value) => {
          const selected = mode === value;
          const label =
            value === "system"
              ? t("settings.theme_system")
              : value === "light"
                ? t("settings.theme_light")
                : t("settings.theme_dark");
          return (
            <Pressable
              key={value}
              onPress={() => setMode(value)}
              style={{
                padding: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                opacity: selected ? 1 : 0.6,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text style={{ fontWeight: "800" }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onLogout}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800" }}>{t("settings.logout")}</Text>
      </Pressable>
    </Screen>
  );
}
