import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------------------------------------------------------
// Local, per-user stand-in for a server-side "last read" marker.
//
// The backend has no read-tracking yet (no last_read_at column, no unread RPC),
// and we can't change the production schema from the app. So until a backend
// migration lands (see .docs/UNREAD_MIGRATION.md), we remember how far each
// room has been read *on this device*, in AsyncStorage, keyed per user so two
// accounts on one phone don't clobber each other.
//
// Unread COUNTS are still derived from real room_events — this store only holds
// the "where I last read up to" watermark. When the server column exists, point
// these functions at it and the rest of the app keeps working unchanged.
// ---------------------------------------------------------------------------

const key = (userId: string) => `reads.lastReadAt.v1.${userId}`;

/** activityId -> epoch milliseconds of the last message the user has seen. */
export type ReadMap = Record<string, number>;

export async function getLastReadMap(userId: string): Promise<ReadMap> {
  if (!userId) return {};
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ReadMap;
    }
    return {};
  } catch {
    return {};
  }
}

export async function getLastRead(
  userId: string,
  activityId: string
): Promise<number> {
  const map = await getLastReadMap(userId);
  return map[activityId] ?? 0;
}

/**
 * Advance the read watermark for a room. Never moves backwards, so a stale
 * screen re-marking an old timestamp can't resurrect unread counts.
 */
export async function markRead(
  userId: string,
  activityId: string,
  atMs: number
): Promise<void> {
  if (!userId || !activityId || !Number.isFinite(atMs)) return;
  try {
    const map = await getLastReadMap(userId);
    if ((map[activityId] ?? 0) >= atMs) return;
    map[activityId] = atMs;
    await AsyncStorage.setItem(key(userId), JSON.stringify(map));
  } catch {
    // Unread is a best-effort convenience; ignore storage failures.
  }
}
