import { backend } from "../backend";

export function subscribeToBrowseActivities(onChange: (payload: any) => void) {
  return backend.realtime.subscribeToBrowseActivities(onChange);
}

export function subscribeToJoinedActivityChanges(
  userId: string,
  activityIdSet: Set<string>,
  onChange: () => void
) {
  return backend.realtime.subscribeToJoinedActivityChanges(
    userId,
    activityIdSet,
    onChange
  );
}
