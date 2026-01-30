import { supabase } from "../api/supabase";
import type { ActivityCardActivity } from "../components/ActivityCard";

export type MembershipState = "joined" | "left";

export type MembershipRow = {
  activity_id: string;
  user_id: string;
  state: MembershipState;
  role: string;
  joined_at: string | null;
};

export type ActivityCursor = { created_at: string; id: string };

const ACTIVITY_SELECT =
  "id, creator_id, title_text, place_text, place_name, place_address, lat, lng, expires_at, gender_pref, capacity, status, created_at";

function applyCursor<T>(query: T, cursor?: ActivityCursor | null): T {
  if (!cursor) return query;
  return (query as any).or(
    `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
  );
}

function orderByCreatedId<T>(query: T, asc = false): T {
  return (query as any)
    .order("created_at", { ascending: asc })
    .order("id", { ascending: asc });
}

export function isExpiredOrClosed(a: ActivityCardActivity): boolean {
  if (a.status && a.status !== "open") return true;
  if (a.expires_at) return new Date(a.expires_at).getTime() <= Date.now();
  return false;
}

export function isActiveActivity(a: ActivityCardActivity): boolean {
  if (a.status && a.status !== "open") return false;
  if (a.expires_at) {
    const ts = new Date(a.expires_at).getTime();
    if (!Number.isNaN(ts) && ts <= Date.now()) return false;
  }
  return true;
}

export function isJoinableActivity(
  a: ActivityCardActivity,
  joinedSet: Set<string>
): boolean {
  if (joinedSet.has(a.id)) return false;
  if (a.status !== "open") return false;
  if (a.expires_at && new Date(a.expires_at).getTime() <= Date.now())
    return false;
  return true;
}

// :zap: CHANGE 1: Fetch activities by ids (two-step approach avoids relying on FK).
export async function fetchActivitiesByIds(
  activityIds: string[]
): Promise<ActivityCardActivity[]> {
  if (activityIds.length === 0) return [];

  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .in("id", activityIds);

  if (error) throw error;

  const rows = (data ?? []) as any[];
  rows.sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime();
    const tb = new Date(b.created_at ?? 0).getTime();
    return tb - ta;
  });

  return rows as ActivityCardActivity[];
}

export async function fetchActivitiesByIdsPage(
  activityIds: string[],
  cursor?: ActivityCursor | null,
  limit = 50
): Promise<ActivityCardActivity[]> {
  if (activityIds.length === 0) return [];

  let query = supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .in("id", activityIds);

  query = orderByCreatedId(query, false).limit(limit);
  query = applyCursor(query, cursor);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityCardActivity[];
}

export async function fetchOpenActivities(
  limit = 200
): Promise<ActivityCardActivity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityCardActivity[];
}

export async function fetchOpenActivitiesPage(
  cursor?: ActivityCursor | null,
  limit = 50
): Promise<ActivityCardActivity[]> {
  let query = supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("status", "open");

  query = orderByCreatedId(query, false).limit(limit);
  query = applyCursor(query, cursor);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityCardActivity[];
}

export async function fetchCreatedActivities(
  userId: string,
  limit = 200
): Promise<ActivityCardActivity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityCardActivity[];
}

export async function fetchCreatedActivitiesPage(
  userId: string,
  cursor?: ActivityCursor | null,
  limit = 50
): Promise<ActivityCardActivity[]> {
  let query = supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("creator_id", userId);

  query = orderByCreatedId(query, false).limit(limit);
  query = applyCursor(query, cursor);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityCardActivity[];
}

// :zap: CHANGE 2: Fetch membership rows for user.
export async function fetchMembershipRowsForUser(
  userId: string
): Promise<MembershipRow[]> {
  const { data, error } = await supabase
    .from("activity_members")
    .select("activity_id, user_id, state, role, joined_at")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as MembershipRow[];
}

// :zap: CHANGE 3: Helper to upsert joined state (works for join + re-join).
export async function upsertJoin(activityId: string, userId: string) {
  const { error } = await supabase.from("activity_members").upsert({
    activity_id: activityId,
    user_id: userId,
    role: "member",
    state: "joined",
  });

  if (error) throw error;
}

export async function joinWithSystemMessage(
  activityId: string,
  userId: string
): Promise<void> {
  const { data: existing, error: existingErr } = await supabase
    .from("activity_members")
    .select("state")
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingErr) throw existingErr;

  const { error } = await supabase.from("activity_members").upsert({
    activity_id: activityId,
    user_id: userId,
    role: "member",
    state: "joined",
  });

  if (error) throw error;

  if ((existing as any)?.state === "joined") return;

  const { error: evtErr } = await supabase.from("room_events").insert({
    activity_id: activityId,
    user_id: userId,
    type: "system",
    content: JSON.stringify({ k: "room.system.joined" }),
  });

  if (evtErr) console.error("system join message insert failed:", evtErr);
}
