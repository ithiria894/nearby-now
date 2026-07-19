// Activity categories / banners — MIRROR of ../../../lib/ui/activityIcon.ts
// (mobile). Type=WHAT (this), vibe=HOW — kept orthogonal (VIBE_SYSTEM.md).
// Banners (WEB_PLAN §3.3 v2): category tint + icon watermark, asset-free v1.
// `outdoors` is a web-first ADDITION — port to mobile's list to stay mirrored.

export type CategoryKey =
  | "music"
  | "drinks"
  | "games"
  | "food"
  | "sports"
  | "fitness"
  | "outdoors"
  | "movies"
  | "study"
  | "shopping"
  | "photo"
  | "other";

export type Category = {
  key: CategoryKey;
  label: string;
  tint: string; // CSS var reference — re-themes in light/dark
};

export const CATEGORIES: Category[] = [
  { key: "food", label: "Food", tint: "var(--yellow)" },
  { key: "games", label: "Games", tint: "var(--sky)" },
  { key: "outdoors", label: "Outdoors", tint: "var(--mint)" },
  { key: "music", label: "Music", tint: "var(--coral)" },
  { key: "drinks", label: "Drinks", tint: "var(--pink)" },
  { key: "sports", label: "Sports", tint: "var(--mint)" },
  { key: "fitness", label: "Fitness", tint: "var(--mint)" },
  { key: "movies", label: "Movies", tint: "var(--grape)" },
  { key: "study", label: "Study", tint: "var(--sky)" },
  { key: "shopping", label: "Shopping", tint: "var(--pink)" },
  { key: "photo", label: "Photo", tint: "var(--grape)" },
  { key: "other", label: "Hangout", tint: "var(--brand)" },
];

export function categoryByKey(key?: string | null): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[11];
}

// Keyword auto-detect — ported subset of mobile's activityCategory(). Default
// banner when the creator doesn't pick: detect first, RANDOM fallback when
// nothing matches (LLM best-fit is the future upgrade).
// Platform-assigned banner: keyword detect first; deterministic slug-hash
// fallback so a card never flickers between loads. LLM best-fit later.
export function bannerCategory(title: string, slug: string): CategoryKey {
  const detected = detectCategory(title);
  if (detected) return detected;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return CATEGORIES[h % (CATEGORIES.length - 1)].key; // excludes trailing "other"
}

export function detectCategory(title?: string | null): CategoryKey | null {
  const t = (title ?? "").toLowerCase();
  if (/karaoke|唱k|sing|music|音樂|band|concert|演唱/.test(t)) return "music";
  if (/coffee|咖啡|cafe|café|tea|茶|drink|飲|酒|bar|beer|wine/.test(t))
    return "drinks";
  if (/board ?game|桌遊|狼人|werewolf|chess|棋|card|遊戲|game|valorant/.test(t))
    return "games";
  if (
    /hotpot|火鍋|dinner|lunch|brunch|food|飯|eat|吃|食|meal|餐|restaurant|sushi|ramen|pizza|bbq|燒/.test(
      t
    )
  )
    return "food";
  if (
    /badminton|羽毛球|tennis|網球|basketball|籃球|soccer|football|足球|波|volleyball|排球|乒乓/.test(
      t
    )
  )
    return "sports";
  if (/hike|行山|camp|露營|beach|沙灘|nature|picnic|野餐|outdoor/.test(t))
    return "outdoors";
  if (
    /run|跑|jog|walk|散步|climb|攀|cycle|單車|bike|swim|游水|gym|健身|yoga|運動/.test(
      t
    )
  )
    return "fitness";
  if (/movie|電影|film|戲|cinema/.test(t)) return "movies";
  if (/study|讀書|溫書|work|coding|code/.test(t)) return "study";
  if (/shop|購物|逛街|mall|market|市集/.test(t)) return "shopping";
  if (/photo|影相|攝影|camera/.test(t)) return "photo";
  return null;
}
