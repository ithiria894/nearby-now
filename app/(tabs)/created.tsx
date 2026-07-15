import { useCallback, useEffect, useMemo, useState } from "react";
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

import { ConversationRow } from "../../components/ConversationRow";
import type { ActivityCardActivity } from "../../lib/domain/activities";
import { isAuthMissingError, requireUserId } from "../../lib/domain/auth";
import {
  getCreatedPage,
  getMembershipForUser,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import {
  getRoomSummaries,
  type RoomSummary,
} from "../../lib/repo/room_summaries";
import { getLastReadMap } from "../../lib/domain/reads";
import { isActiveActivity } from "../../lib/domain/activities";
import { useT } from "../../lib/i18n/useT";
import { handleError } from "../../lib/ui/handleError";

// :zap: CHANGE 1: Created = activities.creator_id = me
export default function CreatedScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();

  const PAGE_SIZE = 30;

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  // :zap: CHANGE 3: Simple tabs state.
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<ActivitiesPage["cursor"]>(null);
  const [hasMore, setHasMore] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, RoomSummary>>({});

  const loadInitial = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await getMembershipForUser(uid);
    setJoinedSet(
      new Set(
        memberships
          .filter((m) => m.state === "joined")
          .map((m) => m.activity_id)
      )
    );

    const page = await getCreatedPage({
      userId: uid,
      cursor: null,
      limit: PAGE_SIZE,
    });
    setItems(page.rows);
    setCursor(page.cursor);
    setHasMore(page.hasMore);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !userId) return;
    setLoadingMore(true);
    try {
      const page = await getCreatedPage({
        userId,
        cursor,
        limit: PAGE_SIZE,
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
      handleError(t("created.refreshErrorTitle"), e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, t, userId]);

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        if (isAuthMissingError(e)) {
          router.replace("/login");
          return;
        }
        handleError(t("created.loadErrorTitle"), e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadInitial, router]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      loadInitial().catch((e: any) => {
        handleError(t("created.refreshErrorTitle"), e);
      });
    }, [loadInitial, loading, t])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e: any) {
      handleError(t("created.refreshErrorTitle"), e);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

  // Conversation summaries (last message + unread count) for loaded rooms.
  // Re-runs on item changes, including focus after reading a room.
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
        title={t("created.headerTitle")}
        right={
          <BToggle<"active" | "inactive">
            c={c}
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "active",
                label: t("created.tab_active", { count: activeItems.length }),
              },
              {
                value: "inactive",
                label: t("created.tab_inactive", {
                  count: inactiveItems.length,
                }),
              },
            ]}
          />
        }
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
        <FlatList
          data={dataToShow}
          keyExtractor={(x) => x.id}
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
          renderItem={({ item }) => (
            <View style={{ marginBottom: space.sm }}>
              <ConversationRow
                c={c}
                activity={item}
                summary={summaries[item.id]}
                userId={userId}
                onPress={() => router.push(`/room/${item.id}`)}
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
                {t("created.empty")}
              </BText>
              <BButton
                c={c}
                tone="primary"
                label={t("created.empty_cta")}
                onPress={() => router.push("/create")}
              />
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
