import { formatChangeValue } from "../i18n/i18n_format";

export type RoomEventType = "chat" | "quick" | "system";
export type QuickCode = "IM_HERE" | "LATE_10" | "CANCEL";

export type InviteChange =
  | { kind: "title"; from: string | null; to: string | null }
  | { kind: "place"; from: string | null; to: string | null }
  | { kind: "gender"; from: string | null; to: string | null }
  | { kind: "capacity"; from: number | null; to: number | null }
  | {
      kind: "expires";
      toMode: "never" | "datetime";
      iso?: string | null;
      to?: string | null;
    };

export type SystemEventKey =
  | "room.system.left"
  | "room.system.joined"
  | "room.system.invite_updated"
  | "room.system.invite_closed";

export type SystemEventContent =
  | { k: "room.system.left"; p?: Record<string, unknown> }
  | { k: "room.system.joined"; p?: Record<string, unknown> }
  | { k: "room.system.invite_updated"; p?: { changes?: InviteChange[] } }
  | { k: "room.system.invite_closed"; p?: Record<string, unknown> }
  | { k: string; p?: Record<string, unknown> };

export type RoomEventForRender = {
  user_id: string | null;
  type: RoomEventType;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
};

export type ActivityForRoomState = {
  status: string;
  expires_at: string | null;
};

export function hhmm(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function startOfLocalDayMs(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function sectionLabelForIso(
  t: (key: string) => string,
  lang: string,
  iso: string
): string {
  const d = new Date(iso);
  const now = new Date();
  const t0 = startOfLocalDayMs(d);
  const n0 = startOfLocalDayMs(now);

  const diffDays = Math.round((t0 - n0) / 86400000);
  if (diffDays === 0) return t("room.section_today");
  if (diffDays === -1) return t("room.section_yesterday");

  const month = d.toLocaleString(lang, { month: "short" });
  return `${month} ${d.getDate()}`;
}

export function getEventDisplayName(
  t: (key: string) => string,
  e: RoomEventForRender
): string {
  if (!e.user_id) return t("room.systemName");
  const name = (e.profiles?.display_name ?? "").trim();
  return name || t("room.unknownUser");
}

export function safeParseSystemContent(
  content: string
): SystemEventContent | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && "k" in parsed) {
      return parsed as SystemEventContent;
    }
    return null;
  } catch {
    return null;
  }
}

export function joinChangeLabels(labels: string[], lang: string): string {
  const l = lang.toLowerCase();
  const sep = l.startsWith("zh") || l.startsWith("ja") ? "、" : ", ";
  return labels.join(sep);
}

export function formatChangeLabel(
  t: (key: string, options?: Record<string, any>) => string,
  lang: string,
  change: InviteChange
): string {
  switch (change.kind) {
    case "title":
      return t("room.change.title", {
        from: formatChangeValue("title", change.from, t),
        to: formatChangeValue("title", change.to, t),
      });
    case "place":
      return t("room.change.place", {
        from: formatChangeValue("place", change.from, t),
        to: formatChangeValue("place", change.to, t),
      });
    case "gender":
      return t("room.change.gender", {
        from: formatChangeValue("gender_pref", change.from, t),
        to: formatChangeValue("gender_pref", change.to, t),
      });
    case "capacity":
      return t("room.change.capacity", {
        from: formatChangeValue("capacity", change.from, t),
        to: formatChangeValue("capacity", change.to, t),
      });
    case "expires": {
      if (change.toMode === "never") return t("room.change.expires.never");
      const iso = change.iso ?? change.to;
      const label = formatChangeValue("expires_at", iso, t);
      return t("room.change.expires.datetime", { to: label });
    }
    default:
      return "";
  }
}

export function renderEventContent(
  t: (key: string, options?: Record<string, any>) => string,
  lang: string,
  e: RoomEventForRender
): string {
  if (e.type === "quick") {
    switch (e.content as QuickCode) {
      case "IM_HERE":
        return t("room.quick.imHere");
      case "LATE_10":
        return t("room.quick.late10");
      case "CANCEL":
        return t("room.quick.cancel");
      default:
        return e.content;
    }
  }

  if (e.type === "system") {
    const parsed = safeParseSystemContent(e.content);
    if (parsed?.k) {
      if (parsed.k === "room.system.joined") {
        const name = getEventDisplayName(t, e);
        return t(parsed.k, { ...(parsed.p ?? {}), name });
      }

      if (parsed.k === "room.system.left") {
        const name = getEventDisplayName(t, e);
        return t(parsed.k, { ...(parsed.p ?? {}), name });
      }

      if (parsed.k === "room.system.invite_updated") {
        const changes = Array.isArray(parsed.p?.changes)
          ? parsed.p.changes
          : [];
        const labels = changes
          .map((c) => formatChangeLabel(t, lang, c))
          .filter((x) => x);
        const joined = joinChangeLabels(labels, lang);
        return t(parsed.k, { changes: joined });
      }

      if (parsed.k === "room.system.invite_closed") {
        return t(parsed.k, parsed.p ?? {});
      }

      return t(parsed.k, parsed.p ?? {});
    }
  }

  return e.content;
}

export function computeRoomState(activity: ActivityForRoomState | null) {
  const isClosed = !!activity && activity.status !== "open";
  const expiresAtMs = activity?.expires_at
    ? new Date(activity.expires_at).getTime()
    : null;
  const isExpired = expiresAtMs != null && expiresAtMs <= Date.now();
  const isReadOnly = isClosed || isExpired;

  let labelKey: "closed" | "expired" | null = null;
  if (isClosed) labelKey = "closed";
  else if (isExpired) labelKey = "expired";

  return { isClosed, isExpired, isReadOnly, labelKey };
}

export function friendlyDbError(
  t: (key: string) => string,
  message: string
): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security")) {
    return t("room.readOnlyAlertBody");
  }
  return message;
}
