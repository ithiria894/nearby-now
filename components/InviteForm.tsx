import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { searchPlacesNominatim, type PlaceCandidate } from "../lib/places";
import { useT } from "../lib/useT";

type GenderPref = "any" | "female" | "male";

export type InviteFormPayload = {
  title_text: string;
  place_name: string | null;
  place_address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  location_source: string | null;
  gender_pref: GenderPref;
  capacity: number | null;
  expires_at?: string | null;
};

type InviteFormInitialValues = {
  title_text?: string;
  place_name?: string | null;
  place_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  place_id?: string | null;
  location_source?: string | null;
  gender_pref?: GenderPref | null;
  capacity?: number | null;
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

  const { t } = useT();
  const initialPlace = buildInitialPlace(initialValues, t);
  const effectiveSubmitLabel =
    submitLabel ?? (mode === "edit" ? t("edit.save") : t("create.submit"));

  const [title, setTitle] = useState(initialValues?.title_text ?? "");
  const [placeQuery, setPlaceQuery] = useState(initialPlace?.name ?? "");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    initialPlace
  );
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [genderPref, setGenderPref] = useState<GenderPref>(
    (initialValues?.gender_pref as GenderPref) ?? "any"
  );
  const [capacity, setCapacity] = useState(
    initialValues?.capacity == null ? "" : String(initialValues.capacity)
  );
  const [expiryMode, setExpiryMode] = useState<"default" | "never" | "preset">(
    initialValues?.expires_at === null ? "never" : "default"
  );
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);

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
    setCandidates([]);
    setSearching(false);
  };

  const onClearSelection = () => {
    setSelectedPlace(null);
    setPlaceQuery("");
    setCandidates([]);
    setSearching(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t("inviteForm.missingTitle"), t("inviteForm.missingBody"));
      return;
    }

    if (placeQuery.trim() !== "" && !selectedPlace) {
      Alert.alert(
        t("inviteForm.selectPlaceTitle"),
        t("inviteForm.selectPlaceBody")
      );
      return;
    }

    const trimmedCapacity = capacity.trim();
    let capacityNum: number | null = null;
    if (trimmedCapacity !== "") {
      const parsed = Number(trimmedCapacity);
      if (!Number.isInteger(parsed) || parsed < 1) {
        Alert.alert(t("inviteForm.invalidTitle"), t("inviteForm.invalidBody"));
        return;
      }
      capacityNum = parsed;
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
      : null;

    await onSubmit({
      title_text: title.trim(),
      place_name: placeName,
      place_address: placeAddress,
      lat,
      lng,
      place_id: placeId,
      location_source: locationSource,
      gender_pref: genderPref,
      capacity: capacityNum,
      expires_at: expiresAt,
    });
  };

  const expiryHint =
    expiryMode === "never"
      ? t("inviteForm.expiry_hint_never")
      : expiryMode === "preset" && expiryMinutes != null
        ? t("inviteForm.expiry_hint_preset", { minutes: expiryMinutes })
        : mode === "edit"
          ? t("inviteForm.expiry_hint_edit")
          : t("inviteForm.expiry_hint_default");

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("inviteForm.titlePlaceholder")}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <View style={{ gap: 8 }}>
        <TextInput
          value={placeQuery}
          onChangeText={onChangePlaceQuery}
          placeholder={t("inviteForm.placePlaceholder")}
          style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
        />

        {selectedPlace ? (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              gap: 4,
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
                alignSelf: "flex-start",
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
          <View style={{ borderWidth: 1, borderRadius: 10 }}>
            {candidates.map((c) => (
              <Pressable
                key={c.placeId}
                onPress={() => onSelectCandidate(c)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
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
              opacity: genderPref === v ? 1 : 0.6,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {t(`inviteForm.gender_${v}`)}
            </Text>
          </Pressable>
        ))}
      </View>

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
            opacity: expiryMode === "default" ? 1 : 0.6,
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
              opacity:
                expiryMode === "preset" && expiryMinutes === p.minutes
                  ? 1
                  : 0.6,
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
            opacity: expiryMode === "never" ? 1 : 0.6,
          }}
        >
          <Text style={{ fontWeight: "600" }}>
            {t("inviteForm.expiry_never")}
          </Text>
        </Pressable>
      </View>
      <Text style={{ opacity: 0.7 }}>{expiryHint}</Text>

      <TextInput
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
        placeholder={t("inviteForm.capacityPlaceholder")}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
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
