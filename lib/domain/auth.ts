// lib/auth.ts
import { backend } from "../backend";

// :zap: CHANGE 1: Central helper to require an authenticated user (id + email).
export async function requireUser(): Promise<{
  id: string;
  email: string | null;
}> {
  const { session, error } = await backend.auth.getSession();

  if (error) throw error;
  const user = session?.user ?? null;
  if (!user) throw new Error("Not authenticated");
  return { id: user.id, email: user.email ?? null };
}

export function isAuthMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as any).message) : "";
  const name = "name" in error ? String((error as any).name) : "";
  return (
    name === "AuthSessionMissingError" ||
    message === "Not authenticated" ||
    message === "Auth session missing!"
  );
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

  const { error: upsertErr } = await backend.profiles.upsertProfile(userId);
  if (upsertErr) {
    console.error("ensureProfile upsert failed:", upsertErr);
    throw upsertErr;
  }

  const { displayName, error: selErr } =
    await backend.profiles.getProfileDisplayName(userId);

  if (selErr) {
    console.error("ensureProfile select failed:", selErr);
    return;
  }

  const currentName = (displayName ?? "").trim();
  if (currentName) return;

  const nextName = computeDefaultDisplayName(email, userId);

  const { error: updErr } = await backend.profiles.updateProfileDisplayName(
    userId,
    nextName
  );

  if (updErr) {
    console.error("ensureProfile update display_name failed:", updErr);
  }
}
