import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../../src/ui/theme/ThemeProvider";
import { TAB_GAP, TAB_HEIGHT } from "../../src/ui/tabbar";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/domain/auth";
import {
  getCreatedPage,
  getMembershipForUser,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import { isActiveActivity } from "../../lib/domain/activities";
import { useT } from "../../lib/i18n/useT";
import {
  Screen,
  SegmentedTabs,
  PrimaryButton,
  PageTitle,
} from "../../src/ui/common";
import { handleError } from "../../lib/ui/handleError";

// :zap: CHANGE 1: Created = activities.creator_id = me
export default function CreatedScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_BOTTOM = 8 + insets.bottom;
  const tabBarSpace = TAB_HEIGHT + TAB_BOTTOM + TAB_GAP;
  const brandIconColor = theme.colors.brand;

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
        handleError(t("created.loadErrorTitle"), e);
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

    const softCardStyle = {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark
        ? theme.colors.border
        : theme.colors.brandBorder,
      backgroundColor: theme.isDark
        ? theme.colors.surface
        : theme.colors.brandSurface,
      padding: 14,
      gap: 10,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    } as const;

    return (
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.isDark
                ? theme.colors.otherBg
                : theme.colors.brandSoft,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.isDark
                ? theme.colors.border
                : theme.colors.brandBorder,
            }}
          >
            <MaterialCommunityIcons
              name="pencil-box-outline"
              size={20}
              color={brandIconColor}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <PageTitle>{t("created.headerTitle")}</PageTitle>
            <Text style={{ fontSize: 12.5, color: theme.colors.subtitleText }}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={softCardStyle}>
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
        </View>
      </View>
    );
  }, [tab, activeItems.length, inactiveItems.length, t, theme, brandIconColor]);

  if (loading) {
    return (
      <Screen>
        <Text>{t("common.loading")}</Text>
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        data={dataToShow}
        keyExtractor={(x) => x.id}
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
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.isDark
                  ? theme.colors.border
                  : theme.colors.brandBorder,
                backgroundColor: theme.isDark
                  ? theme.colors.surface
                  : theme.colors.brandSurface,
                padding: 14,
                gap: 10,
              }}
            >
              <Text style={{ opacity: 0.8 }}>{t("created.empty")}</Text>
              <PrimaryButton
                label={t("created.empty_cta")}
                onPress={() => router.push("/create")}
              />
            </View>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          ) : !hasMore && items.length > 0 ? (
            <View style={{ paddingVertical: 12 }}>
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.subtitleText,
                }}
              >
                {t("common.noMore")}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
