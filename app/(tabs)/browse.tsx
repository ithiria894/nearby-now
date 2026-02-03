import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ActivityCard, {
  type ActivityCardActivity,
} from "../../components/ActivityCard";
import BrowseMap from "../../components/BrowseMap";
import {
  searchPlacesNominatim,
  type PlaceCandidate,
} from "../../lib/api/places";
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
import {
  getIpLocation,
  requestDeviceLocation,
  reverseGeocodeLabel,
  type AreaLocation,
  type DeviceLocation,
} from "../../lib/ui/location";

function distanceKm(a: DeviceLocation, b: DeviceLocation) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// :zap: CHANGE 1: Browse = joinable open + not expired + not joined
export default function BrowseScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const PAGE_SIZE = 30;
  const RECENT_AREAS_KEY = "browse.recentAreas.v1";
  const RADIUS_KEY = "browse.radiusKm.v1";

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
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const searchSnapPoints = useMemo(() => ["35%", "70%"], []);
  const areaSheetRef = useRef<BottomSheetModal>(null);
  const areaSnapPoints = useMemo(() => ["55%"], []);
  const [hintIndex, setHintIndex] = useState(0);
  const [currentArea, setCurrentArea] = useState<AreaLocation | null>(null);
  const [areaLoading, setAreaLoading] = useState(true);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState<PlaceCandidate[]>([]);
  const [areaSearching, setAreaSearching] = useState(false);
  const [recentAreas, setRecentAreas] = useState<AreaLocation[]>([]);
  const [radiusKm, setRadiusKm] = useState(30);

  const paperBg = theme.colors.bg;
  const bottomInset = insets.bottom;
  const TAB_BOTTOM = 8 + bottomInset;
  const tabBarSpace = 0;
  const brandIconColor = theme.colors.brand;
  const openSearchSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const openAreaSheet = useCallback(() => {
    areaSheetRef.current?.present();
  }, []);

  const renderSearchBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const composerHints = useMemo(
    () => [
      t("browse.composer_hint_1"),
      t("browse.composer_hint_2"),
      t("browse.composer_hint_3"),
      t("browse.composer_hint_4"),
      t("browse.composer_hint_5"),
    ],
    [t]
  );

  useEffect(() => {
    if (composerHints.length <= 1) return;
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % composerHints.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [composerHints.length]);

  useEffect(() => {
    if (hintIndex >= composerHints.length) {
      setHintIndex(0);
    }
  }, [composerHints.length, hintIndex]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [recentRaw, radiusRaw] = await Promise.all([
          AsyncStorage.getItem(RECENT_AREAS_KEY),
          AsyncStorage.getItem(RADIUS_KEY),
        ]);

        if (recentRaw) {
          const parsed = JSON.parse(recentRaw) as AreaLocation[];
          if (Array.isArray(parsed)) {
            setRecentAreas(
              parsed.filter(
                (area) =>
                  area &&
                  Number.isFinite(area.lat) &&
                  Number.isFinite(area.lng) &&
                  typeof area.label === "string"
              )
            );
          }
        }

        if (radiusRaw) {
          const parsed = Number(radiusRaw);
          if (Number.isFinite(parsed) && parsed > 0) {
            setRadiusKm(parsed);
          }
        }
      } catch {
        // ignore storage errors
      }

      if (currentArea) return;
      setAreaLoading(true);
      const ipArea = await getIpLocation();
      if (!alive) return;
      if (ipArea) {
        setCurrentArea(ipArea);
      }
      setAreaLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [currentArea]);

  useEffect(() => {
    AsyncStorage.setItem(RECENT_AREAS_KEY, JSON.stringify(recentAreas)).catch(
      () => {}
    );
  }, [recentAreas]);

  useEffect(() => {
    AsyncStorage.setItem(RADIUS_KEY, String(radiusKm)).catch(() => {});
  }, [radiusKm]);

  useEffect(() => {
    const q = areaQuery.trim();
    if (!q) {
      setAreaResults([]);
      setAreaSearching(false);
      return;
    }
    setAreaSearching(true);
    const handle = setTimeout(async () => {
      try {
        const results = await searchPlacesNominatim(q);
        setAreaResults(results);
      } finally {
        setAreaSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [areaQuery]);

  const setAreaFromDevice = useCallback(async () => {
    const res = await requestDeviceLocation();
    if (res.status === "granted" && res.location) {
      const label =
        (await reverseGeocodeLabel(res.location)) ?? t("browse.area_nearby");
      setCurrentArea({
        lat: res.location.lat,
        lng: res.location.lng,
        label,
        approx: false,
      });
      setAreaLoading(false);
      return true;
    }

    const ipArea = await getIpLocation();
    if (ipArea) {
      setCurrentArea(ipArea);
    }
    setAreaLoading(false);
    return false;
  }, [t]);

  const refreshArea = useCallback(async () => {
    setAreaLoading(true);
    if (currentArea?.approx) {
      const ipArea = await getIpLocation();
      if (ipArea) setCurrentArea(ipArea);
      setAreaLoading(false);
      return;
    }
    await setAreaFromDevice();
  }, [currentArea?.approx, setAreaFromDevice]);

  const selectArea = useCallback((area: AreaLocation) => {
    setCurrentArea(area);
    setAreaLoading(false);
    setRecentAreas((prev) => {
      const next = [area, ...prev.filter((a) => a.label !== area.label)];
      return next.slice(0, 5);
    });
  }, []);

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

  const filteredItems = useMemo(() => {
    if (!currentArea) return items;
    const center = { lat: currentArea.lat, lng: currentArea.lng };
    return items
      .map((item) => {
        if (item.lat == null || item.lng == null) return null;
        const dist = distanceKm(center, { lat: item.lat, lng: item.lng });
        if (!Number.isFinite(dist)) return null;
        if (dist > radiusKm) return null;
        return { ...item, distance_km: dist };
      })
      .filter(Boolean) as ActivityCardActivity[];
  }, [currentArea, items, radiusKm]);

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

  const areaLabel = currentArea?.label ?? t("browse.area_unknown");
  const areaPillLabel = areaLoading
    ? t("browse.area_detecting")
    : currentArea?.approx
      ? `${areaLabel} ${t("browse.area_approx")}`
      : areaLabel;

  return (
    <>
      <View style={{ flex: 1, backgroundColor: paperBg }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: paperBg }}>
          {/* Section 1: Logo + App name + Search button */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 10,
              gap: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme.colors.brandSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.colors.brandBorder,
                  }}
                >
                  <MaterialCommunityIcons
                    name="compass-rose"
                    size={24}
                    color={brandIconColor}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "ShortStack",
                    fontSize: 26,
                    fontStyle: "normal",
                    color: theme.colors.ink,
                  }}
                >
                  {t("app.name")}
                </Text>
              </View>

              <Pressable
                onPress={openSearchSheet}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: theme.colors.brandBorder,
                  backgroundColor: pressed
                    ? theme.colors.brandSurfacePressed
                    : theme.colors.brandSurfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Ionicons name="search" size={18} color={brandIconColor} />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/compose")}
            style={({ pressed }) => ({
              marginHorizontal: 18,
              marginBottom: 12,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.colors.brandBorder,
              backgroundColor: pressed
                ? theme.colors.brandSurfaceAlt
                : theme.colors.brandSurface,
              padding: 12,
              gap: 10,
              shadowColor: theme.colors.shadow,
              shadowOpacity: pressed ? 0.06 : 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: theme.colors.title,
              }}
            >
              {t("browse.composer_title")}
            </Text>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.colors.brandSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: theme.colors.brandBorder,
                }}
              >
                <MaterialCommunityIcons
                  name="compass-rose"
                  size={20}
                  color={brandIconColor}
                />
              </View>

              <View
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.isDark
                    ? theme.colors.surfaceAlt
                    : theme.colors.surface,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
                  {composerHints[hintIndex]}
                </Text>
              </View>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={14}
                  color={brandIconColor}
                />
                <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
                  {t("compose.navTitle")}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons
                  name="people"
                  size={14}
                  color={theme.colors.subtext}
                />
                <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
                  {t("common.join")}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Section 2: What's happening + Map button */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "Kalam",
                  fontSize: 20,
                  color: theme.colors.inkSubtle,
                }}
              >
                {t("browse.whatsHappening")}
              </Text>
              <Pressable
                onPress={openAreaSheet}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.brandBorder,
                  backgroundColor: pressed
                    ? theme.colors.brandSurfacePressed
                    : theme.colors.brandSurface,
                  maxWidth: "60%",
                })}
              >
                <Ionicons name="location" size={14} color={brandIconColor} />
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12.5, color: theme.colors.text }}
                >
                  {areaPillLabel}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={theme.colors.subtext}
                />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Section 3: Cards / Map (scrollable area only) */}
        <View style={{ flex: 1 }}>
          {viewMode === "map" ? (
            <View style={{ flex: 1, paddingBottom: tabBarSpace }}>
              <BrowseMap
                items={filteredItems}
                onPressCard={onPressCard}
                onRequestList={() => setViewMode("list")}
              />
            </View>
          ) : (
            <FlatList
              data={filteredItems}
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
                areaLoading || !currentArea ? (
                  <View
                    style={{ paddingHorizontal: 16, paddingTop: 24, gap: 10 }}
                  >
                    <Text style={{ opacity: 0.8 }}>
                      {t("browse.area_detecting")}
                    </Text>
                    <PrimaryButton
                      label={t("browse.area_choose")}
                      onPress={openAreaSheet}
                    />
                  </View>
                ) : (
                  <View
                    style={{ paddingHorizontal: 16, paddingTop: 24, gap: 10 }}
                  >
                    <Text style={{ opacity: 0.8 }}>{t("browse.empty")}</Text>
                    <PrimaryButton
                      label={t("browse.empty_cta")}
                      onPress={() => router.push("/create")}
                    />
                  </View>
                )
              }
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 12 }}>
                    <ActivityIndicator />
                  </View>
                ) : !hasMore && filteredItems.length > 0 ? (
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
          )}
        </View>

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setViewMode(viewMode === "map" ? "list" : "map");
          }}
          hitSlop={8}
          style={({ pressed }) => ({
            position: "absolute",
            left: "50%",
            transform: [{ translateX: -44 }],
            bottom: TAB_BOTTOM + 10,
            width: 88,
            height: 40,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.72 : 0.88,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: theme.colors.shadow,
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          })}
        >
          {viewMode === "map" ? (
            <Ionicons name="list" size={22} color={theme.colors.text} />
          ) : (
            <Ionicons name="map" size={22} color={theme.colors.text} />
          )}
        </Pressable>
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={searchSnapPoints}
        enablePanDownToClose
        backdropComponent={renderSearchBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.border,
        }}
      >
        <BottomSheetView
          style={{
            padding: 16,
            paddingBottom: 16 + insets.bottom,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="search" size={18} color={brandIconColor} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: theme.colors.title,
              }}
            >
              {t("browse.searchPlaceholder")}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.isDark
                ? theme.colors.surfaceAlt
                : theme.colors.inputBg,
            }}
          >
            <Ionicons name="search" size={16} color={theme.colors.subtext} />
            <BottomSheetTextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("browse.searchPlaceholder")}
              placeholderTextColor={theme.colors.subtext}
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                fontSize: 14,
                color: theme.colors.text,
              }}
            />
            <Pressable
              onPress={() => setSearchText("")}
              hitSlop={6}
              style={{ padding: 2 }}
            >
              <Ionicons
                name={searchText ? "close-circle" : "chevron-down"}
                size={18}
                color={theme.colors.subtext}
              />
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            >
              Filters
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
              Filters will live here.
            </Text>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={areaSheetRef}
        snapPoints={areaSnapPoints}
        enablePanDownToClose
        backdropComponent={renderSearchBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.border,
        }}
      >
        <BottomSheetView
          style={{
            padding: 16,
            paddingBottom: 16 + insets.bottom,
            gap: 12,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: theme.colors.title,
              }}
            >
              {t("browse.area_sheet_title")}
            </Text>
            <Text style={{ fontSize: 12.5, color: theme.colors.subtext }}>
              {t("browse.area_sheet_subtitle")}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 12.5, color: theme.colors.subtext }}>
              {t("browse.area_current")}
            </Text>
            <Pressable onPress={refreshArea} hitSlop={8}>
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {t("browse.area_refresh")}
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.isDark
                ? theme.colors.surfaceAlt
                : theme.colors.inputBg,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.colors.text }}>
              {areaPillLabel}
            </Text>
          </View>

          <Pressable
            onPress={async () => {
              await setAreaFromDevice();
              areaSheetRef.current?.dismiss();
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: pressed
                ? theme.colors.otherBg
                : theme.colors.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            })}
          >
            <Ionicons name="navigate" size={16} color={theme.colors.text} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            >
              {t("browse.area_use_current")}
            </Text>
          </Pressable>

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            >
              {t("browse.area_choose_manual")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.isDark
                  ? theme.colors.surfaceAlt
                  : theme.colors.inputBg,
              }}
            >
              <Ionicons name="search" size={16} color={theme.colors.subtext} />
              <BottomSheetTextInput
                value={areaQuery}
                onChangeText={setAreaQuery}
                placeholder={t("browse.area_search_placeholder")}
                placeholderTextColor={theme.colors.subtext}
                returnKeyType="search"
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: theme.colors.text,
                }}
              />
              <Pressable
                onPress={() => setAreaQuery("")}
                hitSlop={6}
                style={{ padding: 2 }}
              >
                <Ionicons
                  name={areaQuery ? "close-circle" : "chevron-down"}
                  size={18}
                  color={theme.colors.subtext}
                />
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            >
              {t("browse.area_radius_title")}
            </Text>
            <Text style={{ fontSize: 12.5, color: theme.colors.subtext }}>
              {t("browse.area_radius_value", { km: radiusKm })}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[5, 10, 20, 30, 50].map((km) => {
                const active = km === radiusKm;
                return (
                  <Pressable
                    key={`radius-${km}`}
                    onPress={() => setRadiusKm(km)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: active
                        ? theme.colors.otherBg
                        : pressed
                          ? theme.colors.otherBg
                          : theme.colors.surface,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: active ? "800" : "700",
                        color: theme.colors.text,
                      }}
                    >
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {areaQuery.trim().length > 0 ? (
            <View style={{ gap: 8 }}>
              {areaSearching ? (
                <Text style={{ fontSize: 12.5, color: theme.colors.subtext }}>
                  {t("browse.area_searching")}
                </Text>
              ) : areaResults.length === 0 ? (
                <Text style={{ fontSize: 12.5, color: theme.colors.subtext }}>
                  {t("browse.area_no_results")}
                </Text>
              ) : (
                areaResults.map((place) => (
                  <Pressable
                    key={place.placeId}
                    onPress={() => {
                      selectArea({
                        lat: place.lat,
                        lng: place.lng,
                        label: place.name,
                        approx: false,
                      });
                      setAreaQuery("");
                      areaSheetRef.current?.dismiss();
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: pressed
                        ? theme.colors.otherBg
                        : theme.colors.surface,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: theme.colors.text,
                      }}
                    >
                      {place.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
                      {place.address}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : (
            <>
              {recentAreas.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: "800",
                      color: theme.colors.text,
                    }}
                  >
                    {t("browse.area_recent")}
                  </Text>
                  {recentAreas.map((area) => (
                    <Pressable
                      key={`${area.label}-${area.lat}-${area.lng}`}
                      onPress={() => {
                        selectArea(area);
                        areaSheetRef.current?.dismiss();
                      }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: pressed
                          ? theme.colors.otherBg
                          : theme.colors.surface,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: theme.colors.text,
                        }}
                      >
                        {area.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
