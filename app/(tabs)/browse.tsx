import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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

import type { ActivityCardActivity } from "../../lib/domain/activities";
import BrowseMap from "../../components/BrowseMap";
import { AreaSheet, type AreaSheetHandle } from "../../components/AreaSheet";
import {
  searchPlacesNominatim,
  type PlaceCandidate,
} from "../../lib/api/places";
import { isAuthMissingError, requireUserId } from "../../lib/domain/auth";
import {
  getBrowsePage,
  getMembershipForUser,
  type ActivitiesPage,
} from "../../lib/repo/activities_repo";
import { isJoinableActivity } from "../../lib/domain/activities";
import { subscribeToBrowseActivities } from "../../lib/realtime/activities";
import { useT } from "../../lib/i18n/useT";
import { formatExpiryLabel } from "../../lib/i18n/i18n_format";
import { useTheme, useThemeSettings } from "../../src/ui/theme/ThemeProvider";
import { handleError } from "../../lib/ui/handleError";
import {
  getIpLocation,
  requestDeviceLocation,
  reverseGeocodeLabel,
  type AreaLocation,
  type DeviceLocation,
} from "../../lib/ui/location";
import { updatePushLocation } from "../../lib/push/updateLocation";
import { useUIKit } from "../../src/ui/theme/useUIKit";
import { layout, space, radius, borders } from "../../src/ui/theme/uikit";
import {
  PaperTexture,
  BComposer,
  BActivityRow,
  BBadge,
  BButton,
  BText,
  BChip,
  BToggle,
  BIconButton,
} from "../../src/ui/components/brutal";
import {
  activityCategory,
  type ActivityCategory,
} from "../../lib/ui/activityIcon";

