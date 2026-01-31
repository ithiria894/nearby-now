import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { searchPlacesNominatim, type PlaceCandidate } from "../lib/api/places";
import { useT } from "../lib/i18n/useT";
import { formatExpiryLabel } from "../lib/i18n/i18n_format";
import { useTheme } from "../src/ui/theme/ThemeProvider";

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

  const theme = useTheme();
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

  const titleError =
    didSubmit && !title.trim() ? t("inviteForm.titleRequired") : null;
  const capacityError = didSubmit ? parsedCapacity.error : null;
  const startTimeError =
    didSubmit && startParsed.error ? t("inviteForm.timeFormatError") : null;
  const endTimeError =
    didSubmit && endParsed.error ? t("inviteForm.timeFormatError") : null;
  const timeRangeDisplayError = didSubmit ? timeRangeError : null;

  const handleSubmit = async () => {
    setDidSubmit(true);
    if (
      !title.trim() ||
      parsedCapacity.error ||
      startParsed.error ||
      endParsed.error ||
      timeRangeError
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
      : manualPlace.trim() || placeQuery.trim()
        ? "manual"
        : null;
    const placeTextValue = selectedPlace
      ? null
      : manualPlace.trim() || placeQuery.trim() || null;

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

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontWeight: "800" }}>{t("inviteForm.titleLabel")}</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("inviteForm.titlePlaceholder")}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 12,
          backgroundColor: theme.colors.surface,
        }}
      />
      {titleError ? (
        <Text style={{ color: theme.colors.dangerText, fontSize: 12 }}>
          {titleError}
        </Text>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "800" }}>{t("inviteForm.placeLabel")}</Text>
        <TextInput
          value={placeQuery}
          onChangeText={onChangePlaceQuery}
          placeholder={t("inviteForm.placePlaceholder")}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 10,
            padding: 12,
            backgroundColor: theme.colors.surface,
          }}
        />
        <Text style={{ fontSize: 12, opacity: 0.7 }}>
          {t("inviteForm.placeHint")}
        </Text>

        {selectedPlace ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 10,
              padding: 10,
              gap: 4,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700" }}>
              {selectedPlace.name}
            </Text>
            <Text style={{ opacity: 0.7 }}>{selectedPlace.address}</Text>
            <Pressable
              onPress={onClearSelection}
              style={{
                marginTop: 6,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignSelf: "flex-start",
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text style={{ fontWeight: "600" }}>
                {t("inviteForm.clearSelection")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {searching ? (
          <Text style={{ opacity: 0.7 }}>{t("inviteForm.searching")}</Text>
        ) : null}

        {!selectedPlace && candidates.length > 0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 10,
              backgroundColor: theme.colors.surface,
            }}
          >
            {candidates.map((c) => (
              <Pressable
                key={c.placeId}
                onPress={() => onSelectCandidate(c)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700" }}>
                  {c.name}
                </Text>
                <Text style={{ fontSize: 12, opacity: 0.7 }}>{c.address}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!selectedPlace &&
        !searching &&
        placeQuery.trim().length >= 3 &&
        candidates.length === 0 ? (
          <Text style={{ opacity: 0.7 }}>{t("inviteForm.noResults")}</Text>
        ) : null}
      </View>

      <Text style={{ fontWeight: "800" }}>
        {t("inviteForm.customPlaceLabel")}
      </Text>
      <TextInput
        value={manualPlace}
        onChangeText={setManualPlace}
        placeholder={t("inviteForm.customPlacePlaceholder")}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 12,
          backgroundColor: theme.colors.surface,
        }}
      />
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        {t("inviteForm.customPlaceHint")}
      </Text>

      <Text style={{ fontWeight: "800" }}>{t("inviteForm.genderLabel")}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["any", "female", "male"] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setGenderPref(v)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: genderPref === v ? 1 : 0.6,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {t(`inviteForm.gender_${v}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ fontWeight: "800" }}>{t("inviteForm.timeLabel")}</Text>
      <TextInput
        value={startTime}
        onChangeText={setStartTime}
        placeholder={t("inviteForm.startTimePlaceholder")}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 12,
          backgroundColor: theme.colors.surface,
        }}
      />
      {startTimeError ? (
        <Text style={{ color: theme.colors.dangerText, fontSize: 12 }}>
          {startTimeError}
        </Text>
      ) : null}
      <TextInput
        value={endTime}
        onChangeText={setEndTime}
        placeholder={t("inviteForm.endTimePlaceholder")}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 12,
          backgroundColor: theme.colors.surface,
        }}
      />
      {endTimeError ? (
        <Text style={{ color: theme.colors.dangerText, fontSize: 12 }}>
          {endTimeError}
        </Text>
      ) : null}
      {timeRangeDisplayError ? (
        <Text style={{ color: theme.colors.dangerText, fontSize: 12 }}>
          {timeRangeDisplayError}
        </Text>
      ) : null}

      <Text style={{ fontWeight: "800" }}>{t("inviteForm.expiryTitle")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable
          onPress={() => {
            setExpiryMode("default");
            setExpiryMinutes(null);
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: expiryMode === "default" ? 1 : 0.6,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontWeight: "600" }}>
            {t("inviteForm.expiry_default")}
          </Text>
        </Pressable>

        {EXPIRY_PRESETS.map((p) => (
          <Pressable
            key={p.label}
            onPress={() => {
              setExpiryMode("preset");
              setExpiryMinutes(p.minutes);
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity:
                expiryMode === "preset" && expiryMinutes === p.minutes
                  ? 1
                  : 0.6,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text style={{ fontWeight: "600" }}>{p.label}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => {
            setExpiryMode("never");
            setExpiryMinutes(null);
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: expiryMode === "never" ? 1 : 0.6,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontWeight: "600" }}>
            {t("inviteForm.expiry_never")}
          </Text>
        </Pressable>
      </View>
      <Text style={{ opacity: 0.7 }}>{expiryHint}</Text>

      <Text style={{ fontWeight: "800" }}>{t("inviteForm.capacityLabel")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          onPress={() =>
            setCapacity((prev) => {
              if (!prev) return null;
              const next = prev - 1;
              return next <= 0 ? null : next;
            })
          }
          disabled={!capacity}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: capacity ? 1 : 0.4,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontWeight: "700" }}>-</Text>
        </Pressable>
        <View
          style={{
            minWidth: 86,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: "center",
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontWeight: "700" }}>
            {capacity ?? t("inviteForm.capacityNoLimit")}
          </Text>
        </View>
        <Pressable
          onPress={() => setCapacity((prev) => (prev ?? 0) + 1)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontWeight: "700" }}>+</Text>
        </Pressable>
        <Pressable
          onPress={() => setCapacity(null)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: capacity == null ? 0.5 : 1,
          }}
        >
          <Text style={{ fontWeight: "600" }}>
            {t("inviteForm.capacityNoLimit")}
          </Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        {t("inviteForm.capacityHint")}
      </Text>
      {capacityError ? (
        <Text style={{ color: theme.colors.dangerText, fontSize: 12 }}>
          {capacityError}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <Text style={{ fontWeight: "800" }}>
            {submitting ? t("inviteForm.submitting") : effectiveSubmitLabel}
          </Text>
        </Pressable>

        {onCancel ? (
          <Pressable
            onPress={onCancel}
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{t("inviteForm.cancel")}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
