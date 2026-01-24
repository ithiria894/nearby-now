import { Pressable, ScrollView, Text, View, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRouter, useFocusEffect } from "expo-router";

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
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      Alert.alert("Load failed", error.message);
      return;
    }
    setActivities((data ?? []) as ActivityRow[]);
  }

  // :zap: CHANGE 1: Initial load
  useEffect(() => {
    fetchActivities();
  }, []);
  // :zap: CHANGE 3: Refresh when screen is focused again (e.g. after create)
  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [])
  );
  // :zap: CHANGE 2: Realtime refresh
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
    return "Browse invites or post your own";
  }, []);

  async function onLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Logout failed", error.message);
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{header}</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => router.push("/create")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600" }}>+ Create an invite</Text>
        </Pressable>

        <Pressable
          onPress={onLogout}
          style={{
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600" }}>Logout</Text>
        </Pressable>
      </View>

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
