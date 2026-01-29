// lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// :zap: CHANGE 1: Enable hint-safe auth session persistence for React Native
const SUPABASE_URL = "https://vvpkrbrirnfzdvyndmet.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cCqlyybzIrDwrE8EtuJ00g_2m5o4YGp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
