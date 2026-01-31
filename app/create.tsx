import { useState } from "react";
import { Alert, Text } from "react-native";
import { useRouter } from "expo-router";
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import InviteForm, { type InviteFormPayload } from "../components/InviteForm";
import { useT } from "../lib/i18n/useT";
import { Screen } from "../src/ui/common";

export default function CreateScreen() {
  const router = useRouter();
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);

  async function onCreate(payload: InviteFormPayload) {
    setSubmitting(true);
    try {
      const userId = await requireUserId();

      const insertPayload: any = {
        creator_id: userId,
        title_text: payload.title_text,
        place_text: payload.place_text,
        place_name: payload.place_name,
        place_address: payload.place_address,
        lat: payload.lat,
        lng: payload.lng,
        place_id: payload.place_id,
        location_source: payload.location_source,
        gender_pref: payload.gender_pref,
        capacity: payload.capacity,
        start_time: payload.start_time,
        end_time: payload.end_time,
        status: "open",
      };

      if (payload.expires_at !== undefined) {
        insertPayload.expires_at = payload.expires_at;
      }

      const { data, error } =
        await backend.activities.createActivity(insertPayload);

      if (error) throw error;

      // :zap: CHANGE 1: Auto-join creator as member
      const { error: joinErr } = await backend.activities.upsertActivityMember({
        activity_id: data.id,
        user_id: userId,
        role: "creator",
        state: "joined",
      });

      if (joinErr) throw joinErr;

      // :zap: CHANGE 2: Create -> go back to Created tab
      router.replace("/(tabs)/created");
    } catch (_e: any) {
      console.error(_e);
      Alert.alert(t("create.errorTitle"), _e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>
        {t("create.title")}
      </Text>

      <InviteForm
        mode="create"
        submitting={submitting}
        submitLabel={t("create.submit")}
        onSubmit={onCreate}
      />
    </Screen>
  );
}
