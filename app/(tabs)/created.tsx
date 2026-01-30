import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/domain/auth";
import {
  fetchCreatedActivities,
  fetchMembershipRowsForUser,
  isActiveActivity,
} from "../../lib/domain/activities";
import { useT } from "../../lib/i18n/useT";
import { Screen, SegmentedTabs } from "../../src/ui/common";

// :zap: CHANGE 1: Created = activities.creator_id = me
export default function CreatedScreen() {
  const router = useRouter();
  const { t } = useT();

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  // :zap: CHANGE 3: Simple tabs state.
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
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

    const rows = await fetchCreatedActivities(uid, 200);
    setItems(rows);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        console.error(e);
        Alert.alert(t("created.loadErrorTitle"), e?.message ?? "Unknown error");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [load, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        t("created.refreshErrorTitle"),
        e?.message ?? "Unknown error"
      );
    } finally {
      setRefreshing(false);
    }
  }, [load]);

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
          <Text style={{ opacity: 0.8 }}>{t("created.empty")}</Text>
        </View>
      }
    />
  );
}
