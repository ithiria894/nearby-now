import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import BrowseMap from "../../components/BrowseMap";
import { requireUserId } from "../../lib/domain/auth";
import {
  getBrowsePage,
  getMembershipForUser,
  joinActivity,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import { isJoinableActivity } from "../../lib/domain/activities";
import { subscribeToBrowseActivities } from "../../lib/realtime/activities";
import { useT } from "../../lib/i18n/useT";
import {
  formatCapacity,
  formatGenderPref,
  formatLocalDateTime,
} from "../../lib/i18n/i18n_format";
import { Screen, PrimaryButton } from "../../src/ui/common";
import { useTheme } from "../../src/ui/theme/ThemeProvider";
import { handleError } from "../../lib/ui/handleError";

// :zap: CHANGE 1: Browse = joinable open + not expired + not joined
export default function BrowseScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const PAGE_SIZE = 30;

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityCardActivity[]>([]);
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<ActivitiesPage["cursor"]>(null);
  const [hasMore, setHasMore] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchText, setSearchText] = useState("");
  const [mapImageError, setMapImageError] = useState(false);

  const paperBg = theme.colors.bg;
  const mapImage = require("../../assets/map.png");
  const bottomInset = insets.bottom;
  const TAB_HEIGHT = 64;
  const TAB_BOTTOM = 8 + bottomInset;
  const tabBarSpace = 0;

  const loadInitial = useCallback(async () => {
    const uid = await requireUserId();
    setUserId(uid);

    const memberships = await getMembershipForUser(uid);
    const joined = new Set(
      memberships.filter((m) => m.state === "joined").map((m) => m.activity_id)
    );
    setJoinedSet(joined);

    const page = await getBrowsePage({
      cursor: null,
      limit: PAGE_SIZE,
      joinedSet: joined,
    });

    setItems(page.rows);
    setCursor(page.cursor);
    setHasMore(page.hasMore);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await getBrowsePage({
        cursor,
        limit: PAGE_SIZE,
        joinedSet,
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
      handleError(t("browse.refreshErrorTitle"), e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, joinedSet, loadingMore, t]);

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        handleError(t("browse.loadErrorTitle"), e);
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
        handleError(t("browse.refreshErrorTitle"), e);
      });
    }, [loadInitial, loading, t])
  );

  // :zap: CHANGE 9: Realtime updates for Browse list.
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToBrowseActivities((payload) => {
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
          if (tb !== ta) return tb - ta;
          return String(b.id).localeCompare(String(a.id));
        });
        return arr;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userId, joinedSet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e: any) {
      handleError(t("browse.refreshErrorTitle"), e);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

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
        await joinActivity(a.id, userId);
        setJoinedSet((prev) => new Set([...prev, a.id]));
        setItems((prev) => prev.filter((x) => x.id !== a.id));
        router.push(`/room/${a.id}`);
      } catch (e: any) {
        handleError(t("browse.joinErrorTitle"), e);
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

  if (loading) {
    return (
      <Screen>
        <Text>{t("common.loading")}</Text>
      </Screen>
    );
  }

  const mapButtonLabel =
    viewMode === "map" ? t("browse.mapButton_list") : t("browse.mapButton_map");

  return (
    <View style={{ flex: 1, backgroundColor: paperBg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: paperBg }}>
        {/* Section 1: Logo + App name + Search */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 12,
            paddingBottom: 10,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#E6F1DE",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#D6E6C8",
              }}
            >
              <Ionicons name="location" size={20} color="#6FA35B" />
            </View>
            <Text
              style={{
                fontFamily: "KalamBold",
                fontSize: 26,
                color: "#2E2A25",
              }}
            >
              {t("app.name")}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#E4DCCE",
              backgroundColor: "#F1ECE3",
            }}
          >
            <Ionicons name="search" size={18} color="#8B847B" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("browse.searchPlaceholder")}
              placeholderTextColor="#9C9388"
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                fontSize: 14,
                color: "#3A342E",
              }}
            />
            <Pressable
              onPress={() => {
                setSearchText("");
                Keyboard.dismiss();
              }}
              hitSlop={6}
              style={{ padding: 2 }}
            >
              <Ionicons
                name={searchText ? "close-circle" : "chevron-down"}
                size={18}
                color="#9C9388"
              />
            </Pressable>
          </View>
        </View>

        {/* Section 2: What's happening + Map button */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "KalamBold",
              fontSize: 20,
              color: "#3A342E",
            }}
          >
            {t("browse.whatsHappening")}
          </Text>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setViewMode(viewMode === "map" ? "list" : "map");
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#D6E6C8",
              backgroundColor: pressed ? "#E2F0D8" : "#EAF4E2",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 64,
            })}
          >
            {mapImageError ? (
              <Text style={{ fontWeight: "800", color: "#4F7E40" }}>
                {mapButtonLabel}
              </Text>
            ) : (
              <Image
                source={mapImage}
                onError={() => setMapImageError(true)}
                style={{ width: 54, height: 34, borderRadius: 8 }}
                resizeMode="cover"
              />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Section 3: Cards / Map (scrollable area only) */}
      <View style={{ flex: 1 }}>
        {viewMode === "map" ? (
          <View style={{ flex: 1, paddingBottom: tabBarSpace }}>
            <BrowseMap
              items={items}
              onPressCard={onPressCard}
              onRequestList={() => setViewMode("list")}
            />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(x) => x.id}
            contentContainerStyle={{
              paddingBottom: tabBarSpace,
              paddingTop: 4,
            }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
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
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 12 }}>
                  <ActivityIndicator />
                </View>
              ) : !hasMore && items.length > 0 ? (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ textAlign: "center", opacity: 0.6 }}>
                    {t("common.noMore")}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}
