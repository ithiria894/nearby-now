import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { Screen, PrimaryButton } from "../src/ui/common";
import { useTheme } from "../src/ui/theme/ThemeProvider";

export default function ComposeScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const userId = await requireUserId();
      const { data, error } = await backend.activities.createActivity({
        creator_id: userId,
        title_text: text.trim(),
        status: "open",
      });

      if (error) throw error;

      const { error: joinErr } = await backend.activities.upsertActivityMember({
        activity_id: data.id,
        user_id: userId,
        role: "creator",
        state: "joined",
      });

      if (joinErr) throw joinErr;

      router.replace(`/room/${data.id}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("compose.errorTitle"), e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text
        style={{ fontSize: 20, fontWeight: "800", color: theme.colors.title }}
      >
        {t("compose.title")}
      </Text>
      <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
        {t("compose.subtitle")}
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
          padding: 12,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("compose.placeholder")}
          placeholderTextColor={theme.colors.subtext}
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 120,
            fontSize: 16,
            color: theme.colors.text,
          }}
        />
      </View>

      <PrimaryButton
        label={submitting ? t("common.loading") : t("compose.submit")}
        onPress={onSubmit}
        disabled={submitting || !text.trim()}
      />
    </Screen>
  );
}
