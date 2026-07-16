-- "附近有人開咗局" push: when a new OPEN activity is created, notify people who
-- are physically nearby (and not blocked, not the creator) via the Expo Push API,
-- straight from Postgres with pg_net. Different trigger from the room-message
-- sender (20260715150000, fires on room_events); this one fires on activities.
--
-- The trigger runs inside Postgres, so "who is nearby?" needs server-side
-- recipient locations. push_tokens gains lat/lng/location_updated_at, written by
-- the client from the location `browse` already fetches (see lib/push/updateLocation).
-- See .docs/NEARBY_PUSH.md for the full spec + the (unbenchmarked) constants.

create extension if not exists pg_net;

-- 1) Per-device last-known location (same grain as the token). No new RLS: the
--    existing push_tokens *_own policies already scope each row to auth.uid().
alter table public.push_tokens
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists location_updated_at timestamptz;

create index if not exists push_tokens_loc_idx
  on public.push_tokens (lat, lng)
  where location_updated_at is not null;

-- 2) Sender.
create or replace function public.notify_nearby_new_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Tunable, NOT benchmarked (fresh feature). See spec.
  v_radius_km constant double precision := 10.0;
  v_max_age   constant interval        := interval '30 days';

  v_dlat   double precision;
  v_dlng   double precision;
  v_title  text;
  v_tokens text[];
begin
  -- Only a brand-new OPEN activity that actually has a location notifies anyone.
  if new.status <> 'open' or new.lat is null or new.lng is null then
    return new;
  end if;

  -- Bounding-box half-spans (degrees). ~111 km per degree of latitude; longitude
  -- shrinks by cos(lat). greatest(...,0.01) caps the span near the poles so we
  -- never divide by ~0.
  v_dlat := v_radius_km / 111.0;
  v_dlng := v_radius_km / (111.0 * greatest(cos(radians(new.lat)), 0.01));

  v_title := coalesce(nullif(trim(new.title_text), ''), 'NearbyNow');

  select array_agg(distinct pt.token)
    into v_tokens
    from public.push_tokens pt
   where pt.location_updated_at > now() - v_max_age
     and pt.lat is not null
     and pt.lng is not null
     -- fast, index-friendly superset...
     and pt.lat between new.lat - v_dlat and new.lat + v_dlat
     and pt.lng between new.lng - v_dlng and new.lng + v_dlng
     -- ...then the exact great-circle gate (km). acos arg clamped to [-1,1].
     and 6371.0 * acos(least(1.0, greatest(-1.0,
           sin(radians(new.lat)) * sin(radians(pt.lat)) +
           cos(radians(new.lat)) * cos(radians(pt.lat)) *
           cos(radians(pt.lng - new.lng))
         ))) <= v_radius_km
     and pt.user_id <> new.creator_id
     and pt.token like 'ExponentPushToken%'
     -- never notify across a block, in either direction.
     and not exists (
       select 1 from public.user_blocks b
        where (b.blocker_id = new.creator_id and b.blocked_id = pt.user_id)
           or (b.blocker_id = pt.user_id and b.blocked_id = new.creator_id)
     );

  if v_tokens is null or array_length(v_tokens, 1) is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'to', to_jsonb(v_tokens),
      'sound', 'default',
      'title', v_title,
      'body', 'Just opened near you — tap to join',
      'data', jsonb_build_object('activityId', new.id, 'type', 'nearby')
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_nearby_new_activity on public.activities;
create trigger trg_notify_nearby_new_activity
  after insert on public.activities
  for each row execute function public.notify_nearby_new_activity();
