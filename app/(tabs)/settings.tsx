import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  setLanguage,
  SUPPORTED_LANGS,
  type SupportedLang,
} from "../../lib/i18n";
import { useT } from "../../lib/useT";

// :zap: CHANGE 1: Settings tab with Logout action
export default function SettingsScreen() {
  const router = useRouter();
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
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
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
                borderRadius: 10,
                opacity: selected ? 1 : 0.6,
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

      <Pressable
        onPress={onLogout}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800" }}>{t("settings.logout")}</Text>
      </Pressable>
    </View>
  );
}
