// Map an activity title to a MaterialCommunityIcons name (NO emoji in UI).
// Keyword match (en + zh); falls back to a neutral marker.
export function activityIcon(title?: string | null): string {
  const t = (title ?? "").toLowerCase();
  if (/karaoke|唱k|sing|music|音樂|樂隊|band|concert|演唱/.test(t))
    return "microphone-variant";
  if (/coffee|咖啡|cafe|café|tea|茶|drink|飲|酒|bar|beer|wine/.test(t))
    return "coffee";
  if (/board ?game|桌遊|狼人|werewolf|chess|棋|card|遊戲|game/.test(t))
    return "dice-multiple";
  if (
    /hotpot|火鍋|dinner|lunch|breakfast|brunch|food|飯|eat|吃|食|meal|餐|restaurant|sushi|ramen|pizza|bbq|燒/.test(
      t
    )
  )
    return "silverware-fork-knife";
  if (
    /badminton|羽毛球|tennis|網球|basketball|籃球|soccer|football|足球|波|volleyball|排球|table ?tennis|乒乓/.test(
      t
    )
  )
    return "badminton";
  if (
    /run|跑|jog|walk|散步|hike|行山|climb|攀|cycle|單車|bike|swim|游水|gym|健身|yoga|sport|運動/.test(
      t
    )
  )
    return "run";
  if (/movie|電影|film|戲|cinema/.test(t)) return "movie-open";
  if (/study|讀書|溫書|work|工作|coding|code|寫字/.test(t))
    return "book-open-variant";
  if (/shop|購物|逛街|mall|market|市集/.test(t)) return "shopping";
  if (/photo|影相|攝影|camera/.test(t)) return "camera";
  return "star-four-points";
}

// A stable bright tile color per activity id, so rows aren't monochrome.
// Callers pass the id + the current UIColors accents.
export function activityTileColor(id: string, accents: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return accents[h % accents.length];
}
