-- Web funnel (#49): the ONLY anonymous read surface. A SECURITY DEFINER RPC that
-- returns a strict whitelist of public room fields by slug, so a logged-out
-- visitor can see a room page. Base-table grants for `anon` stay at zero.
--
-- Whitelist (WEB_PLAN §3.1, open decision §12.2 — confirm before prod):
--   title, vibe, start_time, place_name, capacity, status, expires_at,
--   joined_count, host display name.
-- EXCLUDED by design: place_address, lat/lng, member names, room_events.

create or replace function public.get_room_public(p_slug text)
returns table (
  id uuid,
  title_text text,
  vibe text,
  start_time timestamptz,
  place_name text,
  capacity integer,
  status text,
  expires_at timestamptz,
  joined_count bigint,
  host_display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.title_text,
    a.vibe,
    a.start_time,
    a.place_name,
    a.capacity,
    a.status,
    a.expires_at,
    (
      select count(*)
      from public.activity_members m
      where m.activity_id = a.id and m.state = 'joined'
    ) as joined_count,
    p.display_name as host_display_name
  from public.activities a
  left join public.profiles p on p.id = a.creator_id
  where a.share_slug = p_slug
  limit 1;
$$;

-- Only this function is callable by anon; no base-table access is granted.
revoke all on function public.get_room_public(text) from public;
grant execute on function public.get_room_public(text) to anon, authenticated;
