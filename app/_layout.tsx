// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import "fast-text-encoding"; // ✅ provides TextDecoder/TextEncoder
import "react-native-url-polyfill/auto"; // ✅ provides URL, URLSearchParams

// :zap: CHANGE 1: Load Google fonts via expo-font + expo-google-fonts
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";

// :zap: CHANGE 2: Keep splash visible until fonts are ready (prevents font flicker)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  // :zap: CHANGE 3: Load fonts once at root
  const [fontsLoaded, fontError] = useFonts({
    PatrickHand: PatrickHand_400Regular,
    Kalam: Kalam_400Regular,
    KalamBold: Kalam_700Bold,
  });

  // :zap: CHANGE 4: Hide splash only when fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
    if (fontError) {
      console.error("Font load error:", fontError);
    }
  }, [fontsLoaded, fontError]);

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

      // segments: e.g. ["login"] / ["register"] / ["(tabs)", "browse"]
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

  // :zap: CHANGE 5: While fonts aren't loaded, keep splash (render Stack but splash covers it)
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{ title: "Login", headerShown: false }}
      />
      <Stack.Screen name="register" options={{ title: "Register" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ title: "Create" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Edit Invite" }} />
      <Stack.Screen name="room/[id]" options={{ title: "Room" }} />
    </Stack>
  );
}
