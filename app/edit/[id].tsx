import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { requireUserId } from "../../lib/auth";
import InviteForm, {
  type InviteFormPayload,
} from "../../components/InviteForm";
import { useT } from "../../lib/useT";

type ActivityRow = {
  id: string;
  creator_id: string;
  title_text: string;
  place_text: string | null;
  place_name: string | null;
  place_address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  location_source: string | null;
  gender_pref: string;
  capacity: number | null;
  expires_at: string | null;
};

type InviteChange =
  | { kind: "title"; from: string | null; to: string | null }
  | { kind: "place"; from: string | null; to: string | null }
  | { kind: "gender"; from: string | null; to: string | null }
  | { kind: "capacity"; from: number | null; to: number | null }
  | { kind: "expires"; toMode: "never" | "datetime"; iso?: string | null };

function formatPlace(
  t: (key: string) => string,
  name?: string | null,
  address?: string | null
): string {
  const safeName = (name ?? "").trim();
  const safeAddress = (address ?? "").trim();
  if (!safeName && !safeAddress) return t("place.none");
  if (safeName && safeAddress && safeName !== safeAddress) {
    return `${safeName} / ${safeAddress}`;
  }
  return safeName || safeAddress;
}

export default function EditActivityScreen() {
  const router = useRouter();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = String(id);

  const [userId, setUserId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreator = useMemo(() => {
    if (!userId || !activity) return false;
    return activity.creator_id === userId;
  }, [activity, userId]);

  // :zap: CHANGE 1: Load activity and validate creator up front.
  useEffect(() => {
    (async () => {
      try {
        const uid = await requireUserId();
        setUserId(uid);

        const { data, error } = await supabase
          .from("activities")
          .select(
            "id, creator_id, title_text, place_text, place_name, place_address, lat, lng, place_id, location_source, gender_pref, capacity, expires_at"
          )
          .eq("id", activityId)
          .single();

        if (error) throw error;

        const a = data as ActivityRow;
        if (a.creator_id !== uid) {
          Alert.alert(t("edit.notAllowedTitle"), t("edit.notAllowedBody"));
          router.back();
          return;
        }

        setActivity(a);
      } catch (e: any) {
        console.error(e);
        Alert.alert(t("edit.loadErrorTitle"), e?.message ?? "Unknown error");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  // :zap: CHANGE 4: Save edit + system broadcast.
  async function onSave(payload: InviteFormPayload) {
    if (!userId || !activity) return;
    if (!isCreator) {
      Alert.alert(t("edit.notAllowedTitle"), t("edit.notAllowedBody"));
      return;
    }

    const updates: Record<string, any> = {
      title_text: payload.title_text,
      place_name: payload.place_name,
      place_address: payload.place_address,
      lat: payload.lat,
      lng: payload.lng,
      place_id: payload.place_id,
      location_source: payload.location_source,
      gender_pref: payload.gender_pref,
      capacity: payload.capacity,
    };

    if (payload.expires_at !== undefined) {
      updates.expires_at = payload.expires_at;
    }

    const changes: InviteChange[] = [];
    if (activity.title_text !== payload.title_text) {
      changes.push({
        kind: "title",
        from: activity.title_text ?? null,
        to: payload.title_text ?? null,
      });
    }

    const oldPlace = formatPlace(
      t,
      activity.place_name ?? activity.place_text,
      activity.place_address
    );
    const nextPlace = formatPlace(t, payload.place_name, payload.place_address);
    if (oldPlace !== nextPlace) {
      changes.push({ kind: "place", from: oldPlace, to: nextPlace });
    }

    if (activity.gender_pref !== payload.gender_pref) {
      changes.push({
        kind: "gender",
        from: activity.gender_pref ?? null,
        to: payload.gender_pref ?? null,
      });
    }
    if ((activity.capacity ?? null) !== (payload.capacity ?? null)) {
      changes.push({
        kind: "capacity",
        from: activity.capacity ?? null,
        to: payload.capacity ?? null,
      });
    }

    if (payload.expires_at !== undefined) {
      if (payload.expires_at === null && activity.expires_at !== null) {
        changes.push({ kind: "expires", toMode: "never" });
      } else if (payload.expires_at) {
        changes.push({
          kind: "expires",
          toMode: "datetime",
          iso: payload.expires_at,
        });
      }
    }

    if (changes.length === 0) {
      router.replace("/");
      return;
    }

    setSaving(true);
    try {
      const { error: updErr } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", activityId);

      if (updErr) throw updErr;

      // Only insert system event if user is still joined and room is open.
      const { data: memberRow } = await supabase
        .from("activity_members")
        .select("state")
        .eq("activity_id", activityId)
        .eq("user_id", userId)
        .maybeSingle();

      const isJoined = (memberRow as any)?.state === "joined";
      const isOpen =
        !activity.expires_at ||
        new Date(activity.expires_at).getTime() > Date.now();

      if (isJoined && isOpen) {
        const { error: evtErr } = await supabase.from("room_events").insert({
          activity_id: activityId,
          user_id: userId,
          type: "system",
          content: JSON.stringify({
            k: "room.system.invite_updated",
            p: { changes },
          }),
        });

        if (evtErr) {
          console.error("system message insert failed:", evtErr);
        }
      }

      router.replace("/");
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("edit.saveErrorTitle"), e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!activity) return null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        {t("edit.titlePrefix")}{" "}
        {activity.title_text ?? t("edit.fallbackInviteTitle")}
      </Text>

      <InviteForm
        mode="edit"
        submitting={saving}
        submitLabel={t("edit.save")}
        onSubmit={onSave}
        onCancel={() => router.back()}
        initialValues={{
          title_text: activity.title_text ?? "",
          place_name: activity.place_name ?? activity.place_text ?? null,
          place_address: activity.place_address ?? null,
          lat: activity.lat ?? null,
          lng: activity.lng ?? null,
          place_id: activity.place_id ?? null,
          location_source: activity.location_source ?? null,
          gender_pref: (activity.gender_pref as any) ?? "any",
          capacity: activity.capacity ?? null,
          expires_at: activity.expires_at,
        }}
      />
    </ScrollView>
  );
}
