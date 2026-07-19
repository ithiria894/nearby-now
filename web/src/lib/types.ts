import type { VibeKey } from "./vibes";

// Public room shape returned by get_room_public (#49). The only data a
// logged-out visitor sees.
export type RoomPublic = {
  id: string;
  title_text: string;
  vibe: string | null;
  start_time: string | null;
  place_name: string | null;
  capacity: number | null;
  status: string;
  expires_at: string | null;
  joined_count: number;
  host_display_name: string | null;
};

export type RoomState = "open" | "full" | "expired" | "closed" | "notfound";

export function roomState(room: RoomPublic | null): RoomState {
  if (!room) return "notfound";
  if (room.status === "closed") return "closed";
  if (room.expires_at && new Date(room.expires_at).getTime() <= Date.now())
    return "expired";
  if (room.status !== "open") return "closed";
  if (room.capacity != null && room.joined_count >= room.capacity)
    return "full";
  return "open";
}

export function roomVibe(room: RoomPublic): VibeKey {
  const v = room.vibe;
  const valid = ["chill", "hype", "deep", "playful", "open"];
  return (v && valid.includes(v) ? v : "open") as VibeKey;
}

export type RoomMember = {
  user_id: string;
  role: string;
  state: string;
  display_name: string | null;
};

export type RoomEvent = {
  id: string;
  activity_id: string;
  user_id: string | null;
  type: string;
  content: string;
  created_at: string;
  display_name: string | null;
};
