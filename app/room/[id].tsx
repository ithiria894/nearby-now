import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { requireUserId } from "../../lib/auth";

type ActivityRow = {
  id: string;
  title_text: string;
  place_text: string | null;
  expires_at: string;
  gender_pref: string;
  capacity: number | null;
  status: string;
};

type MemberRow = {
  user_id: string;
  role: string;
  state: string;
  joined_at: string;
};

type RoomEventRow = {
  id: string;
  activity_id: string;
  user_id: string | null;
  type: string;
  content: string;
  created_at: string;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

export default function RoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = String(id);

  const [userId, setUserId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [events, setEvents] = useState<RoomEventRow[]>([]);
  const [message, setMessage] = useState("");

  // :zap: CHANGE 1: Load activity + members always, but only load events if joined (RLS)
  async function loadAll(currentUserId?: string | null) {
    const { data: a, error: aErr } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single();

    if (aErr) console.error(aErr);
    setActivity((a ?? null) as any);

    const { data: m, error: mErr } = await supabase
      .from("activity_members")
      .select("*")
      .eq("activity_id", activityId)
      .eq("state", "joined")
      .order("joined_at", { ascending: true });

    if (mErr) console.error(mErr);
    setMembers((m ?? []) as any);

    const uid = currentUserId ?? userId;
    const isJoined = uid
      ? (m ?? []).some((x: any) => x.user_id === uid)
      : false;

    if (!isJoined) {
      setEvents([]);
      return;
    }

    const { data: e, error: eErr } = await supabase
      .from("room_events")
      .select("*")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (eErr) console.error(eErr);
    setEvents((e ?? []) as any);
  }

  // :zap: CHANGE 2: Require auth user id once
  useEffect(() => {
    (async () => {
      try {
        const uid = await requireUserId();
        setUserId(uid);
        await loadAll(uid);
      } catch (_e: any) {
        Alert.alert("Auth required", "Please log in again.");
        router.replace("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  // :zap: CHANGE 3: Realtime refresh
  useEffect(() => {
    const channel = supabase
      .channel(`nearby-now-room-${activityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_members",
          filter: `activity_id=eq.${activityId}`,
        },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_events",
          filter: `activity_id=eq.${activityId}`,
        },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          filter: `id=eq.${activityId}`,
        },
        () => loadAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, userId]);

  const joined = useMemo(() => {
    if (!userId) return false;
    return members.some((m) => m.user_id === userId && m.state === "joined");
  }, [members, userId]);

  async function join() {
    if (!userId) return;

    const { error } = await supabase.from("activity_members").upsert({
      activity_id: activityId,
      user_id: userId,
      role: "member",
      state: "joined",
    });

    if (error) Alert.alert("Join failed", error.message);
    else {
      // :zap: CHANGE 4: Refresh local state immediately (do not rely on realtime)
      await loadAll(userId);
    }
  }

  async function leave() {
    if (!userId) return;

    const { error } = await supabase
      .from("activity_members")
      .update({ state: "left" })
      .eq("activity_id", activityId)
      .eq("user_id", userId);

    if (error) Alert.alert("Leave failed", error.message);
    else {
      // :zap: CHANGE 5: Refresh before navigating away (optional)
      await loadAll(userId);
      router.back();
    }
  }

  async function sendChat(text: string) {
    if (!userId) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("room_events").insert({
      activity_id: activityId,
      user_id: userId,
      type: "chat",
      content: trimmed,
    });

    if (error) Alert.alert("Send failed", error.message);
    else {
      setMessage("");
      // :zap: CHANGE 6: Refresh events immediately
      await loadAll(userId);
    }
  }

  async function sendQuick(code: string) {
    if (!userId) return;

    const { error } = await supabase.from("room_events").insert({
      activity_id: activityId,
      user_id: userId,
      type: "quick",
      content: code,
    });

    if (error) Alert.alert("Failed", error.message);
    else {
      // :zap: CHANGE 7: Refresh events immediately
      await loadAll(userId);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        {activity?.title_text ?? "Room"}
      </Text>

      <Text>
        {activity?.place_text ?? "No place"} • members: {members.length}
      </Text>

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {!joined ? (
          <Pressable
            onPress={join}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "700" }}>Join</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={leave}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "700" }}>Leave</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => sendQuick("IM_HERE")}
          disabled={!joined}
          style={{
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            opacity: joined ? 1 : 0.5,
          }}
        >
          <Text>✅ I'm here</Text>
        </Pressable>

        <Pressable
          onPress={() => sendQuick("LATE_10")}
          disabled={!joined}
          style={{
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            opacity: joined ? 1 : 0.5,
          }}
        >
          <Text>⏱️ 10 min late</Text>
        </Pressable>

        <Pressable
          onPress={() => sendQuick("CANCEL")}
          disabled={!joined}
          style={{
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            opacity: joined ? 1 : 0.5,
          }}
        >
          <Text>❌ Cancel</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, borderWidth: 1, borderRadius: 12, padding: 10 }}>
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          {!joined ? (
            <Text style={{ opacity: 0.8 }}>
              Join this invite to see and send messages.
            </Text>
          ) : events.length === 0 ? (
            <Text>No messages yet.</Text>
          ) : (
            events.map((e) => (
              <View key={e.id} style={{ gap: 2 }}>
                <Text style={{ fontWeight: "700" }}>
                  {/* :zap: CHANGE 1: Show system type explicitly. */}
                  {e.type} • {timeAgo(e.created_at)}
                </Text>
                <Text>{e.content}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={joined ? "Say something…" : "Join to chat"}
          editable={joined}
          style={{
            flex: 1,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            opacity: joined ? 1 : 0.6,
          }}
        />
        <Pressable
          onPress={() => sendChat(message)}
          disabled={!joined}
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 10,
            opacity: joined ? 1 : 0.5,
          }}
        >
          <Text style={{ fontWeight: "800" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
