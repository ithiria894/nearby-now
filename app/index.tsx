import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { getOrCreateUserId } from "../lib/identity";

type ActivityRow = {
  id: string;
  title_text: string;
  place_text: string | null;
  start_time: string | null;
  end_time: string | null;
  expires_at: string;
  gender_pref: string;
  capacity: number | null;
  status: string;
  created_at: string;
};

function formatTimeLeft(expiresAtIso: string): string {
  const ms = new Date(expiresAtIso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export default function IndexScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  // :zap: CHANGE 1: Ensure anonymous user exists before any write operations
  useEffect(() => {
    (async () => {
      const uid = await getOrCreateUserId();
      setUserId(uid);
    })();
  }, []);

  async function fetchActivities() {
    setLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    setActivities((data ?? []) as ActivityRow[]);
  }

  // :zap: CHANGE 2: Initial load
  useEffect(() => {
    fetchActivities();
  }, []);

  // :zap: CHANGE 3: Realtime subscription to refresh list on any activity/member change
  useEffect(() => {
    const channel = supabase
      .channel("nearby-now-activity-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => fetchActivities()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_members" },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const header = useMemo(() => {
    if (!userId) return "Setting up...";
    return "Post something and people nearby can join";
  }, [userId]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{header}</Text>

      <Pressable
        onPress={() => router.push("/create")}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "600" }}>+ Create an invite</Text>
      </Pressable>

      {loading ? (
        <Text>Loading…</Text>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 10 }}>
          {activities.map((a) => (
            <Link key={a.id} href={`/room/${a.id}`} asChild>
              <Pressable
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700" }}>
                  {a.title_text}
                </Text>

                <Text>
                  {a.place_text ? a.place_text : "No place"} • expires in{" "}
                  {formatTimeLeft(a.expires_at)}
                </Text>

                <Text>
                  gender: {a.gender_pref} • capacity:{" "}
                  {a.capacity ?? "unlimited"}
                </Text>
              </Pressable>
            </Link>
          ))}
          {activities.length === 0 ? <Text>No active invites yet.</Text> : null}
        </ScrollView>
      )}
    </View>
  );
}
