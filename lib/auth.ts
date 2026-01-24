// lib/auth.ts
import { supabase } from "./supabase";

// :zap: CHANGE 1: Central helper to require an authenticated user id
export async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// :zap: CHANGE 2: Ensure profile row exists (optional but recommended)
export async function ensureProfile(): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("ensureProfile failed:", error);
    throw error;
  }
}
