import { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { backend } from "../../lib/backend";
import { requireUserId } from "../../lib/domain/auth";
import type { InviteChange } from "../../lib/domain/room";
import InviteForm, {
  type InviteFormPayload,
} from "../../components/InviteForm";
import { useT } from "../../lib/i18n/useT";
import { Screen } from "../../src/ui/common";

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
  start_time: string | null;
  end_time: string | null;
};

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

        const { data, error } =
          await backend.activities.getActivityById<ActivityRow>(
            activityId,
            "id, creator_id, title_text, place_text, place_name, place_address, lat, lng, place_id, location_source, gender_pref, capacity, expires_at, start_time, end_time"
          );

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
    const nextPlace = formatPlace(
      t,
      payload.place_name ?? payload.place_text,
      payload.place_address
    );
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
    if ((activity.start_time ?? null) !== (payload.start_time ?? null)) {
      changes.push({
        kind: "start_time",
        from: activity.start_time ?? null,
        to: payload.start_time ?? null,
      });
    }
    if ((activity.end_time ?? null) !== (payload.end_time ?? null)) {
      changes.push({
        kind: "end_time",
        from: activity.end_time ?? null,
        to: payload.end_time ?? null,
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
      router.replace("/(tabs)/created");
      return;
    }

    setSaving(true);
    try {
      const { error: updErr } = await backend.activities.updateActivity(
        activityId,
        updates
      );

      if (updErr) throw updErr;

      // Only insert system event if user is still joined and room is open.
      const { data: memberRow } =
        await backend.activities.getActivityMemberState(activityId, userId);

      const isJoined = (memberRow as any)?.state === "joined";
      const isOpen =
        !activity.expires_at ||
        new Date(activity.expires_at).getTime() > Date.now();

      if (isJoined && isOpen) {
        const { error: evtErr } = await backend.roomEvents.insertRoomEvent({
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

      router.replace("/(tabs)/created");
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
    <Screen scroll>
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
          place_text: activity.place_text ?? null,
          place_name: activity.place_name ?? activity.place_text ?? null,
          place_address: activity.place_address ?? null,
          lat: activity.lat ?? null,
          lng: activity.lng ?? null,
          place_id: activity.place_id ?? null,
          location_source: activity.location_source ?? null,
          gender_pref: (activity.gender_pref as any) ?? "any",
          capacity: activity.capacity ?? null,
          expires_at: activity.expires_at,
          start_time: activity.start_time ?? null,
          end_time: activity.end_time ?? null,
        }}
      />
    </Screen>
  );
}
