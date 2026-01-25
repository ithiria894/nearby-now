import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Switch, Text, View } from "react-native";
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

type RowItem =
  | { kind: "header"; title: string }
  | {
      kind: "card";
      activity: ActivityCardActivity;
      membershipState: MembershipState;
    };

export default function JoinedScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
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

  const viewModel = useMemo<RowItem[]>(() => {
    const withState = items.map((a) => ({
      activity: a,
      state: membershipById.get(a.id) ?? "none",
    }));

    const activeJoined = withState
      .filter((x) => x.state === "joined" && isActive(x.activity))
      .map((x) => x.activity);

    if (activeOnly) {
      return [
        { kind: "header", title: "Active" },
        ...activeJoined.map((a) => ({
          kind: "card",
          activity: a,
          membershipState: "joined" as const,
        })),
      ];
    }

    const inactiveJoined = withState
      .filter((x) => x.state === "joined" && !isActive(x.activity))
      .map((x) => x.activity);

    const leftRooms = withState
      .filter((x) => x.state === "left")
      .map((x) => x.activity);

    const rows: RowItem[] = [];
    rows.push({ kind: "header", title: "Active" });
    rows.push(
      ...activeJoined.map((a) => ({
        kind: "card",
        activity: a,
        membershipState: "joined" as const,
      }))
    );

    rows.push({ kind: "header", title: "Inactive (closed/expired)" });
    rows.push(
      ...inactiveJoined.map((a) => ({
        kind: "card",
        activity: a,
        membershipState: "joined" as const,
      }))
    );

    rows.push({ kind: "header", title: "Left rooms" });
    rows.push(
      ...leftRooms.map((a) => ({
        kind: "card",
        activity: a,
        membershipState: "left" as const,
      }))
    );

    return rows;
  }, [items, membershipById, activeOnly]);

  const header = useMemo(() => {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Joined</Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontWeight: "700" }}>Active only</Text>
          <Switch value={activeOnly} onValueChange={setActiveOnly} />
        </View>

        <Text style={{ opacity: 0.7 }}>
          {activeOnly
            ? "Showing active rooms only."
            : "Showing active + inactive + left rooms."}
        </Text>
      </View>
    );
  }, [activeOnly]);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={viewModel}
      keyExtractor={(x, idx) =>
        x.kind === "header" ? `h-${x.title}-${idx}` : x.activity.id
      }
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 16 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderItem={({ item }) => {
        if (item.kind === "header") {
          return (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 6,
              }}
            >
              <Text style={{ fontWeight: "800", opacity: 0.8 }}>
                {item.title}
              </Text>
            </View>
          );
        }

        const a = item.activity;
        const membershipState = item.membershipState;

        return (
          <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            <ActivityCard
              activity={a}
              currentUserId={userId}
              membershipState={membershipState}
              isJoining={false}
              // :zap: CHANGE 4: left rooms click = view history only.
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
            {activeOnly ? "No active joined rooms." : "No rooms."}
          </Text>
        </View>
      }
    />
  );
}
