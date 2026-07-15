import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (typeof extra.supabaseUrl === "string" ? extra.supabaseUrl : undefined);
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (typeof extra.supabaseAnonKey === "string"
    ? extra.supabaseAnonKey
    : undefined);

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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
