import {
  fetchOpenActivitiesPage,
  fetchCreatedActivitiesPage,
  fetchActivitiesByIdsPage,
  fetchMembershipRowsForUser,
  joinWithSystemMessage,
  isJoinableActivity,
  isActiveActivity,
  type ActivityCursor,
  type MembershipRow,
} from "../domain/activities";
import type { ActivityCardActivity } from "../../components/ActivityCard";

export type ActivitiesPage = {
  rows: ActivityCardActivity[];
  cursor: ActivityCursor | null;
  hasMore: boolean;
};

function buildCursor(rows: ActivityCardActivity[]): ActivityCursor | null {
  const last = rows[rows.length - 1];
  if (!last?.created_at) return null;
  return { created_at: last.created_at, id: last.id };
}

export async function getMembershipForUser(
  userId: string
): Promise<MembershipRow[]> {
  return fetchMembershipRowsForUser(userId);
}

export async function getBrowsePage(params: {
  cursor?: ActivityCursor | null;
  limit: number;
  joinedSet: Set<string>;
  excludeCreatorId?: string | null;
}): Promise<ActivitiesPage> {
  const rows = await fetchOpenActivitiesPage(
    params.cursor ?? null,
    params.limit
  );
  const notMine =
    params.excludeCreatorId != null
      ? rows.filter((a) => a.creator_id !== params.excludeCreatorId)
      : rows;
  const joinable = notMine.filter((a) =>
    isJoinableActivity(a, params.joinedSet)
  );
  return {
    rows: joinable,
    cursor: buildCursor(rows),
    hasMore: rows.length === params.limit,
  };
}

export async function getCreatedPage(params: {
  userId: string;
  cursor?: ActivityCursor | null;
  limit: number;
}): Promise<ActivitiesPage> {
  const rows = await fetchCreatedActivitiesPage(
    params.userId,
    params.cursor ?? null,
    params.limit
  );
  return {
    rows,
    cursor: buildCursor(rows),
    hasMore: rows.length === params.limit,
  };
}

export async function getJoinedPage(params: {
  activityIds: string[];
  cursor?: ActivityCursor | null;
  limit: number;
  excludeCreatorId?: string | null;
}): Promise<ActivitiesPage> {
  if (params.activityIds.length === 0) {
    return { rows: [], cursor: null, hasMore: false };
  }

  const rows = await fetchActivitiesByIdsPage(
    params.activityIds,
    params.cursor ?? null,
    params.limit
  );
  const notMine =
    params.excludeCreatorId != null
      ? rows.filter((a) => a.creator_id !== params.excludeCreatorId)
      : rows;
  return {
    rows: notMine,
    cursor: buildCursor(rows),
    hasMore: rows.length === params.limit,
  };
}

export function filterActiveActivities(
  rows: ActivityCardActivity[]
): ActivityCardActivity[] {
  return rows.filter((a) => isActiveActivity(a));
}

export async function joinActivity(activityId: string, userId: string) {
  return joinWithSystemMessage(activityId, userId);
}
