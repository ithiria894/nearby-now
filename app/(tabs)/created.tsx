import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { layout, space } from "../../src/ui/theme/uikit";
import {
  BActivityRow,
  BBadge,
  BButton,
  BChip,
  BText,
  PaperTexture,
} from "../../src/ui/components/brutal";

import type { ActivityCardActivity } from "../../lib/domain/activities";
import { isAuthMissingError, requireUserId } from "../../lib/domain/auth";
import {
  getCreatedPage,
  getMembershipForUser,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import { isActiveActivity } from "../../lib/domain/activities";
import { useT } from "../../lib/i18n/useT";
import { formatCapacity, formatExpiryLabel } from "../../lib/i18n/i18n_format";
import { activityIcon, activityTileColor } from "../../lib/ui/activityIcon";
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
    const subtitle =
      tab === "active"
        ? t("created.subtitle_active")
        : t("created.subtitle_inactive");

    return (
      <View
        style={{ paddingTop: space.md, paddingBottom: space.lg, gap: space.md }}
      >
        <View style={{ gap: space.xs }}>
          <BText c={c} v="h1">
            {t("created.headerTitle")}
          </BText>
          <BText c={c} v="caption" color={c.subtext}>
            {subtitle}
          </BText>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <Pressable onPress={() => setTab("active")}>
            <BChip
              c={c}
              label={t("created.tab_active", { count: activeCount })}
              selected={tab === "active"}
            />
          </Pressable>
          <Pressable onPress={() => setTab("inactive")}>
            <BChip
              c={c}
              label={t("created.tab_inactive", { count: inactiveCount })}
              selected={tab === "inactive"}
            />
          </Pressable>
        </View>
      </View>
    );
  }, [tab, activeItems.length, inactiveItems.length, t, c]);

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
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <FlatList
          data={dataToShow}
          keyExtractor={(x) => x.id}
          ListHeaderComponent={header}
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: layout.maxContentWidth,
            alignSelf: "center",
            paddingHorizontal: space.lg,
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
          renderItem={({ item }) => {
            const placeName = (item.place_name ?? item.place_text ?? "").trim();
            const expiryLabel = formatExpiryLabel(
              item.expires_at,
              Date.now(),
              t
            );
            const capacityLabel = formatCapacity(item.capacity, t);
            const meta = [placeName, expiryLabel, capacityLabel]
              .filter(Boolean)
              .join(" · ");
            const active = isActiveActivity(item);
            const badgeLabel = active
              ? t("created.subtitle_active")
              : t("created.subtitle_inactive");

            return (
              <View style={{ marginBottom: space.sm }}>
                <BActivityRow
                  c={c}
                  icon={activityIcon(item.title_text)}
                  iconBg={activityTileColor(item.id, [
                    c.coral,
                    c.mint,
                    c.sky,
                    c.yellow,
                    c.grape,
                    c.pink,
                  ])}
                  title={item.title_text}
                  meta={meta}
                  badges={
                    <BBadge
                      c={c}
                      label={badgeLabel}
                      fill={active ? c.mint : c.yellow}
                    />
                  }
                  onPress={() => router.push(`/room/${item.id}`)}
                />
              </View>
            );
          }}
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
