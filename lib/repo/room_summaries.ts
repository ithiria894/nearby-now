import { fetchRoomEventsPage } from "./room_repo";
import type { RoomEventRow } from "../domain/room_events";

// How many recent events we scan per room to build a preview + unread count.
// There's no server-side unread count yet (see .docs/UNREAD_MIGRATION.md), so we
// pull the tail of each room's history and count client-side. Kept modest so a
// lobby with many rooms doesn't fan out into huge fetches.
const SUMMARY_FETCH_LIMIT = 40;

export type RoomLastMessage = {
  senderId: string | null;
  senderName: string | null; // raw profiles.display_name; caller adds "You"/fallback
  event: RoomEventRow; // full event so callers can renderEventContent()
  at: number; // epoch ms
};

export type RoomSummary = {
  lastMessage: RoomLastMessage | null;
  unreadCount: number;
  /** True when unread hit the scan cap and the real number may be higher. */
  unreadCapped: boolean;
};

function isRealMessage(e: RoomEventRow): boolean {
  return e.type === "chat" || e.type === "quick";
}

/**
 * Batch-build a conversation summary (last message + unread count) for each
 * room. Unread = real messages newer than the caller's per-room read watermark
 * (`since`) that weren't authored by the caller. System events (joins, edits)
 * don't count as unread but can still be the "last message" shown as a preview.
 */
export async function getRoomSummaries(params: {
  activityIds: string[];
  meId: string;
  since: Record<string, number>; // activityId -> last-read epoch ms
}): Promise<Record<string, RoomSummary>> {
  const { activityIds, meId, since } = params;
  const out: Record<string, RoomSummary> = {};

  await Promise.all(
    activityIds.map(async (activityId) => {
      try {
        const page = await fetchRoomEventsPage({
          activityId,
          limit: SUMMARY_FETCH_LIMIT,
        });
        const rows = page.rows; // ascending: oldest -> newest
        const last = rows.length ? rows[rows.length - 1] : null;
        const readAt = since[activityId] ?? 0;

        // Only surface unread once a room has actually been opened (readAt > 0).
        // Otherwise a first launch would flag every room's whole history as
        // unread, which the chat's "New messages" divider deliberately doesn't
        // do. The real backend can use a smarter baseline (e.g. joined_at).
        let unread = 0;
        if (readAt > 0) {
          for (const e of rows) {
            if (!isRealMessage(e)) continue;
            if (e.user_id === meId) continue;
            if (new Date(e.created_at).getTime() > readAt) unread++;
          }
        }

        out[activityId] = {
          lastMessage: last
            ? {
                senderId: last.user_id,
                senderName: last.profiles?.display_name ?? null,
                event: last,
                at: new Date(last.created_at).getTime(),
              }
            : null,
          unreadCount: unread,
          unreadCapped: unread >= SUMMARY_FETCH_LIMIT,
        };
      } catch {
        // A single room failing shouldn't blank the whole list.
        out[activityId] = {
          lastMessage: null,
          unreadCount: 0,
          unreadCapped: false,
        };
      }
    })
  );

  return out;
}
