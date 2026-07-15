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
    // setTokenLocation RESOLVES with {error} on a Postgres/RLS failure (it does
    // not throw), so a silent write failure would otherwise leave the user
    // un-targetable with no trail. Log it explicitly.
    const { error } = await backend.push.setTokenLocation(userId, lat, lng);
    if (error) {
      console.error("updatePushLocation: setTokenLocation failed:", error);
    }
  } catch (e) {
    console.error("updatePushLocation failed:", e);
  }
}
