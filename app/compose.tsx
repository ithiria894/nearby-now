import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { Screen, PrimaryButton } from "../src/ui/common";
import { useTheme } from "../src/ui/theme/ThemeProvider";
import {
  getIpLocation,
  requestDeviceLocation,
  reverseGeocodeLabel,
  type AreaLocation,
} from "../lib/ui/location";
import { searchPlacesNominatim, type PlaceCandidate } from "../lib/api/places";

const RECENT_AREAS_KEY = "browse.recentAreas.v1";

export default function ComposeScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [successLine, setSuccessLine] = useState<string>("");
  const successSheetRef = useRef<BottomSheetModal>(null);
  const areaSheetRef = useRef<BottomSheetModal>(null);
  const successSnapPoints = useMemo(() => ["45%"], []);
  const areaSnapPoints = useMemo(() => ["55%"], []);
  const [currentArea, setCurrentArea] = useState<AreaLocation | null>(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState<PlaceCandidate[]>([]);
  const [areaSearching, setAreaSearching] = useState(false);
  const [recentAreas, setRecentAreas] = useState<AreaLocation[]>([]);
  const [areaSource, setAreaSource] = useState<
    "device" | "ip" | "manual" | null
  >(null);
  const templates = [
    t("compose.template_1"),
    t("compose.template_2"),
    t("compose.template_3"),
    t("compose.template_4"),
    t("compose.template_5"),
    t("compose.template_6"),
  ];

  const successLines = useMemo(
    () => [
      t("compose.success_line_1"),
      t("compose.success_line_2"),
      t("compose.success_line_3"),
      t("compose.success_line_4"),
      t("compose.success_line_5"),
    ],
    [t]
  );

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );

  useEffect(() => {
    (async () => {
      try {
        const recentRaw = await AsyncStorage.getItem(RECENT_AREAS_KEY);
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
      } catch {
        // ignore storage errors
      }
    })();
  }, []);

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

  const selectArea = (
    area: AreaLocation,
    source: "device" | "ip" | "manual"
  ) => {
    setCurrentArea({ ...area, source });
    setAreaSource(source);
    setAreaLoading(false);
    setRecentAreas((prev) => {
      const next = [
        { ...area, source },
        ...prev.filter((a) => a.label !== area.label),
      ];
      return next.slice(0, 5);
    });
  };

  useEffect(() => {
    AsyncStorage.setItem(RECENT_AREAS_KEY, JSON.stringify(recentAreas)).catch(
      () => {}
    );
  }, [recentAreas]);

  const setAreaFromDevice = async (): Promise<AreaLocation | null> => {
    const res = await requestDeviceLocation();
    if (res.status === "granted" && res.location) {
      const label =
        (await reverseGeocodeLabel(res.location)) ?? t("browse.area_nearby");
      const area = {
        lat: res.location.lat,
        lng: res.location.lng,
        label,
        approx: false,
      };
      selectArea(area, "device");
      return area;
    }
    const ipArea = await getIpLocation();
    if (ipArea) {
      selectArea(ipArea, "ip");
      return ipArea;
    }
    return null;
  };

  const loadSuggestedArea = async () => {
    if (currentArea || areaLoading) return;
    setAreaLoading(true);
    try {
      const ipArea = await getIpLocation();
      if (ipArea) {
        selectArea(ipArea, "ip");
      }
    } finally {
      setAreaLoading(false);
    }
  };

  async function onSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const area = currentArea;
      if (!area) {
        await loadSuggestedArea();
        areaSheetRef.current?.present();
        return;
      }
      const userId = await requireUserId();
      const { data, error } = await backend.activities.createActivity({
        creator_id: userId,
        title_text: text.trim(),
        lat: area?.lat ?? null,
        lng: area?.lng ?? null,
        location_source:
          areaSource ?? (area?.approx ? "ip" : area ? "device" : null),
        status: "open",
      });

      if (error) throw error;

      const { error: joinErr } = await backend.activities.upsertActivityMember({
        activity_id: data.id,
        user_id: userId,
        role: "creator",
        state: "joined",
      });

      if (joinErr) throw joinErr;

      setCreatedId(data.id);
      const pick =
        successLines[Math.floor(Math.random() * successLines.length)] ??
        t("compose.success_line_1");
      setSuccessLine(pick);
      successSheetRef.current?.present();
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("compose.errorTitle"), e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <Screen scroll>
        <Text
          style={{ fontSize: 20, fontWeight: "800", color: theme.colors.title }}
        >
          {t("compose.title")}
        </Text>
        <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
          {t("compose.subtitle")}
        </Text>

        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: theme.colors.title,
            }}
          >
            {t("compose.template_label")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {templates.map((tpl) => (
              <Pressable
                key={tpl}
                onPress={() => setText(tpl)}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: pressed
                    ? theme.isDark
                      ? theme.colors.surfaceAlt
                      : "#EAF4E2"
                    : theme.isDark
                      ? theme.colors.surface
                      : "#F6F9F2",
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: theme.colors.text,
                  }}
                >
                  {tpl}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
            {t("compose.template_hint")}
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
            padding: 12,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("compose.placeholder")}
            placeholderTextColor={theme.colors.subtext}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 120,
              fontSize: 16,
              color: theme.colors.text,
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
            {t("compose.area_label")}
          </Text>
          <Pressable
            onPress={async () => {
              await loadSuggestedArea();
              areaSheetRef.current?.present();
            }}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: pressed
                ? theme.isDark
                  ? theme.colors.surfaceAlt
                  : "#EAF4E2"
                : theme.isDark
                  ? theme.colors.surface
                  : "#F6F9F2",
            })}
          >
            <Ionicons name="location" size={14} color={theme.colors.text} />
            <Text style={{ fontSize: 12.5, color: theme.colors.text }}>
              {areaLoading
                ? t("browse.area_detecting")
                : currentArea?.approx
                  ? `${currentArea?.label ?? t("browse.area_unknown")} ${t(
                      "browse.area_approx"
                    )}`
                  : (currentArea?.label ?? t("browse.area_unknown"))}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={theme.colors.subtext}
            />
          </Pressable>
        </View>

        <PrimaryButton
          label={submitting ? t("common.loading") : t("compose.submit")}
          onPress={onSubmit}
          disabled={submitting || !text.trim()}
        />

        <BottomSheetModal
          ref={successSheetRef}
          snapPoints={successSnapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.border,
          }}
        >
          <BottomSheetView style={{ padding: 16, gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: theme.colors.title,
              }}
            >
              {t("compose.success_title")}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
              {successLine}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
              {t("compose.success_guidance")}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => {
                  successSheetRef.current?.dismiss();
                  router.replace("/(tabs)/browse");
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: pressed
                    ? theme.isDark
                      ? theme.colors.surfaceAlt
                      : "#EAF4E2"
                    : theme.isDark
                      ? theme.colors.surface
                      : "#F6F9F2",
                  alignItems: "center",
                })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: theme.colors.text,
                  }}
                >
                  {t("compose.success_wait")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!createdId) return;
                  successSheetRef.current?.dismiss();
                  router.push(`/edit/${createdId}`);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: pressed
                    ? theme.isDark
                      ? theme.colors.surfaceAlt
                      : "#E2F0D8"
                    : theme.isDark
                      ? theme.colors.surface
                      : "#EAF4E2",
                  alignItems: "center",
                })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: theme.colors.text,
                  }}
                >
                  {t("compose.success_edit")}
                </Text>
              </Pressable>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={areaSheetRef}
          snapPoints={areaSnapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.border,
          }}
        >
          <BottomSheetView style={{ padding: 16, gap: 12 }}>
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
                    : "#F1ECE3",
                }}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={theme.colors.subtext}
                />
                <TextInput
                  value={areaQuery}
                  onChangeText={setAreaQuery}
                  placeholder={t("browse.area_search_placeholder")}
                  placeholderTextColor={theme.colors.subtext}
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
                        selectArea(
                          {
                            lat: place.lat,
                            lng: place.lng,
                            label: place.name,
                            approx: false,
                          },
                          "manual"
                        );
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
                      <Text style={{ fontSize: 14, fontWeight: "800" }}>
                        {place.name}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: theme.colors.subtext }}
                      >
                        {place.address}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            ) : recentAreas.length > 0 ? (
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
                      selectArea(area, area.source ?? "manual");
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
                    <Text style={{ fontSize: 14, fontWeight: "800" }}>
                      {area.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </BottomSheetView>
        </BottomSheetModal>
      </Screen>
    </KeyboardAvoidingView>
  );
}
