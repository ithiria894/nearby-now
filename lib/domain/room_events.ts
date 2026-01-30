import { supabase } from "../api/supabase";
import type { RoomEventType } from "./room";

export type RoomEventRow = {
  id: string;
  activity_id: string;
  user_id: string | null;
  type: RoomEventType;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
};

type RoomEventRpcRow = {
  id: string;
  activity_id: string;
  user_id: string | null;
  type: RoomEventType;
  content: string;
  created_at: string;
  display_name: string | null;
};

export type RoomEventCursor = { created_at: string; id: string };

function mapRpcRow(row: RoomEventRpcRow): RoomEventRow {
  return {
    id: row.id,
    activity_id: row.activity_id,
    user_id: row.user_id,
    type: row.type,
    content: row.content,
    created_at: row.created_at,
    profiles: row.display_name ? { display_name: row.display_name } : null,
  };
}

export async function getRoomEventsPage(params: {
  activityId: string;
  limit: number;
  cursor?: RoomEventCursor | null;
  leftAt?: Date | null;
}): Promise<{
  rows: RoomEventRow[];
  nextCursor: RoomEventCursor | null;
  hasMore: boolean;
}> {
  const { activityId, limit, cursor, leftAt } = params;
  const { data, error } = await supabase.rpc("get_room_events_page", {
    p_activity_id: activityId,
    p_limit: limit,
    p_cursor_created_at: cursor?.created_at ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_left_at: leftAt ? leftAt.toISOString() : null,
  });

  if (error) throw error;

  const mapped = ((data ?? []) as RoomEventRpcRow[]).map(mapRpcRow);
  const rows = mapped.slice().reverse();
  const first = rows[0];
  const nextCursor =
    rows.length > 0 && first?.created_at
      ? { created_at: first.created_at, id: first.id }
      : null;
  const hasMore = (data ?? []).length === limit;

  return { rows, nextCursor, hasMore };
}

export async function getRoomEventById(
  eventId: string
): Promise<RoomEventRow | null> {
  const { data, error } = await supabase.rpc("get_room_event_by_id", {
    p_event_id: eventId,
  });

  if (error) throw error;
  const rows = (data ?? []) as RoomEventRpcRow[];
  if (!rows.length) return null;
  return mapRpcRow(rows[0]);
}
