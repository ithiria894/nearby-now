import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { backend } from "../backend";

export function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;

    async function guard() {
      if (!segments.length) return;
      const { session, error } = await backend.auth.getSession();

      if (!isMounted) return;
      if (error) {
        // Transient/offline getSession failure: keep the user where they are
        // instead of falsely logging out an authenticated (but offline) user.
        console.error("getSession error:", error);
        return;
      }

      const inAuthScreen =
        segments[0] === "login" || segments[0] === "register";

      if (!session?.user && !inAuthScreen) {
        router.replace("/login");
      }
    }

    guard();

    const sub = backend.auth.onAuthStateChange(() => {
      guard();
    });

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, [router, segments]);
}
