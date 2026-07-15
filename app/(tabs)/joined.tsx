import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { layout, space } from "../../src/ui/theme/uikit";
import {
  BAppBar,
  BButton,
  BText,
  BToggle,
  PaperTexture,
} from "../../src/ui/components/brutal";

import { type MembershipState } from "../../components/ActivityCard";
import { ConversationRow } from "../../components/ConversationRow";
import type { ActivityCardActivity } from "../../lib/domain/activities";
import { isAuthMissingError, requireUserId } from "../../lib/domain/auth";
import {
  getJoinedPage,
  getMembershipForUser,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import {
  getRoomSummaries,
  type RoomSummary,
} from "../../lib/repo/room_summaries";
import { getLastReadMap } from "../../lib/domain/reads";
import { isActiveActivity } from "../../lib/domain/activities";
import { subscribeToJoinedActivityChanges } from "../../lib/realtime/activities";
import { useT } from "../../lib/i18n/useT";
import { handleError } from "../../lib/ui/handleError";

export default function JoinedScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();

  const PAGE_SIZE = 30;

  const [userId, setUserId] = useState<string | null>(null);
  // :zap: CHANGE 1: Tabs instead of Active-only switch.
  const [tab, setTab] = useState<"active" | "inactive" | "left">("active");
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  const [membershipById, setMembershipById] = useState<
    Map<string, MembershipState>
  >(new Map());
  const [membershipIds, setMembershipIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<ActivitiesPage["cursor"]>(null);
  const [hasMore, setHasMore] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, RoomSummary>>({});

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInitial = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await getMembershipForUser(uid);
    const relevant = memberships.filter((m) => m.role !== "creator");

    const map = new Map<string, MembershipState>();
    for (const m of relevant) {
      map.set(m.activity_id, m.state === "left" ? "left" : "joined");
    }
    setMembershipById(map);

    const ids = relevant.map((m) => m.activity_id);
    setMembershipIds(ids);
    const page = await getJoinedPage({
      activityIds: ids,
      cursor: null,
      limit: PAGE_SIZE,
      excludeCreatorId: uid,
    });
    setItems(page.rows);
    setCursor(page.cursor);
    setHasMore(page.hasMore);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || membershipIds.length === 0 || !userId)
      return;
    setLoadingMore(true);
    try {
      const page = await getJoinedPage({
        activityIds: membershipIds,
        cursor,
        limit: PAGE_SIZE,
        excludeCreatorId: userId,
      });
      if (page.rows.length === 0) {
        setHasMore(false);
        return;
      }
      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.id, x]));
        for (const a of page.rows) map.set(a.id, a);
        const arr = Array.from(map.values());
        arr.sort((a, b) => {
          const ta = new Date(a.created_at ?? 0).getTime();
          const tb = new Date(b.created_at ?? 0).getTime();
          if (tb !== ta) return tb - ta;
          return String(b.id).localeCompare(String(a.id));
        });
        return arr;
      });
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (e: any) {
      handleError(t("joined.refreshErrorTitle"), e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, membershipIds, t, userId]);

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        if (isAuthMissingError(e)) {
          router.replace("/login");
          return;
        }
        handleError(t("joined.loadErrorTitle"), e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadInitial, router]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      loadInitial().catch((e: any) => {
        handleError(t("joined.refreshErrorTitle"), e);
      });
    }, [loadInitial, loading, t])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e: any) {
      handleError(t("joined.refreshErrorTitle"), e);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      void loadInitial().catch((e: any) =>
        handleError(t("joined.refreshErrorTitle"), e)
      );
      reloadTimerRef.current = null;
    }, 250);
  }, [loadInitial, t]);

  // :zap: CHANGE 3: Realtime updates (membership + activities).
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToJoinedActivityChanges(
      userId,
      new Set(membershipIds),
      () => scheduleReload()
    );

    return () => {
      unsubscribe();
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [userId, membershipIds, scheduleReload]);

  // Conversation summaries (last message + unread count) for the loaded rooms.
  // Re-runs whenever the item set changes — including on focus after reading a
  // room, which is when the unread watermark has just advanced.
  useEffect(() => {
    if (!userId || items.length === 0) return;
    let alive = true;
    (async () => {
      const ids = items.map((a) => a.id);
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
  }, [userId, items]);

  // :zap: CHANGE 2: Split joined into Active / Inactive / Left lists.
  const { activeJoined, inactiveJoined, leftRooms } = useMemo(() => {
    const withState = items.map((a) => ({
      activity: a,
      state: membershipById.get(a.id) ?? "none",
    }));

    const active = withState
      .filter((x) => x.state === "joined" && isActiveActivity(x.activity))
      .map((x) => x.activity);

    const inactive = withState
      .filter((x) => x.state === "joined" && !isActiveActivity(x.activity))
      .map((x) => x.activity);

    const left = withState
      .filter((x) => x.state === "left")
      .map((x) => x.activity);

    return { activeJoined: active, inactiveJoined: inactive, leftRooms: left };
  }, [items, membershipById]);

  // :zap: CHANGE 3: The list to show depends on the selected tab.
  const dataToShow = useMemo(() => {
    if (tab === "active") return activeJoined;
    if (tab === "inactive") return inactiveJoined;
    return leftRooms;
  }, [tab, activeJoined, inactiveJoined, leftRooms]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <PaperTexture opacity={0.06} />
        <SafeAreaView
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          edges={["top"]}
        >
          <BText c={c} color={c.subtext}>
            {t("common.loading")}
          </BText>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperTexture opacity={0.06} />
      <BAppBar
        c={c}
        title={t("joined.headerTitle")}
        right={
          <BToggle<"active" | "inactive" | "left">
            c={c}
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "active",
                label: t("joined.tab_active", { count: activeJoined.length }),
              },
              {
                value: "inactive",
                label: t("joined.tab_inactive", {
                  count: inactiveJoined.length,
                }),
              },
              {
                value: "left",
                label: t("joined.tab_left", { count: leftRooms.length }),
              },
            ]}
          />
        }
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
        <FlatList
          data={dataToShow}
          keyExtractor={(a) => a.id}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          initialNumToRender={6}
          windowSize={5}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          renderItem={({ item: a }) => (
            <View style={{ marginBottom: space.sm }}>
              <ConversationRow
                c={c}
                activity={a}
                summary={summaries[a.id]}
                userId={userId}
                onPress={() => router.push(`/room/${a.id}`)}
              />
            </View>
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
                {tab === "active" && t("joined.empty_active")}
                {tab === "inactive" && t("joined.empty_inactive")}
                {tab === "left" && t("joined.empty_left")}
              </BText>
              {tab === "active" ? (
                <BButton
                  c={c}
                  tone="primary"
                  label={t("joined.empty_active_cta")}
                  onPress={() => router.push("/(tabs)/browse")}
                />
              ) : null}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: space.md, alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            ) : !hasMore && items.length > 0 ? (
              <View style={{ paddingVertical: space.md, alignItems: "center" }}>
                <BText c={c} color={c.subtext}>
                  {t("common.noMore")}
                </BText>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}
