import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActivityCard, {
  type ActivityCardActivity,
  type MembershipState,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/domain/auth";
import {
  getJoinedPage,
  getMembershipForUser,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import { isActiveActivity } from "../../lib/domain/activities";
import { subscribeToJoinedActivityChanges } from "../../lib/realtime/activities";
import { useT } from "../../lib/i18n/useT";
import { Screen, SegmentedTabs, PrimaryButton } from "../../src/ui/common";
import { handleError } from "../../lib/ui/handleError";

export default function JoinedScreen() {
  const router = useRouter();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 64;
  const TAB_BOTTOM = 8 + insets.bottom;
  const tabBarSpace = 0;

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
        handleError(t("joined.loadErrorTitle"), e);
        router.replace("/login");
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

  // :zap: CHANGE 4: Header tabs UI (Active / Inactive / Left).
  const header = useMemo(() => {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          {t("joined.headerTitle")}
        </Text>

        <SegmentedTabs
          value={tab}
          onChange={setTab}
          items={[
            {
              value: "active",
              label: t("joined.tab_active", { count: activeJoined.length }),
            },
            {
              value: "inactive",
              label: t("joined.tab_inactive", { count: inactiveJoined.length }),
            },
            {
              value: "left",
              label: t("joined.tab_left", { count: leftRooms.length }),
            },
          ]}
        />

        <Text style={{ opacity: 0.7 }}>
          {tab === "active" && t("joined.subtitle_active")}
          {tab === "inactive" && t("joined.subtitle_inactive")}
          {tab === "left" && t("joined.subtitle_left")}
        </Text>
      </View>
    );
  }, [tab, activeJoined.length, inactiveJoined.length, leftRooms.length, t]);

  if (loading) {
    return (
      <Screen>
        <Text>{t("common.loading")}</Text>
      </Screen>
    );
  }

  return (
    <FlatList
      data={dataToShow}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: tabBarSpace }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      initialNumToRender={6}
      windowSize={5}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
      renderItem={({ item: a }) => {
        const membershipState: MembershipState =
          tab === "left" ? "left" : "joined";

        return (
          <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            <ActivityCard
              activity={a}
              currentUserId={userId}
              membershipState={membershipState}
              isJoining={false}
              onPressCard={() => router.push(`/room/${a.id}`)}
              onPressEdit={
                a.creator_id === userId
                  ? () => router.push(`/edit/${a.id}`)
                  : undefined
              }
            />
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 10 }}>
          <Text style={{ opacity: 0.8 }}>
            {tab === "active" && t("joined.empty_active")}
            {tab === "inactive" && t("joined.empty_inactive")}
            {tab === "left" && t("joined.empty_left")}
          </Text>
          {tab === "active" ? (
            <PrimaryButton
              label={t("joined.empty_active_cta")}
              onPress={() => router.push("/(tabs)/browse")}
            />
          ) : null}
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : !hasMore && items.length > 0 ? (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ textAlign: "center", opacity: 0.6 }}>
              {t("common.noMore")}
            </Text>
          </View>
        ) : null
      }
    />
  );
}
