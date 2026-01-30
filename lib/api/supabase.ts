// lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// :zap: CHANGE 1: Enable hint-safe auth session persistence for React Native
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (typeof extra.supabaseUrl === "string" ? extra.supabaseUrl : undefined) ??
  "https://vvpkrbrirnfzdvyndmet.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (typeof extra.supabaseAnonKey === "string"
    ? extra.supabaseAnonKey
    : undefined) ??
  "sb_publishable_cCqlyybzIrDwrE8EtuJ00g_2m5o4YGp";

const hasEnvUrl = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
const hasEnvKey = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const hasExtraUrl =
  typeof extra.supabaseUrl === "string" && !!extra.supabaseUrl;
const hasExtraKey =
  typeof extra.supabaseAnonKey === "string" && !!extra.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  throw new Error(
    `[supabase] Missing config: ${missing.join(
      ", "
    )}. Set them in .env or app.config.js (extra).`
  );
}

if (!hasEnvUrl && !hasExtraUrl) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL not found in env/extra; using fallback."
  );
}
if (!hasEnvKey && !hasExtraKey) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY not found in env/extra; using fallback."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
