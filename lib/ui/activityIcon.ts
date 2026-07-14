// Derive a category (tag + icon + color) for an activity from its title.
// Keyword match (en + zh). Used for the row icon, the tag chip, and the Feed
// tag filter. NO emoji in UI — categories carry a MaterialCommunityIcons name.
export type ActivityTint =
  | "coral"
  | "mint"
  | "sky"
  | "yellow"
  | "pink"
  | "grape";

export type ActivityCategory = {
  key: string;
  label: string;
  icon: string;
  tint: ActivityTint;
};

export function activityCategory(title?: string | null): ActivityCategory {
  const t = (title ?? "").toLowerCase();
  if (/karaoke|唱k|sing|music|音樂|樂隊|band|concert|演唱/.test(t))
    return {
      key: "music",
      label: "Music",
      icon: "microphone-variant",
      tint: "coral",
    };
  if (/coffee|咖啡|cafe|café|tea|茶|drink|飲|酒|bar|beer|wine/.test(t))
    return { key: "drinks", label: "Drinks", icon: "coffee", tint: "pink" };
  if (/board ?game|桌遊|狼人|werewolf|chess|棋|card|遊戲|game/.test(t))
    return { key: "games", label: "Games", icon: "dice-multiple", tint: "sky" };
  if (
    /hotpot|火鍋|dinner|lunch|breakfast|brunch|food|飯|eat|吃|食|meal|餐|restaurant|sushi|ramen|pizza|bbq|燒/.test(
      t
    )
  )
    return {
      key: "food",
      label: "Food",
      icon: "silverware-fork-knife",
      tint: "yellow",
    };
  if (
    /badminton|羽毛球|tennis|網球|basketball|籃球|soccer|football|足球|波|volleyball|排球|table ?tennis|乒乓/.test(
      t
    )
  )
    return { key: "sports", label: "Sports", icon: "badminton", tint: "mint" };
  if (
    /run|跑|jog|walk|散步|hike|行山|climb|攀|cycle|單車|bike|swim|游水|gym|健身|yoga|sport|運動/.test(
      t
    )
  )
    return { key: "fitness", label: "Fitness", icon: "run", tint: "mint" };
  if (/movie|電影|film|戲|cinema/.test(t))
    return {
      key: "movies",
      label: "Movies",
      icon: "movie-open",
      tint: "grape",
    };
  if (/study|讀書|溫書|work|工作|coding|code|寫字/.test(t))
    return {
      key: "study",
      label: "Study",
      icon: "book-open-variant",
      tint: "sky",
    };
  if (/shop|購物|逛街|mall|market|市集/.test(t))
    return {
      key: "shopping",
      label: "Shopping",
      icon: "shopping",
      tint: "pink",
    };
  if (/photo|影相|攝影|camera/.test(t))
    return { key: "photo", label: "Photo", icon: "camera", tint: "grape" };
  return {
    key: "other",
    label: "Other",
    icon: "star-four-points",
    tint: "sky",
  };
}

export function activityIcon(title?: string | null): string {
  return activityCategory(title).icon;
}

// A stable bright tile color per activity id, so rows aren't monochrome.
// Callers pass the id + the current UIColors accents.
export function activityTileColor(id: string, accents: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return accents[h % accents.length];
}
