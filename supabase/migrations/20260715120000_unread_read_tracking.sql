-- Unread message tracking — backend for the app's unread badges + the room
-- "New messages" divider. Implements .docs/UNREAD_MIGRATION.md (friend's handoff
-- spec). Replaces the on-device AsyncStorage watermark with a synced server one.
--
-- Model: a per-member read watermark. Unread = real messages (chat/quick) newer
-- than the watermark, NOT authored by the caller. Baseline for a never-read
-- room is joined_at (so a room you were added to but never opened correctly
-- shows unread since you joined — better than the local fake's "0 until opened").

-- 1. Per-member read watermark. Nullable = never read (baseline falls back to
--    joined_at in the count below).
alter table public.activity_members
  add column if not exists last_read_at timestamptz;

-- 2. Mark a room read. Advances the watermark; greatest() so it never moves
--    backwards (a stale screen re-marking an old ts can't resurrect unread).
--    auth.uid() scopes it to the caller — nobody can mark another's read state.
create or replace function public.mark_room_read(
  p_activity_id uuid,
  p_at timestamptz
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.activity_members
     set last_read_at = greatest(coalesce(last_read_at, 'epoch'::timestamptz), p_at)
   where activity_id = p_activity_id
     and user_id = auth.uid();
$$;

-- 3. Unread counts for a set of rooms (one round-trip for the lobby/created
--    badges). Only the caller's own memberships are considered (m.user_id =
--    auth.uid()), so no one can read another user's unread state.
create or replace function public.unread_counts(p_activity_ids uuid[])
returns table(activity_id uuid, unread_count int)
language sql
security definer
set search_path = public
as $$
  select m.activity_id,
         count(e.*) filter (
           where e.type in ('chat', 'quick')
             and e.user_id <> m.user_id
             and e.created_at > greatest(m.last_read_at, m.joined_at, 'epoch'::timestamptz)
         )::int as unread_count
    from public.activity_members m
    left join public.room_events e on e.activity_id = m.activity_id
   where m.user_id = auth.uid()
     and m.activity_id = any (p_activity_ids)
   group by m.activity_id;
$$;

-- Grants: authenticated only. Block anon + public (matches the existing
-- get_room_events_page hardening; SECURITY DEFINER must not be anon-callable).
revoke all on function public.mark_room_read(uuid, timestamptz) from public;
revoke all on function public.mark_room_read(uuid, timestamptz) from anon;
grant execute on function public.mark_room_read(uuid, timestamptz) to authenticated;

revoke all on function public.unread_counts(uuid[]) from public;
revoke all on function public.unread_counts(uuid[]) from anon;
grant execute on function public.unread_counts(uuid[]) to authenticated;
