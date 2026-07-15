import { backend } from "../backend";

// Report + block other users. reporter_id / blocker_id default to auth.uid()
// server-side, so callers never pass their own id (the DB + RLS enforce it).

export async function reportUser(
  reportedUserId: string,
  opts?: { activityId?: string | null; reason?: string | null }
): Promise<void> {
  const { error } = await backend.safety.reportUser({
    reportedUserId,
    activityId: opts?.activityId ?? null,
    reason: opts?.reason ?? null,
  });
  if (error) throw error;
}

export async function blockUser(blockedId: string): Promise<void> {
  const { error } = await backend.safety.blockUser(blockedId);
  if (error) throw error;
}

export async function unblockUser(blockedId: string): Promise<void> {
  const { error } = await backend.safety.unblockUser(blockedId);
  if (error) throw error;
}

/** The set of user ids the current user has blocked. */
export async function getBlockedIds(): Promise<Set<string>> {
  const { data, error } = await backend.safety.getBlockedIds();
  if (error) throw error;
  return new Set(data ?? []);
}

/**
 * Drop items authored by a blocked user. `getAuthorId` maps an item to the user
 * id to check (e.g. activity.creator_id, event.user_id). Pure — used to filter
 * the feed + room content once `getBlockedIds()` is loaded.
 */
export function filterOutBlocked<T>(
  items: T[],
  getAuthorId: (item: T) => string | null | undefined,
  blocked: Set<string>
): T[] {
  if (blocked.size === 0) return items;
  return items.filter((it) => {
    const id = getAuthorId(it);
    return !id || !blocked.has(id);
  });
}
