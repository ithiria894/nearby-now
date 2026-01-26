import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  place_name: string | null;
  place_address: string | null;
  expires_at: string | null;
  gender_pref: string;
  capacity: number | null;
  status: string;
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

const TOKENS = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  subtext: "#6B7280",

  bannerBg: "#F3F4F6",
  bannerBorder: "#E5E7EB",

  dangerBg: "#FEE2E2",
  dangerBorder: "#FECACA",
  dangerText: "#991B1B",

  okBg: "#DCFCE7",
  okBorder: "#BBF7D0",
  okText: "#166534",

  chipBg: "#F3F4F6",
  chipBorder: "#E5E7EB",
} as const;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

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
  if (lower.includes("row-level security")) {
    return "This invite is closed or expired. You can still read messages.";
  }
  return message;
}

function SmallChip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: TOKENS.chipBorder,
        backgroundColor: TOKENS.chipBg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: TOKENS.text }}>
        {label}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  destructive,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: destructive ? TOKENS.dangerBorder : TOKENS.border,
        backgroundColor: destructive ? TOKENS.dangerBg : TOKENS.bg,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontWeight: "800",
          color: destructive ? TOKENS.dangerText : TOKENS.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
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

  const listRef = useRef<FlatList<RoomEventRow> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  // :zap: CHANGE 1: A single helper to scroll chat to bottom
  function scrollToBottom(animated = true) {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }

  // :zap: CHANGE 2: Keyboard avoid offset (keeps input visible)
  const keyboardVerticalOffset = useMemo(() => {
    // Expo Router header height varies; we keep a safe-ish offset.
    // If you later add a native header, bump iOS from 64 -> 88.
    if (Platform.OS === "ios") return 100;
    return 0;
  }, []);

  async function loadAll(currentUserId?: string | null) {
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

    const canReadEvents = myState === "joined" || myState === "left";
    if (!canReadEvents) {
      setEvents([]);
      return;
    }

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

    // :zap: CHANGE 3: After loading events, keep view at bottom
    if ((e ?? []).length > 0) scrollToBottom(false);
  }

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

  // :zap: CHANGE 4: When keyboard shows, auto-scroll so input + latest msgs stay visible
  useEffect(() => {
    const subShow = Keyboard.addListener("keyboardDidShow", () => {
      scrollToBottom(true);
    });
    return () => {
      subShow.remove();
    };
  }, []);

  const joined = useMemo(() => {
    if (!userId) return false;
    return members.some((m) => m.user_id === userId && m.state === "joined");
  }, [members, userId]);

  const isCreator = useMemo(() => {
    if (!userId || !activity?.creator_id) return false;
    return activity.creator_id === userId;
  }, [activity, userId]);

  const roomState = useMemo(() => computeRoomState(activity), [activity]);
  const canInteract = myMembershipState === "joined" && !roomState.isReadOnly;
  const canReadEvents =
    myMembershipState === "joined" || myMembershipState === "left";

  async function join() {
    if (!userId) return;
    if (roomState.isReadOnly) {
      Alert.alert("Not available", "This invite is closed or expired.");
      return;
    }

    Alert.alert("Join this invite?", "Confirm to join this room.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Join",
        onPress: async () => {
          const { error } = await supabase.from("activity_members").upsert({
            activity_id: activityId,
            user_id: userId,
            role: "member",
            state: "joined",
          });

          if (error) Alert.alert("Join failed", friendlyDbError(error.message));
          else {
            await loadAll(userId);
            scrollToBottom(false);
            inputRef.current?.focus?.();
          }
        },
      },
    ]);
  }

  async function doLeave() {
    if (!userId) return;

    try {
      if (!roomState.isReadOnly) {
        await supabase.from("room_events").insert({
          activity_id: activityId,
          user_id: userId,
          type: "system",
          content: "Left the invite",
        });
      }

      const { error } = await supabase
        .from("activity_members")
        .update({ state: "left" })
        .eq("activity_id", activityId)
        .eq("user_id", userId);

      if (error) throw error;

      await loadAll(userId);
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Leave failed", e?.message ?? "Unknown error");
    }
  }

  function confirmLeave() {
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

      await supabase.from("room_events").insert({
        activity_id: activityId,
        user_id: userId,
        type: "system",
        content: "Invite closed by creator",
      });

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
      await loadAll(userId);
      scrollToBottom(true);
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
      await loadAll(userId);
      scrollToBottom(true);
    }
  }

  const placeName =
    (activity?.place_name ?? activity?.place_text ?? "").trim() || "No place";
  const placeAddress = (activity?.place_address ?? "").trim();

  // :zap: CHANGE 5: Render message bubble style (small but improves UX a lot)
  function renderItem({ item }: { item: RoomEventRow }) {
    const isMine = !!userId && item.user_id === userId;
    const name = getEventDisplayName(item);
    const content = renderEventContent(item);

    return (
      <View style={{ gap: 4 }}>
        <Text
          style={{ fontSize: 12, color: TOKENS.subtext, fontWeight: "700" }}
        >
          {name} • {timeAgo(item.created_at)}
        </Text>

        <View
          style={{
            alignSelf: isMine ? "flex-end" : "flex-start",
            maxWidth: "86%",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: TOKENS.border,
            backgroundColor: isMine ? TOKENS.okBg : TOKENS.bannerBg,
          }}
        >
          <Text style={{ color: TOKENS.text, fontWeight: "600" }}>
            {content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TOKENS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {/* Header card */}
        <View
          style={{
            borderWidth: 1,
            borderColor: TOKENS.border,
            borderRadius: 16,
            padding: 12,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: TOKENS.text }}>
            {activity?.title_text ?? "Room"}
          </Text>

          <View style={{ gap: 2 }}>
            <Text style={{ fontWeight: "700", color: TOKENS.text }}>
              {placeName}
            </Text>
            {placeAddress ? (
              <Text style={{ fontSize: 12, color: TOKENS.subtext }}>
                {placeAddress}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <SmallChip label={`Members ${members.length}`} />
            {isCreator ? <SmallChip label="Created" /> : null}
            {roomState.label ? <SmallChip label={roomState.label} /> : null}
          </View>

          {/* Status banners */}
          {roomState.label ? (
            <View
              style={{
                padding: 10,
                borderWidth: 1,
                borderRadius: 12,
                borderColor: TOKENS.dangerBorder,
                backgroundColor: TOKENS.dangerBg,
                gap: 4,
              }}
            >
              <Text style={{ fontWeight: "900", color: TOKENS.dangerText }}>
                {roomState.label}
              </Text>
              <Text style={{ color: TOKENS.dangerText, opacity: 0.9 }}>
                This room is read-only. You can still view messages.
              </Text>
            </View>
          ) : null}

          {myMembershipState === "left" ? (
            <View
              style={{
                padding: 10,
                borderWidth: 1,
                borderRadius: 12,
                borderColor: TOKENS.border,
                backgroundColor: TOKENS.bannerBg,
                gap: 4,
              }}
            >
              <Text style={{ fontWeight: "900", color: TOKENS.text }}>
                You left
              </Text>
              <Text style={{ color: TOKENS.subtext }}>
                You can view history messages. Tap Join to re-join.
              </Text>
            </View>
          ) : null}

          {/* Action row */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {!joined ? (
              <PrimaryButton
                label={myMembershipState === "left" ? "Re-join" : "Join"}
                onPress={join}
                disabled={roomState.isReadOnly}
              />
            ) : (
              <PrimaryButton label="Leave" onPress={confirmLeave} destructive />
            )}

            {isCreator ? (
              <PrimaryButton
                label="Close invite"
                onPress={closeInvite}
                disabled={roomState.isReadOnly}
                destructive
              />
            ) : null}

            <PrimaryButton
              label="✅ I'm here"
              onPress={() => sendQuick("IM_HERE")}
              disabled={!canInteract}
            />
            <PrimaryButton
              label="⏱️ 10 min late"
              onPress={() => sendQuick("LATE_10")}
              disabled={!canInteract}
            />
            <PrimaryButton
              label="❌ Cancel"
              onPress={() => sendQuick("CANCEL")}
              disabled={!canInteract}
            />
          </View>
        </View>

        {/* Chat list */}
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: TOKENS.border,
            borderRadius: 16,
            padding: 12,
          }}
        >
          {!canReadEvents ? (
            <Text style={{ color: TOKENS.subtext }}>
              Join this invite to see and send messages.
            </Text>
          ) : (
            <FlatList
              ref={(r) => (listRef.current = r)}
              data={events}
              keyExtractor={(e) => e.id}
              renderItem={renderItem}
              contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
              onContentSizeChange={() => scrollToBottom(false)}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {/* Input bar (always pinned to bottom; keyboard won’t cover it) */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <TextInput
            ref={(r) => (inputRef.current = r)}
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
            multiline
            onFocus={() => scrollToBottom(true)}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              borderWidth: 1,
              borderColor: TOKENS.border,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: TOKENS.text,
              opacity: canInteract ? 1 : 0.6,
            }}
          />

          <Pressable
            onPress={() => sendChat(message)}
            disabled={!canInteract}
            style={({ pressed }) => ({
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: TOKENS.border,
              backgroundColor: "#FFFFFF",
              opacity: !canInteract ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontWeight: "900", color: TOKENS.text }}>Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
