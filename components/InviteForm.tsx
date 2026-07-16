import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { searchPlacesNominatim, type PlaceCandidate } from "../lib/api/places";
import { VIBES, VIBE_META } from "../lib/ui/vibe";
import { useT } from "../lib/i18n/useT";
import { formatExpiryLabel } from "../lib/i18n/i18n_format";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { space } from "../src/ui/theme/uikit";
import {
  BAccordion,
  BButton,
  BCard,
  BChip,
  BInput,
  BText,
} from "../src/ui/components/brutal";
import {
  EXPIRY_PRESETS,
  buildQuickTimes,
  formatDateTimeLocal,
  formatDateTimeLocalFromDate,
  parseDateTimeInput,
} from "../lib/ui/form_time";

type GenderPref = "any" | "female" | "male";
type Section = "where" | "when" | "who" | "expires";

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
  const [openSection, setOpenSection] = useState<Section | null>(null);
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

  const quickTimes = useMemo(() => buildQuickTimes(t), [t]);
  const searchIdRef = useRef(0);

  const toggleSection = (s: Section) =>
    setOpenSection((v) => (v === s ? null : s));

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

  const onSelectCandidate = (cand: PlaceCandidate) => {
    setSelectedPlace({
      placeId: cand.placeId || null,
      name: cand.name,
      address: cand.address,
      lat: cand.lat,
      lng: cand.lng,
      source: "nominatim",
    });
    setPlaceQuery(cand.name);
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

  // Surface a validation problem in a collapsed section by auto-opening it.
  const openSectionWithError = () => {
    if (
      startParsed.error ||
      endParsed.error ||
      timeRangeError ||
      startPastError
    )
      setOpenSection("when");
    else if (parsedCapacity.error) setOpenSection("who");
  };

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
      openSectionWithError();
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

  // ---- collapsed-row summaries (brand when a value is set) ----
  const placeLabel = selectedPlace?.name || manualPlace.trim();
  const whereSummary = placeLabel || t("compose.where_add");
  const whenSummary = startTime.trim() || t("compose.when_add");
  const whoSummary = useMemo(() => {
    const parts: string[] = [];
    if (genderPref !== "any")
      parts.push(
        t(genderPref === "female" ? "compose.g_women" : "compose.g_men")
      );
    if (capacity != null) parts.push(t("compose.people_n", { n: capacity }));
    return parts.length ? parts.join(" · ") : t("compose.who_anyone");
  }, [genderPref, capacity, t]);
  const whoFilled = genderPref !== "any" || capacity != null;
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

  const rowChips = (children: React.ReactNode) => (
    <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
      {children}
    </View>
  );

  return (
    <View style={{ gap: space.md }}>
      {/* Title — required; the only thing needed to save. */}
      <BInput
        c={c}
        label={t("inviteForm.titleLabel")}
        placeholder={t("inviteForm.titlePlaceholder")}
        value={title}
        onChangeText={setTitle}
        error={titleError ?? undefined}
      />

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
        summary={whereSummary}
        filled={!!placeLabel}
        open={openSection === "where"}
        onToggle={() => toggleSection("where")}
      >
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

        <BInput
          c={c}
          label={t("inviteForm.customPlaceLabel")}
          placeholder={t("inviteForm.customPlacePlaceholder")}
          value={manualPlace}
          onChangeText={setManualPlace}
          hint={t("inviteForm.customPlaceHint")}
        />
      </BAccordion>

      <BAccordion
        c={c}
        label={t("compose.sec_when")}
        summary={whenSummary}
        filled={!!startTime.trim()}
        open={openSection === "when"}
        onToggle={() => toggleSection("when")}
      >
        <BText c={c} v="caption" color={c.subtext}>
          {t("inviteForm.timeBlurb")}
        </BText>
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
        <BInput
          c={c}
          label={t("inviteForm.startTimePlaceholder")}
          placeholder={t("inviteForm.startTimePlaceholder")}
          value={startTime}
          onChangeText={setStartTime}
          error={startTimeError ?? startPastDisplayError ?? undefined}
        />
        <BInput
          c={c}
          label={t("inviteForm.endTimePlaceholder")}
          placeholder={t("inviteForm.endTimePlaceholder")}
          value={endTime}
          onChangeText={setEndTime}
          error={endTimeError ?? timeRangeDisplayError ?? undefined}
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
        {capacityError ? (
          <BText c={c} v="caption" color={c.danger}>
            {capacityError}
          </BText>
        ) : null}
        <BText c={c} v="caption" color={c.subtext}>
          {t("inviteForm.genderLabel")}
        </BText>
        {rowChips(
          (["any", "female", "male"] as const).map((g) => (
            <Pressable key={g} onPress={() => setGenderPref(g)}>
              <BChip
                c={c}
                label={t(`inviteForm.gender_${g}`)}
                selected={genderPref === g}
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
        <BText c={c} v="body" color={c.subtext}>
          {expiryHint}
        </BText>
      </BAccordion>

      <BButton
        c={c}
        tone="primary"
        full
        label={submitting ? t("inviteForm.submitting") : effectiveSubmitLabel}
        onPress={handleSubmit}
      />

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
