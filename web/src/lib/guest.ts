"use client";

import { createSupabaseBrowser } from "./supabase/client";
import { upsertProfile } from "./backend";

// Guest identity (#52). Zero-signup: an anonymous Supabase session + a nickname
// on the profile. Anonymous users get the `authenticated` role, so existing RLS
// applies. Idempotent — safe to call from both join and create.
export async function ensureGuestSession(
  nickname: string,
  gender?: string | null
): Promise<string> {
  const db = createSupabaseBrowser();
  const {
    data: { session },
  } = await db.auth.getSession();

  let userId = session?.user?.id;
  if (!userId) {
    const { data, error } = await db.auth.signInAnonymously();
    if (error) throw error;
    userId = data.user?.id;
  }
  if (!userId) throw new Error("no session after anonymous sign-in");

  await upsertProfile(db, userId, nickname.trim(), gender ?? null);
  return userId;
}

// Ensure SOME session exists (for actions that need auth but no nickname, e.g.
// reporting). Signs in anonymously if there's no session; no profile upsert.
export async function ensureAnonSession(): Promise<string | null> {
  const db = createSupabaseBrowser();
  const {
    data: { session },
  } = await db.auth.getSession();
  if (session?.user?.id) return session.user.id;
  const { data, error } = await db.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function currentUserId(): Promise<string | null> {
  const db = createSupabaseBrowser();
  const {
    data: { session },
  } = await db.auth.getSession();
  return session?.user?.id ?? null;
}

export async function signOutGuest() {
  const db = createSupabaseBrowser();
  await db.auth.signOut();
}
