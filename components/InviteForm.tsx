import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { searchPlacesNominatim, type PlaceCandidate } from "../lib/api/places";
import { VIBES, VIBE_META } from "../lib/ui/vibe";
import { useT } from "../lib/i18n/useT";
import { formatExpiryLabel } from "../lib/i18n/i18n_format";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { space } from "../src/ui/theme/uikit";
import {
  BButton,
  BCard,
  BChip,
  BInput,
  BStepper,
  BText,
} from "../src/ui/components/brutal";

type GenderPref = "any" | "female" | "male";

export type InviteFormPayload = {
  title_text: string;
  place_text: string | null;
  place_name: string | null;
  place_address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  location_source: string | null;
  gender_pref: GenderPref;
  vibe: string | null;
  capacity: number | null;
  start_time?: string | null;
  end_time?: string | null;
  expires_at?: string | null;
};

type InviteFormInitialValues = {
  title_text?: string;
  place_text?: string | null;
  place_name?: string | null;
  place_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  place_id?: string | null;
  location_source?: string | null;
  gender_pref?: GenderPref | null;
  vibe?: string | null;
  capacity?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  expires_at?: string | null;
};

type Props = {
  initialValues?: InviteFormInitialValues;
  onSubmit: (payload: InviteFormPayload) => void | Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
};

type SelectedPlace = {
  placeId: string | null;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  source: string | null;
};

const EXPIRY_PRESETS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "8h", minutes: 480 },
];

const pad2 = (value: number) => String(value).padStart(2, "0");

function formatDateTimeLocalFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseDateTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { iso: null, error: null, date: null as Date | null };
  let normalized = trimmed;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) {
    normalized = `${trimmed.replace(" ", "T")}:00`;
  } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    normalized = trimmed.replace(" ", "T");
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return { iso: null, error: "format", date: null as Date | null };
  }
  return { iso: parsed.toISOString(), error: null, date: parsed };
}

function buildInitialPlace(
  initialValues: InviteFormInitialValues | undefined,
  t: (key: string) => string
): SelectedPlace | null {
  const name = (initialValues?.place_name ?? "").trim();
  const address = (initialValues?.place_address ?? "").trim();
  if (!name && !address) return null;

  const lat = initialValues?.lat;
  const lng = initialValues?.lng;

  return {
    placeId: initialValues?.place_id ?? null,
    name: name || address || t("inviteForm.selectPlaceTitle"),
    address: address || name,
    lat: Number.isFinite(lat as number) ? (lat as number) : null,
    lng: Number.isFinite(lng as number) ? (lng as number) : null,
    source: initialValues?.location_source ?? null,
  };
}

