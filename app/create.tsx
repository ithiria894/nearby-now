import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/api/supabase";
import { requireUserId } from "../lib/domain/auth";
import InviteForm, { type InviteFormPayload } from "../components/InviteForm";
import { useT } from "../lib/i18n/useT";
import { useTheme } from "../src/ui/theme/ThemeProvider";

export default function CreateScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);

  async function onCreate(payload: InviteFormPayload) {
    setSubmitting(true);
    try {
      const userId = await requireUserId();

      const insertPayload: any = {
        creator_id: userId,
        title_text: payload.title_text,
        place_name: payload.place_name,
        place_address: payload.place_address,
        lat: payload.lat,
        lng: payload.lng,
        place_id: payload.place_id,
        location_source: payload.location_source,
        gender_pref: payload.gender_pref,
        capacity: payload.capacity,
        status: "open",
      };

      if (payload.expires_at !== undefined) {
        insertPayload.expires_at = payload.expires_at;
      }

      const { data, error } = await supabase
        .from("activities")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) throw error;

      // :zap: CHANGE 1: Auto-join creator as member
      const { error: joinErr } = await supabase
        .from("activity_members")
        .upsert({
          activity_id: data.id,
          user_id: userId,
          role: "creator",
          state: "joined",
        });

      if (joinErr) throw joinErr;

      // :zap: CHANGE 2: Create -> go back to list (not room)
      router.replace("/");
    } catch (_e: any) {
      console.error(_e);
      Alert.alert(t("create.errorTitle"), _e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text style={{ fontSize: 18, fontWeight: "700" }}>
        {t("create.title")}
      </Text>

      <InviteForm
        mode="create"
        submitting={submitting}
        submitLabel={t("create.submit")}
        onSubmit={onCreate}
      />
    </ScrollView>
  );
}
