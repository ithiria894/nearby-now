import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { alertAsync } from "../lib/ui/dialog";
import { backend } from "../lib/backend";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSend() {
    if (!email.trim()) {
      alertAsync(t("auth.forgot.missingTitle"), t("auth.forgot.missingBody"));
      return;
    }
    setSubmitting(true);
    try {
      // Deep link back into the app; the recovery link opens /reset-password.
      const redirectTo = Linking.createURL("reset-password");
      const { error } = await backend.auth.resetPasswordForEmail(
        email.trim(),
        redirectTo
      );
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      console.error(e);
      alertAsync(t("auth.forgot.errorTitle"), e?.message ?? "Unknown error");
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
            <MaterialCommunityIcons name="lock-reset" size={40} color={c.ink} />
          </View>
        </HardShadow>
        <BText v="h1" c={c} color={c.ink} style={{ marginTop: space.sm }}>
          {t("auth.forgot.title")}
        </BText>
      </View>

      {sent ? (
        <BCard c={c}>
          <BText c={c} color={c.text}>
            {t("auth.forgot.sentBody", { email: email.trim() })}
          </BText>
          <BButton
            c={c}
            tone="secondary"
            full
            label={t("auth.forgot.backToLogin")}
            onPress={() => router.replace("/login")}
          />
        </BCard>
      ) : (
        <BCard c={c}>
          <BText c={c} color={c.subtext} v="caption">
            {t("auth.forgot.subtitle")}
          </BText>
          <BInput
            c={c}
            label={t("auth.login.emailLabel")}
            placeholder={t("auth.login.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <BButton
            c={c}
            tone="primary"
            full
            label={submitting ? t("common.loading") : t("auth.forgot.send")}
            onPress={onSend}
          />
        </BCard>
      )}

      <Pressable
        onPress={() => router.replace("/login")}
        style={{ padding: space.sm, alignItems: "center" }}
      >
        <BText v="bodyStrong" c={c} color={c.brand}>
          {t("auth.forgot.backToLogin")}
        </BText>
      </Pressable>
    </BScreen>
  );
}
