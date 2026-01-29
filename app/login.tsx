// app/login.tsx
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { ensureProfile } from "../lib/auth";
import { useT } from "../lib/useT";

// :zap: CHANGE 1: Keep imports at top (ESM/Metro requirement). Log inside component instead.
export default function LoginScreen() {
  console.log("LOGIN SCREEN RENDER");

  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onLogin() {
    if (!email.trim() || !password) {
      Alert.alert(t("auth.login.missingTitle"), t("auth.login.missingBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
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
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        {t("auth.login.title")}
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("auth.login.emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.login.passwordPlaceholder")}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <Pressable
        onPress={onLogin}
        disabled={submitting}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ fontWeight: "800" }}>
          {submitting ? t("auth.login.submitBusy") : t("auth.login.submitIdle")}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/register")}
        style={{ padding: 10, alignItems: "center" }}
      >
        <Text style={{ fontWeight: "700" }}>{t("auth.login.goRegister")}</Text>
      </Pressable>
    </View>
  );
}
