"use client";

import { createSupabaseBrowser } from "./supabase/client";

// Fire-and-forget funnel event (#59). Insert-only table; never awaited so it
// never blocks the UI. Events: link_open, join_start/done, create_start/done,
// message_sent, share_copied (COLD_START §3 / WEB_PLAN §10).
export function track(event: string, slug?: string, ref?: string) {
  try {
    void createSupabaseBrowser()
      .from("funnel_events")
      .insert({ event, slug: slug ?? null, ref: ref ?? null })
      .then(
        () => {},
        () => {}
      );
  } catch {
    // best-effort; analytics must never break the funnel
  }
}
