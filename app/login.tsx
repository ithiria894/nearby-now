// app/login.tsx
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { backend } from "../lib/backend";
import { ensureProfile } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { Screen, PrimaryButton } from "../src/ui/common";
import { useTheme } from "../src/ui/theme/ThemeProvider";

// :zap: CHANGE 1: Keep imports at top (ESM/Metro requirement). Log inside component instead.
export default function LoginScreen() {
  console.log("LOGIN SCREEN RENDER");

  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const brandIconColor = theme.colors.brand;

  async function onLogin() {
    if (!email.trim() || !password) {
      Alert.alert(t("auth.login.missingTitle"), t("auth.login.missingBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await backend.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // :zap: CHANGE 2: Create profile row after login (optional)
      await ensureProfile();

      router.replace("/");
    } catch (_e: any) {
      console.error(_e);
      Alert.alert(t("auth.login.errorTitle"), _e?.message ?? "Unknown error");
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
            {t("auth.login.title")}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.subtitleText }}>
            {t("auth.login.submitIdle")}
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
            {t("auth.login.emailLabel")}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.login.emailPlaceholder")}
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
            {t("auth.login.passwordLabel")}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.login.passwordPlaceholder")}
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
                ? t("auth.login.submitBusy")
                : t("auth.login.submitIdle")
            }
            onPress={onLogin}
            disabled={submitting}
          />
        </View>

        <Pressable
          onPress={() => router.push("/register")}
          style={{ padding: 10, alignItems: "center" }}
        >
          <Text style={{ fontWeight: "700", color: theme.colors.text }}>
            {t("auth.login.goRegister")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
