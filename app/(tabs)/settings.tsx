import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { backend } from "../../lib/backend";
import {
  setLanguage,
  SUPPORTED_LANGS,
  type SupportedLang,
} from "../../lib/i18n/i18n";
import { useT } from "../../lib/i18n/useT";
import { Screen } from "../../src/ui/common";
import { useTheme, useThemeSettings } from "../../src/ui/theme/ThemeProvider";
import { handleError } from "../../lib/ui/handleError";
import { requireUserId } from "../../lib/domain/auth";

// :zap: CHANGE 1: Settings tab with Logout action
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode, setMode } = useThemeSettings();
  const { t, i18n } = useT();
  const [displayName, setDisplayName] = useState("");
  const [nameLoading, setNameLoading] = useState(true);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const userId = await requireUserId();
        const { displayName: current, error } =
          await backend.profiles.getProfileDisplayName(userId);
        if (!alive) return;
        if (error) throw error;
        setDisplayName(current ?? "");
        setNameSaved(false);
      } catch (e) {
        handleError(t("settings.displayNameLabel"), e);
      } finally {
        if (alive) setNameLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  async function onLogout() {
    try {
      const { error } = await backend.auth.signOut();
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

  async function onSaveDisplayName() {
    if (nameSaving) return;
    setNameSaving(true);
    setNameSaved(false);
    try {
      const userId = await requireUserId();
      const next = displayName.trim().slice(0, 24);
      const { error } = await backend.profiles.updateProfileDisplayName(
        userId,
        next
      );
      if (error) throw error;
      setDisplayName(next);
      setNameSaved(true);
    } catch (e) {
      handleError(t("settings.displayNameLabel"), e);
    } finally {
      setNameSaving(false);
    }
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: pressed
              ? theme.colors.otherBg
              : theme.colors.surface,
          })}
        >
          <Ionicons name="chevron-back" size={14} color={theme.colors.text} />
          <Text style={{ fontSize: 12.5, color: theme.colors.text }}>
            {t("common.back")}
          </Text>
        </Pressable>
        <View />
      </View>

      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        {t("settings.title")}
      </Text>

      <Text style={{ fontWeight: "800" }}>
        {t("settings.displayNameLabel")}
      </Text>
      <View style={{ gap: 8 }}>
        <TextInput
          value={displayName}
          onChangeText={(value) => {
            setDisplayName(value);
            if (nameSaved) setNameSaved(false);
          }}
          placeholder={t("settings.displayNamePlaceholder")}
          placeholderTextColor={theme.colors.subtext}
          editable={!nameLoading}
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            borderColor: theme.colors.border,
            backgroundColor: theme.isDark ? theme.colors.surfaceAlt : "#FFFFFF",
            color: theme.colors.text,
          }}
        />
        <Pressable
          onPress={onSaveDisplayName}
          disabled={nameSaving || nameLoading}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: nameSaved
              ? theme.colors.okBg
              : pressed
                ? theme.colors.otherBg
                : theme.colors.surface,
            opacity: nameSaving || nameLoading ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontWeight: "800",
              color: nameSaved ? theme.colors.okText : theme.colors.text,
            }}
          >
            {nameSaving
              ? t("common.loading")
              : nameSaved
                ? t("settings.displayNameSaved")
                : t("settings.displayNameSave")}
            {nameSaved ? " ✓" : ""}
          </Text>
        </Pressable>
      </View>

      <Text style={{ fontWeight: "800" }}>{t("settings.language")}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {SUPPORTED_LANGS.map((lng) => {
          const selected = i18n.language === lng;
          return (
            <Pressable
              key={lng}
              onPress={async () => {
                try {
                  await setLanguage(lng as SupportedLang);
                } catch (e) {
                  handleError(t("settings.language"), e);
                }
              }}
              style={{
                padding: 10,
                borderWidth: 1,
                borderColor: selected
                  ? theme.colors.okBorder
                  : theme.colors.border,
                borderRadius: 10,
                opacity: selected ? 1 : 0.6,
                backgroundColor: selected
                  ? theme.colors.okBg
                  : theme.colors.surface,
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  color: selected ? theme.colors.okText : theme.colors.text,
                }}
              >
                {lng === "en"
                  ? t("settings.language_en")
                  : lng === "ja"
                    ? t("settings.language_ja")
                    : lng === "zh-CN"
                      ? t("settings.language_zhCN")
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
                borderColor: selected
                  ? theme.colors.okBorder
                  : theme.colors.border,
                borderRadius: 10,
                opacity: selected ? 1 : 0.6,
                backgroundColor: selected
                  ? theme.colors.okBg
                  : theme.colors.surface,
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  color: selected ? theme.colors.okText : theme.colors.text,
                }}
              >
                {label}
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
