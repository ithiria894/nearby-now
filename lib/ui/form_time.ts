// Shared time / expiry helpers for the one-page invite forms (Quick Post +
// Create/Edit). Kept framework-free so both screens parse and format the same
// "YYYY-MM-DD HH:MM" local-time strings and offer the same quick presets.

export const pad2 = (value: number) => String(value).padStart(2, "0");

export function formatDateTimeLocalFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return formatDateTimeLocalFromDate(d);
}

export function parseDateTimeInput(value: string) {
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

export const EXPIRY_PRESETS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "8h", minutes: 480 },
];

// Quick "start time" chips: tonight / in a couple hours / this weekend / next week.
export function buildQuickTimes(t: (key: string) => string) {
  return [
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
}
