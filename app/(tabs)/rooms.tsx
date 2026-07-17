import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { listLayout, rowEntering, useSeenRows } from "../../lib/ui/listMotion";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { layout, space } from "../../src/ui/theme/uikit";
import {
  BAppBar,
  BButton,
  BText,
  BToggle,
  PaperTexture,
} from "../../src/ui/components/brutal";

import { ConversationRow } from "../../components/ConversationRow";
import type { ActivityCardActivity } from "../../lib/domain/activities";
import { isActiveActivity } from "../../lib/domain/activities";
import { isAuthMissingError, requireUserId } from "../../lib/domain/auth";
import {
  getCreatedPage,
  getJoinedPage,
  getMembershipForUser,
} from "../../lib/repo/activities_repo";
import {
  getRoomSummaries,
  type RoomSummary,
} from "../../lib/repo/room_summaries";
import { getLastReadMap } from "../../lib/domain/reads";
import { subscribeToJoinedActivityChanges } from "../../lib/realtime/activities";
import { useT } from "../../lib/i18n/useT";
import { handleError } from "../../lib/ui/handleError";

// Combined "Rooms": every room you're part of — the ones you host (created) and
// the ones you joined — in one list, sorted by most recent message. Host rooms
// carry a gold crown; a Role filter (All / Hosting / Joined) and a Status filter
// (Active / Past) narrow it down. Replaces the separate Lobby + Created tabs.
type Role = "all" | "hosting" | "joined";
type Row = { activity: ActivityCardActivity; isHost: boolean; left: boolean };

const PAGE = 50;

