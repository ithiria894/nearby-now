import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoomPublic, RoomMember, RoomEvent } from "./types";

// Web backend adapter — the same seam as the mobile app's
// lib/backend/supabase_backend.ts, second implementation, for the subset web
// needs. Each fn takes a Supabase client (server or browser).

type DB = SupabaseClient;

export async function getRoomPublic(
  db: DB,
  slug: string
): Promise<RoomPublic | null> {
  const { data, error } = await db
    .rpc("get_room_public", { p_slug: slug })
    .maybeSingle();
  if (error) throw error;
  return (data as RoomPublic) ?? null;
}

export type JoinResult =
  | "ok"
  | "full"
  | "closed"
  | "expired"
  | "not_found"
  | "not_authenticated";

export async function joinRoom(
  db: DB,
  activityId: string
): Promise<JoinResult> {
  const { data, error } = await db.rpc("join_room", {
    p_activity_id: activityId,
  });
  if (error) throw error;
  return data as JoinResult;
}

export async function fetchMembers(
  db: DB,
  activityId: string
): Promise<RoomMember[]> {
  const { data, error } = await db
    .from("activity_members")
    .select("user_id, role, state, profiles(display_name)")
    .eq("activity_id", activityId)
    .eq("state", "joined")
    .order("joined_at", { ascending: true });
  if (error) throw error;
  type Prof = { display_name: string | null };
  type Row = {
    user_id: string;
    role: string;
    state: string;
    profiles: Prof | Prof[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((rec) => {
    const prof = Array.isArray(rec.profiles) ? rec.profiles[0] : rec.profiles;
    return {
      user_id: rec.user_id,
      role: rec.role,
      state: rec.state,
      display_name: prof?.display_name ?? null,
    };
  });
}

export async function getActivityCreatorId(
  db: DB,
  activityId: string
): Promise<string | null> {
  const { data, error } = await db
    .from("activities")
    .select("creator_id")
    .eq("id", activityId)
    .maybeSingle();
  if (error) throw error;
  return (data as { creator_id: string } | null)?.creator_id ?? null;
}

export async function getMembershipState(
  db: DB,
  activityId: string,
  userId: string
): Promise<{ state: string; role: string; left_at: string | null } | null> {
  const { data, error } = await db
    .from("activity_members")
    .select("state, role, left_at")
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (
    (data as { state: string; role: string; left_at: string | null }) ?? null
  );
}

export async function getRoomEventsPage(
  db: DB,
  activityId: string,
  limit = 50,
  leftAt: string | null = null
): Promise<RoomEvent[]> {
  const { data, error } = await db.rpc("get_room_events_page", {
    p_activity_id: activityId,
    p_limit: limit,
    p_left_at: leftAt,
  });
  if (error) throw error;
  // RPC returns newest-first; reverse to chronological for display
  return ((data ?? []) as RoomEvent[]).slice().reverse();
}

export async function insertRoomEvent(
  db: DB,
  activityId: string,
  userId: string,
  content: string,
  type = "message"
) {
  const { error } = await db.from("room_events").insert({
    activity_id: activityId,
    user_id: userId,
    type,
    content,
  });
  if (error) throw error;
}

export async function upsertProfile(
  db: DB,
  userId: string,
  displayName: string,
  gender?: string | null
) {
  const row: Record<string, unknown> = {
    id: userId,
    display_name: displayName,
  };
  if (gender !== undefined) row.gender = gender;
  const { error } = await db.from("profiles").upsert(row);
  if (error) throw error;
}

export async function createActivity(
  db: DB,
  payload: Record<string, unknown>
): Promise<{ id: string; share_slug: string }> {
  const { data, error } = await db
    .from("activities")
    .insert(payload)
    .select("id, share_slug")
    .single();
  if (error) throw error;
  return data as { id: string; share_slug: string };
}

export async function reportActivity(
  db: DB,
  activityId: string,
  reason: string
) {
  const { error } = await db.rpc("report_activity", {
    p_activity_id: activityId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function reportMessage(db: DB, eventId: string, reason: string) {
  const { error } = await db.rpc("report_message", {
    p_event_id: eventId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function addSelfMembership(
  db: DB,
  activityId: string,
  userId: string,
  role: "creator" | "member"
) {
  const { error } = await db.from("activity_members").upsert({
    activity_id: activityId,
    user_id: userId,
    role,
    state: "joined",
    left_at: null,
  });
  if (error) throw error;
}

export async function leaveRoom(db: DB, activityId: string, userId: string) {
  const { error } = await db
    .from("activity_members")
    .update({ state: "left", left_at: new Date().toISOString() })
    .eq("activity_id", activityId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function closeRoom(db: DB, activityId: string) {
  const { error } = await db
    .from("activities")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", activityId);
  if (error) throw error;
}

export type FeedItem = {
  share_slug: string;
  title_text: string;
  vibe: string | null;
  start_time: string | null;
  place_name: string | null;
  capacity: number | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  joined_count: number;
  host_display_name: string | null;
  distance_km: number | null;
};

export async function getFeedPublic(
  db: DB,
  scope: "open" | "past",
  filter: "all" | "nearby" | "online",
  coords?: { lat: number; lng: number },
  radiusKm = 15,
  limit = 30
): Promise<FeedItem[]> {
  const { data, error } = await db.rpc("get_feed_public", {
    p_scope: scope,
    p_filter: filter,
    p_lat: coords?.lat ?? null,
    p_lng: coords?.lng ?? null,
    p_radius_km: radiusKm,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

export type MyRoom = {
  id: string;
  share_slug: string;
  title_text: string;
  vibe: string | null;
  start_time: string | null;
  place_name: string | null;
  capacity: number | null;
  status: string;
  expires_at: string | null;
  role: string;
};

export async function fetchMyRooms(db: DB, userId: string): Promise<MyRoom[]> {
  const { data, error } = await db
    .from("activity_members")
    .select(
      "role, activities(id, share_slug, title_text, vibe, start_time, place_name, capacity, status, expires_at, created_at)"
    )
    .eq("user_id", userId)
    .neq("state", "left")
    .order("created_at", { referencedTable: "activities", ascending: false });
  if (error) throw error;
  type Act = Omit<MyRoom, "role"> & { created_at: string };
  type Row = { role: string; activities: Act | Act[] | null };
  return ((data ?? []) as unknown as Row[])
    .map((rec) => {
      const act = Array.isArray(rec.activities)
        ? rec.activities[0]
        : rec.activities;
      if (!act) return null;
      return { ...act, role: rec.role } as MyRoom;
    })
    .filter(Boolean) as MyRoom[];
}
