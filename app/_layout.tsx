// app/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import "fast-text-encoding"; // ✅ provides TextDecoder/TextEncoder
import "react-native-url-polyfill/auto"; // ✅ provides URL, URLSearchParams
import { initI18n } from "../lib/i18n/i18n";
import { useT } from "../lib/i18n/useT";
import { ThemeProvider } from "../src/ui/theme/ThemeProvider";
import { useAuthGuard } from "../lib/hooks/useAuthGuard";
import { Pressable, Text } from "react-native";
import { useTheme } from "../src/ui/theme/ThemeProvider";

// :zap: CHANGE 1: Load Google fonts via expo-font + expo-google-fonts
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";

// :zap: CHANGE 2: Keep splash visible until fonts are ready (prevents font flicker)
SplashScreen.preventAutoHideAsync().catch(() => {});

function StackBackButton() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/browse");
      }}
      hitSlop={10}
      style={{ paddingHorizontal: 10, paddingVertical: 6 }}
    >
      <Text style={{ fontSize: 18, color: theme.colors.text }}>←</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const { t } = useT();
  const [i18nReady, setI18nReady] = useState(false);
  useAuthGuard();

  // :zap: CHANGE 3: Load fonts once at root
  const [fontsLoaded, fontError] = useFonts({
    PatrickHand: PatrickHand_400Regular,
    Kalam: Kalam_400Regular,
    KalamBold: Kalam_700Bold,
  });

  // :zap: CHANGE 4: Init i18n before rendering
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await initI18n();
      } catch (e) {
        console.error("i18n init failed:", e);
      } finally {
        if (active) setI18nReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // :zap: CHANGE 5: Hide splash only when fonts + i18n are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
    if (fontError) {
      console.error("Font load error:", fontError);
    }
  }, [fontsLoaded, fontError, i18nReady]);

  if (!i18nReady) return null;

  // :zap: CHANGE 6: While fonts aren't loaded, keep splash (render Stack but splash covers it)
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen
          name="login"
          options={{ title: t("rootNav.login"), headerShown: false }}
        />
        <Stack.Screen
          name="register"
          options={{ title: t("rootNav.register") }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="create"
          options={{ title: t("rootNav.create"), headerLeft: StackBackButton }}
        />
        <Stack.Screen
          name="edit/[id]"
          options={{
            title: t("rootNav.editInvite"),
            headerLeft: StackBackButton,
          }}
        />
        <Stack.Screen
          name="room/[id]"
          options={{
            title: t("rootNav.room"),
            headerBackTitleVisible: false,
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerLeft: StackBackButton,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
