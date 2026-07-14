import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
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
import { useUIKit } from "../../src/ui/theme/useUIKit";
import {
  space,
  radius,
  typeScale,
  type UIColors,
} from "../../src/ui/theme/uikit";
import {
  BBadge,
  BButton,
  BCard,
  BChip,
  BText,
  PaperTexture,
} from "../../src/ui/components/brutal";

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

  // long-press menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<RoomEventRow | null>(null);

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listRef = useRef<FlatList<ChatItem> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

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

  useEffect(() => {
    (async () => {
      try {
        const uid = await requireUserId();
        setUserId(uid);
        await loadAll(uid);
      } catch (e: any) {
        if (isAuthMissingError(e)) {
          Alert.alert(t("room.authRequiredTitle"), t("room.authRequiredBody"));
          router.replace("/login");
          return;
        }
        Alert.alert(t("room.loadErrorTitle"), e?.message ?? "Unknown error");
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

  async function join() {
    if (!userId) return;
    if (roomState.isReadOnly) {
      Alert.alert(
        t("room.joinNotAvailableTitle"),
        t("room.joinNotAvailableBody")
      );
      return;
    }

    Alert.alert(t("room.joinConfirmTitle"), t("room.joinConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.join"),
        onPress: async () => {
          try {
            await joinWithSystemMessage(activityId, userId);
            await loadAll(userId);
            scrollToBottom(false);
            inputRef.current?.focus?.();
          } catch (e: any) {
            Alert.alert(
              t("room.joinFailedTitle"),
              friendlyDbError(t, e?.message ?? "Unknown error")
            );
          }
        },
      },
    ]);
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
      Alert.alert(t("room.leaveFailedTitle"), e?.message ?? "Unknown error");
    }
  }

  function confirmLeave() {
    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.(
        `${t("room.leaveConfirmTitle")}\n\n${t("room.leaveConfirmBody")}`
      );
      if (ok) doLeave();
      return;
    }

    Alert.alert(t("room.leaveConfirmTitle"), t("room.leaveConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.leave"),
        style: "destructive",
        onPress: () => doLeave(),
      },
    ]);
  }

  async function closeInvite() {
    if (!userId || !activity) return;
    if (!isCreator) {
      Alert.alert(
        t("room.closeNotAllowedTitle"),
        t("room.closeNotAllowedBody")
      );
      return;
    }
    if (roomState.isReadOnly) return;

    const ok =
      Platform.OS === "web"
        ? globalThis.confirm?.(
            `${t("room.closeConfirmTitle")}\n\n${t("room.closeConfirmBody")}`
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              t("room.closeConfirmTitle"),
              t("room.closeConfirmBody"),
              [
                {
                  text: t("common.cancel"),
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: t("common.close"),
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ]
            );
          });

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
      Alert.alert(t("room.closeFailedTitle"), e?.message ?? "Unknown error");
    }
  }

  async function sendChat(text: string) {
    if (!userId) return;
    if (!canInteract) {
      Alert.alert(t("room.readOnlyAlertTitle"), t("room.readOnlyAlertBody"));
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
      Alert.alert(t("room.sendFailedTitle"), friendlyDbError(t, error.message));
    else {
      setMessage("");
      await loadAll(userId);
      scrollToBottom(true);
    }
  }

  async function sendQuick(code: string) {
    if (!userId) return;
    if (!canInteract) {
      Alert.alert(t("room.readOnlyAlertTitle"), t("room.readOnlyAlertBody"));
      return;
    }

    const { error } = await backend.roomEvents.insertRoomEvent({
      activity_id: activityId,
      user_id: userId,
      type: "quick",
      content: code,
    });

    if (error)
      Alert.alert(t("room.failedTitle"), friendlyDbError(t, error.message));
    else {
      await loadAll(userId);
      scrollToBottom(true);
    }
  }

  const placeName =
    (activity?.place_name ?? activity?.place_text ?? "").trim() ||
    t("activityCard.place_none");
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

    for (const e of ordered) {
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

    return items;
  }, [events, i18n.language, t]);

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
        Alert.alert(
          t("room.clipboard.copiedTitle"),
          t("room.clipboard.copiedBody")
        );
      } catch {
        Alert.alert(
          t("room.clipboard.copyFailedTitle"),
          t("room.clipboard.copyFailedBody")
        );
      }
      return;
    }

    // Native placeholder (so you can test UX now without adding deps)
    // If you want real native copy, tell me and I’ll add expo-clipboard cleanly.
    Alert.alert(
      t("room.clipboard.nativePlaceholderTitle"),
      t("room.clipboard.nativePlaceholderBody")
    );
  }

  function reportMessage(_e: RoomEventRow) {
    Alert.alert(
      t("room.clipboard.reportPlaceholderTitle"),
      t("room.clipboard.reportPlaceholderBody")
    );
  }

  function renderChatItem({ item }: { item: ChatItem }) {
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
      <View style={{ flex: 1, padding: space.lg, gap: space.md }}>
        {/* Header */}
        <BCard c={c}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: space.md,
            }}
          >
            <View style={{ flex: 1, gap: space.xs, paddingRight: 6 }}>
              <BText c={c} v="h2" color={c.ink}>
                {activity?.title_text ?? t("room.fallbackRoomTitle")}
              </BText>

              <BText c={c} v="bodyStrong" numberOfLines={1}>
                {placeName}
              </BText>

              {placeAddress ? (
                <BText c={c} v="caption" color={c.subtext} numberOfLines={1}>
                  {placeAddress}
                </BText>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: space.sm,
                  marginTop: space.xs,
                }}
              >
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
              </View>
            </View>

            {/* Top-right controls */}
            <View style={{ gap: space.sm, alignItems: "flex-end" }}>
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
                  tone="danger"
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
            </View>
          </View>

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
        </BCard>

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
