import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { requireUserId } from "../lib/auth";

export default function CreateScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [genderPref, setGenderPref] = useState<"any" | "female" | "male">(
    "any"
  );
  const [capacity, setCapacity] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function computeExpiresAtIso(endTimeIso?: string | null) {
    if (endTimeIso) return endTimeIso;
    const twoHoursMs = 2 * 60 * 60 * 1000;
    return new Date(Date.now() + twoHoursMs).toISOString();
  }

  async function onCreate() {
    if (!title.trim()) {
      Alert.alert("Missing", "Please type what you want to do.");
      return;
    }

    setSubmitting(true);
    try {
      const userId = await requireUserId();

      const capacityNum =
        capacity.trim() === "" ? null : Math.max(1, Number(capacity));
      const expiresAt = computeExpiresAtIso(null);

      const { data, error } = await supabase
        .from("activities")
        .insert({
          creator_id: userId,
          title_text: title.trim(),
          place_text: place.trim() ? place.trim() : null,
          gender_pref: genderPref,
          capacity: Number.isFinite(capacityNum as any) ? capacityNum : null,
          status: "open",
          expires_at: expiresAt,
        })
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
      Alert.alert("Create failed", _e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Create an invite</Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Dinner at Robson, karaoke tonight, club now..."
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        value={place}
        onChangeText={setPlace}
        placeholder="Place (optional)"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <View style={{ flexDirection: "row", gap: 8 }}>
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

      <TextInput
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
        placeholder="Capacity (optional)"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <Pressable
        onPress={onCreate}
        disabled={submitting}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ fontWeight: "700" }}>
          {submitting ? "Creating…" : "Post now"}
        </Text>
      </Pressable>
    </View>
  );
}
