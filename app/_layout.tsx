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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// :zap: CHANGE 1: Load Google fonts via expo-font + expo-google-fonts
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import {
  Caveat_400Regular,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from "@expo-google-fonts/caveat";
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  Montserrat_500Medium,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { ShortStack_400Regular } from "@expo-google-fonts/short-stack";

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
    // 你原本有的
    PatrickHand: PatrickHand_400Regular,
    Kalam: Kalam_400Regular,
    KalamBold: Kalam_700Bold,

    // UI 萬用：Inter
    Inter: Inter_400Regular,
    InterSemi: Inter_600SemiBold,

    // 圓潤：Nunito
    Nunito: Nunito_400Regular,
    NunitoBold: Nunito_700Bold,

    // 標題：Poppins
    PoppinsSemi: Poppins_600SemiBold,
    PoppinsBold: Poppins_700Bold,

    // 品牌感：Montserrat
    Montserrat: Montserrat_500Medium,
    MontserratBold: Montserrat_700Bold,

    // 手帳感：Short Stack
    ShortStack: ShortStack_400Regular,

    // NEW: Caveat (handwriting + real weights)
    Caveat: Caveat_400Regular,
    CaveatSemi: Caveat_600SemiBold,
    CaveatBold: Caveat_700Bold,
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
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
              options={{
                title: t("rootNav.create"),
                headerLeft: StackBackButton,
              }}
            />
            <Stack.Screen
              name="compose"
              options={{
                title: t("compose.navTitle"),
                headerLeft: StackBackButton,
              }}
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
