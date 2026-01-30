import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import BrowseMap from "../../components/BrowseMap";
import { requireUserId } from "../../lib/domain/auth";
import {
  fetchOpenActivities,
  fetchMembershipRowsForUser,
  joinWithSystemMessage,
  isJoinableActivity,
} from "../../lib/domain/activities";
import { supabase } from "../../lib/api/supabase";
import { useT } from "../../lib/i18n/useT";
import {
  formatCapacity,
  formatGenderPref,
  formatLocalDateTime,
} from "../../lib/i18n/i18n_format";
import { Screen, SegmentedTabs, PrimaryButton } from "../../src/ui/common";
import { useTheme } from "../../src/ui/theme/ThemeProvider";

// :zap: CHANGE 1: Browse = joinable open + not expired + not joined
export default function BrowseScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const load = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await fetchMembershipRowsForUser(uid);
    const joined = new Set(
      memberships.filter((m) => m.state === "joined").map((m) => m.activity_id)
    );
    setJoinedSet(joined);

    const rows = await fetchOpenActivities(200);
    const joinable = rows.filter((a) => isJoinableActivity(a, joined));

    setItems(joinable);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        console.error(e);
        Alert.alert(t("browse.loadErrorTitle"), e?.message ?? "Unknown error");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [load, router]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      load().catch((e: any) => {
        console.error(e);
        Alert.alert(
          t("browse.refreshErrorTitle"),
          e?.message ?? "Unknown error"
        );
      });
    }, [load, loading, t])
  );

  // :zap: CHANGE 9: Realtime updates for Browse list.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("browse-activities")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        (payload) => {
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
              return tb - ta;
            });
            return arr;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, joinedSet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("browse.refreshErrorTitle"), e?.message ?? "Unknown error");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

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
        await joinWithSystemMessage(a.id, userId);
        setJoinedSet((prev) => new Set([...prev, a.id]));
        setItems((prev) => prev.filter((x) => x.id !== a.id));
        router.push(`/room/${a.id}`);
      } catch (e: any) {
        console.error(e);
        Alert.alert(t("browse.joinErrorTitle"), e?.message ?? "Unknown error");
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
    />
  );
}
