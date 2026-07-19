-- Web feed (#66 / WEB_PLAN §3.3 + §6.6): the anonymous LIST read for the front
-- page. Same posture as get_room_public — SECURITY DEFINER whitelist, zero
-- base-table grants for anon. Returns computed distance_km when coords are
-- supplied; RAW COORDINATES ARE NEVER RETURNED.
--
-- p_scope:  'open' = status open + unexpired (the feed), newest or nearest first
--           'past' = expired/closed (FOMO section), newest first, small limit
-- p_filter: 'all' | 'nearby' (needs p_lat/p_lng; within p_radius_km, sorted by
--           distance) | 'online' (no location at all — VISION §4.4)

create or replace function public.get_feed_public(
  p_scope text default 'open',
  p_filter text default 'all',
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default 15,
  p_limit int default 30
)
returns table (
  share_slug text,
  title_text text,
  vibe text,
  start_time timestamptz,
  place_name text,
  capacity integer,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  joined_count bigint,
  host_display_name text,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.share_slug,
    a.title_text,
    a.vibe,
    a.start_time,
    a.place_name,
    a.capacity,
    a.status,
    a.expires_at,
    a.created_at,
    (
      select count(*) from public.activity_members m
      where m.activity_id = a.id and m.state = 'joined'
    ) as joined_count,
    p.display_name as host_display_name,
    case
      when p_lat is not null and p_lng is not null and a.lat is not null and a.lng is not null
      then round((6371 * acos(least(1, greatest(-1,
             cos(radians(p_lat)) * cos(radians(a.lat)) *
             cos(radians(a.lng) - radians(p_lng)) +
             sin(radians(p_lat)) * sin(radians(a.lat))
           ))))::numeric, 1)::double precision
      else null
    end as distance_km
  from public.activities a
  left join public.profiles p on p.id = a.creator_id
  where
    case when p_scope = 'past'
      then (a.status <> 'open' or (a.expires_at is not null and a.expires_at <= now()))
      else (a.status = 'open' and (a.expires_at is null or a.expires_at > now()))
    end
    and case
      when p_filter = 'online' then (a.lat is null and a.place_name is null)
      when p_filter = 'nearby' and p_lat is not null and p_lng is not null
        then (a.lat is not null and a.lng is not null and
          6371 * acos(least(1, greatest(-1,
            cos(radians(p_lat)) * cos(radians(a.lat)) *
            cos(radians(a.lng) - radians(p_lng)) +
            sin(radians(p_lat)) * sin(radians(a.lat))
          ))) <= p_radius_km)
      else true
    end
  order by
    case when p_filter = 'nearby' and p_lat is not null and p_lng is not null and a.lat is not null
      then 6371 * acos(least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(a.lat)) *
        cos(radians(a.lng) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(a.lat))
      )))
      else null
    end asc nulls last,
    a.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

revoke all on function public.get_feed_public(text, text, double precision, double precision, double precision, int) from public;
grant execute on function public.get_feed_public(text, text, double precision, double precision, double precision, int) to anon, authenticated;
