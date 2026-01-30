import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/domain/auth";
import {
  fetchCreatedActivitiesPage,
  fetchMembershipRowsForUser,
  isActiveActivity,
  type ActivityCursor,
} from "../../lib/domain/activities";
import { useT } from "../../lib/i18n/useT";
import { Screen, SegmentedTabs, PrimaryButton } from "../../src/ui/common";

// :zap: CHANGE 1: Created = activities.creator_id = me
export default function CreatedScreen() {
  const router = useRouter();
  const { t } = useT();

  const PAGE_SIZE = 30;

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  // :zap: CHANGE 3: Simple tabs state.
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<ActivityCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await fetchMembershipRowsForUser(uid);
    setJoinedSet(
      new Set(
        memberships
          .filter((m) => m.state === "joined")
          .map((m) => m.activity_id)
      )
    );

    const rows = await fetchCreatedActivitiesPage(uid, null, PAGE_SIZE);
    setItems(rows);
    const last = rows[rows.length - 1];
    const nextCursor =
      rows.length > 0 && last?.created_at
        ? { created_at: last.created_at, id: last.id }
        : null;
    setCursor(nextCursor);
    setHasMore(rows.length === PAGE_SIZE);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !userId) return;
    setLoadingMore(true);
    try {
      const rows = await fetchCreatedActivitiesPage(userId, cursor, PAGE_SIZE);
      if (rows.length === 0) {
        setHasMore(false);
        return;
      }
      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.id, x]));
        for (const a of rows) map.set(a.id, a);
        const arr = Array.from(map.values());
        arr.sort((a, b) => {
          const ta = new Date(a.created_at ?? 0).getTime();
          const tb = new Date(b.created_at ?? 0).getTime();
          if (tb !== ta) return tb - ta;
          return String(b.id).localeCompare(String(a.id));
        });
        return arr;
      });
      const last = rows[rows.length - 1];
      const nextCursor =
        rows.length > 0 && last?.created_at
          ? { created_at: last.created_at, id: last.id }
          : null;
      setCursor(nextCursor);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        t("created.refreshErrorTitle"),
        e?.message ?? "Unknown error"
      );
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, t, userId]);

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        console.error(e);
        Alert.alert(t("created.loadErrorTitle"), e?.message ?? "Unknown error");
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
        console.error(e);
        Alert.alert(
          t("created.refreshErrorTitle"),
          e?.message ?? "Unknown error"
        );
      });
    }, [loadInitial, loading, t])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        t("created.refreshErrorTitle"),
        e?.message ?? "Unknown error"
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

  // :zap: CHANGE 2: Split items into active/inactive.
  const { activeItems, inactiveItems } = useMemo(() => {
    const active: ActivityCardActivity[] = [];
    const inactive: ActivityCardActivity[] = [];

    for (const a of items) {
      (isActiveActivity(a) ? active : inactive).push(a);
    }

    return { activeItems: active, inactiveItems: inactive };
  }, [items]);

  const dataToShow = tab === "active" ? activeItems : inactiveItems;

  const header = useMemo(() => {
    const activeCount = activeItems.length;
    const inactiveCount = inactiveItems.length;

    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          {t("created.headerTitle")}
        </Text>

        <SegmentedTabs
          value={tab}
          onChange={setTab}
          items={[
            {
              value: "active",
              label: t("created.tab_active", { count: activeCount }),
            },
            {
              value: "inactive",
              label: t("created.tab_inactive", { count: inactiveCount }),
            },
          ]}
        />

        <Text style={{ opacity: 0.7 }}>
          {tab === "active"
            ? t("created.subtitle_active")
            : t("created.subtitle_inactive")}
        </Text>
      </View>
    );
  }, [tab, activeItems.length, inactiveItems.length, t]);

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
      keyExtractor={(x) => x.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 16 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      initialNumToRender={6}
      windowSize={5}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          <ActivityCard
            activity={item}
            currentUserId={userId}
            membershipState={joinedSet.has(item.id) ? "joined" : "none"}
            isJoining={false}
            onPressCard={() => router.push(`/room/${item.id}`)}
            onPressEdit={() => router.push(`/edit/${item.id}`)}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 10 }}>
          <Text style={{ opacity: 0.8 }}>{t("created.empty")}</Text>
          <PrimaryButton
            label={t("created.empty_cta")}
            onPress={() => router.push("/create")}
          />
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
