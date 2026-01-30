import { supabase } from "../api/supabase";

type RoomHandlers = {
  onMemberChange?: (payload: any) => void;
  onEventInsert?: (payload: any) => void;
  onActivityChange?: (payload: any) => void;
};

export function subscribeToRoom(activityId: string, handlers: RoomHandlers) {
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
}
