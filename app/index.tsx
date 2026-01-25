import {
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
  Platform,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { requireUserId } from "../lib/auth";

type ActivityRow = {
  id: string;
  creator_id: string;
  title_text: string;
  place_text: string | null;
  start_time: string | null;
  end_time: string | null;
  expires_at: string | null;
  gender_pref: string;
  capacity: number | null;
  status: string;
  created_at: string;
};

function formatTimeLeft(expiresAtIso: string | null): string {
  if (!expiresAtIso) return "never";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(
    null
  );
  // :zap: CHANGE 8: Track which activities the current user already joined.
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  // :zap: CHANGE 1: Load current user id for creator-only UI.
  useEffect(() => {
    (async () => {
      try {
        const uid = await requireUserId();
        setUserId(uid);
        await fetchJoinedIds(uid);
      } catch {
        setUserId(null);
        setJoinedIds(new Set());
      }
    })();
  }, []);

  async function fetchActivities() {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("status", "open")
      // :zap: CHANGE 5: Include never-expire rows (expires_at is null).
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
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

  // :zap: CHANGE 9: Fetch joined activity ids for current user.
  async function fetchJoinedIds(currentUserId?: string | null) {
    const uid = currentUserId ?? userId;
    if (!uid) {
      setJoinedIds(new Set());
      return;
    }

    const { data, error } = await supabase
      .from("activity_members")
      .select("activity_id")
      .eq("user_id", uid)
      .eq("state", "joined")
      .limit(500);

    if (error) {
      console.error(error);
      return;
    }

    setJoinedIds(new Set((data ?? []).map((r: any) => String(r.activity_id))));
  }

  // :zap: CHANGE 6: Join from index (tap card -> confirm -> join -> navigate).
  async function joinFromIndex(activityId: string) {
    if (joiningActivityId) return;

    setJoiningActivityId(activityId);
    try {
      const uid = await requireUserId();

      const { error } = await supabase.from("activity_members").upsert({
        activity_id: activityId,
        user_id: uid,
        role: "member",
        state: "joined",
      });

      if (error) throw error;

      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.add(activityId);
        return next;
      });

      await fetchActivities();
      router.push(`/room/${activityId}`);
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message ?? "Unknown error");
      const lower = msg.toLowerCase();
      const friendly = lower.includes("row-level security")
        ? "This invite is closed or expired."
        : msg;
      Alert.alert("Join failed", friendly);
    } finally {
      setJoiningActivityId(null);
    }
  }

  // :zap: CHANGE 7: Cross-platform join confirm (web uses window.confirm).
  function confirmJoin(activityId: string) {
    console.log("[Index] card pressed:", activityId);

    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.(
        "Join this invite?\n\nYou’ll be added as a member and enter the room."
      );
      if (ok) joinFromIndex(activityId);
      return;
    }

    Alert.alert(
      "Join this invite?",
      "You’ll be added as a member and enter the room.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Join", onPress: () => joinFromIndex(activityId) },
      ]
    );
  }

  // :zap: CHANGE 2: Initial load
  useEffect(() => {
    fetchActivities();
  }, []);
  // :zap: CHANGE 3: Refresh when screen is focused again (e.g. after edit).
  useFocusEffect(
    useCallback(() => {
      fetchActivities();
      fetchJoinedIds();
    }, [userId])
  );
  // :zap: CHANGE 4: Realtime refresh
  useEffect(() => {
    const channel = supabase
      .channel("nearby-now-activity-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => {
          fetchActivities();
          fetchJoinedIds();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_members" },
        () => {
          fetchActivities();
          fetchJoinedIds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
            <Pressable
              key={a.id}
              onPress={() => {
                if (joinedIds.has(a.id)) {
                  router.push(`/room/${a.id}`);
                  return;
                }
                confirmJoin(a.id);
              }}
              disabled={joiningActivityId === a.id}
              style={{
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                opacity: joiningActivityId === a.id ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700" }}>
                    {a.title_text}
                  </Text>

                  <Text>
                    {a.place_text ? a.place_text : "No place"} • expires{" "}
                    {formatTimeLeft(a.expires_at)}
                  </Text>

                  <Text>
                    gender: {a.gender_pref} • capacity:{" "}
                    {a.capacity ?? "unlimited"}
                  </Text>
                </View>

                {userId && a.creator_id === userId ? (
                  <Pressable
                    onPress={(event: any) => {
                      event?.stopPropagation?.();
                      router.push(`/edit/${a.id}`);
                    }}
                    // Keep edit separate from card navigation.
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ fontWeight: "700" }}>Edit</Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          ))}
          {activities.length === 0 ? <Text>No active invites yet.</Text> : null}
        </ScrollView>
      )}
    </View>
  );
}
