-- Realtime publication config for postgres_changes.
--
-- On Supabase Cloud this was previously set via the dashboard Realtime toggle
-- and never captured in migrations (config drift). The app subscribes to
-- postgres_changes on these 3 tables (lib/backend/supabase_backend.ts:
-- browse-activities, joined-realtime, nearby-now-room-<id>). Without the tables
-- in the supabase_realtime publication + REPLICA IDENTITY FULL, realtime
-- connects but silently receives nothing (and filtered events need FULL).

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.activities,
  public.activity_members,
  public.room_events;

ALTER TABLE public.activities       REPLICA IDENTITY FULL;
ALTER TABLE public.activity_members REPLICA IDENTITY FULL;
ALTER TABLE public.room_events      REPLICA IDENTITY FULL;
