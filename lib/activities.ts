import { supabase } from "./supabase";
import type { ActivityCardActivity } from "../components/ActivityCard";

export type MembershipState = "joined" | "left";

export type MembershipRow = {
  activity_id: string;
  user_id: string;
  state: MembershipState;
  role: string;
  joined_at: string | null;
};

export function isExpiredOrClosed(a: ActivityCardActivity): boolean {
  if (a.status && a.status !== "open") return true;
  if (a.expires_at) return new Date(a.expires_at).getTime() <= Date.now();
  return false;
}

// :zap: CHANGE 1: Fetch activities by ids (two-step approach avoids relying on FK).
export async function fetchActivitiesByIds(
  activityIds: string[]
): Promise<ActivityCardActivity[]> {
  if (activityIds.length === 0) return [];

  const { data, error } = await supabase
    .from("activities")
    .select(
      "id, creator_id, title_text, place_text, place_name, place_address, lat, lng, expires_at, gender_pref, capacity, status, created_at"
    )
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
