import { backend } from "../backend";

/**
 * Write the device's current location onto this user's push token(s) so the
 * nearby-activity trigger can match them. Best-effort + fire-and-forget: any
 * failure (no session, no token row yet, network) is swallowed — location is a
 * nice-to-have signal for push targeting, never a blocker for the browse flow.
 */
export async function updatePushLocation(
  lat: number,
  lng: number
): Promise<void> {
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const { session } = await backend.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await backend.push.setTokenLocation(userId, lat, lng);
  } catch (e) {
    console.error("updatePushLocation failed:", e);
  }
}