export default function RoomsScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const markSeen = useSeenRows();

  const [userId, setUserId] = useState<string | null>(null);
  const [hosted, setHosted] = useState<ActivityCardActivity[]>([]);
  const [joined, setJoined] = useState<ActivityCardActivity[]>([]);
  const [leftIds, setLeftIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<Record<string, RoomSummary>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<Role>("all");
  const [showPast, setShowPast] = useState(false);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInitial = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await getMembershipForUser(uid);
    const nonCreator = memberships.filter((m) => m.role !== "creator");
    setLeftIds(
      new Set(
        nonCreator.filter((m) => m.state === "left").map((m) => m.activity_id)
      )
    );
    const jIds = nonCreator.map((m) => m.activity_id);
    setJoinedIds(jIds);

    const createdPage = await getCreatedPage({
      userId: uid,
      cursor: null,
      limit: PAGE,
    });
    setHosted(createdPage.rows);

    if (jIds.length) {
      const joinedPage = await getJoinedPage({
        activityIds: jIds,
        cursor: null,
        limit: PAGE,
        excludeCreatorId: uid,
      });
      setJoined(joinedPage.rows);
    } else {
      setJoined([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        if (isAuthMissingError(e)) {
          router.replace("/login");
          return;
        }
        handleError(t("rooms.loadErrorTitle"), e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadInitial, router]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      loadInitial().catch((e: any) =>
        handleError(t("rooms.refreshErrorTitle"), e)
      );
    }, [loadInitial, loading, t])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e: any) {
      handleError(t("rooms.refreshErrorTitle"), e);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial, t]);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      void loadInitial().catch((e: any) =>
        handleError(t("rooms.refreshErrorTitle"), e)
      );
      reloadTimerRef.current = null;
    }, 250);
  }, [loadInitial, t]);

  // Realtime: reload when a joined room's membership/activity changes.
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToJoinedActivityChanges(
      userId,
      new Set(joinedIds),
      () => scheduleReload()
    );
    return () => {
      unsub();
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [userId, joinedIds, scheduleReload]);

  // All rooms, tagged host/joined + left. (Hosted and joined are disjoint by
  // construction, but dedup defensively.)
  const allRows = useMemo<Row[]>(() => {
    const rows: Row[] = [];
    for (const a of hosted)
      rows.push({ activity: a, isHost: true, left: false });
    for (const a of joined)
      rows.push({ activity: a, isHost: false, left: leftIds.has(a.id) });
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (seen.has(r.activity.id)) return false;
      seen.add(r.activity.id);
      return true;
    });
  }, [hosted, joined, leftIds]);

  // Conversation summaries (last message + unread) for every room.
  useEffect(() => {
    if (!userId || allRows.length === 0) return;
    let alive = true;
    (async () => {
      const ids = allRows.map((r) => r.activity.id);
      const since = await getLastReadMap(userId);
      const sums = await getRoomSummaries({
        activityIds: ids,
        meId: userId,
        since,
      });
      if (alive) setSummaries(sums);
    })();
    return () => {
      alive = false;
    };
  }, [userId, allRows]);

  const lastTs = useCallback(
    (r: Row) => {
      const lm = summaries[r.activity.id]?.lastMessage?.event?.created_at;
      return new Date(lm ?? r.activity.created_at ?? 0).getTime();
    },
    [summaries]
  );

  // Filter by Role, sort by most recent activity. Active rooms show by default;
  // "past" (expired / closed / left) fold under a "Show past" link.
  const { shown, pastCount } = useMemo(() => {
    let rows = allRows;
    if (role === "hosting") rows = rows.filter((r) => r.isHost);
    else if (role === "joined") rows = rows.filter((r) => !r.isHost);
    const isLive = (r: Row) => isActiveActivity(r.activity) && !r.left;
    const byRecent = (a: Row, b: Row) => lastTs(b) - lastTs(a);
    const active = rows.filter(isLive).sort(byRecent);
    const past = rows.filter((r) => !isLive(r)).sort(byRecent);
    return {
      shown: showPast ? [...active, ...past] : active,
      pastCount: past.length,
    };
  }, [allRows, role, showPast, lastTs]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <PaperTexture opacity={0.06} />
        <SafeAreaView
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          edges={["top"]}
        >
          <ActivityIndicator color={c.brand} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperTexture opacity={0.06} />
      <BAppBar
        c={c}
        title={t("rooms.headerTitle")}
        right={
          <BToggle<Role>
            c={c}
            value={role}
            onChange={setRole}
            options={[
              { value: "all", label: t("rooms.role_all") },
              { value: "hosting", label: t("rooms.role_hosting") },
              { value: "joined", label: t("rooms.role_joined") },
            ]}
          />
        }
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
        <Animated.FlatList
          data={shown}
          keyExtractor={(r: Row) => r.activity.id}
          itemLayoutAnimation={listLayout}
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: layout.maxContentWidth,
            alignSelf: "center",
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: space.xxl,
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          initialNumToRender={8}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews={false}
          renderItem={({ item, index }: { item: Row; index: number }) => (
            <Animated.View
              style={{ marginBottom: space.sm }}
              entering={
                markSeen(item.activity.id) ? rowEntering(index) : undefined
              }
            >
              <ConversationRow
                c={c}
                activity={item.activity}
                summary={summaries[item.activity.id]}
                userId={userId}
                isHost={item.isHost}
                onEditPress={
                  item.isHost
                    ? () => router.push(`/edit/${item.activity.id}`)
                    : undefined
                }
                onPress={() => router.push(`/room/${item.activity.id}`)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                gap: space.md,
                paddingTop: space.xxl,
              }}
            >
              <BText c={c} color={c.subtext}>
                {t("rooms.empty")}
              </BText>
              <BButton
                c={c}
                tone="primary"
                label={t("rooms.empty_cta")}
                onPress={() => router.push("/(tabs)/browse")}
              />
            </View>
          }
          ListFooterComponent={
            pastCount > 0 ? (
              <Pressable
                onPress={() => setShowPast((v) => !v)}
                style={{ paddingVertical: space.lg, alignItems: "center" }}
              >
                <BText c={c} v="label" color={c.subtext}>
                  {showPast
                    ? t("rooms.hide_past")
                    : t("rooms.show_past", { count: pastCount })}
                </BText>
              </Pressable>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}
