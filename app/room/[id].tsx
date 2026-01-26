import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

type ChatItem =
  | { kind: "section"; id: string; label: string }
  | { kind: "event"; id: string; e: RoomEventRow };

const TOKENS = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  title: "#111827",
  text: "#111827",
  subtext: "#6B7280",

  cardBg: "#FFFFFF",

  mineBg: "#DCFCE7",
  mineBorder: "#BBF7D0",

  otherBg: "#F3F4F6",
  otherBorder: "#E5E7EB",

  systemText: "#6B7280",
  systemBg: "#F3F4F6",
  systemBorder: "#E5E7EB",

  primary: "#111827",
  overlay: "rgba(0,0,0,0.28)",

  dangerText: "#991B1B",
  dangerBg: "#FEE2E2",
  dangerBorder: "#FECACA",

  okText: "#166534",
  okBg: "#DCFCE7",
  okBorder: "#BBF7D0",
} as const;

/* =======================
 * Time helpers
 * ======================= */
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function startOfLocalDayMs(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function sectionLabelForIso(iso: string): string {
  const t = new Date(iso);
  const now = new Date();
  const t0 = startOfLocalDayMs(t);
  const n0 = startOfLocalDayMs(now);

  const diffDays = Math.round((t0 - n0) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";

  // older: show date like "Jan 26"
  const month = t.toLocaleString(undefined, { month: "short" });
  return `${month} ${t.getDate()}`;
}

/* =======================
 * Message content helpers
 * ======================= */
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

/* =======================
 * UI components
 * ======================= */
function IconButton({
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
      hitSlop={10}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: destructive ? TOKENS.dangerBorder : TOKENS.border,
        backgroundColor: destructive ? TOKENS.dangerBg : TOKENS.cardBg,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontWeight: "900",
          color: destructive ? TOKENS.dangerText : TOKENS.text,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function QuickChip({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: TOKENS.border,
        backgroundColor: TOKENS.cardBg,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontWeight: "800", color: TOKENS.text, fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SheetItem({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "900",
          color: destructive ? TOKENS.dangerText : TOKENS.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =======================
 * Main
 * ======================= */
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

  // long-press menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<RoomEventRow | null>(null);

  const listRef = useRef<FlatList<ChatItem> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  function scrollToBottom(animated = true) {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }

  const keyboardVerticalOffset = 100; // you said you already set this

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

  useEffect(() => {
    const subShow = Keyboard.addListener("keyboardDidShow", () => {
      scrollToBottom(true);
    });
    return () => subShow.remove();
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

  // :zap: CHANGE 1: Build "sectioned list items" (Today/Yesterday/Date)
  const chatItems: ChatItem[] = useMemo(() => {
    const items: ChatItem[] = [];
    let lastLabel: string | null = null;

    for (const e of events) {
      const label = sectionLabelForIso(e.created_at);
      if (label !== lastLabel) {
        items.push({ kind: "section", id: `section:${label}`, label });
        lastLabel = label;
      }
      items.push({ kind: "event", id: e.id, e });
    }

    return items;
  }, [events]);

  // :zap: CHANGE 2: Long-press handler for message
  function openMessageMenu(e: RoomEventRow) {
    setMenuTarget(e);
    setMenuOpen(true);
  }

  async function copyToClipboard(text: string) {
    // Web
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert("Copied", "Message copied.");
      } catch {
        Alert.alert("Copy failed", "Clipboard not available.");
      }
      return;
    }

    // Native placeholder (so you can test UX now without adding deps)
    // If you want real native copy, tell me and I’ll add expo-clipboard cleanly.
    Alert.alert("Copy", "Not implemented yet on native (placeholder).");
  }

  function reportMessage(_e: RoomEventRow) {
    Alert.alert("Report", "Not implemented yet.");
  }

  function renderChatItem({ item }: { item: ChatItem }) {
    if (item.kind === "section") {
      return (
        <View style={{ alignItems: "center", paddingVertical: 6 }}>
          <View
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: TOKENS.border,
              backgroundColor: TOKENS.otherBg,
            }}
          >
            <Text
              style={{ fontSize: 12, fontWeight: "800", color: TOKENS.subtext }}
            >
              {item.label}
            </Text>
          </View>
        </View>
      );
    }

    const e = item.e;

    // :zap: CHANGE 3: System message style (grey centered small bubble)
    if (e.type === "system" || !e.user_id) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 6 }}>
          <View
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: TOKENS.systemBorder,
              backgroundColor: TOKENS.systemBg,
              maxWidth: "92%",
            }}
          >
            <Text
              style={{
                color: TOKENS.systemText,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {renderEventContent(e)}
            </Text>
          </View>
        </View>
      );
    }

    const isMine = !!userId && e.user_id === userId;
    const name = getEventDisplayName(e);
    const content = renderEventContent(e);

    // :zap: CHANGE 4: IG-ish layout: name closer + smaller gap, time near bubble
    return (
      <Pressable
        onLongPress={() => openMessageMenu(e)}
        delayLongPress={250}
        style={{
          alignSelf: isMine ? "flex-end" : "flex-start",
          maxWidth: "88%",
          gap: 4,
        }}
      >
        <View
          style={{
            flexDirection: isMine ? "row-reverse" : "row",
            alignItems: "baseline",
            gap: 6,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: TOKENS.subtext,
              maxWidth: 180,
            }}
          >
            {name}
          </Text>
          <Text style={{ fontSize: 11, color: TOKENS.subtext }}>
            {hhmm(e.created_at)}
          </Text>
        </View>

        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 18,
            borderTopRightRadius: isMine ? 6 : 18,
            borderTopLeftRadius: isMine ? 18 : 6,
            borderWidth: 1,
            borderColor: isMine ? TOKENS.mineBorder : TOKENS.otherBorder,
            backgroundColor: isMine ? TOKENS.mineBg : TOKENS.otherBg,
          }}
        >
          <Text style={{ color: TOKENS.text, fontWeight: "600", fontSize: 15 }}>
            {content}
          </Text>
        </View>
      </Pressable>
    );
  }

  // :zap: CHANGE 5: Header action placement — top-right controls; quick actions near input
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TOKENS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {/* Header */}
        <View
          style={{
            borderWidth: 1,
            borderColor: TOKENS.border,
            borderRadius: 16,
            padding: 12,
            backgroundColor: TOKENS.cardBg,
            gap: 10,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
          >
            <View style={{ flex: 1, gap: 4, paddingRight: 6 }}>
              <Text
                style={{ fontSize: 18, fontWeight: "900", color: TOKENS.title }}
              >
                {activity?.title_text ?? "Room"}
              </Text>

              <Text
                style={{ fontWeight: "700", color: TOKENS.text }}
                numberOfLines={1}
              >
                {placeName}
              </Text>

              {placeAddress ? (
                <Text
                  style={{ fontSize: 12, color: TOKENS.subtext }}
                  numberOfLines={1}
                >
                  {placeAddress}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: TOKENS.border,
                    backgroundColor: TOKENS.otherBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: TOKENS.text,
                    }}
                  >
                    Members {members.length}
                  </Text>
                </View>

                {isCreator ? (
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: TOKENS.okBorder,
                      backgroundColor: TOKENS.okBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "900",
                        color: TOKENS.okText,
                      }}
                    >
                      Created
                    </Text>
                  </View>
                ) : null}

                {roomState.label ? (
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: TOKENS.dangerBorder,
                      backgroundColor: TOKENS.dangerBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "900",
                        color: TOKENS.dangerText,
                      }}
                    >
                      {roomState.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Top-right controls */}
            <View style={{ gap: 8, alignItems: "flex-end" }}>
              {!joined ? (
                <IconButton
                  label={myMembershipState === "left" ? "Re-join" : "Join"}
                  onPress={join}
                  disabled={roomState.isReadOnly}
                />
              ) : (
                <IconButton label="Leave" onPress={confirmLeave} destructive />
              )}

              {isCreator ? (
                <IconButton
                  label="Close"
                  onPress={closeInvite}
                  disabled={roomState.isReadOnly}
                  destructive
                />
              ) : null}
            </View>
          </View>

          {myMembershipState === "left" ? (
            <View
              style={{
                padding: 10,
                borderWidth: 1,
                borderRadius: 12,
                borderColor: TOKENS.border,
                backgroundColor: TOKENS.otherBg,
                gap: 4,
              }}
            >
              <Text style={{ fontWeight: "900", color: TOKENS.text }}>
                You left
              </Text>
              <Text style={{ color: TOKENS.subtext }}>
                You can view history. Tap Re-join to chat again.
              </Text>
            </View>
          ) : null}

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
                Read-only
              </Text>
              <Text style={{ color: TOKENS.dangerText, opacity: 0.9 }}>
                You can still view messages.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Chat */}
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: TOKENS.border,
            borderRadius: 16,
            backgroundColor: TOKENS.cardBg,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 10,
          }}
        >
          {!canReadEvents ? (
            <Text style={{ color: TOKENS.subtext }}>
              Join this invite to see and send messages.
            </Text>
          ) : (
            <FlatList
              ref={(r) => (listRef.current = r)}
              data={chatItems}
              keyExtractor={(x) => x.id}
              renderItem={renderChatItem}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
              onContentSizeChange={() => scrollToBottom(false)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Quick actions (near input, like IG quick reactions) */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <QuickChip
            label="✅ I'm here"
            onPress={() => sendQuick("IM_HERE")}
            disabled={!canInteract}
          />
          <QuickChip
            label="⏱️ 10 min late"
            onPress={() => sendQuick("LATE_10")}
            disabled={!canInteract}
          />
          <QuickChip
            label="❌ Cancel"
            onPress={() => sendQuick("CANCEL")}
            disabled={!canInteract}
          />
        </View>

        {/* Input bar */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <TextInput
            ref={(r) => (inputRef.current = r)}
            value={message}
            onChangeText={setMessage}
            placeholder={
              canInteract
                ? "Message…"
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
              maxHeight: 130,
              borderWidth: 1,
              borderColor: TOKENS.border,
              borderRadius: 18,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: TOKENS.text,
              backgroundColor: TOKENS.cardBg,
              opacity: canInteract ? 1 : 0.6,
            }}
          />

          <Pressable
            onPress={() => sendChat(message)}
            disabled={!canInteract}
            style={({ pressed }) => ({
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: TOKENS.border,
              backgroundColor: TOKENS.cardBg,
              opacity: !canInteract ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontWeight: "900", color: TOKENS.text }}>Send</Text>
          </Pressable>
        </View>
      </View>

      {/* :zap: CHANGE 6: Long-press message menu (Copy/Report placeholders) */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: TOKENS.overlay,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: TOKENS.border,
              paddingTop: 10,
              paddingBottom: 12,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 42,
                height: 4,
                borderRadius: 999,
                backgroundColor: "#E5E7EB",
                marginBottom: 10,
              }}
            />

            <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 4 }}>
              <Text style={{ fontWeight: "900", color: TOKENS.text }}>
                Message
              </Text>
              {menuTarget ? (
                <Text style={{ color: TOKENS.subtext }} numberOfLines={2}>
                  {renderEventContent(menuTarget)}
                </Text>
              ) : null}
            </View>

            <SheetItem
              label="Copy"
              onPress={async () => {
                const t = menuTarget ? renderEventContent(menuTarget) : "";
                setMenuOpen(false);
                await copyToClipboard(t);
              }}
            />
            <SheetItem
              label="Report"
              onPress={() => {
                if (!menuTarget) return;
                setMenuOpen(false);
                reportMessage(menuTarget);
              }}
            />

            <View style={{ height: 8 }} />
            <SheetItem label="Cancel" onPress={() => setMenuOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
