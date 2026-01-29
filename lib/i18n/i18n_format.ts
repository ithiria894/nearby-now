export type Translator = (key: string, params?: Record<string, any>) => string;

type GenderPref = string | null | undefined;
type CapacityValue = number | string | null | undefined;

type ChangeField =
  | "gender_pref"
  | "capacity"
  | "expires_at"
  | "place"
  | "title";

function normalizeString(value: string): string {
  return value.trim().toLowerCase();
}

export function formatGenderPref(value: GenderPref, t: Translator): string {
  const v = normalizeString(String(value ?? ""));
  if (v === "female" || v === "f") return t("gender.female");
  if (v === "male" || v === "m") return t("gender.male");
  if (v === "any") return t("gender.any");
  return t("common.unknown");
}

export function formatCapacity(value: CapacityValue, t: Translator): string {
  if (value == null || value === "") return t("capacity.unlimited");
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isInteger(n) && n >= 1) return t("capacity.n", { n });
  return t("common.unknown");
}

export function formatExpiryLabel(
  expiresAtIso: string | null | undefined,
  nowMs: number,
  t: Translator
): string {
  if (expiresAtIso == null) return t("expiry.none");
  const ts = new Date(expiresAtIso).getTime();
  if (!Number.isFinite(ts)) return t("common.unknown");
  if (ts <= nowMs) return t("expiry.expired");

  const mins = Math.ceil((ts - nowMs) / 60000);
  if (mins < 60) return t("time.in_minutes", { n: mins });

  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return t("time.in_hours", { h });
  return t("time.in_hours_minutes", { h, m });
}

export function formatLocalDateTime(
  iso: string | null | undefined,
  t: Translator,
  options?: Intl.DateTimeFormatOptions
): string {
  if (iso == null) return t("common.never");
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return t("common.unknown");
  return new Date(iso).toLocaleString(undefined, options);
}

export function formatChangeValue(
  field: ChangeField,
  value: any,
  t: Translator
): string {
  switch (field) {
    case "gender_pref":
      return formatGenderPref(value, t);
    case "capacity":
      return formatCapacity(value, t);
    case "expires_at":
      return formatLocalDateTime(value, t);
    case "place": {
      const v = typeof value === "string" ? value.trim() : "";
      return v ? v : t("place.none");
    }
    case "title": {
      const v = typeof value === "string" ? value.trim() : "";
      return v ? v : t("common.unknown");
    }
    default:
      return t("common.unknown");
  }
}

export function createFormatters(t: Translator) {
  return {
    genderLabel: (value: GenderPref) => formatGenderPref(value, t),
    capacityLabel: (value: CapacityValue) => formatCapacity(value, t),
    expiryLabel: (iso: string | null | undefined, nowMs: number) =>
      formatExpiryLabel(iso, nowMs, t),
    localDateTime: (
      iso: string | null | undefined,
      options?: Intl.DateTimeFormatOptions
    ) => formatLocalDateTime(iso, t, options),
    changeValue: (field: ChangeField, value: any) =>
      formatChangeValue(field, value, t),
  };
}
