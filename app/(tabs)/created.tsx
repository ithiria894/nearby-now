import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { fetchMembershipRowsForUser } from "../../lib/activities";

// :zap: CHANGE 1: Created = activities.creator_id = me
export default function CreatedScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
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

    const { data, error } = await supabase
      .from("activities")
      .select(
        "id, creator_id, title_text, place_text, expires_at, gender_pref, capacity, status, created_at"
      )
      .eq("creator_id", uid)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    setItems((data ?? []) as ActivityCardActivity[]);
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
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Created</Text>
        <Text style={{ opacity: 0.7 }}>
          Invites you posted (you can edit them).
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
            membershipState={joinedSet.has(item.id) ? "joined" : "none"}
            isJoining={false}
            onPressCard={() => router.push(`/room/${item.id}`)}
            onPressEdit={() => router.push(`/edit/${item.id}`)}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ opacity: 0.8 }}>
            You haven’t posted any invites yet.
          </Text>
        </View>
      }
    />
  );
}
