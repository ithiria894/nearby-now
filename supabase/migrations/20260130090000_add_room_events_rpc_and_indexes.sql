-- RPC for paged room events with cursor + indexes for scale

create or replace function public.get_room_events_page(
  p_activity_id uuid,
  p_limit int default 50,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_left_at timestamptz default null
)
returns table (
  id uuid,
  activity_id uuid,
  user_id uuid,
  type text,
  content text,
  created_at timestamptz,
  display_name text
)
language sql
stable
as $$
  select
    e.id,
    e.activity_id,
    e.user_id,
    e.type,
    e.content,
    e.created_at,
    p.display_name
  from public.room_events e
  left join public.profiles p on p.id = e.user_id
  where e.activity_id = p_activity_id
    and (p_left_at is null or e.created_at <= p_left_at)
    and (
      p_cursor_created_at is null
      or e.created_at < p_cursor_created_at
      or (e.created_at = p_cursor_created_at and e.id < p_cursor_id)
    )
  order by e.created_at desc, e.id desc
  limit p_limit;
$$;

create or replace function public.get_room_event_by_id(
  p_event_id uuid
)
returns table (
  id uuid,
  activity_id uuid,
  user_id uuid,
  type text,
  content text,
  created_at timestamptz,
  display_name text
)
language sql
stable
as $$
  select
    e.id,
    e.activity_id,
    e.user_id,
    e.type,
    e.content,
    e.created_at,
    p.display_name
  from public.room_events e
  left join public.profiles p on p.id = e.user_id
  where e.id = p_event_id
  limit 1;
$$;

-- indexes for scale
create index if not exists room_events_activity_created_id_idx
  on public.room_events (activity_id, created_at desc, id desc);

create index if not exists room_events_activity_created_idx
  on public.room_events (activity_id, created_at desc);

create index if not exists activity_members_user_idx
  on public.activity_members (user_id);

create index if not exists activity_members_activity_idx
  on public.activity_members (activity_id);

create index if not exists activity_members_user_state_idx
  on public.activity_members (user_id, state);

create index if not exists activities_status_created_id_idx
  on public.activities (status, created_at desc, id desc);

create index if not exists activities_creator_created_id_idx
  on public.activities (creator_id, created_at desc, id desc);