export default function InviteForm(props: Props) {
  const {
    initialValues,
    onSubmit,
    onCancel,
    submitting = false,
    submitLabel,
    mode = "create",
  } = props;

  const c = useUIKit();
  const { t } = useT();
  const initialPlace = buildInitialPlace(initialValues, t);
  const effectiveSubmitLabel =
    submitLabel ?? (mode === "edit" ? t("edit.save") : t("create.submit"));

  const [title, setTitle] = useState(initialValues?.title_text ?? "");
  const [placeQuery, setPlaceQuery] = useState(initialPlace?.name ?? "");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    initialPlace
  );
  const [manualPlace, setManualPlace] = useState(
    initialPlace ? "" : (initialValues?.place_text ?? "")
  );
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState(0);
  const [vibe, setVibe] = useState<string | null>(initialValues?.vibe ?? null);
  const [genderPref, setGenderPref] = useState<GenderPref>(
    (initialValues?.gender_pref as GenderPref) ?? "any"
  );
  const [capacity, setCapacity] = useState<number | null>(
    initialValues?.capacity ?? null
  );
  const [startTime, setStartTime] = useState(
    formatDateTimeLocal(initialValues?.start_time ?? null)
  );
  const [endTime, setEndTime] = useState(
    formatDateTimeLocal(initialValues?.end_time ?? null)
  );
  const [expiryMode, setExpiryMode] = useState<"default" | "never" | "preset">(
    initialValues?.expires_at === null ? "never" : "default"
  );
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const searchIdRef = useRef(0);

  useEffect(() => {
    const q = placeQuery.trim();

    if (selectedPlace && q === selectedPlace.name) {
      setCandidates([]);
      setSearching(false);
      return;
    }

    if (q.length < 3) {
      setCandidates([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const searchId = ++searchIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesNominatim(q);
        if (searchId !== searchIdRef.current) return;
        setCandidates(results);
      } catch (e) {
        if (searchId !== searchIdRef.current) return;
        setCandidates([]);
      } finally {
        if (searchId === searchIdRef.current) setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [placeQuery, selectedPlace]);

  const onChangePlaceQuery = (text: string) => {
    const trimmed = text.trim();
    setPlaceQuery(text);

    if (selectedPlace && trimmed !== selectedPlace.name) {
      setSelectedPlace(null);
    }
  };

  const onSelectCandidate = (c: PlaceCandidate) => {
    setSelectedPlace({
      placeId: c.placeId || null,
      name: c.name,
      address: c.address,
      lat: c.lat,
      lng: c.lng,
      source: "nominatim",
    });
    setPlaceQuery(c.name);
    setManualPlace("");
    setCandidates([]);
    setSearching(false);
  };

  const onClearSelection = () => {
    setSelectedPlace(null);
    setPlaceQuery("");
    setCandidates([]);
    setSearching(false);
    setManualPlace("");
  };

  const parsedCapacity = useMemo(() => {
    if (capacity == null) return { value: null, error: null };
    if (!Number.isInteger(capacity) || capacity < 1) {
      return { value: null, error: t("inviteForm.invalidBody") };
    }
    return { value: capacity, error: null };
  }, [capacity, t]);

  const startParsed = useMemo(() => parseDateTimeInput(startTime), [startTime]);
  const endParsed = useMemo(() => parseDateTimeInput(endTime), [endTime]);
  const timeRangeError = useMemo(() => {
    if (startParsed.error || endParsed.error) return null;
    if (startParsed.date && endParsed.date) {
      if (endParsed.date.getTime() < startParsed.date.getTime()) {
        return t("inviteForm.timeRangeError");
      }
    }
    return null;
  }, [startParsed, endParsed, t]);
  const startPastError = useMemo(() => {
    if (mode !== "create") return null;
    if (startParsed.error) return null;
    if (startParsed.date && startParsed.date.getTime() < Date.now()) {
      return t("inviteForm.timePastError");
    }
    return null;
  }, [mode, startParsed, t]);

  const titleError =
    didSubmit && !title.trim() ? t("inviteForm.titleRequired") : null;
  const capacityError = didSubmit ? parsedCapacity.error : null;
  const startTimeError =
    didSubmit && startParsed.error ? t("inviteForm.timeFormatError") : null;
  const endTimeError =
    didSubmit && endParsed.error ? t("inviteForm.timeFormatError") : null;
  const timeRangeDisplayError = didSubmit ? timeRangeError : null;
  const startPastDisplayError = didSubmit ? startPastError : null;

  const handleSubmit = async () => {
    setDidSubmit(true);
    if (
      !title.trim() ||
      parsedCapacity.error ||
      startParsed.error ||
      endParsed.error ||
      timeRangeError ||
      startPastError
    ) {
      return;
    }

    let expiresAt: string | null | undefined = undefined;
    if (expiryMode === "never") {
      expiresAt = null;
    } else if (expiryMode === "preset" && expiryMinutes != null) {
      expiresAt = new Date(
        Date.now() + expiryMinutes * 60 * 1000
      ).toISOString();
    }

    const placeName = selectedPlace ? selectedPlace.name : null;
    const placeAddress = selectedPlace ? selectedPlace.address : null;
    const lat =
      selectedPlace && Number.isFinite(selectedPlace.lat as number)
        ? (selectedPlace.lat as number)
        : null;
    const lng =
      selectedPlace && Number.isFinite(selectedPlace.lng as number)
        ? (selectedPlace.lng as number)
        : null;
    const placeId =
      selectedPlace && selectedPlace.placeId
        ? selectedPlace.placeId.trim() || null
        : null;
    const locationSource = selectedPlace
      ? (selectedPlace.source ?? null)
      : manualPlace.trim()
        ? "manual"
        : null;
    const placeTextValue = selectedPlace ? null : manualPlace.trim() || null;

    await onSubmit({
      title_text: title.trim(),
      place_text: placeTextValue,
      place_name: placeName,
      place_address: placeAddress,
      lat,
      lng,
      place_id: placeId,
      location_source: locationSource,
      gender_pref: genderPref,
      vibe,
      capacity: parsedCapacity.value,
      start_time: startParsed.iso,
      end_time: endParsed.iso,
      expires_at: expiresAt,
    });
  };

  const expiryHint =
    expiryMode === "never"
      ? t("inviteForm.expiry_hint_never")
      : expiryMode === "preset" && expiryMinutes != null
        ? t("inviteForm.expiry_hint_preset", {
            when: formatExpiryLabel(
              new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
              Date.now(),
              t
            ),
          })
        : mode === "edit"
          ? t("inviteForm.expiry_hint_edit")
          : t("inviteForm.expiry_hint_default");

  const quickTimes = [
    {
      key: "tonight",
      label: t("inviteForm.time_quick_tonight"),
      getDate: () => {
        const d = new Date();
        d.setHours(20, 0, 0, 0);
        return d;
      },
    },
    {
      key: "later",
      label: t("inviteForm.time_quick_later"),
      getDate: () => {
        const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
        d.setMinutes(0, 0, 0);
        return d;
      },
    },
    {
      key: "week",
      label: t("inviteForm.time_quick_week"),
      getDate: () => {
        const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        d.setHours(19, 0, 0, 0);
        return d;
      },
    },
    {
      key: "next",
      label: t("inviteForm.time_quick_next"),
      getDate: () => {
        const d = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
        d.setHours(19, 0, 0, 0);
        return d;
      },
    },
  ];

  const capacityPresets = [
    { key: "2-3", label: t("inviteForm.cap_quick_2_3"), value: 3 },
    { key: "3-4", label: t("inviteForm.cap_quick_3_4"), value: 4 },
    { key: "5+", label: t("inviteForm.cap_quick_5_plus"), value: 6 },
    { key: "any", label: t("inviteForm.cap_quick_any"), value: null },
  ];

  const summaryItems = useMemo(() => {
    const items: Array<{ key: string; label: string }> = [];
    if (selectedPlace || manualPlace.trim()) {
      items.push({ key: "place", label: t("inviteForm.summary_place") });
    }
    if (startTime.trim()) {
      items.push({ key: "time", label: t("inviteForm.summary_time") });
    }
    if (capacity != null) {
      items.push({ key: "cap", label: t("inviteForm.summary_capacity") });
    }
    if (genderPref !== "any") {
      items.push({ key: "gender", label: t("inviteForm.summary_gender") });
    }
    if (expiryMode !== "default") {
      items.push({ key: "expiry", label: t("inviteForm.summary_expiry") });
    }
    return items;
  }, [
    capacity,
    expiryMode,
    genderPref,
    manualPlace,
    placeQuery,
    selectedPlace,
    startTime,
    t,
  ]);

  return (
    <View style={{ gap: space.md }}>
      <BStepper
        c={c}
        current={step}
        onStepPress={setStep}
        steps={[
          { label: t("inviteForm.step_basics") },
          { label: t("inviteForm.step_where"), optional: true },
          { label: t("inviteForm.step_details"), optional: true },
        ]}
      />

      {step === 0 ? (
        <>
          <BInput
            c={c}
            label={t("inviteForm.titleLabel")}
            placeholder={t("inviteForm.titlePlaceholder")}
            value={title}
            onChangeText={setTitle}
            error={titleError ?? undefined}
          />

          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("vibe.pick")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {t("vibe.pick_hint")}
            </BText>
            <View
              style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
            >
              {VIBES.map((v) => (
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
              ))}
            </View>
          </BCard>
        </>
      ) : step === 1 ? (
        <>
          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("inviteForm.placeLabel")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {t("inviteForm.placeBlurb")}
            </BText>
            <BInput
              c={c}
              label={t("inviteForm.placeLabel")}
              placeholder={t("inviteForm.placePlaceholder")}
              value={placeQuery}
              onChangeText={onChangePlaceQuery}
              hint={t("inviteForm.placeHint")}
            />

            <BButton
              c={c}
              tone="secondary"
              label={t("inviteForm.place_skip")}
              onPress={onClearSelection}
            />

            {selectedPlace ? (
              <BCard c={c}>
                <BText c={c} v="title" color={c.ink}>
                  {selectedPlace.name}
                </BText>
                <BText c={c} v="body" color={c.subtext}>
                  {selectedPlace.address}
                </BText>
                <BButton
                  c={c}
                  tone="secondary"
                  label={t("inviteForm.clearSelection")}
                  onPress={onClearSelection}
                />
              </BCard>
            ) : null}

            {searching ? (
              <BText c={c} v="body" color={c.subtext}>
                {t("inviteForm.searching")}
              </BText>
            ) : null}

            {!selectedPlace && candidates.length > 0 ? (
              <BCard c={c}>
                {candidates.map((cand) => (
                  <Pressable
                    key={cand.placeId}
                    onPress={() => onSelectCandidate(cand)}
                  >
                    <View style={{ gap: 2 }}>
                      <BText c={c} v="title" color={c.ink}>
                        {cand.name}
                      </BText>
                      <BText c={c} v="caption" color={c.subtext}>
                        {cand.address}
                      </BText>
                    </View>
                  </Pressable>
                ))}
              </BCard>
            ) : null}

            {!selectedPlace &&
            !searching &&
            placeQuery.trim().length >= 3 &&
            candidates.length === 0 ? (
              <BText c={c} v="body" color={c.subtext}>
                {t("inviteForm.noResults")}
              </BText>
            ) : null}
          </BCard>

          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("inviteForm.customPlaceLabel")}
            </BText>
            <BInput
              c={c}
              label={t("inviteForm.customPlaceLabel")}
              placeholder={t("inviteForm.customPlacePlaceholder")}
              value={manualPlace}
              onChangeText={setManualPlace}
              hint={t("inviteForm.customPlaceHint")}
            />
          </BCard>
        </>
      ) : (
        <>
          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("inviteForm.timeLabel")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {t("inviteForm.timeBlurb")}
            </BText>
            <View
              style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
            >
              {quickTimes.map((q) => (
                <Pressable
                  key={q.key}
                  onPress={() =>
                    setStartTime(formatDateTimeLocalFromDate(q.getDate()))
                  }
                >
                  <BChip c={c} label={q.label} />
                </Pressable>
              ))}
            </View>
            <BInput
              c={c}
              label={t("inviteForm.timeLabel")}
              placeholder={t("inviteForm.startTimePlaceholder")}
              value={startTime}
              onChangeText={setStartTime}
              error={startTimeError ?? startPastDisplayError ?? undefined}
            />
            <BInput
              c={c}
              label={t("inviteForm.timeLabel")}
              placeholder={t("inviteForm.endTimePlaceholder")}
              value={endTime}
              onChangeText={setEndTime}
              error={endTimeError ?? timeRangeDisplayError ?? undefined}
            />
          </BCard>

          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("inviteForm.capacityLabel")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {t("inviteForm.capacityBlurb")}
            </BText>
            <View
              style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
            >
              {capacityPresets.map((p) => (
                <Pressable key={p.key} onPress={() => setCapacity(p.value)}>
                  <BChip
                    c={c}
                    label={p.label}
                    selected={capacity === p.value}
                  />
                </Pressable>
              ))}
            </View>
            <BText c={c} v="caption" color={c.subtext}>
              {t("inviteForm.capacityHint")}
            </BText>
            {capacityError ? (
              <BText c={c} v="caption" color={c.danger}>
                {capacityError}
              </BText>
            ) : null}
          </BCard>

          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("inviteForm.genderLabel")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {t("inviteForm.genderBlurb")}
            </BText>
            <View
              style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
            >
              {(["any", "female", "male"] as const).map((v) => (
                <Pressable key={v} onPress={() => setGenderPref(v)}>
                  <BChip
                    c={c}
                    label={t(`inviteForm.gender_${v}`)}
                    selected={genderPref === v}
                  />
                </Pressable>
              ))}
            </View>
          </BCard>

          <BCard c={c}>
            <BText c={c} v="label" color={c.subtext}>
              {t("inviteForm.expiryTitle")}
            </BText>
            <View
              style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
            >
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
            </View>
            <BText c={c} v="body" color={c.subtext}>
              {expiryHint}
            </BText>
          </BCard>
        </>
      )}

      <View
        style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}
      >
        {step > 0 ? (
          <BButton
            c={c}
            tone="secondary"
            label={t("common.back")}
            onPress={() => setStep((s) => s - 1)}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <BButton
            c={c}
            tone="primary"
            full
            label={
              submitting ? t("inviteForm.submitting") : effectiveSubmitLabel
            }
            onPress={handleSubmit}
          />
        </View>
        {step < 2 ? (
          <BButton
            c={c}
            tone="secondary"
            label={t("common.next")}
            onPress={() => setStep((s) => s + 1)}
          />
        ) : null}
      </View>

      {onCancel ? (
        <BButton
          c={c}
          tone="secondary"
          label={t("inviteForm.cancel")}
          onPress={onCancel}
        />
      ) : null}
    </View>
  );
}
