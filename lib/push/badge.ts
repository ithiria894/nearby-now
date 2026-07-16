import * as Notifications from "expo-notifications";
import { backend } from "../backend";

/** Set the app icon badge to `count` (clamped to >= 0). Best-effort. */
export async function setBadge(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, Math.trunc(count)));
  } catch {
    // no-op on platforms/devices without badge support
  }
}

/**
 * Recompute the user's total unread across all joined rooms and push it to the
 * app icon badge. Uses the same server unread_counts RPC as the in-app badges,
 * so the icon number always matches the list. Returns the total.
 */
export async function refreshBadge(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const { data: rows, error } =
      await backend.activities.fetchMembershipRowsForUser(userId);
    if (error) throw error;
    const activityIds = (rows ?? [])
      .filter((r) => (r as { state?: string }).state === "joined")
      .map((r) => (r as { activity_id: string }).activity_id);
    if (activityIds.length === 0) {
      await setBadge(0);
      return 0;
    }
    const { data } = await backend.roomReads.getUnreadCounts(activityIds);
    const total = (data ?? []).reduce(
      (sum, r) => sum + (r.unread_count ?? 0),
      0
    );
    await setBadge(total);
    return total;
  } catch (e) {
    console.error("refreshBadge failed:", e);
    return 0;
  }
}
