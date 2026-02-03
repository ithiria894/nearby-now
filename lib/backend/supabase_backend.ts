import type { ActivityCardActivity } from "../components/ActivityCard";
import { supabase } from "../api/supabase";

type ActivityCursor = { created_at: string; id: string };
type ActivityMemberStateRow = { state: string | null; left_at: string | null };

const ACTIVITY_SELECT =
  "id, creator_id, title_text, place_text, place_name, place_address, lat, lng, expires_at, start_time, end_time, gender_pref, capacity, status, created_at";

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

export const backend = {
  auth: {
    async signInWithPassword(params: { email: string; password: string }) {
      const { error } = await supabase.auth.signInWithPassword(params);
      return { error };
    },
    async signUp(params: { email: string; password: string }) {
      const { error } = await supabase.auth.signUp(params);
      return { error };
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    async getUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return { user, error };
    },
    async getSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      return { session, error };
    },
    onAuthStateChange(callback: () => void) {
      const { data: sub } = supabase.auth.onAuthStateChange(callback);
      return {
        unsubscribe: () => sub.subscription.unsubscribe(),
      };
    },
  },
  profiles: {
    async upsertProfile(userId: string) {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId }, { onConflict: "id" });
      return { error };
    },
    async getProfileDisplayName(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      return {
        displayName: (data?.display_name ?? "").trim() || null,
        error,
      };
    },
    async updateProfileDisplayName(userId: string, displayName: string) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId);
      return { error };
    },
  },
  activities: {
    async createActivity(payload: Record<string, unknown>) {
      const { data, error } = await supabase
        .from("activities")
        .insert(payload)
        .select("id")
        .single();
      return { data, error };
    },
    async updateActivity(activityId: string, updates: Record<string, unknown>) {
      const { error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", activityId);
      return { error };
    },
    async getActivityById<T>(activityId: string, select: string) {
      const { data, error } = await supabase
        .from("activities")
        .select(select)
        .eq("id", activityId)
        .single();
      return { data: (data as T) ?? null, error };
    },
    async fetchActivityMembers(activityId: string) {
      const { data, error } = await supabase
        .from("activity_members")
        .select("*")
        .eq("activity_id", activityId)
        .eq("state", "joined")
        .order("joined_at", { ascending: true });
      return { data: (data ?? []) as any[], error };
    },
    async getActivityMemberState(activityId: string, userId: string) {
      const { data, error } = await supabase
        .from("activity_members")
        .select("state,left_at")
        .eq("activity_id", activityId)
        .eq("user_id", userId)
        .maybeSingle();
      return { data: (data as ActivityMemberStateRow) ?? null, error };
    },
    async updateActivityMemberState(
      activityId: string,
      userId: string,
      updates: Record<string, unknown>
    ) {
      const { error } = await supabase
        .from("activity_members")
        .update(updates)
        .eq("activity_id", activityId)
        .eq("user_id", userId);
      return { error };
    },
    async upsertActivityMember(payload: Record<string, unknown>) {
      const { error } = await supabase.from("activity_members").upsert(payload);
      return { error };
    },
    async fetchMembershipRowsForUser(userId: string) {
      const { data, error } = await supabase
        .from("activity_members")
        .select("activity_id, user_id, state, role, joined_at")
        .eq("user_id", userId);
      return { data: (data ?? []) as any[], error };
    },
    async fetchActivityMemberCounts(activityIds: string[]) {
      const { data, error } = await supabase
        .from("activity_members")
        .select("activity_id")
        .in("activity_id", activityIds)
        .eq("state", "joined");
      return { data: (data ?? []) as any[], error };
    },
    async fetchActivitiesByIds(activityIds: string[]) {
      const { data, error } = await supabase
        .from("activities")
        .select(ACTIVITY_SELECT)
        .in("id", activityIds);
      return { data: (data ?? []) as ActivityCardActivity[], error };
    },
    async fetchActivitiesByIdsPage(
      activityIds: string[],
      cursor?: ActivityCursor | null,
      limit = 50
    ) {
      let query = supabase
        .from("activities")
        .select(ACTIVITY_SELECT)
        .in("id", activityIds);
      query = orderByCreatedId(query, false).limit(limit);
      query = applyCursor(query, cursor);
      const { data, error } = await query;
      return { data: (data ?? []) as ActivityCardActivity[], error };
    },
    async fetchOpenActivities(limit = 200) {
      const { data, error } = await supabase
        .from("activities")
        .select(ACTIVITY_SELECT)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(limit);
      return { data: (data ?? []) as ActivityCardActivity[], error };
    },
    async fetchOpenActivitiesPage(cursor?: ActivityCursor | null, limit = 50) {
      let query = supabase
        .from("activities")
        .select(ACTIVITY_SELECT)
        .eq("status", "open");
      query = orderByCreatedId(query, false).limit(limit);
      query = applyCursor(query, cursor);
      const { data, error } = await query;
      return { data: (data ?? []) as ActivityCardActivity[], error };
    },
    async fetchCreatedActivities(userId: string, limit = 200) {
      const { data, error } = await supabase
        .from("activities")
        .select(ACTIVITY_SELECT)
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return { data: (data ?? []) as ActivityCardActivity[], error };
    },
    async fetchCreatedActivitiesPage(
      userId: string,
      cursor?: ActivityCursor | null,
      limit = 50
    ) {
      let query = supabase
        .from("activities")
        .select(ACTIVITY_SELECT)
        .eq("creator_id", userId);
      query = orderByCreatedId(query, false).limit(limit);
      query = applyCursor(query, cursor);
      const { data, error } = await query;
      return { data: (data ?? []) as ActivityCardActivity[], error };
    },
  },
  roomEvents: {
    async insertRoomEvent(payload: Record<string, unknown>) {
      const { error } = await supabase.from("room_events").insert(payload);
      return { error };
    },
    async getRoomEventsPageRpc(params: {
      activityId: string;
      limit: number;
      cursorCreatedAt?: string | null;
      cursorId?: string | null;
      leftAt?: string | null;
    }) {
      const { data, error } = await supabase.rpc("get_room_events_page", {
        p_activity_id: params.activityId,
        p_limit: params.limit,
        p_cursor_created_at: params.cursorCreatedAt ?? null,
        p_cursor_id: params.cursorId ?? null,
        p_left_at: params.leftAt ?? null,
      });
      return { data: (data ?? []) as any[], error };
    },
    async getRoomEventByIdRpc(eventId: string) {
      const { data, error } = await supabase.rpc("get_room_event_by_id", {
        p_event_id: eventId,
      });
      return { data: (data ?? []) as any[], error };
    },
  },
  realtime: {
    subscribeToBrowseActivities(onChange: (payload: any) => void) {
      const channel = supabase
        .channel("browse-activities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activities" },
          (payload) => onChange(payload)
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
    subscribeToJoinedActivityChanges(
      userId: string,
      activityIdSet: Set<string>,
      onChange: () => void
    ) {
      const channel = supabase
        .channel("joined-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activity_members",
            filter: `user_id=eq.${userId}`,
          },
          () => onChange()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activities" },
          (payload) => {
            const activityId = (payload.new as { id?: string })?.id;
            if (activityId && activityIdSet.has(activityId)) onChange();
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
    subscribeToRoom(
      activityId: string,
      handlers: {
        onMemberChange?: (payload: any) => void;
        onEventInsert?: (payload: any) => void;
        onActivityChange?: (payload: any) => void;
      }
    ) {
      const channel = supabase
        .channel(`nearby-now-room-${activityId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activity_members",
            filter: `activity_id=eq.${activityId}`,
          },
          (payload) => handlers.onMemberChange?.(payload)
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "room_events",
            filter: `activity_id=eq.${activityId}`,
          },
          (payload) => handlers.onEventInsert?.(payload)
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activities",
            filter: `id=eq.${activityId}`,
          },
          (payload) => handlers.onActivityChange?.(payload)
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  },
};
