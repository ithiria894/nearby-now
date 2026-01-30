import {
  getRoomEventById,
  getRoomEventsPage,
  type RoomEventCursor,
  type RoomEventRow,
} from "../domain/room_events";

export type RoomEventsPage = {
  rows: RoomEventRow[];
  cursor: RoomEventCursor | null;
  hasMore: boolean;
};

export async function fetchRoomEventsPage(params: {
  activityId: string;
  limit: number;
  cursor?: RoomEventCursor | null;
  leftAt?: Date | null;
}): Promise<RoomEventsPage> {
  const { rows, nextCursor, hasMore } = await getRoomEventsPage(params);
  return { rows, cursor: nextCursor, hasMore };
}

export async function fetchRoomEventById(
  eventId: string
): Promise<RoomEventRow | null> {
  return getRoomEventById(eventId);
}
