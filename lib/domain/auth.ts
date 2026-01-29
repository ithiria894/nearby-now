// lib/auth.ts
import { supabase } from "../api/supabase";

// :zap: CHANGE 1: Central helper to require an authenticated user (id + email).
export async function requireUser(): Promise<{
  id: string;
  email: string | null;
}> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return { id: user.id, email: user.email ?? null };
}

// :zap: CHANGE 2: Keep existing helper for places that only need id.
export async function requireUserId(): Promise<string> {
  const u = await requireUser();
  return u.id;
}

function computeDefaultDisplayName(
  email: string | null,
  userId: string
): string {
  const fromEmail = (email ?? "").split("@")[0]?.trim() ?? "";
  const sanitized = fromEmail.replace(/\s+/g, "");
  if (sanitized.length >= 2) return sanitized.slice(0, 24);
  return `user-${userId.slice(0, 6)}`;
}

// :zap: CHANGE 3: Ensure profile row exists + auto-fill display_name once.
export async function ensureProfile(): Promise<void> {
  const { id: userId, email } = await requireUser();

  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id" });
  if (upsertErr) {
    console.error("ensureProfile upsert failed:", upsertErr);
    throw upsertErr;
  }

  const { data: profile, error: selErr } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  if (selErr) {
    console.error("ensureProfile select failed:", selErr);
    return;
  }

  const currentName = (profile?.display_name ?? "").trim();
  if (currentName) return;

  const nextName = computeDefaultDisplayName(email, userId);

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ display_name: nextName })
    .eq("id", userId);

  if (updErr) {
    console.error("ensureProfile update display_name failed:", updErr);
  }
}
