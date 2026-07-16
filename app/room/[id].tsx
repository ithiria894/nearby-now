import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { backend } from "../../lib/backend";
import { isAuthMissingError, requireUserId } from "../../lib/domain/auth";
import { joinWithSystemMessage } from "../../lib/domain/activities";
import {
  fetchRoomEventById,
  fetchRoomEventsPage,
  type RoomEventCursor,
  type RoomEventRow,
} from "../../lib/repo/room_repo";
import { useT } from "../../lib/i18n/useT";
import {
  computeRoomState,
  friendlyDbError,
  getEventDisplayName,
  hhmm,
  renderEventContent,
  sectionLabelForIso,
} from "../../lib/domain/room";
import { subscribeToRoom } from "../../lib/realtime/room";
import { getLastRead, markRead } from "../../lib/domain/reads";
import { alertAsync, confirmAsync } from "../../lib/ui/dialog";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import {
  space,
  radius,
  motion,
  typeScale,
  type UIColors,
} from "../../src/ui/theme/uikit";
import {
  BAppBar,
  BBadge,
  BButton,
  BCard,
  BChip,
  BText,
  PaperTexture,
} from "../../src/ui/components/brutal";
import { BottomNav } from "../../components/BottomNav";

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

type ChatItem =
  | { kind: "section"; id: string; label: string }
  | { kind: "unread"; id: string }
  | { kind: "event"; id: string; e: RoomEventRow };

/* =======================
 * UI components
 * ======================= */
function SheetItem({
  label,
  onPress,
  destructive,
  c,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  c: UIColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <BText c={c} v="bodyStrong" color={destructive ? c.danger : c.text}>
        {label}
      </BText>
    </Pressable>
  );
}

/* =======================
 * Main
 * ======================= */
