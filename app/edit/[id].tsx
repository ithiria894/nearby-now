import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { requireUserId } from "../../lib/auth";

type ActivityRow = {
  id: string;
  creator_id: string;
  title_text: string;
  place_text: string | null;
  gender_pref: string;
  capacity: number | null;
  expires_at: string | null;
};

export default function EditActivityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = String(id);

  const [userId, setUserId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [place, setPlace] = useState("");
  const [genderPref, setGenderPref] = useState<"any" | "female" | "male">(
    "any"
  );
  const [capacity, setCapacity] = useState<string>("");
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);
  const [neverExpire, setNeverExpire] = useState(false);
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
            "id, creator_id, title_text, place_text, gender_pref, capacity, expires_at"
          )
          .eq("id", activityId)
          .single();

        if (error) throw error;

        const a = data as ActivityRow;
        if (a.creator_id !== uid) {
          Alert.alert("Not allowed", "Only the creator can edit this invite.");
          router.back();
          return;
        }

        setActivity(a);
        setPlace(a.place_text ?? "");
        setGenderPref((a.gender_pref as any) ?? "any");
        setCapacity(a.capacity == null ? "" : String(a.capacity));
      } catch (e: any) {
        console.error(e);
        Alert.alert("Load failed", e?.message ?? "Unknown error");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  // :zap: CHANGE 2: Prefill expiry editor.
  useEffect(() => {
    if (!activity) return;
    if (!activity.expires_at) {
      setNeverExpire(true);
      setExpiryMinutes(null);
    } else {
      setNeverExpire(false);
      setExpiryMinutes(null);
    }
  }, [activity]);

  // :zap: CHANGE 4: Save edit + system broadcast.
  async function onSave() {
    if (!userId || !activity) return;
    if (!isCreator) {
      Alert.alert("Not allowed", "Only the creator can edit this invite.");
      return;
    }

    const nextPlace = place.trim() ? place.trim() : null;
    const nextGender = genderPref;

    const trimmedCapacity = capacity.trim();
    if (trimmedCapacity !== "") {
      const parsed = Number(trimmedCapacity);
      if (!Number.isInteger(parsed) || parsed < 1) {
        Alert.alert("Invalid", "Capacity must be an integer of 1 or more.");
        return;
      }
    }

    const capacityNumRaw =
      trimmedCapacity === "" ? null : Number(trimmedCapacity);
    const nextCapacity =
      capacityNumRaw == null
        ? null
        : Number.isFinite(capacityNumRaw)
          ? capacityNumRaw
          : null;

    // :zap: CHANGE 5: Compute next expires_at from presets.
    let nextExpiresAt: string | null = activity.expires_at ?? null;
    if (neverExpire) {
      nextExpiresAt = null;
    } else if (expiryMinutes != null) {
      nextExpiresAt = new Date(
        Date.now() + expiryMinutes * 60 * 1000
      ).toISOString();
    }

    const changes: string[] = [];
    if ((activity.place_text ?? null) !== nextPlace) {
      changes.push(
        `place: ${activity.place_text ?? "none"} -> ${nextPlace ?? "none"}`
      );
    }
    if (activity.gender_pref !== nextGender) {
      changes.push(`gender: ${activity.gender_pref} -> ${nextGender}`);
    }
    if ((activity.capacity ?? null) !== nextCapacity) {
      changes.push(
        `capacity: ${activity.capacity ?? "unlimited"} -> ${
          nextCapacity ?? "unlimited"
        }`
      );
    }
    if (neverExpire && activity.expires_at !== null) {
      changes.push("expires: set -> never");
    } else if (expiryMinutes != null) {
      const pretty =
        expiryMinutes < 60
          ? `in ${expiryMinutes}m`
          : `in ${Math.round(expiryMinutes / 60)}h`;
      changes.push(`expires: -> ${pretty}`);
    }

    if (changes.length === 0) {
      router.replace("/");
      return;
    }

    setSaving(true);
    try {
      const { error: updErr } = await supabase
        .from("activities")
        .update({
          place_text: nextPlace,
          gender_pref: nextGender,
          capacity: nextCapacity,
          expires_at: nextExpiresAt,
        })
        .eq("id", activityId);

      if (updErr) throw updErr;

      const { error: evtErr } = await supabase.from("room_events").insert({
        activity_id: activityId,
        user_id: userId,
        type: "system",
        // Keep a readable diff for immediate room visibility.
        content: `Updated invite — ${changes.join(", ")}`,
      });

      if (evtErr) {
        console.error("system message insert failed:", evtErr);
      }

      router.replace("/");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        Edit: {activity?.title_text ?? "Invite"}
      </Text>

      <TextInput
        value={place}
        onChangeText={setPlace}
        placeholder="Place (optional)"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {(["any", "female", "male"] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setGenderPref(v)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              opacity: genderPref === v ? 1 : 0.6,
            }}
          >
            <Text style={{ fontWeight: "600" }}>{v}</Text>
          </Pressable>
        ))}
      </View>

      {/* :zap: CHANGE 3: Expiry presets + never option. */}
      <Text style={{ fontWeight: "800" }}>Expiry</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { label: "30m", minutes: 30 },
          { label: "1h", minutes: 60 },
          { label: "2h", minutes: 120 },
          { label: "4h", minutes: 240 },
          { label: "8h", minutes: 480 },
        ].map((p) => (
          <Pressable
            key={p.label}
            onPress={() => {
              setNeverExpire(false);
              setExpiryMinutes(p.minutes);
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              opacity: !neverExpire && expiryMinutes === p.minutes ? 1 : 0.6,
            }}
          >
            <Text style={{ fontWeight: "600" }}>{p.label}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => {
            setNeverExpire(true);
            setExpiryMinutes(null);
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            opacity: neverExpire ? 1 : 0.6,
          }}
        >
          <Text style={{ fontWeight: "600" }}>Never</Text>
        </Pressable>
      </View>
      {neverExpire ? (
        <Text style={{ opacity: 0.7 }}>This invite will not expire.</Text>
      ) : expiryMinutes != null ? (
        <Text style={{ opacity: 0.7 }}>
          Expires in {expiryMinutes} minutes.
        </Text>
      ) : (
        <Text style={{ opacity: 0.7 }}>No change to expiry.</Text>
      )}

      <TextInput
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
        placeholder="Capacity (optional)"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            alignItems: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ fontWeight: "800" }}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={saving}
          style={{
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            alignItems: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
