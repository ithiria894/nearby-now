// app/login.tsx
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { alertAsync } from "../lib/ui/dialog";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { backend } from "../lib/backend";
import { ensureProfile } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { hardShadow, radius, space } from "../src/ui/theme/uikit";
import {
  BButton,
  BCard,
  BInput,
  BScreen,
  BText,
  HardShadow,
} from "../src/ui/components/brutal";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onLogin() {
    if (!email.trim() || !password.trim()) {
      alertAsync(t("auth.login.missingTitle"), t("auth.login.missingBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await backend.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // Profile creation is best-effort — a transient failure must not strand
      // an already-authenticated user on the Login screen.
      try {
        await ensureProfile();
      } catch (pe) {
        console.error("ensureProfile (login):", pe);
      }

      router.replace("/");
    } catch (_e: any) {
      console.error(_e);
      alertAsync(t("auth.login.errorTitle"), _e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BScreen c={c} scroll center>
      <View style={{ alignItems: "center", gap: space.sm }}>
        <HardShadow c={c} radius={radius.lg} offset={hardShadow.md}>
          <View
            style={{
              width: 74,
              height: 74,
              borderRadius: radius.lg,
              borderWidth: 2,
              borderColor: c.border,
              backgroundColor: c.yellow,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="compass-rose"
              size={40}
              color={c.ink}
            />
          </View>
        </HardShadow>
        <BText
          v="display"
          c={c}
          color={c.ink}
          style={{ marginTop: space.sm, fontFamily: "ShortStack" }}
        >
          {t("app.name")}
        </BText>
        <BText
          c={c}
          color={c.subtext}
          style={{ fontFamily: "CaveatBold", fontSize: 22 }}
        >
          {t("auth.login.submitIdle")}
        </BText>
      </View>

      <BCard c={c}>
        <BInput
          c={c}
          label={t("auth.login.emailLabel")}
          placeholder={t("auth.login.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <BInput
          c={c}
          label={t("auth.login.passwordLabel")}
          placeholder={t("auth.login.passwordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <BButton
          c={c}
          tone="primary"
          full
          label={
            submitting ? t("auth.login.submitBusy") : t("auth.login.submitIdle")
          }
          onPress={onLogin}
        />
      </BCard>

      <Pressable
        onPress={() => router.push("/forgot-password")}
        style={{ paddingVertical: space.xs, alignItems: "center" }}
      >
        <BText v="bodyStrong" c={c} color={c.subtext}>
          {t("auth.login.forgotPassword")}
        </BText>
      </Pressable>

      <Pressable
        onPress={() => router.push("/register")}
        style={{ padding: space.sm, alignItems: "center" }}
      >
        <BText v="bodyStrong" c={c} color={c.brand}>
          {t("auth.login.goRegister")}
        </BText>
      </Pressable>
    </BScreen>
  );
}
