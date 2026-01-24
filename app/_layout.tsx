// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;

    async function guard() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;
      if (error) console.error("getSession error:", error);

      // segments: e.g. ["login"] / ["register"] / ["room", "[id]"] / ["index"]
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

  // ✅ DO NOT block rendering
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{ title: "Login", headerShown: false }}
      />
      <Stack.Screen name="register" options={{ title: "Register" }} />
      <Stack.Screen name="index" options={{ title: "Nearby Now" }} />
      <Stack.Screen name="create" options={{ title: "Create" }} />
      <Stack.Screen name="room/[id]" options={{ title: "Room" }} />
    </Stack>
  );
}
