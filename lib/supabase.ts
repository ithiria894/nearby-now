import { createClient } from "@supabase/supabase-js";

// :zap: CHANGE 1: Centralize Supabase client config in one place
const SUPABASE_URL = "https://vvpkrbrirnfzdvyndmet.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cCqlyybzIrDwrE8EtuJ00g_2m5o4YGp"; // paste yours

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // we are doing anonymous-by-device for MVP
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
