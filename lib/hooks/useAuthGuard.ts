import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { supabase } from "../api/supabase";

export function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;

    async function guard() {
      if (!segments.length) return;
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;
      if (error) console.error("getSession error:", error);

      const inAuthScreen =
        segments[0] === "login" || segments[0] === "register";

      if (!session?.user && !inAuthScreen) {
        router.replace("/login");
      }
    }

    guard();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      guard();
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, segments]);
}