export default function RoomScreen() {
  const router = useRouter();
  const { t, i18n } = useT();
  const c = useUIKit();
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
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const [leftAt, setLeftAt] = useState<Date | null>(null);
  const [chatCursor, setChatCursor] = useState<RoomEventCursor | null>(null);
  const [chatHasMore, setChatHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Read watermark captured when the room opens (before we mark it read), used
  // to draw the "New messages" divider. Frozen for the session so the divider
  // stays put even as incoming messages get marked read.
  const [unreadSince, setUnreadSince] = useState<number | null>(null);

  // long-press menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<RoomEventRow | null>(null);

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listRef = useRef<FlatList<ChatItem> | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  // Only animate messages that arrive AFTER the first render — the initial
  // batch and older (paged-in) messages should appear instantly. We seed this
  // set with whatever's on screen at first paint; anything new after that slides
  // in from the sender's side.
  const seenMsgIds = useRef<Set<string>>(new Set());
  const chatHydrated = useRef(false);

  function scrollToBottom(animated = true) {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated });
    });
  }

  const keyboardVerticalOffset = 100; // you said you already set this
  const CHAT_PAGE_SIZE = 50;

  const loadAll = useCallback(
    async (currentUserId?: string | null) => {
      const { data: a, error: aErr } =
        await backend.activities.getActivityById<ActivityRow>(
          activityId,
          "id, title_text, place_text, place_name, place_address, expires_at, gender_pref, capacity, status, creator_id"
        );

      if (aErr) console.error(aErr);
      setActivity((a ?? null) as any);

      const { data: m, error: mErr } =
        await backend.activities.fetchActivityMembers(activityId);

      if (mErr) console.error(mErr);
      setMembers((m ?? []) as any);

      const uid = currentUserId ?? userId;

      let myState: "none" | "joined" | "left" = "none";
      let leftAtValue: Date | null = null;
      if (uid) {
        const { data: me, error: meErr } =
          await backend.activities.getActivityMemberState(activityId, uid);

        if (meErr) console.error(meErr);
        const st = (me as any)?.state;
        myState = st === "left" ? "left" : st === "joined" ? "joined" : "none";
        leftAtValue = (me as any)?.left_at
          ? new Date((me as any).left_at)
          : null;
      }

      setMyMembershipState(myState);
      setLeftAt(leftAtValue);

      const canReadEvents = myState === "joined" || myState === "left";
      if (!canReadEvents) {
        setEvents([]);
        return;
      }

      const page = await fetchRoomEventsPage({
        activityId,
        limit: CHAT_PAGE_SIZE,
        cursor: null,
        leftAt: leftAtValue,
      });

      setEvents(page.rows);
      setChatCursor(page.cursor);
      setChatHasMore(page.hasMore);
      if (page.rows.length > 0) scrollToBottom(false);
    },
    [activityId, userId]
  );

  const loadOlder = useCallback(async () => {
    if (!chatHasMore || loadingOlder || !chatCursor) return;
    setLoadingOlder(true);
    try {
      const page = await fetchRoomEventsPage({
        activityId,
        limit: CHAT_PAGE_SIZE,
        cursor: chatCursor,
        leftAt,
      });

      const rows = page.rows;
      if (rows.length === 0) {
        setChatHasMore(false);
        return;
      }
      setEvents((prev) => {
        const existing = new Set(prev.map((e) => e.id));
        const merged = rows.filter((r) => !existing.has(r.id)).concat(prev);
        return merged as any;
      });
      setChatCursor(page.cursor);
      setChatHasMore(page.hasMore);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingOlder(false);
    }
  }, [
    activityId,
    chatCursor,
    chatHasMore,
    leftAt,
    loadingOlder,
    myMembershipState,
  ]);

  const appendEventIfMissing = useCallback((next: RoomEventRow) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === next.id)) return prev;
      return [...prev, next];
    });
  }, []);

  // Advance the local read watermark to the newest loaded event. Runs on the
  // initial load and whenever a new message arrives while the room is open, so
  // the Lobby/Created unread badges clear once you've seen the messages.
  useEffect(() => {
    if (!userId || events.length === 0) return;
    let newest = 0;
    for (const e of events) {
      const ms = new Date(e.created_at).getTime();
      if (ms > newest) newest = ms;
    }
    if (newest > 0) void markRead(userId, activityId, newest);
  }, [userId, activityId, events]);

  useEffect(() => {
    (async () => {
      try {
        const uid = await requireUserId();
        setUserId(uid);
        // Snapshot how far this room had been read *before* we open it, so the
        // "New messages" divider knows where to sit.
        setUnreadSince(await getLastRead(uid, activityId));
        await loadAll(uid);
      } catch (e: any) {
        if (isAuthMissingError(e)) {
          alertAsync(t("room.authRequiredTitle"), t("room.authRequiredBody"));
          router.replace("/login");
          return;
        }
        alertAsync(t("room.loadErrorTitle"), e?.message ?? "Unknown error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, loadAll]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { displayName, error } =
        await backend.profiles.getProfileDisplayName(userId);
      if (error) {
        console.error(error);
        return;
      }
      setMyDisplayName((displayName ?? "").trim() || null);
    })();
  }, [userId]);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      loadAll();
      reloadTimerRef.current = null;
    }, 200);
  }, [loadAll]);

  useEffect(() => {
    if (myMembershipState !== "joined") return;

    const unsubscribe = subscribeToRoom(activityId, {
      onMemberChange: () => scheduleReload(),
      onActivityChange: () => scheduleReload(),
      onEventInsert: (payload) => {
        const id = (payload.new as { id?: string })?.id;
        if (!id) return;
        fetchRoomEventById(id)
          .then((evt) => {
            if (!evt) return;
            appendEventIfMissing(evt);
          })
          .catch((e) => console.error(e));
      },
    });

    return () => {
      unsubscribe();
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [
    activityId,
    appendEventIfMissing,
    leftAt,
    myMembershipState,
    scheduleReload,
  ]);

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

  // Join directly on tap — the user already previewed the room, joining is
  // reversible (Leave), and a confirm Alert is a no-op on react-native-web.
  async function join() {
    if (!userId || roomState.isReadOnly) return;
    try {
      await joinWithSystemMessage(activityId, userId);
      await loadAll(userId);
      scrollToBottom(false);
      inputRef.current?.focus?.();
    } catch (e: any) {
      console.error("[join]", e);
      alertAsync(
        t("room.joinFailedTitle"),
        friendlyDbError(t, e?.message ?? "Unknown error")
      );
    }
  }

  async function doLeave() {
    if (!userId) return;

    try {
      const { error } = await backend.activities.updateActivityMemberState(
        activityId,
        userId,
        { state: "left" }
      );

      if (error) throw error;

      if (!roomState.isReadOnly) {
        try {
          await backend.roomEvents.insertRoomEvent({
            activity_id: activityId,
            user_id: userId,
            type: "system",
            content: JSON.stringify({ k: "room.system.left" }),
          });
        } catch (postErr) {
          console.error(postErr);
        }
      }

      router.back();
    } catch (e: any) {
      console.error(e);
      alertAsync(t("room.leaveFailedTitle"), e?.message ?? "Unknown error");
    }
  }

  async function confirmLeave() {
    const ok = await confirmAsync(
      t("room.leaveConfirmTitle"),
      t("room.leaveConfirmBody"),
      {
        confirmText: t("common.leave"),
        cancelText: t("common.cancel"),
        destructive: true,
      }
    );
    if (ok) doLeave();
  }

  async function closeInvite() {
    if (!userId || !activity) return;
    if (!isCreator) {
      alertAsync(t("room.closeNotAllowedTitle"), t("room.closeNotAllowedBody"));
      return;
    }
    if (roomState.isReadOnly) return;

    const ok = await confirmAsync(
      t("room.closeConfirmTitle"),
      t("room.closeConfirmBody"),
      {
        confirmText: t("common.close"),
        cancelText: t("common.cancel"),
        destructive: true,
      }
    );

    if (!ok) return;

    try {
      const { error: updErr } = await backend.activities.updateActivity(
        activityId,
        {
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: userId,
        }
      );

      if (updErr) throw updErr;

      await backend.roomEvents.insertRoomEvent({
        activity_id: activityId,
        user_id: userId,
        type: "system",
        content: JSON.stringify({ k: "room.system.invite_closed" }),
      });

      await loadAll(userId);
    } catch (e: any) {
      console.error(e);
      alertAsync(t("room.closeFailedTitle"), e?.message ?? "Unknown error");
    }
  }

  async function sendChat(text: string) {
    if (!userId) return;
    if (!canInteract) {
      alertAsync(t("room.readOnlyAlertTitle"), t("room.readOnlyAlertBody"));
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const { error } = await backend.roomEvents.insertRoomEvent({
      activity_id: activityId,
      user_id: userId,
      type: "chat",
      content: trimmed,
    });

    if (error)
      alertAsync(t("room.sendFailedTitle"), friendlyDbError(t, error.message));
    else {
      setMessage("");
      await loadAll(userId);
      scrollToBottom(true);
    }
  }

  async function sendQuick(code: string) {
    if (!userId) return;
    if (!canInteract) {
      alertAsync(t("room.readOnlyAlertTitle"), t("room.readOnlyAlertBody"));
      return;
    }

    const { error } = await backend.roomEvents.insertRoomEvent({
      activity_id: activityId,
      user_id: userId,
      type: "quick",
      content: code,
    });

    if (error)
      alertAsync(t("room.failedTitle"), friendlyDbError(t, error.message));
    else {
      await loadAll(userId);
      scrollToBottom(true);
    }
  }

  const placeRaw = (activity?.place_name ?? activity?.place_text ?? "").trim();
  const hasPlace = placeRaw.length > 0;
  const placeName = placeRaw || t("activityCard.place_none");
  const placeAddress = (activity?.place_address ?? "").trim();

  // :zap: CHANGE 1: Build "sectioned list items" (Today/Yesterday/Date)
  const chatItems: ChatItem[] = useMemo(() => {
    const items: ChatItem[] = [];
    let currentLabel: string | null = null;

    const ordered = [...events].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      if (tb !== ta) return tb - ta;
      return String(b.id).localeCompare(String(a.id));
    });

    // Show the "New messages" divider only if there's a real message from
    // someone else newer than where we last read up to.
    const watermark = unreadSince ?? 0;
    const hasUnread =
      watermark > 0 &&
      ordered.some(
        (e) =>
          (e.type === "chat" || e.type === "quick") &&
          e.user_id !== userId &&
          new Date(e.created_at).getTime() > watermark
      );
    let dividerDone = false;

    for (const e of ordered) {
      // The list is inverted + newest-first, so pushing the divider right
      // before the first already-read message lands it just above the block
      // of unread messages.
      if (
        hasUnread &&
        !dividerDone &&
        new Date(e.created_at).getTime() <= watermark
      ) {
        items.push({ kind: "unread", id: "unread-divider" });
        dividerDone = true;
      }

      const label = sectionLabelForIso(t, i18n.language, e.created_at);
      if (label !== currentLabel && currentLabel) {
        // For inverted list: place section AFTER its group's messages
        items.push({
          kind: "section",
          id: `section:${currentLabel}`,
          label: currentLabel,
        });
      }
      currentLabel = label;
      items.push({ kind: "event", id: e.id, e });
    }

    if (currentLabel) {
      items.push({
        kind: "section",
        id: `section:${currentLabel}`,
        label: currentLabel,
      });
    }

    // All loaded messages are unread (e.g. older ones paged out): divider on top.
    if (hasUnread && !dividerDone) {
      items.push({ kind: "unread", id: "unread-divider" });
    }

    return items;
  }, [events, i18n.language, t, unreadSince, userId]);

  // Seed the "already seen" set once, from the first non-empty render, so the
  // initial conversation doesn't animate — only later arrivals do.
  useEffect(() => {
    if (chatHydrated.current || chatItems.length === 0) return;
    for (const it of chatItems) {
      if (it.kind === "event") seenMsgIds.current.add(it.e.id);
    }
    chatHydrated.current = true;
  }, [chatItems]);

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
        alertAsync(
          t("room.clipboard.copiedTitle"),
          t("room.clipboard.copiedBody")
        );
      } catch {
        alertAsync(
          t("room.clipboard.copyFailedTitle"),
          t("room.clipboard.copyFailedBody")
        );
      }
      return;
    }

    // Native placeholder (so you can test UX now without adding deps)
    // If you want real native copy, tell me and I’ll add expo-clipboard cleanly.
    alertAsync(
      t("room.clipboard.nativePlaceholderTitle"),
      t("room.clipboard.nativePlaceholderBody")
    );
  }

  function reportMessage(_e: RoomEventRow) {
    alertAsync(
      t("room.clipboard.reportPlaceholderTitle"),
      t("room.clipboard.reportPlaceholderBody")
    );
  }

  function renderChatItem({ item }: { item: ChatItem }) {
    if (item.kind === "unread") {
      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            paddingVertical: space.xs + 2,
          }}
        >
          <View style={{ flex: 1, height: 2, backgroundColor: c.brand }} />
          <BText c={c} v="label" color={c.brand}>
            {t("room.newMessages")}
          </BText>
          <View style={{ flex: 1, height: 2, backgroundColor: c.brand }} />
        </View>
      );
    }

    if (item.kind === "section") {
      return (
        <View style={{ alignItems: "center", paddingVertical: space.xs + 2 }}>
          <View
            style={{
              paddingVertical: space.xs,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              borderWidth: 2,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
            }}
          >
            <BText c={c} v="label" color={c.subtext}>
              {item.label}
            </BText>
          </View>
        </View>
      );
    }

    const e = item.e;

    // :zap: CHANGE 3: System message style (grey centered small bubble)
    if (e.type === "system" || !e.user_id) {
      return (
        <View style={{ alignItems: "center", paddingVertical: space.xs + 2 }}>
          <View
            style={{
              paddingVertical: space.xs + 2,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              borderWidth: 2,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
              maxWidth: "92%",
            }}
          >
            <BText c={c} v="caption" color={c.subtext}>
              {renderEventContent(t, i18n.language, e)}
            </BText>
          </View>
        </View>
      );
    }

    const isMine = !!userId && e.user_id === userId;
    const name = isMine
      ? myDisplayName?.trim() || t("room.you")
      : getEventDisplayName(t, e);
    const content = renderEventContent(t, i18n.language, e);

    // Slide a brand-new message in from the sender's side (right = mine, left =
    // theirs). Older/initial messages render instantly (see chatHydrated).
    const isNewMsg = chatHydrated.current && !seenMsgIds.current.has(e.id);
    if (chatHydrated.current) seenMsgIds.current.add(e.id);
    const entering = isNewMsg
      ? (isMine ? FadeInRight : FadeInLeft)
          .springify()
          .damping(motion.spring.damping)
          .stiffness(motion.spring.stiffness)
          .mass(motion.spring.mass)
      : undefined;

    // :zap: CHANGE 4: IG-ish layout: name closer + smaller gap, time near bubble
    return (
      <Animated.View entering={entering}>
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
            <BText
              c={c}
              v="label"
              color={c.subtext}
              numberOfLines={1}
              style={{ maxWidth: 180 }}
            >
              {name}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {hhmm(e.created_at)}
            </BText>
          </View>

          <View
            style={{
              paddingVertical: space.sm + 2,
              paddingHorizontal: space.md,
              borderRadius: radius.lg,
              borderTopRightRadius: isMine ? radius.sm : radius.lg,
              borderTopLeftRadius: isMine ? radius.lg : radius.sm,
              borderWidth: 2,
              borderColor: c.border,
              backgroundColor: isMine ? c.brand : c.surface,
            }}
          >
            <BText c={c} v="body" color={isMine ? c.onBrand : c.text}>
              {content}
            </BText>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // :zap: CHANGE 5: Header action placement — top-right controls; quick actions near input
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <PaperTexture opacity={0.06} />
      <BAppBar
        c={c}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)/browse")
        }
        title={activity?.title_text ?? t("room.fallbackRoomTitle")}
        meta={
          <>
            {hasPlace ? (
              <BText c={c} v="caption" color={c.subtext} numberOfLines={1}>
                {placeName}
              </BText>
            ) : null}
            <BBadge
              c={c}
              label={t("room.membersCount", { count: members.length })}
              fill={c.surface}
            />
            {isCreator ? (
              <BBadge c={c} label={t("room.createdBadge")} fill={c.mint} />
            ) : null}
            {roomState.labelKey ? (
              <BBadge
                c={c}
                label={
                  roomState.labelKey === "closed"
                    ? t("room.closedBadge")
                    : t("room.expiredBadge")
                }
                fill={c.coral}
              />
            ) : null}
          </>
        }
        right={
          <>
            {!joined ? (
              <BButton
                c={c}
                tone="primary"
                label={
                  myMembershipState === "left"
                    ? t("common.rejoin")
                    : t("common.join")
                }
                onPress={roomState.isReadOnly ? undefined : join}
              />
            ) : (
              <BButton
                c={c}
                tone="secondary"
                label={t("common.leave")}
                onPress={confirmLeave}
              />
            )}
            {isCreator ? (
              <BButton
                c={c}
                tone="danger"
                label={t("common.close")}
                onPress={roomState.isReadOnly ? undefined : closeInvite}
              />
            ) : null}
          </>
        }
      />
      <View style={{ flex: 1, padding: space.lg, gap: space.md }}>
        {myMembershipState === "left" ? (
          <View
            style={{
              padding: space.md,
              borderWidth: 2,
              borderRadius: radius.md,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
              gap: space.xs,
            }}
          >
            <BText c={c} v="bodyStrong" color={c.text}>
              {t("room.leftTitle")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {t("room.leftBody")}
            </BText>
          </View>
        ) : null}

        {roomState.labelKey ? (
          <View
            style={{
              padding: space.md,
              borderWidth: 2,
              borderRadius: radius.md,
              borderColor: c.border,
              backgroundColor: c.coral,
              gap: space.xs,
            }}
          >
            <BText c={c} v="bodyStrong" color={c.onBright}>
              {t("room.readonlyTitle")}
            </BText>
            <BText c={c} v="caption" color={c.onBright}>
              {t("room.readonlyBody")}
            </BText>
          </View>
        ) : null}

        {/* Chat */}
        <View
          style={{
            flex: 1,
            borderWidth: 2,
            borderColor: c.border,
            borderRadius: radius.lg,
            backgroundColor: c.surface,
            paddingHorizontal: space.md,
            paddingTop: space.sm,
            paddingBottom: space.sm + 2,
          }}
        >
          {!canReadEvents ? (
            <BText c={c} v="body" color={c.subtext}>
              {t("room.joinToSee")}
            </BText>
          ) : (
            <FlatList
              ref={(r) => {
                listRef.current = r;
              }}
              data={chatItems}
              keyExtractor={(x) => x.id}
              renderItem={renderChatItem}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
              inverted
              onEndReached={loadOlder}
              onEndReachedThreshold={0.2}
              ListFooterComponent={
                chatHasMore ? (
                  <View style={{ paddingVertical: 6 }}>
                    <BText
                      c={c}
                      v="caption"
                      color={c.faint}
                      style={{ textAlign: "center" }}
                    >
                      {loadingOlder ? t("common.loading") : ""}
                    </BText>
                  </View>
                ) : null
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              initialNumToRender={12}
              windowSize={7}
              maxToRenderPerBatch={12}
              updateCellsBatchingPeriod={40}
            />
          )}
        </View>

        {/* Quick actions (near input, like IG quick reactions) */}
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          <Pressable
            onPress={() => sendQuick("IM_HERE")}
            disabled={!canInteract}
            style={{ opacity: canInteract ? 1 : 0.45 }}
          >
            <BChip c={c} label={t("room.quick.imHere")} />
          </Pressable>
          <Pressable
            onPress={() => sendQuick("LATE_10")}
            disabled={!canInteract}
            style={{ opacity: canInteract ? 1 : 0.45 }}
          >
            <BChip c={c} label={t("room.quick.late10")} />
          </Pressable>
          <Pressable
            onPress={() => sendQuick("CANCEL")}
            disabled={!canInteract}
            style={{ opacity: canInteract ? 1 : 0.45 }}
          >
            <BChip c={c} label={t("room.quick.cancel")} />
          </Pressable>
        </View>

        {/* Input bar */}
        <View
          style={{
            flexDirection: "row",
            gap: space.sm,
            alignItems: "flex-end",
          }}
        >
          <TextInput
            ref={(r) => {
              inputRef.current = r;
            }}
            value={message}
            onChangeText={setMessage}
            placeholder={
              canInteract
                ? t("room.placeholder.message")
                : myMembershipState === "left"
                  ? t("room.placeholder.rejoinToChat")
                  : roomState.isReadOnly
                    ? t("room.placeholder.readonly")
                    : t("room.placeholder.joinToChat")
            }
            placeholderTextColor={c.faint}
            editable={canInteract}
            multiline
            onFocus={() => scrollToBottom(true)}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 130,
              borderWidth: 2,
              borderColor: c.border,
              borderRadius: radius.lg,
              paddingHorizontal: space.md,
              paddingVertical: space.sm + 2,
              color: c.text,
              backgroundColor: c.surface,
              fontFamily: typeScale.body.font,
              fontSize: typeScale.body.size,
              opacity: canInteract ? 1 : 0.6,
            }}
          />

          <View
            style={{
              opacity: !canInteract || !message.trim() ? 0.5 : 1,
            }}
          >
            <BButton
              c={c}
              tone="primary"
              label={t("common.send")}
              onPress={
                !canInteract || !message.trim()
                  ? undefined
                  : () => sendChat(message)
              }
            />
          </View>
        </View>
      </View>

      {/* Keep the bottom nav visible even though the room lives outside the
          Tabs navigator. */}
      <BottomNav />

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
            backgroundColor: c.overlay,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              borderTopWidth: 2,
              borderColor: c.border,
              paddingTop: space.sm,
              paddingBottom: space.md,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 42,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: c.border,
                marginBottom: space.sm,
              }}
            />

            <View
              style={{
                paddingHorizontal: space.lg,
                paddingBottom: space.sm,
                gap: space.xs,
              }}
            >
              <BText c={c} v="bodyStrong" color={c.text}>
                {t("room.menu.title")}
              </BText>
              {menuTarget ? (
                <BText c={c} v="caption" color={c.subtext} numberOfLines={2}>
                  {renderEventContent(t, i18n.language, menuTarget)}
                </BText>
              ) : null}
            </View>

            <SheetItem
              label={t("room.menu.copy")}
              onPress={async () => {
                const text = menuTarget
                  ? renderEventContent(t, i18n.language, menuTarget)
                  : "";
                setMenuOpen(false);
                await copyToClipboard(text);
              }}
              c={c}
            />
            <SheetItem
              label={t("room.menu.report")}
              onPress={() => {
                if (!menuTarget) return;
                setMenuOpen(false);
                reportMessage(menuTarget);
              }}
              c={c}
            />

            <View style={{ height: space.sm }} />
            <SheetItem
              label={t("room.menu.cancel")}
              onPress={() => setMenuOpen(false)}
              c={c}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
