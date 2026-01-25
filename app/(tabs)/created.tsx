import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { fetchMembershipRowsForUser } from "../../lib/activities";

// :zap: CHANGE 1: Helper to decide "active" activities.
function isActiveActivity(a: ActivityCardActivity): boolean {
  if (a.status && a.status !== "open") return false;
  if (a.expires_at) {
    const ts = new Date(a.expires_at).getTime();
    if (!Number.isNaN(ts) && ts <= Date.now()) return false;
  }
  return true;
}

// :zap: CHANGE 1: Created = activities.creator_id = me
export default function CreatedScreen() {
  const router = useRouter();

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

    const TabButton = ({
      value,
      label,
    }: {
      value: "active" | "inactive";
      label: string;
    }) => {
      const selected = tab === value;
      return (
        <Pressable
          onPress={() => setTab(value)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            opacity: selected ? 1 : 0.6,
          }}
        >
          <Text style={{ fontWeight: "800" }}>{label}</Text>
        </Pressable>
      );
    };

    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Created</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TabButton value="active" label={`Active (${activeCount})`} />
          <TabButton value="inactive" label={`Inactive (${inactiveCount})`} />
        </View>

        <Text style={{ opacity: 0.7 }}>
          {tab === "active"
            ? "Showing active invites you created."
            : "Showing expired/closed invites you created."}
        </Text>
      </View>
    );
  }, [tab, activeItems.length, inactiveItems.length]);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Loading...</Text>
      </View>
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
          <Text style={{ opacity: 0.8 }}>
            You haven’t posted any invites yet.
          </Text>
        </View>
      }
    />
  );
}
