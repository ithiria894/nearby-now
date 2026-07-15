import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { alertAsync } from "../lib/ui/dialog";
import { useRouter } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AreaSheet, type AreaSheetHandle } from "../components/AreaSheet";
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { space, radius } from "../src/ui/theme/uikit";
import {
  BAppBar,
  BButton,
  BCard,
  BChip,
  BScreen,
  BText,
} from "../src/ui/components/brutal";
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
  const c = useUIKit();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const createdActivityIdRef = useRef<string | null>(null);
  const [successLine, setSuccessLine] = useState<string>("");
  const successSheetRef = useRef<BottomSheetModal>(null);
  const areaSheetRef = useRef<AreaSheetHandle>(null);
  const successSnapPoints = useMemo(() => ["45%"], []);
  const areaSnapPoints = useMemo(() => ["65%"], []);
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

      let activityId = createdActivityIdRef.current;
      if (!activityId) {
        const { data, error } = await backend.activities.createActivity({
          creator_id: userId,
          title_text: text.replace(/\s+/g, " ").trim().slice(0, 200),
          lat: area?.lat ?? null,
          lng: area?.lng ?? null,
          location_source:
            areaSource ?? (area?.approx ? "ip" : area ? "device" : null),
          status: "open",
        });

        if (error) throw error;

        // Remember the created activity id so a failed auto-join below does not
        // create a duplicate activity when the user re-taps Post.
        activityId = data.id;
        createdActivityIdRef.current = activityId;
      }

      const { error: joinErr } = await backend.activities.upsertActivityMember({
        activity_id: activityId,
        user_id: userId,
        role: "creator",
        state: "joined",
      });

      if (joinErr) throw joinErr;

      // Success: clear the retry guard and the composed text so a
      // dismiss-then-resubmit of the success sheet can't insert a duplicate.
      createdActivityIdRef.current = null;
      setCreatedId(activityId);
      setText("");
      const pick =
        successLines[Math.floor(Math.random() * successLines.length)] ??
        t("compose.success_line_1");
      setSuccessLine(pick);
      successSheetRef.current?.present();
    } catch (e: any) {
      console.error(e);
      alertAsync(t("compose.errorTitle"), e?.message ?? "Unknown error");
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
      <BScreen
        c={c}
        scroll
        appBar={
          <BAppBar
            c={c}
            onBack={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)/browse")
            }
            title={t("compose.title")}
            subtitle={t("compose.subtitle")}
          />
        }
      >
        <BCard c={c}>
          <BText c={c} v="label" color={c.subtext}>
            {t("compose.template_label")}
          </BText>
          <BText c={c} v="caption" color={c.subtext}>
            {t("compose.template_hint")}
          </BText>
          <View
            style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
          >
            {templates.map((tpl) => (
              <Pressable key={tpl} onPress={() => setText(tpl)}>
                <BChip c={c} label={tpl} />
              </Pressable>
            ))}
          </View>
        </BCard>

        <BCard c={c}>
          <BText c={c} v="label" color={c.subtext}>
            {t("compose.placeholder")}
          </BText>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("compose.placeholder")}
            placeholderTextColor={c.faint}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 120,
              borderWidth: 2,
              borderColor: c.border,
              borderRadius: radius.lg,
              backgroundColor: c.surface,
              padding: space.md,
              fontSize: 16,
              color: c.text,
            }}
          />
        </BCard>

        <BCard c={c}>
          <BText c={c} v="label" color={c.subtext}>
            {t("compose.area_label")}
          </BText>
          <Pressable
            onPress={async () => {
              await loadSuggestedArea();
              areaSheetRef.current?.present();
            }}
          >
            <BChip
              c={c}
              label={
                areaLoading
                  ? t("browse.area_detecting")
                  : currentArea?.approx
                    ? `${currentArea?.label ?? t("browse.area_unknown")} ${t(
                        "browse.area_approx"
                      )}`
                    : (currentArea?.label ?? t("browse.area_unknown"))
              }
              selected={!!currentArea}
            />
          </Pressable>
        </BCard>

        <BButton
          c={c}
          tone="primary"
          full
          label={submitting ? t("common.loading") : t("compose.submit")}
          onPress={onSubmit}
        />

        <BottomSheetModal
          ref={successSheetRef}
          snapPoints={successSnapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: c.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
          }}
          handleIndicatorStyle={{
            backgroundColor: c.border,
          }}
        >
          <BottomSheetView style={{ padding: space.lg, gap: space.md }}>
            <BText c={c} v="h2" color={c.ink}>
              {t("compose.success_title")}
            </BText>
            <BText c={c} v="body" color={c.subtext}>
              {successLine}
            </BText>
            <BText c={c} v="body" color={c.subtext}>
              {t("compose.success_guidance")}
            </BText>

            <View
              style={{
                flexDirection: "row",
                gap: space.sm,
                marginTop: space.xs,
              }}
            >
              <View style={{ flex: 1 }}>
                <BButton
                  c={c}
                  tone="secondary"
                  full
                  label={t("compose.success_wait")}
                  onPress={() => {
                    successSheetRef.current?.dismiss();
                    router.replace("/(tabs)/browse");
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <BButton
                  c={c}
                  tone="primary"
                  full
                  label={t("compose.success_edit")}
                  onPress={() => {
                    if (!createdId) return;
                    successSheetRef.current?.dismiss();
                    router.push(`/edit/${createdId}`);
                  }}
                />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        <AreaSheet
          ref={areaSheetRef}
          c={c}
          bottomInset={insets.bottom}
          snapPoints={areaSnapPoints}
          backdropComponent={renderBackdrop}
          subtitle={t("browse.area_sheet_subtitle_post")}
          currentLabel={currentArea ? currentArea.label : null}
          currentApprox={currentArea?.approx}
          detecting={areaLoading}
          query={areaQuery}
          onQueryChange={setAreaQuery}
          results={areaResults}
          searching={areaSearching}
          recentAreas={recentAreas}
          onLocate={setAreaFromDevice}
          onPickPlace={(place) =>
            selectArea(
              {
                lat: place.lat,
                lng: place.lng,
                label: place.name,
                approx: false,
              },
              "manual"
            )
          }
          onPickRecent={(area) => selectArea(area, area.source ?? "manual")}
        />
      </BScreen>
    </KeyboardAvoidingView>
  );
}
