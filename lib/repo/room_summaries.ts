import { fetchRoomEventsPage } from "./room_repo";
import { backend } from "../backend";
import type { RoomEventRow } from "../domain/room_events";

// How many recent events we scan per room to build the last-message preview.
// Unread COUNTS now come from the server (unread_counts RPC, migration
// 20260715120000); this fetch is only for the preview text shown in the list.
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
  /** Kept for API compat; the server count is exact so this is always false. */
  unreadCapped: boolean;
};

/**
 * Batch-build a conversation summary (last message + unread count) for each
 * room. Unread now comes from the server unread_counts RPC — real messages
 * (chat/quick) newer than the caller's watermark, not authored by the caller,
 * with joined_at as the never-read baseline. The last-message preview is still
 * fetched per room. `meId` / `since` are accepted for API compatibility but no
 * longer needed (the server owns the watermark + own-message filter).
 */
export async function getRoomSummaries(params: {
  activityIds: string[];
  meId: string;
  since: Record<string, number>;
}): Promise<Record<string, RoomSummary>> {
  const { activityIds } = params;
  const out: Record<string, RoomSummary> = {};
  if (activityIds.length === 0) return out;

  // Unread counts: one server round-trip for all rooms.
  const unreadByRoom: Record<string, number> = {};
  try {
    const { data, error } =
      await backend.roomReads.getUnreadCounts(activityIds);
    if (!error) {
      for (const r of data ?? []) {
        unreadByRoom[r.activity_id] = r.unread_count ?? 0;
      }
    }
  } catch {
    // Unread is best-effort; leave counts at 0 if the call fails.
  }

  // Last-message preview: still per room.
  await Promise.all(
    activityIds.map(async (activityId) => {
      try {
        const page = await fetchRoomEventsPage({
          activityId,
          limit: SUMMARY_FETCH_LIMIT,
        });
        const rows = page.rows; // ascending: oldest -> newest
        const last = rows.length ? rows[rows.length - 1] : null;
        out[activityId] = {
          lastMessage: last
            ? {
                senderId: last.user_id,
                senderName: last.profiles?.display_name ?? null,
                event: last,
                at: new Date(last.created_at).getTime(),
              }
            : null,
          unreadCount: unreadByRoom[activityId] ?? 0,
          unreadCapped: false,
        };
      } catch {
        // A single room failing shouldn't blank the whole list.
        out[activityId] = {
          lastMessage: null,
          unreadCount: unreadByRoom[activityId] ?? 0,
          unreadCapped: false,
        };
      }
    })
  );

  return out;
}
