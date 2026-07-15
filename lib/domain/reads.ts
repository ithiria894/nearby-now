import { backend } from "../backend";

// ---------------------------------------------------------------------------
// Per-user "last read" watermark — now backed by the server.
//
// The backend migration 20260715120000 added activity_members.last_read_at plus
// mark_room_read() / unread_counts() RPCs (see .docs/UNREAD_MIGRATION.md). This
// module keeps the SAME public API the app already uses, so consumers
// (joined.tsx, created.tsx, room/[id].tsx) don't change — only the internals
// moved from on-device AsyncStorage to the synced server watermark.
// ---------------------------------------------------------------------------

/** activityId -> epoch milliseconds of the last message the user has seen. */
export type ReadMap = Record<string, number>;

function toMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export async function getLastReadMap(userId: string): Promise<ReadMap> {
  if (!userId) return {};
  try {
    const { data, error } = await backend.roomReads.getAllLastReads(userId);
    if (error) throw error;
    const map: ReadMap = {};
    for (const row of data ?? []) {
      const id = (row as { activity_id?: string }).activity_id;
      const at = toMs((row as { last_read_at?: string | null }).last_read_at);
      if (id && at > 0) map[id] = at;
    }
    return map;
  } catch {
    return {};
  }
}

export async function getLastRead(
  userId: string,
  activityId: string
): Promise<number> {
  if (!userId || !activityId) return 0;
  try {
    const { lastReadAt, error } = await backend.roomReads.getLastReadAt(
      userId,
      activityId
    );
    if (error) throw error;
    return toMs(lastReadAt);
  } catch {
    return 0;
  }
}

/**
 * Advance the read watermark for a room. The server does greatest() so the
 * watermark never moves backwards even if a stale screen re-marks an old ts.
 * Best-effort: unread is a convenience, so a failure here is swallowed.
 */
export async function markRead(
  _userId: string,
  activityId: string,
  atMs: number
): Promise<void> {
  if (!activityId || !Number.isFinite(atMs) || atMs <= 0) return;
  try {
    await backend.roomReads.markRoomRead(
      activityId,
      new Date(atMs).toISOString()
    );
  } catch {
    // best-effort; ignore
  }
}
