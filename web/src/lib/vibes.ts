// Vibe taxonomy — MIRROR of ../../../lib/ui/vibe.ts (mobile). That file is the
// source of truth; keep this in sync. Vibe says HOW a hangout feels (orthogonal
// to the activity category). `open` is the default and carries no badge/tint.
// See .docs/VIBE_SYSTEM.md.

export type VibeKey = "chill" | "hype" | "deep" | "playful" | "open";

export const VIBES: VibeKey[] = ["chill", "hype", "deep", "playful", "open"];

// Tint = the accent token each vibe reads in. Mirrors VIBE_META.tint on mobile
// (chill→sky, hype→coral, deep→grape, playful→pink, open→none). Expressed as
// CSS custom-property references so they re-theme in light/dark.
export const VIBE_TINT: Record<VibeKey, string | null> = {
  chill: "var(--sky)",
  hype: "var(--coral)",
  deep: "var(--grape)",
  playful: "var(--pink)",
  open: null,
};

export const VIBE_LABEL_EN: Record<VibeKey, string> = {
  chill: "Chill",
  hype: "Hype",
  deep: "Deep",
  playful: "Playful",
  open: "Open",
};

// Icons live in components/icons.tsx (VibeIcon) — inline SVG, no emoji, mirroring
// the mobile app's icon-not-emoji rule.

export function normalizeVibe(v?: string | null): VibeKey {
  return v && (VIBES as string[]).includes(v) ? (v as VibeKey) : "open";
}
