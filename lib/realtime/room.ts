import { backend } from "../backend";

type RoomHandlers = {
  onMemberChange?: (payload: any) => void;
  onEventInsert?: (payload: any) => void;
  onActivityChange?: (payload: any) => void;
};

export function subscribeToRoom(activityId: string, handlers: RoomHandlers) {
  return backend.realtime.subscribeToRoom(activityId, handlers);
}
