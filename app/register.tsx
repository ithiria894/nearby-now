import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { backend } from "../lib/backend";
import { ensureProfile } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { Screen, PrimaryButton } from "../src/ui/common";
import { useTheme } from "../src/ui/theme/ThemeProvider";

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const brandIconColor = theme.colors.brand;

  async function onRegister() {
    if (!email.trim() || !password) {
      Alert.alert(
        t("auth.register.missingTitle"),
        t("auth.register.missingBody")
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert(t("auth.register.weakTitle"), t("auth.register.weakBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await backend.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // If email confirmation is ON, user may not be fully logged in yet.
      // This still works when user completes confirmation and signs in.
      try {
        await ensureProfile();
      } catch {
        // ignore if not logged in yet
      }

      Alert.alert(
        t("auth.register.successTitle"),
        t("auth.register.successBody")
      );
      router.replace("/login");
    } catch (_e: any) {
      console.error(_e);
      Alert.alert(
        t("auth.register.errorTitle"),
        _e?.message ?? "Unknown error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
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
            <MaterialCommunityIcons
              name="compass-rose"
              size={28}
              color={brandIconColor}
            />
          </View>
          <Text
            style={{
              fontFamily: "ShortStack",
              fontSize: 26,
              color: theme.colors.title,
            }}
          >
            {t("app.name")}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.subtitleText }}>
            {t("auth.register.submitIdle")}
          </Text>
        </View>

        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.isDark
              ? theme.colors.border
              : theme.colors.brandBorder,
            backgroundColor: theme.isDark
              ? theme.colors.surface
              : theme.colors.brandSurface,
            padding: 14,
            gap: 12,
            shadowColor: theme.colors.shadow,
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
            {t("auth.register.emailPlaceholder")}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.register.emailPlaceholder")}
            placeholderTextColor={theme.colors.subtext}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              borderColor: theme.colors.border,
              backgroundColor: theme.isDark
                ? theme.colors.surfaceAlt
                : theme.colors.surface,
              color: theme.colors.text,
            }}
          />

          <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
            {t("auth.register.passwordPlaceholder")}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.register.passwordPlaceholder")}
            placeholderTextColor={theme.colors.subtext}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              borderColor: theme.colors.border,
              backgroundColor: theme.isDark
                ? theme.colors.surfaceAlt
                : theme.colors.surface,
              color: theme.colors.text,
            }}
          />

          <PrimaryButton
            label={
              submitting
                ? t("auth.register.submitBusy")
                : t("auth.register.submitIdle")
            }
            onPress={onRegister}
            disabled={submitting}
          />
        </View>

        <Pressable
          onPress={() => router.replace("/login")}
          style={{ padding: 10, alignItems: "center" }}
        >
          <Text style={{ fontWeight: "700", color: theme.colors.text }}>
            {t("auth.register.backToLogin")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
