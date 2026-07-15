import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { alertAsync } from "../../lib/ui/dialog";
import { useEffect, useState } from "react";
import { backend } from "../../lib/backend";
import {
  setLanguage,
  SUPPORTED_LANGS,
  type SupportedLang,
} from "../../lib/i18n/i18n";
import { useT } from "../../lib/i18n/useT";
import { useTheme, useThemeSettings } from "../../src/ui/theme/ThemeProvider";
import { handleError } from "../../lib/ui/handleError";
import { requireUserId } from "../../lib/domain/auth";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { space } from "../../src/ui/theme/uikit";
import {
  BButton,
  BCard,
  BChip,
  BIconButton,
  BInput,
  BScreen,
  BText,
} from "../../src/ui/components/brutal";

// :zap: CHANGE 1: Settings tab with Logout action
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode, setMode } = useThemeSettings();
  const { t, i18n } = useT();
  const c = useUIKit();
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
      alertAsync(t("settings.logoutErrorTitle"), e?.message ?? "Unknown error");
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
    <BScreen c={c} scroll>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <BIconButton c={c} icon="chevron-left" onPress={() => router.back()} />
        <View />
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.yellow,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: c.border,
          }}
        >
          <BIconButton c={c} icon="cog" color={c.ink} />
        </View>
        <BText c={c} v="h1" color={c.ink}>
          {t("settings.title")}
        </BText>
      </View>

      <BCard c={c}>
        <BInput
          c={c}
          label={t("settings.displayNameLabel")}
          placeholder={t("settings.displayNamePlaceholder")}
          value={displayName}
          onChangeText={(value) => {
            setDisplayName(value);
            if (nameSaved) setNameSaved(false);
          }}
        />
        <BButton
          c={c}
          tone={nameSaved ? "secondary" : "primary"}
          label={`${
            nameSaving
              ? t("common.loading")
              : nameSaved
                ? t("settings.displayNameSaved")
                : t("settings.displayNameSave")
          }${nameSaved ? " ✓" : ""}`}
          onPress={onSaveDisplayName}
        />
      </BCard>

      <BCard c={c}>
        <BText c={c} v="label" color={c.subtext}>
          {t("settings.language")}
        </BText>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
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
              >
                <BChip
                  c={c}
                  selected={selected}
                  label={
                    lng === "en"
                      ? t("settings.language_en")
                      : lng === "ja"
                        ? t("settings.language_ja")
                        : lng === "zh-CN"
                          ? t("settings.language_zhCN")
                          : t("settings.language_zhHK")
                  }
                />
              </Pressable>
            );
          })}
        </View>
      </BCard>

      <BCard c={c}>
        <BText c={c} v="label" color={c.subtext}>
          {t("settings.theme")}
        </BText>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          {(
            [
              "system",
              "light",
              "dark",
              "sagePaper",
              "forestGlass",
              "compassTeal",
              "compassTealDark",
              "sunsetCoral",
              "sunsetCoralDark",
              "electricViolet",
              "electricVioletDark",
            ] as const
          ).map((value) => {
            const selected = mode === value;
            const label =
              value === "system"
                ? t("settings.theme_system")
                : value === "light"
                  ? t("settings.theme_light")
                  : value === "dark"
                    ? t("settings.theme_dark")
                    : value === "sagePaper"
                      ? t("settings.theme_sage_paper")
                      : value === "forestGlass"
                        ? t("settings.theme_forest_glass")
                        : value === "compassTeal"
                          ? t("settings.theme_compass_teal")
                          : value === "compassTealDark"
                            ? t("settings.theme_compass_teal_dark")
                            : value === "sunsetCoral"
                              ? t("settings.theme_sunset_coral")
                              : value === "sunsetCoralDark"
                                ? t("settings.theme_sunset_coral_dark")
                                : value === "electricViolet"
                                  ? t("settings.theme_electric_violet")
                                  : t("settings.theme_electric_violet_dark");
            return (
              <Pressable key={value} onPress={() => setMode(value)}>
                <BChip c={c} selected={selected} label={label} />
              </Pressable>
            );
          })}
        </View>
      </BCard>

      <BButton
        c={c}
        tone="danger"
        full
        label={t("settings.logout")}
        onPress={onLogout}
      />
    </BScreen>
  );
}
