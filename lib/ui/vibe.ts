import type { ActivityTint } from "./activityIcon";

// The 5 fixed vibes (matches the DB check constraint on activities.vibe).
// Vibe is ORTHOGONAL to the activity category: category says WHAT you'll do,
// vibe says HOW it'll feel. `open` is the default / go-with-the-flow and gets
// no badge (no signal to show).
export type VibeKey = "chill" | "hype" | "deep" | "playful" | "open";

export const VIBES: VibeKey[] = ["chill", "hype", "deep", "playful", "open"];

export type VibeMeta = {
  key: VibeKey;
  labelKey: string; // i18n key under "vibe"
  icon: string; // MaterialCommunityIcons name (NO emoji)
  tint: ActivityTint | null; // badge fill; null = don't badge (open)
};

export const VIBE_META: Record<VibeKey, VibeMeta> = {
  chill: {
    key: "chill",
    labelKey: "vibe.chill",
    icon: "weather-night",
    tint: "sky",
  },
  hype: { key: "hype", labelKey: "vibe.hype", icon: "fire", tint: "coral" },
  deep: {
    key: "deep",
    labelKey: "vibe.deep",
    icon: "chat-outline",
    tint: "grape",
  },
  playful: {
    key: "playful",
    labelKey: "vibe.playful",
    icon: "emoticon-happy",
    tint: "pink",
  },
  open: { key: "open", labelKey: "vibe.open", icon: "compass", tint: null },
};

/** DB value (possibly null / unknown) -> a valid VibeKey (default "open"). */
export function normalizeVibe(v?: string | null): VibeKey {
  return v && (VIBES as string[]).includes(v) ? (v as VibeKey) : "open";
}
