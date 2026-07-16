import { useState } from "react";
import { useRouter } from "expo-router";
import { alertAsync } from "../lib/ui/dialog";
import { backend } from "../lib/backend";
import { useT } from "../lib/i18n/useT";
import { useUIKit } from "../src/ui/theme/useUIKit";
import {
  BButton,
  BCard,
  BInput,
  BScreen,
  BText,
} from "../src/ui/components/brutal";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSave() {
    const pw = password.trim();
    if (pw.length < 6) {
      alertAsync(t("auth.reset.weakTitle"), t("auth.reset.weakBody"));
      return;
    }
    if (pw !== confirm.trim()) {
      alertAsync(t("auth.reset.mismatchTitle"), t("auth.reset.mismatchBody"));
      return;
    }
    setSubmitting(true);
    try {
      // Requires an active recovery session (set from the recovery deep link).
      const { error } = await backend.auth.updatePassword(pw);
      if (error) throw error;
      alertAsync(t("auth.reset.doneTitle"), t("auth.reset.doneBody"));
      await backend.auth.signOut();
      router.replace("/login");
    } catch (e: any) {
      console.error(e);
      alertAsync(t("auth.reset.errorTitle"), e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BScreen c={c} scroll center>
      <BText v="h1" c={c} color={c.ink}>
        {t("auth.reset.title")}
      </BText>
      <BCard c={c}>
        <BInput
          c={c}
          label={t("auth.reset.newPassword")}
          placeholder={t("auth.register.passwordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <BInput
          c={c}
          label={t("auth.reset.confirmPassword")}
          placeholder={t("auth.reset.confirmPassword")}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        <BButton
          c={c}
          tone="primary"
          full
          label={submitting ? t("common.loading") : t("auth.reset.save")}
          onPress={onSave}
        />
      </BCard>
    </BScreen>
  );
}
