import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { backend } from "../lib/backend";

// Route by auth state up front so a logged-out user goes straight to Login,
// instead of always redirecting into /(tabs)/browse (which then fails to load,
// flashes a "Not authenticated" error, and only then bounces to Login).
export default function Index() {
  const [href, setHref] = useState<"/(tabs)/browse" | "/login" | null>(null);

  useEffect(() => {
    let mounted = true;
    backend.auth
      .getSession()
      .then(({ session }) => {
        if (mounted) setHref(session?.user ? "/(tabs)/browse" : "/login");
      })
      .catch(() => {
        // On a transient/offline session read, prefer the app; the per-screen
        // guard still protects data and won't false-logout on a transient error.
        if (mounted) setHref("/(tabs)/browse");
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!href) return null;
  return <Redirect href={href} />;
}