// gorhom's BottomSheetTextInput crashes on react-native-web when the sheet
// unmounts (findNodeHandle on a null scroll ref). It's only needed on native
// for keyboard coordination, so fall back to a plain TextInput on web.
const SheetInput = (
  Platform.OS === "web" ? TextInput : BottomSheetTextInput
) as typeof TextInput;

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
  const { setMode } = useThemeSettings();
  const c = useUIKit();
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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchText, setSearchText] = useState("");
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const searchSnapPoints = useMemo(() => ["35%", "70%"], []);
  const areaSheetRef = useRef<AreaSheetHandle>(null);
  const areaSnapPoints = useMemo(() => ["70%"], []);
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
      // Feed the same location we already have to the nearby-activity push
      // targeting. Fire-and-forget — must never block or fail the browse flow.
      void updatePushLocation(res.location.lat, res.location.lng);
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
      excludeCreatorId: uid,
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
        excludeCreatorId: userId,
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
  }, [cursor, hasMore, joinedSet, loadingMore, t, userId]);

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

  // Tag system: derive a category per activity and let the user filter by it.
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const presentCats = useMemo(() => {
    const seen = new Map<string, ActivityCategory>();
    for (const x of filteredItems) {
      const cat = activityCategory(x.title_text);
      if (!seen.has(cat.key)) seen.set(cat.key, cat);
    }
    return Array.from(seen.values());
  }, [filteredItems]);
  const shownItems = useMemo(
    () =>
      tagFilter
        ? filteredItems.filter(
            (x) => activityCategory(x.title_text).key === tagFilter
          )
        : filteredItems,
    [filteredItems, tagFilter]
  );

  useEffect(() => {
    (async () => {
      try {
        await loadInitial();
      } catch (e: any) {
        if (isAuthMissingError(e)) {
          router.replace("/login");
          return;
        }
        handleError(t("browse.loadErrorTitle"), e);
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

        const isMine = !!userId && next?.creator_id === userId;
        const shouldShow = !isMine && isJoinableActivity(next, joinedSet);

        if (!shouldShow) {
          map.delete(next.id);
        } else {
          const existing = map.get(next.id);
          map.set(
            next.id,
            existing?.joined_count != null && (next as any).joined_count == null
              ? { ...next, joined_count: existing.joined_count }
              : next
          );
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

  // Tapping an activity opens its room so you can look before joining — the
  // room screen carries the Join button. (No more join-confirm Alert here.)
  function onPressCard(a: ActivityCardActivity) {
    router.push(`/room/${a.id}`);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PaperTexture opacity={0.06} />
        <ActivityIndicator color={c.brand} />
        <BText c={c} color={c.subtext} style={{ marginTop: space.md }}>
          {t("common.loading")}
        </BText>
      </View>
    );
  }

  const areaLabel = currentArea?.label ?? t("browse.area_unknown");
  // Compact label for the header — city only (the sheet shows the full label).
  const areaShort = areaLoading
    ? t("browse.area_detecting")
    : areaLabel.split(",")[0].trim();

  const tagFilterBar =
    presentCats.length > 1 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: space.sm,
          paddingVertical: 2,
          alignItems: "center",
        }}
      >
        <Pressable onPress={() => setTagFilter(null)}>
          <BChip c={c} label="All" selected={tagFilter === null} />
        </Pressable>
        {presentCats.map((cat) => (
          <Pressable key={cat.key} onPress={() => setTagFilter(cat.key)}>
            <BChip c={c} label={cat.label} selected={tagFilter === cat.key} />
          </Pressable>
        ))}
      </ScrollView>
    ) : (
      <View style={{ flex: 1 }} />
    );

  const ListHeader = (
    <View style={{ gap: space.md, paddingTop: space.md }}>
      {/* Brand + location + search — location lives up top so it never clips */}
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <BText c={c} v="display" style={{ fontFamily: "ShortStack" }}>
          {t("app.name")}
        </BText>
        <View style={{ flex: 1 }} />
        <Pressable onPress={openAreaSheet} hitSlop={8}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              maxWidth: 150,
            }}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={c.brand}
            />
            <BText c={c} v="bodyStrong" color={c.text} numberOfLines={1}>
              {areaShort}
            </BText>
            <MaterialCommunityIcons
              name="chevron-down"
              size={15}
              color={c.subtext}
            />
          </View>
        </Pressable>
        <BIconButton
          c={c}
          icon={theme.isDark ? "weather-sunny" : "weather-night"}
          onPress={() => setMode(theme.isDark ? "light" : "dark")}
        />
        <BIconButton c={c} icon="magnify" onPress={openSearchSheet} />
      </View>

      {/* Composer card */}
      <BComposer
        c={c}
        heading={t("browse.composer_title")}
        placeholders={composerHints}
        onPress={() => router.push("/compose")}
      />

      {/* View toggle + category filter share one row */}
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <BToggle<"list" | "map">
          c={c}
          value={viewMode}
          onChange={setViewMode}
          options={[
            {
              value: "list",
              label: t("browse.mapButton_list"),
              icon: "format-list-bulleted",
            },
            { value: "map", label: t("browse.mapButton_map"), icon: "map" },
          ]}
        />
        {tagFilterBar}
      </View>
    </View>
  );

  return (
    <>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <PaperTexture opacity={0.06} />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {viewMode === "map" ? (
            <View style={{ flex: 1, paddingBottom: tabBarSpace }}>
              {ListHeader}
              <View style={{ flex: 1 }}>
                <BrowseMap
                  items={shownItems}
                  onPressCard={onPressCard}
                  onRequestList={() => setViewMode("list")}
                />
              </View>
            </View>
          ) : (
            <FlatList
              data={shownItems}
              keyExtractor={(x) => x.id}
              style={{ flex: 1, backgroundColor: "transparent" }}
              contentContainerStyle={{
                width: "100%",
                maxWidth: layout.maxContentWidth,
                alignSelf: "center",
                paddingHorizontal: space.lg,
                paddingBottom: space.xxl,
              }}
              ListHeaderComponent={ListHeader}
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
              renderItem={({ item }) => {
                // Meta is text info: venue (fallback area) · 👤 people · closes;
                // people is "N/cap" when capped, else "N"; distance top-right.
                const venue =
                  (item.place_name ?? item.place_text ?? "").trim() ||
                  areaShort;
                const closesLabel = t("activityCard.hint_expiry_short", {
                  when: formatExpiryLabel(item.expires_at, Date.now(), t),
                });
                const going =
                  typeof item.joined_count === "number" ? item.joined_count : 0;
                const cap =
                  typeof item.capacity === "number" && item.capacity >= 1
                    ? item.capacity
                    : null;
                const peopleLabel = cap ? `${going}/${cap}` : `${going}`;
                const meta = (
                  <>
                    {venue} ·{" "}
                    <MaterialCommunityIcons
                      name="account"
                      size={13}
                      color={c.subtext}
                    />
                    {peopleLabel} · {closesLabel}
                  </>
                );
                const distance =
                  item.distance_km != null
                    ? `${item.distance_km.toFixed(1)}km`
                    : undefined;
                const cat = activityCategory(item.title_text);
                return (
                  <View style={{ marginBottom: space.sm }}>
                    <BActivityRow
                      c={c}
                      icon={cat.icon}
                      iconBg={c[cat.tint]}
                      title={item.title_text}
                      meta={meta}
                      trailing={distance}
                      badges={
                        <BBadge c={c} label={cat.label} fill={c[cat.tint]} />
                      }
                      onPress={() => onPressCard(item)}
                    />
                  </View>
                );
              }}
              ListEmptyComponent={
                areaLoading || !currentArea ? (
                  <View style={{ paddingTop: space.xxl, gap: space.md }}>
                    <BText c={c} color={c.subtext}>
                      {t("browse.area_detecting")}
                    </BText>
                    <BButton
                      c={c}
                      tone="primary"
                      label={t("browse.area_choose")}
                      onPress={openAreaSheet}
                    />
                  </View>
                ) : (
                  <View style={{ paddingTop: space.xxl, gap: space.md }}>
                    <BText c={c} color={c.subtext}>
                      {t("browse.empty")}
                    </BText>
                    <BButton
                      c={c}
                      tone="primary"
                      label={t("browse.empty_cta")}
                      onPress={() => router.push("/compose")}
                    />
                  </View>
                )
              }
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: space.md }}>
                    <ActivityIndicator color={c.brand} />
                  </View>
                ) : !hasMore && shownItems.length > 0 ? (
                  <View style={{ paddingVertical: space.md }}>
                    <BText
                      c={c}
                      color={c.subtext}
                      style={{ textAlign: "center" }}
                    >
                      {t("common.noMore")}
                    </BText>
                  </View>
                ) : null
              }
            />
          )}
        </SafeAreaView>

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
            borderRadius: radius.pill,
            borderWidth: 2,
            borderColor: c.border,
            backgroundColor: c.surface,
            opacity: pressed ? 0.8 : 1,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {viewMode === "map" ? (
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={22}
              color={c.ink}
            />
          ) : (
            <MaterialCommunityIcons name="map" size={22} color={c.ink} />
          )}
        </Pressable>
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={searchSnapPoints}
        enableDynamicSizing={false}
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
            <SheetInput
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
        </BottomSheetView>
      </BottomSheetModal>

      <AreaSheet
        ref={areaSheetRef}
        c={c}
        bottomInset={insets.bottom}
        snapPoints={areaSnapPoints}
        backdropComponent={renderSearchBackdrop}
        subtitle={t("browse.area_sheet_subtitle")}
        currentLabel={currentArea ? areaLabel : null}
        currentApprox={currentArea?.approx}
        detecting={areaLoading}
        query={areaQuery}
        onQueryChange={setAreaQuery}
        results={areaResults}
        searching={areaSearching}
        recentAreas={recentAreas}
        onLocate={setAreaFromDevice}
        onPickPlace={(place) =>
          selectArea({
            lat: place.lat,
            lng: place.lng,
            label: place.name,
            approx: false,
          })
        }
        onPickRecent={(area) => selectArea(area)}
        radiusSlot={
          <View style={{ gap: space.sm }}>
            <BText c={c} v="label" color={c.subtext}>
              {t("browse.area_radius_title")}
            </BText>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
            >
              {[5, 10, 20, 30, 50].map((km) => {
                const active = km === radiusKm;
                return (
                  <Pressable
                    key={`radius-${km}`}
                    onPress={() => setRadiusKm(km)}
                    style={({ pressed }) => ({
                      paddingHorizontal: space.md,
                      paddingVertical: space.sm,
                      borderRadius: radius.pill,
                      borderWidth: borders.thick,
                      borderColor: active ? c.brand : c.border,
                      backgroundColor: active
                        ? c.brand
                        : pressed
                          ? c.surfaceAlt
                          : c.surface,
                    })}
                  >
                    <BText
                      c={c}
                      v="caption"
                      color={active ? c.onBrand : c.text}
                      style={{ fontWeight: "700" }}
                    >
                      {`${km} km`}
                    </BText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
      />
    </>
  );
}
