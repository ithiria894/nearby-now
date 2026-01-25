import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/auth";
import {
  fetchMembershipRowsForUser,
  fetchActivitiesByIds,
} from "../../lib/activities";

// :zap: CHANGE 1: History = membership state=left, allow re-join
export default function HistoryScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await fetchMembershipRowsForUser(uid);
    const leftIds = memberships
      .filter((m) => m.state === "left")
      .map((m) => m.activity_id);

    const activities = await fetchActivitiesByIds(leftIds);
    setItems(activities);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        console.error(e);
        Alert.alert("Load failed", e?.message ?? "Unknown error");
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
      Alert.alert("Refresh failed", e?.message ?? "Unknown error");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const header = useMemo(() => {
    return (
      <View style={{ padding: 16, gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>History</Text>
        <Text style={{ opacity: 0.7 }}>
          Rooms you left before. Tap to re-join and see past messages again.
        </Text>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Loading...</Text>
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
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          <ActivityCard
            activity={item}
            currentUserId={userId}
            membershipState="left"
            isJoining={false}
            onPressCard={() => router.push(`/room/${item.id}`)}
            onPressEdit={
              item.creator_id === userId
                ? () => router.push(`/edit/${item.id}`)
                : undefined
            }
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ opacity: 0.8 }}>No left rooms yet.</Text>
        </View>
      }
    />
  );
}
