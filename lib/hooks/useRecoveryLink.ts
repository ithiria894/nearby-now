import { useEffect } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { backend } from "../backend";

// Extract the recovery tokens from a password-reset deep link. Supabase puts
// them in the URL fragment: nearbynow://reset-password#access_token=...&
// refresh_token=...&type=recovery.
function parseRecoveryTokens(
  url: string
): { accessToken: string; refreshToken: string } | null {
  const frag = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
  if (!frag) return null;
  const p = new URLSearchParams(frag);
  const accessToken = p.get("access_token");
  const refreshToken = p.get("refresh_token");
  const type = p.get("type");
  if (accessToken && refreshToken && (type === "recovery" || type === null)) {
    return { accessToken, refreshToken };
  }
  return null;
}

/**
 * Handle a password-recovery deep link: when the app is opened from the reset
 * email, establish the recovery session from the URL tokens and route to the
 * reset-password screen. Used once, at the app root.
 */
export function useRecoveryLink() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    async function handle(url: string | null) {
      if (!url) return;
      const tokens = parseRecoveryTokens(url);
      if (!tokens) return;
      try {
        const { error } = await backend.auth.setSessionFromTokens(
          tokens.accessToken,
          tokens.refreshToken
        );
        if (error) throw error;
        if (alive) router.replace("/reset-password");
      } catch (e) {
        console.error("recovery deep link failed:", e);
      }
    }

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    return () => {
      alive = false;
      sub.remove();
    };
  }, [router]);
}
