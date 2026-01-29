import { useState } from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/api/supabase";
import { ensureProfile } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { Screen, PrimaryButton } from "../src/ui/common";

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const { error } = await supabase.auth.signUp({
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
    <Screen center>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        {t("auth.register.title")}
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("auth.register.emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.register.passwordPlaceholder")}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
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

      <Pressable
        onPress={() => router.replace("/login")}
        style={{ padding: 10, alignItems: "center" }}
      >
        <Text style={{ fontWeight: "700" }}>
          {t("auth.register.backToLogin")}
        </Text>
      </Pressable>
    </Screen>
  );
}
