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

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onRegister() {
    if (!email.trim() || !password.trim()) {
      alertAsync(
        t("auth.register.missingTitle"),
        t("auth.register.missingBody")
      );
      return;
    }
    if (password.length < 6) {
      alertAsync(t("auth.register.weakTitle"), t("auth.register.weakBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await backend.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // With email confirmation OFF, signUp returns a live session so the user
      // is already logged in — go straight into the app. If confirmation is ON
      // there is no session yet, so fall back to Login.
      const { session } = await backend.auth.getSession();
      if (session?.user) {
        try {
          await ensureProfile();
        } catch (pe) {
          console.error("ensureProfile (register):", pe);
        }
        router.replace("/(tabs)/browse");
      } else {
        alertAsync(
          t("auth.register.maybeExistsTitle"),
          t("auth.register.maybeExistsBody")
        );
        router.replace("/login");
      }
    } catch (_e: any) {
      console.error(_e);
      alertAsync(t("auth.register.errorTitle"), _e?.message ?? "Unknown error");
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
          {t("auth.register.submitIdle")}
        </BText>
      </View>

      <BCard c={c}>
        <BInput
          c={c}
          label={t("auth.register.emailLabel")}
          placeholder={t("auth.register.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <BInput
          c={c}
          label={t("auth.register.passwordLabel")}
          placeholder={t("auth.register.passwordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <BButton
          c={c}
          tone="primary"
          full
          label={
            submitting
              ? t("auth.register.submitBusy")
              : t("auth.register.submitIdle")
          }
          onPress={onRegister}
        />
      </BCard>

      <Pressable
        onPress={() => router.replace("/login")}
        style={{ padding: space.sm, alignItems: "center" }}
      >
        <BText v="bodyStrong" c={c} color={c.brand}>
          {t("auth.register.backToLogin")}
        </BText>
      </Pressable>
    </BScreen>
  );
}
