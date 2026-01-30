import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import BrowseMap from "../../components/BrowseMap";
import { requireUserId } from "../../lib/domain/auth";
import {
  getBrowsePage,
  getMembershipForUser,
  joinActivity,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import { isJoinableActivity } from "../../lib/domain/activities";
import { subscribeToBrowseActivities } from "../../lib/realtime/activities";
import { useT } from "../../lib/i18n/useT";
import {
  formatCapacity,
  formatGenderPref,
  formatLocalDateTime,
} from "../../lib/i18n/i18n_format";
import { Screen, SegmentedTabs, PrimaryButton } from "../../src/ui/common";
import { useTheme } from "../../src/ui/theme/ThemeProvider";
import { handleError } from "../../lib/ui/handleError";

// :zap: CHANGE 1: Browse = joinable open + not expired + not joined
export default function BrowseScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();

  const PAGE_SIZE = 30;

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<ActivitiesPage["cursor"]>(null);
  const [hasMore, setHasMore] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const loadInitial = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await getMembershipForUser(uid);
    const joined = new Set(
      memberships.filter((m) => m.state === "joined").map((m) => m.activity_id)
    );
    setJoinedSet(joined);

    const page = await getBrowsePage({
      cursor: null,
      limit: PAGE_SIZE,
      joinedSet: joined,
    });

    setItems(page.rows);
    setCursor(page.cursor);
    setHasMore(page.hasMore);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await getBrowsePage({
        cursor,
        limit: PAGE_SIZE,
        joinedSet,
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
      handleError(t("browse.refreshErrorTitle"), e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, joinedSet, loadingMore, t]);

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        handleError(t("browse.loadErrorTitle"), e);
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
        handleError(t("browse.refreshErrorTitle"), e);
      });
    }, [loadInitial, loading, t])
  );

  // :zap: CHANGE 9: Realtime updates for Browse list.
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToBrowseActivities((payload) => {
      const next = (payload.new ?? null) as ActivityCardActivity | null;
      const old = (payload.old ?? null) as ActivityCardActivity | null;

      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.id, x]));

        if (payload.eventType === "DELETE") {
          if (old?.id) map.delete(old.id);
          return Array.from(map.values());
        }

        if (!next?.id) return prev;

        const shouldShow = isJoinableActivity(next, joinedSet);

        if (!shouldShow) {
          map.delete(next.id);
        } else {
          map.set(next.id, next);
        }

        const arr = Array.from(map.values());
        arr.sort((a, b) => {
          const ta = new Date(a.created_at ?? 0).getTime();
          const tb = new Date(b.created_at ?? 0).getTime();
          if (tb !== ta) return tb - ta;
          return String(b.id).localeCompare(String(a.id));
        });
        return arr;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userId, joinedSet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e: any) {
      handleError(t("browse.refreshErrorTitle"), e);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

  async function onPressCard(a: ActivityCardActivity) {
    if (!userId) return;
    if (joinedSet.has(a.id)) {
      router.push(`/room/${a.id}`);
      return;
    }

    const title = a.title_text;
    const placeName =
      (a.place_name ?? a.place_text ?? "").trim() || t("browse.place_none");
    const placeAddress = (a.place_address ?? "").trim();
    const expiresLabel = formatLocalDateTime(a.expires_at, t);
    const capacityLabel = formatCapacity(a.capacity, t);
    const genderPrefLabel = formatGenderPref(a.gender_pref, t);

    const confirmJoin = async () => {
      setJoiningId(a.id);
      try {
        await joinActivity(a.id, userId);
        setJoinedSet((prev) => new Set([...prev, a.id]));
        setItems((prev) => prev.filter((x) => x.id !== a.id));
        router.push(`/room/${a.id}`);
      } catch (e: any) {
        handleError(t("browse.joinErrorTitle"), e);
      } finally {
        setJoiningId(null);
      }
    };

    if (viewMode === "map") {
      const details = [
        t("browse.details.goal", { title }),
        t("browse.details.place", { placeName }),
        placeAddress ? t("browse.details.address", { placeAddress }) : null,
        t("browse.details.genderPref", { genderPref: genderPrefLabel }),
        t("browse.details.capacity", { capacityLabel }),
        t("browse.details.expires", { expiresLabel }),
      ]
        .filter(Boolean)
        .join("\n");

      Alert.alert(t("browse.mapJoinConfirmTitle"), details, [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.join"), style: "default", onPress: confirmJoin },
      ]);
      return;
    }

    Alert.alert(t("browse.joinConfirmTitle", { title }), "", [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.join"), style: "default", onPress: confirmJoin },
    ]);
  }

  const header = useMemo(() => {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          {t("browse.headerTitle")}
        </Text>
        <SegmentedTabs
          value={viewMode}
          onChange={setViewMode}
          items={[
            { value: "list", label: t("browse.mode_list") },
            { value: "map", label: t("browse.mode_map") },
          ]}
        />
        <Text style={{ opacity: 0.7 }}>{t("browse.subtitle")}</Text>
      </View>
    );
  }, [viewMode, t]);

  if (loading) {
    return (
      <Screen>
        <Text>{t("common.loading")}</Text>
      </Screen>
    );
  }

  if (viewMode === "map") {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        {header}
        <BrowseMap
          items={items}
          onPressCard={onPressCard}
          onRequestList={() => setViewMode("list")}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
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
            membershipState="none"
            isJoining={joiningId === item.id}
            onPressCard={() => onPressCard(item)}
            onPressEdit={
              item.creator_id === userId
                ? () => router.push(`/edit/${item.id}`)
                : undefined
            }
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 10 }}>
          <Text style={{ opacity: 0.8 }}>{t("browse.empty")}</Text>
          <PrimaryButton
            label={t("browse.empty_cta")}
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
