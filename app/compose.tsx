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
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { formatExpiryLabel } from "../lib/i18n/i18n_format";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { space, radius, controls } from "../src/ui/theme/uikit";
import {
  BAccordion,
  BAppBar,
  BButton,
  BCard,
  BChip,
  BScreen,
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
import {
  EXPIRY_PRESETS,
  buildQuickTimes,
  formatDateTimeLocalFromDate,
  parseDateTimeInput,
} from "../lib/ui/form_time";

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

type Section = "where" | "when" | "who" | "expires";

// A compact primary action for the nav bar: brand pill, dimmed until enabled.
function PostAction({
  c,
  label,
  disabled,
  onPress,
}: {
  c: ReturnType<typeof useUIKit>;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={{
          backgroundColor: c.brand,
          borderWidth: 2,
          borderColor: c.border,
          borderRadius: controls.pillRadius,
          paddingVertical: 6,
          paddingHorizontal: 16,
        }}
      >
        <BText c={c} v="label" color={c.onBrand}>
          {label}
        </BText>
      </View>
    </Pressable>
  );
}

export default function ComposeScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const createdActivityIdRef = useRef<string | null>(null);
  const [successLine, setSuccessLine] = useState<string>("");
  const successSheetRef = useRef<BottomSheetModal>(null);
  const successSnapPoints = useMemo(() => ["45%"], []);
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [gender, setGender] = useState<"any" | "female" | "male">("any");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [expiryMode, setExpiryMode] = useState<"default" | "never" | "preset">(
    "default"
  );
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);

  const canPost = text.trim().length > 0 && !submitting;
  const quickTimes = useMemo(() => buildQuickTimes(t), [t]);

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

  const toggleSection = (s: Section) =>
    setOpenSection((v) => (v === s ? null : s));

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

  // ---- collapsed-row summaries (brand when a value is set) ----
  const whereSummary = currentArea?.label ?? undefined;
  const whenSummary = startTime.trim() || undefined;
  const whoSummary = useMemo(() => {
    const parts: string[] = [];
    if (gender !== "any")
      parts.push(t(gender === "female" ? "compose.g_women" : "compose.g_men"));
    if (capacity != null) parts.push(t("compose.people_n", { n: capacity }));
    return parts.length ? parts.join(" · ") : t("compose.who_anyone");
  }, [gender, capacity, t]);
  const whoFilled = gender !== "any" || capacity != null;
  const expiresSummary =
    expiryMode === "never"
      ? t("inviteForm.expiry_never")
      : expiryMode === "preset" && expiryMinutes != null
        ? formatExpiryLabel(
            new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
            Date.now(),
            t
          )
        : t("inviteForm.expiry_default");

  async function onSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      // Where is optional now — post with whatever area is set (IP default).
      const area = currentArea;
      const userId = await requireUserId();

      const startParsed = parseDateTimeInput(startTime);
      const endParsed = parseDateTimeInput(endTime);

      let activityId = createdActivityIdRef.current;
      if (!activityId) {
        const payload: Record<string, unknown> = {
          creator_id: userId,
          title_text: text.replace(/\s+/g, " ").trim().slice(0, 200),
          lat: area?.lat ?? null,
          lng: area?.lng ?? null,
          location_source:
            areaSource ?? (area?.approx ? "ip" : area ? "device" : null),
          vibe: vibe ?? null,
          gender_pref: gender,
          capacity: capacity,
          start_time: startParsed.iso,
          end_time: endParsed.iso,
          status: "open",
        };
        if (expiryMode === "never") {
          payload.expires_at = null;
        } else if (expiryMode === "preset" && expiryMinutes != null) {
          payload.expires_at = new Date(
            Date.now() + expiryMinutes * 60 * 1000
          ).toISOString();
        }

        const { data, error } =
          await backend.activities.createActivity(payload);

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
            right={
              <PostAction
                c={c}
                label={submitting ? t("common.loading") : t("compose.post")}
                disabled={!canPost}
                onPress={onSubmit}
              />
            }
          />
        }
      >
        {/* Title — the only thing you need to post. */}
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
              minHeight: 110,
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

        {/* Compact vibe row directly under the title. */}
        <View style={{ gap: space.sm }}>
          <BText c={c} v="label" color={c.subtext}>
            {t("vibe.pick")}
          </BText>
          {rowChips(
            VIBES.map((v) => (
              <Pressable key={v} onPress={() => setVibe(vibe === v ? null : v)}>
                <BChip
                  c={c}
                  label={t(VIBE_META[v].labelKey)}
                  selected={vibe === v}
                />
              </Pressable>
            ))
          )}
        </View>

        {/* Optional details — collapsed until you need them. */}
        <BAccordion
          c={c}
          label={t("compose.sec_where")}
          summary={whereSummary ?? t("compose.where_add")}
          filled={!!whereSummary}
          open={openSection === "where"}
          onToggle={() => toggleSection("where")}
        >
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
            onPickRecent={(area) => selectArea(area, area.source ?? "manual")}
            currentLabel={currentArea ? currentArea.label : null}
            currentApprox={currentArea?.approx}
            detecting={areaLoading}
          />
        </BAccordion>

        <BAccordion
          c={c}
          label={t("compose.sec_when")}
          summary={whenSummary ?? t("compose.when_add")}
          filled={!!whenSummary}
          open={openSection === "when"}
          onToggle={() => toggleSection("when")}
        >
          {rowChips(
            quickTimes.map((q) => (
              <Pressable
                key={q.key}
                onPress={() =>
                  setStartTime(formatDateTimeLocalFromDate(q.getDate()))
                }
              >
                <BChip c={c} label={q.label} />
              </Pressable>
            ))
          )}
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder={t("inviteForm.startTimePlaceholder")}
            placeholderTextColor={c.faint}
            style={inputStyle(c)}
          />
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder={t("inviteForm.endTimePlaceholder")}
            placeholderTextColor={c.faint}
            style={inputStyle(c)}
          />
        </BAccordion>

        <BAccordion
          c={c}
          label={t("compose.sec_who")}
          summary={whoSummary}
          filled={whoFilled}
          open={openSection === "who"}
          onToggle={() => toggleSection("who")}
        >
          <BText c={c} v="caption" color={c.subtext}>
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
          <BText c={c} v="caption" color={c.subtext}>
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
        </BAccordion>

        <BAccordion
          c={c}
          label={t("compose.sec_expires")}
          summary={expiresSummary}
          filled={expiryMode !== "default"}
          open={openSection === "expires"}
          onToggle={() => toggleSection("expires")}
        >
          {rowChips(
            <>
              <Pressable
                onPress={() => {
                  setExpiryMode("default");
                  setExpiryMinutes(null);
                }}
              >
                <BChip
                  c={c}
                  label={t("inviteForm.expiry_default")}
                  selected={expiryMode === "default"}
                />
              </Pressable>
              {EXPIRY_PRESETS.map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => {
                    setExpiryMode("preset");
                    setExpiryMinutes(p.minutes);
                  }}
                >
                  <BChip
                    c={c}
                    label={p.label}
                    selected={
                      expiryMode === "preset" && expiryMinutes === p.minutes
                    }
                  />
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  setExpiryMode("never");
                  setExpiryMinutes(null);
                }}
              >
                <BChip
                  c={c}
                  label={t("inviteForm.expiry_never")}
                  selected={expiryMode === "never"}
                />
              </Pressable>
            </>
          )}
        </BAccordion>

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

function inputStyle(c: ReturnType<typeof useUIKit>) {
  return {
    borderWidth: 2,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 15,
    color: c.text,
  } as const;
}
