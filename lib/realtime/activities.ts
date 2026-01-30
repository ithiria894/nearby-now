import { supabase } from "../api/supabase";

export function subscribeToBrowseActivities(onChange: (payload: any) => void) {
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
}

export function subscribeToJoinedActivityChanges(
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
}
