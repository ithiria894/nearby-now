import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { requireUserId } from "../../lib/auth";

type ActivityRow = {
  id: string;
  title_text: string;
  place_text: string | null;
  place_name: string | null;
  place_address: string | null;
  // :zap: CHANGE 1: allow null (never expire).
  expires_at: string | null;
  gender_pref: string;
  capacity: number | null;
  status: string;
  // :zap: CHANGE 2: needed to show creator-only UI.
  creator_id?: string;
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
  profiles?: { display_name: string | null } | null;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

// :zap: CHANGE 6: Render quick event codes as friendly text (without showing type).
function renderEventContent(e: RoomEventRow): string {
  if (e.type === "quick") {
    switch (e.content) {
      case "IM_HERE":
        return "✅ I'm here";
      case "LATE_10":
        return "⏱️ 10 min late";
      case "CANCEL":
        return "❌ Cancel";
      default:
        return e.content;
    }
  }
  return e.content;
}

function getEventDisplayName(e: RoomEventRow): string {
  if (!e.user_id) return "System";
  const name = (e.profiles?.display_name ?? "").trim();
  return name || "Unknown";
}

function computeRoomState(activity: ActivityRow | null) {
  const isClosed = !!activity && activity.status !== "open";
  const expiresAtMs = activity?.expires_at
    ? new Date(activity.expires_at).getTime()
    : null;
  const isExpired = expiresAtMs != null && expiresAtMs <= Date.now();
  const isReadOnly = isClosed || isExpired;

  let label: string | null = null;
  if (isClosed) label = "Closed";
  else if (isExpired) label = "Expired";

  return { isClosed, isExpired, isReadOnly, label };
}

function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  // :zap: CHANGE 3: common RLS error message mapping.
  if (lower.includes("row-level security")) {
    return "This invite is closed or expired. You can still read messages.";
  }
  return message;
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
  const [myMembershipState, setMyMembershipState] = useState<
    "none" | "joined" | "left"
  >("none");

  // :zap: CHANGE 1: Load activity + members always, but only load events if joined (RLS)
  async function loadAll(currentUserId?: string | null) {
    // :zap: CHANGE 4: select creator_id for creator-only UI.
    const { data: a, error: aErr } = await supabase
      .from("activities")
      .select(
        "id, title_text, place_text, place_name, place_address, expires_at, gender_pref, capacity, status, creator_id"
      )
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

    // :zap: CHANGE 13: Load my membership state + left_at.
    let myState: "none" | "joined" | "left" = "none";
    let leftAt: Date | null = null;
    if (uid) {
      const { data: me, error: meErr } = await supabase
        .from("activity_members")
        .select("state,left_at")
        .eq("activity_id", activityId)
        .eq("user_id", uid)
        .maybeSingle();

      if (meErr) console.error(meErr);
      const st = (me as any)?.state;
      myState = st === "left" ? "left" : st === "joined" ? "joined" : "none";
      leftAt = (me as any)?.left_at ? new Date((me as any).left_at) : null;
    }

    setMyMembershipState(myState);

    // :zap: CHANGE 17: Allow viewing messages for joined OR left users.
    const canReadEvents = myState === "joined" || myState === "left";
    if (!canReadEvents) {
      setEvents([]);
      return;
    }

    // :zap: CHANGE 5: Join profiles so we can show display_name instead of event.type.
    // :zap: CHANGE 5: Load events with cutoff when left.
    let query = supabase
      .from("room_events")
      .select(
        "id, activity_id, user_id, type, content, created_at, profiles(display_name)"
      )
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (myState === "left" && leftAt) {
      query = query.lte("created_at", leftAt.toISOString());
    }

    const { data: e, error: eErr } = await query;

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

  // :zap: CHANGE 3: Realtime refresh (joined only).
  useEffect(() => {
    if (myMembershipState !== "joined") return;

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
          event: "INSERT",
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
  }, [activityId, myMembershipState]);

  const joined = useMemo(() => {
    if (!userId) return false;
    return members.some((m) => m.user_id === userId && m.state === "joined");
  }, [members, userId]);

  const isCreator = useMemo(() => {
    if (!userId || !activity?.creator_id) return false;
    return activity.creator_id === userId;
  }, [activity, userId]);

  const roomState = useMemo(() => computeRoomState(activity), [activity]);
  // :zap: CHANGE 5: only allow interaction when joined and not read-only.
  const canInteract = myMembershipState === "joined" && !roomState.isReadOnly;
  const canReadEvents =
    myMembershipState === "joined" || myMembershipState === "left";

  async function join() {
    if (!userId) return;
    if (roomState.isReadOnly) {
      Alert.alert("Not available", "This invite is closed or expired.");
      return;
    }

    const { error } = await supabase.from("activity_members").upsert({
      activity_id: activityId,
      user_id: userId,
      role: "member",
      state: "joined",
    });

    if (error) Alert.alert("Join failed", friendlyDbError(error.message));
    else {
      // :zap: CHANGE 4: Refresh local state immediately (do not rely on realtime)
      await loadAll(userId);
    }
  }

  // :zap: CHANGE 8: Actual leave execution (DB update) + system event + navigate back.
  async function doLeave() {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("activity_members")
        .update({ state: "left" })
        .eq("activity_id", activityId)
        .eq("user_id", userId);

      if (error) throw error;

      // :zap: CHANGE 10: Insert a system event so others see the leave action.
      const { error: evtErr } = await supabase.from("room_events").insert({
        activity_id: activityId,
        user_id: userId,
        type: "system",
        content: "Left the invite",
      });

      if (evtErr) {
        console.error("leave system event insert failed:", evtErr);
      }

      // :zap: CHANGE 11: Refresh local state once then navigate back to list.
      await loadAll(userId);
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Leave failed", e?.message ?? "Unknown error");
    }
  }

  // :zap: CHANGE 12: Cross-platform leave confirm (web uses window.confirm).
  function confirmLeave() {
    console.log("[Room] leave pressed", { activityId, userId });

    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.(
        "Leave this invite?\n\nYou will stop receiving updates from this room."
      );
      if (ok) doLeave();
      return;
    }

    Alert.alert(
      "Leave this invite?",
      "You will stop receiving updates from this room.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: () => doLeave() },
      ]
    );
  }

  // :zap: CHANGE 6: Close invite action (creator only).
  async function closeInvite() {
    if (!userId || !activity) return;
    if (!isCreator) {
      Alert.alert("Not allowed", "Only the creator can close this invite.");
      return;
    }
    if (roomState.isReadOnly) return;

    const ok =
      Platform.OS === "web"
        ? globalThis.confirm?.(
            "Close this invite?\n\nNo one can join or send messages anymore."
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Close this invite?",
              "No one can join or send messages anymore.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Close",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ]
            );
          });

    if (!ok) return;

    try {
      const { error: updErr } = await supabase
        .from("activities")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: userId,
        })
        .eq("id", activityId);

      if (updErr) throw updErr;

      const { error: evtErr } = await supabase.from("room_events").insert({
        activity_id: activityId,
        user_id: userId,
        type: "system",
        content: "Invite closed by creator",
      });

      if (evtErr) console.error("close system event insert failed:", evtErr);

      await loadAll(userId);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Close failed", e?.message ?? "Unknown error");
    }
  }

  async function sendChat(text: string) {
    if (!userId) return;
    if (!canInteract) {
      Alert.alert("Read-only", "This invite is closed or expired.");
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("room_events").insert({
      activity_id: activityId,
      user_id: userId,
      type: "chat",
      content: trimmed,
    });

    if (error) Alert.alert("Send failed", friendlyDbError(error.message));
    else {
      setMessage("");
      // :zap: CHANGE 6: Refresh events immediately
      await loadAll(userId);
    }
  }

  async function sendQuick(code: string) {
    if (!userId) return;
    if (!canInteract) {
      Alert.alert("Read-only", "This invite is closed or expired.");
      return;
    }

    const { error } = await supabase.from("room_events").insert({
      activity_id: activityId,
      user_id: userId,
      type: "quick",
      content: code,
    });

    if (error) Alert.alert("Failed", friendlyDbError(error.message));
    else {
      // :zap: CHANGE 7: Refresh events immediately
      await loadAll(userId);
    }
  }

  const placeName =
    (activity?.place_name ?? activity?.place_text ?? "").trim() || "No place";
  const placeAddress = (activity?.place_address ?? "").trim();

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        {activity?.title_text ?? "Room"}
      </Text>

      <Text style={{ fontWeight: "600" }}>{placeName}</Text>
      {placeAddress ? (
        <Text style={{ opacity: 0.7 }}>{placeAddress}</Text>
      ) : null}
      <Text>members: {members.length}</Text>

      {/* :zap: CHANGE 7: Status banner */}
      {roomState.label ? (
        <View style={{ padding: 10, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontWeight: "800" }}>{roomState.label}</Text>
          <Text style={{ opacity: 0.8 }}>
            This room is read-only. You can still view messages.
          </Text>
        </View>
      ) : null}

      {/* :zap: CHANGE 14: Left banner */}
      {myMembershipState === "left" ? (
        <View style={{ padding: 10, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontWeight: "800" }}>You left</Text>
          <Text style={{ opacity: 0.8 }}>
            You can view history messages. Tap Join to re-join this room.
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {!joined ? (
          <Pressable
            onPress={join}
            disabled={roomState.isReadOnly}
            style={{
              padding: 10,
              borderWidth: 1,
              borderRadius: 10,
              opacity: roomState.isReadOnly ? 0.5 : 1,
            }}
          >
            <Text style={{ fontWeight: "700" }}>
              {myMembershipState === "left" ? "Re-join" : "Join"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={confirmLeave}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "700" }}>Leave</Text>
          </Pressable>
        )}

        {/* :zap: CHANGE 8: Creator-only Close button */}
        {isCreator ? (
          <Pressable
            onPress={closeInvite}
            disabled={roomState.isReadOnly}
            style={{
              padding: 10,
              borderWidth: 1,
              borderRadius: 10,
              opacity: roomState.isReadOnly ? 0.5 : 1,
            }}
          >
            <Text style={{ fontWeight: "800" }}>Close invite</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => sendQuick("IM_HERE")}
          disabled={!canInteract}
          style={{
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            opacity: canInteract ? 1 : 0.5,
          }}
        >
          <Text>✅ I'm here</Text>
        </Pressable>

        <Pressable
          onPress={() => sendQuick("LATE_10")}
          disabled={!canInteract}
          style={{
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            opacity: canInteract ? 1 : 0.5,
          }}
        >
          <Text>⏱️ 10 min late</Text>
        </Pressable>

        <Pressable
          onPress={() => sendQuick("CANCEL")}
          disabled={!canInteract}
          style={{
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            opacity: canInteract ? 1 : 0.5,
          }}
        >
          <Text>❌ Cancel</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, borderWidth: 1, borderRadius: 12, padding: 10 }}>
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          {!canReadEvents ? (
            <Text style={{ opacity: 0.8 }}>
              Join this invite to see and send messages.
            </Text>
          ) : events.length === 0 ? (
            <Text>No messages yet.</Text>
          ) : (
            events.map((e) => (
              <View key={e.id} style={{ gap: 2 }}>
                {/* :zap: CHANGE 7: Show sender display_name instead of event.type. */}
                <Text style={{ fontWeight: "700" }}>
                  {getEventDisplayName(e)} • {timeAgo(e.created_at)}
                </Text>
                <Text>{renderEventContent(e)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={
            canInteract
              ? "Say something…"
              : myMembershipState === "left"
                ? "Re-join to chat"
                : roomState.isReadOnly
                  ? "Read-only"
                  : "Join to chat"
          }
          editable={canInteract}
          style={{
            flex: 1,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            opacity: canInteract ? 1 : 0.6,
          }}
        />
        <Pressable
          onPress={() => sendChat(message)}
          disabled={!canInteract}
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 10,
            opacity: canInteract ? 1 : 0.5,
          }}
        >
          <Text style={{ fontWeight: "800" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
