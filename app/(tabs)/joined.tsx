import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import ActivityCard, {
  type ActivityCardActivity,
  type MembershipState,
} from "../../components/ActivityCard";
import { requireUserId } from "../../lib/auth";
import {
  fetchMembershipRowsForUser,
  fetchActivitiesByIds,
} from "../../lib/activities";
import { supabase } from "../../lib/supabase";

function isActive(a: ActivityCardActivity): boolean {
  if (a.status !== "open") return false;
  if (a.expires_at && new Date(a.expires_at).getTime() <= Date.now())
    return false;
  return true;
}

export default function JoinedScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  // :zap: CHANGE 1: Tabs instead of Active-only switch.
  const [tab, setTab] = useState<"active" | "inactive" | "left">("active");
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  const [membershipById, setMembershipById] = useState<
    Map<string, MembershipState>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await fetchMembershipRowsForUser(uid);
    const relevant = memberships.filter((m) => m.role !== "creator");

    const map = new Map<string, MembershipState>();
    for (const m of relevant) {
      map.set(m.activity_id, m.state === "left" ? "left" : "joined");
    }
    setMembershipById(map);

    const ids = relevant.map((m) => m.activity_id);
    const activities = await fetchActivitiesByIds(ids);
    // :zap: CHANGE 2: hard-exclude anything I created (even if role is wrong).
    const notMine = activities.filter((a) => a.creator_id !== uid);
    setItems(notMine);
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

  // :zap: CHANGE 3: Realtime updates (membership + activities).
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("joined-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_members",
          filter: `user_id=eq.${userId}`,
        },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  // :zap: CHANGE 2: Split joined into Active / Inactive / Left lists.
  const { activeJoined, inactiveJoined, leftRooms } = useMemo(() => {
    const withState = items.map((a) => ({
      activity: a,
      state: membershipById.get(a.id) ?? "none",
    }));

    const active = withState
      .filter((x) => x.state === "joined" && isActive(x.activity))
      .map((x) => x.activity);

    const inactive = withState
      .filter((x) => x.state === "joined" && !isActive(x.activity))
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
    const TabButton = ({
      value,
      label,
    }: {
      value: "active" | "inactive" | "left";
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
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Joined</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TabButton value="active" label={`Active (${activeJoined.length})`} />
          <TabButton
            value="inactive"
            label={`Inactive (${inactiveJoined.length})`}
          />
          <TabButton value="left" label={`Left (${leftRooms.length})`} />
        </View>

        <Text style={{ opacity: 0.7 }}>
          {tab === "active" && "Showing active rooms you joined."}
          {tab === "inactive" && "Showing closed/expired rooms you joined."}
          {tab === "left" && "Showing rooms you left (history view only)."}
        </Text>
      </View>
    );
  }, [tab, activeJoined.length, inactiveJoined.length, leftRooms.length]);

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
      keyExtractor={(a) => a.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 16 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
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
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ opacity: 0.8 }}>
            {tab === "active" && "No active joined rooms."}
            {tab === "inactive" && "No inactive joined rooms."}
            {tab === "left" && "No left rooms."}
          </Text>
        </View>
      }
    />
  );
}
