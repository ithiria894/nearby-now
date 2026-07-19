// Shared fixtures + a phone-ish frame for the page mockups (#44–#47). All fake
// data — no Supabase, no routing. These mockups define the look the real pages
// (#51/#54/#55/#56/#57) get wired to.

import type { ReactNode } from "react";
import type { VibeKey } from "@/lib/vibes";

// Phone-shaped preview (the mobile view).
export function MockFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        className="t-label"
        style={{ color: "var(--subtext)", marginBottom: 6 }}
      >
        {label}
      </div>
      <div
        style={{
          maxWidth: 390,
          border: "var(--border-thick) solid var(--border)",
          borderRadius: 28,
          overflow: "hidden",
          background: "var(--bg)",
          boxShadow: "var(--hard-shadow-md)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Wider, browser-shaped preview (the desktop view). Full-bleed to the gallery
// frame so a real desktop layout can be judged (use the "full" width preset).
export function DesktopFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        className="t-label"
        style={{ color: "var(--subtext)", marginBottom: 6 }}
      >
        {label}
      </div>
      <div
        style={{
          border: "var(--border-thick) solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--bg)",
          boxShadow: "var(--hard-shadow-md)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const FAKE_ROOM = {
  title: "Hotpot Friday, who's in?",
  vibe: "hype" as VibeKey,
  timeText: "Tonight · 8:00pm",
  placeName: "Causeway Bay",
  going: 3,
  capacity: 6,
  host: "mimi",
};

export const FAKE_MEMBERS = [
  { name: "mimi", host: true },
  { name: "kenji" },
  { name: "aya" },
];

export type Msg = {
  id: number;
  kind: "system" | "them" | "me";
  who?: string;
  text: string;
  at: string;
};

export const FAKE_MESSAGES: Msg[] = [
  { id: 1, kind: "system", text: "mimi started this hangout", at: "7:02pm" },
  {
    id: 2,
    kind: "them",
    who: "mimi",
    text: "yo! thinking 8pm at the usual spot",
    at: "7:03pm",
  },
  { id: 3, kind: "system", text: "kenji joined", at: "7:10pm" },
  {
    id: 4,
    kind: "them",
    who: "kenji",
    text: "down! should I book a table for 6?",
    at: "7:11pm",
  },
  { id: 5, kind: "me", text: "yes pls, I'll bring a friend", at: "7:12pm" },
  {
    id: 6,
    kind: "them",
    who: "mimi",
    text: "nice, 2 more spots then",
    at: "7:13pm",
  },
  { id: 7, kind: "system", text: "aya joined", at: "7:20pm" },
  {
    id: 8,
    kind: "them",
    who: "aya",
    text: "first time doing this haha, see you all there",
    at: "7:21pm",
  },
  { id: 9, kind: "me", text: "welcome!", at: "7:22pm" },
];
