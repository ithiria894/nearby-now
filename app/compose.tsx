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
import { Ionicons } from "@expo/vector-icons";
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
  BStepper,
  BText,
} from "../src/ui/components/brutal";
import { AreaPicker } from "../components/AreaPicker";
import {
  getIpLocation,
  requestDeviceLocation,
  reverseGeocodeLabel,
  type AreaLocation,
} from "../lib/ui/location";
import { searchPlacesNominatim, type PlaceCandidate } from "../lib/api/places";
import { VIBES, VIBE_META } from "../lib/ui/vibe";

const RECENT_AREAS_KEY = "browse.recentAreas.v1";

// Short topic chips. Tapping one drafts a randomized sentence from its pool
// (compose.gen.<key>) so every post reads a little differently.
const TOPICS = [
  { key: "boardgame", labelKey: "compose.topic_boardgame" },
  { key: "drink", labelKey: "compose.topic_drink" },
  { key: "ski", labelKey: "compose.topic_ski" },
  { key: "walk", labelKey: "compose.topic_walk" },
  { key: "karaoke", labelKey: "compose.topic_karaoke" },
  { key: "dinner", labelKey: "compose.topic_dinner" },
] as const;

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
  const [vibe, setVibe] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [gender, setGender] = useState<"any" | "female" | "male">("any");
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

  const openAreaSheet = () => areaSheetRef.current?.present();

  function draftFromTopic(topicKey: string) {
    const raw = t(`compose.gen.${topicKey}`, {
      returnObjects: true,
    }) as unknown;
    const list = Array.isArray(raw) ? (raw as string[]) : [];
    if (list.length === 0) return;
    // Prefer a wording different from what's already there, so re-tapping a
    // topic rewrites the text with a fresh variation each time.
    const pool = list.filter((v) => v !== text);
    const choices = pool.length ? pool : list;
    setText(choices[Math.floor(Math.random() * choices.length)]);
  }

  // Default the post's area to the user's location as soon as the screen opens.
  useEffect(() => {
    let alive = true;
    (async () => {
      setAreaLoading(true);
      const ip = await getIpLocation();
      if (alive && ip) selectArea(ip, "ip");
      if (alive) setAreaLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      // Where is optional now — post with whatever area is set (IP default).
      const area = currentArea;
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
          vibe: vibe ?? null,
          gender_pref: gender,
          capacity: capacity,
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

  const rowChips = (children: React.ReactNode) => (
    <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
      {children}
    </View>
  );

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
            title={t("compose.navTitle")}
          />
        }
      >
        <BStepper
          c={c}
          current={step}
          onStepPress={(i) => setStep(i as 0 | 1 | 2)}
          steps={[
            { label: t("compose.step_say") },
            { label: t("compose.step_where"), optional: true },
            { label: t("compose.step_details"), optional: true },
          ]}
        />

        {step === 0 ? (
          <>
            <BCard c={c}>
              <BText c={c} v="label" color={c.subtext}>
                {t("compose.title_label")}
              </BText>
              <TextInput
                value={text}
                onChangeText={setText}
                onFocus={() => setHelpOpen(true)}
                placeholder={t("compose.placeholder")}
                placeholderTextColor={c.faint}
                multiline
                autoFocus
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
              {/* Quick-help expands once you engage the title. */}
              {helpOpen || text.trim().length > 0 ? (
                <>
                  <BText c={c} v="caption" color={c.subtext}>
                    {t("compose.topic_hint")}
                  </BText>
                  {rowChips(
                    TOPICS.map((topic) => (
                      <Pressable
                        key={topic.key}
                        onPress={() => draftFromTopic(topic.key)}
                      >
                        <BChip c={c} label={t(topic.labelKey)} />
                      </Pressable>
                    ))
                  )}
                </>
              ) : null}
            </BCard>

            <BCard c={c}>
              <BText c={c} v="label" color={c.subtext}>
                {t("vibe.pick")}
              </BText>
              {rowChips(
                VIBES.map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setVibe(vibe === v ? null : v)}
                  >
                    <BChip
                      c={c}
                      label={t(VIBE_META[v].labelKey)}
                      selected={vibe === v}
                    />
                  </Pressable>
                ))
              )}
            </BCard>

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <BButton
                  c={c}
                  tone="primary"
                  full
                  label={
                    submitting ? t("common.loading") : t("compose.post_now")
                  }
                  onPress={onSubmit}
                />
              </View>
              <BButton
                c={c}
                tone="secondary"
                label={t("compose.add_details")}
                onPress={() => setStep(1)}
              />
            </View>
          </>
        ) : step === 1 ? (
          <>
            <BCard c={c}>
              <BText c={c} v="label" color={c.subtext}>
                {t("compose.where_hint")}
              </BText>
              <AreaPicker
                c={c}
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
                onPickRecent={(area) =>
                  selectArea(area, area.source ?? "manual")
                }
                currentLabel={currentArea ? currentArea.label : null}
                currentApprox={currentArea?.approx}
                detecting={areaLoading}
              />
            </BCard>

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <BButton
                c={c}
                tone="secondary"
                label={t("common.back")}
                onPress={() => setStep(0)}
              />
              <View style={{ flex: 1 }} />
              <BButton
                c={c}
                tone="secondary"
                label={t("compose.post")}
                onPress={onSubmit}
              />
              <BButton
                c={c}
                tone="primary"
                label={t("common.next")}
                onPress={() => setStep(2)}
              />
            </View>
          </>
        ) : (
          <>
            <BText c={c} v="caption" color={c.subtext}>
              {t("compose.details_hint")}
            </BText>
            <BCard c={c}>
              <BText c={c} v="label" color={c.subtext}>
                {t("inviteForm.capacityLabel")}
              </BText>
              {rowChips(
                [null, 2, 3, 4, 6, 8].map((n) => (
                  <Pressable key={String(n)} onPress={() => setCapacity(n)}>
                    <BChip
                      c={c}
                      selected={capacity === n}
                      label={n == null ? t("capacity.unlimited") : String(n)}
                    />
                  </Pressable>
                ))
              )}
            </BCard>

            <BCard c={c}>
              <BText c={c} v="label" color={c.subtext}>
                {t("inviteForm.genderLabel")}
              </BText>
              {rowChips(
                (["any", "female", "male"] as const).map((g) => (
                  <Pressable key={g} onPress={() => setGender(g)}>
                    <BChip
                      c={c}
                      selected={gender === g}
                      label={t(`inviteForm.gender_${g}`)}
                    />
                  </Pressable>
                ))
              )}
            </BCard>

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <BButton
                c={c}
                tone="secondary"
                label={t("common.back")}
                onPress={() => setStep(1)}
              />
              <View style={{ flex: 1 }} />
              <BButton
                c={c}
                tone="primary"
                label={submitting ? t("common.loading") : t("compose.post")}
                onPress={onSubmit}
              />
            </View>
          </>
        )}

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
      </BScreen>
    </KeyboardAvoidingView>
  );
}
