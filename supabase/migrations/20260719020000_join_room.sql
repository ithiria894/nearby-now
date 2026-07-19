-- Web funnel (#50): atomic join with server-side capacity enforcement.
--
-- Today capacity is enforced NOWHERE server-side — the RLS insert policy checks
-- open+unexpired but not capacity, so two simultaneous joins can overfill a
-- room (mobile has this too). This RPC row-locks the activity (FOR UPDATE),
-- which serializes concurrent joins so the count is consistent, then inserts or
-- reactivates the caller's membership. Adoptable by mobile later.
--
-- Returns a branchable text: 'ok' | 'full' | 'closed' | 'expired' |
-- 'not_found' | 'not_authenticated'. Anonymous-auth sessions have the
-- `authenticated` role, so guests work; raw `anon` does not.

create or replace function public.join_room(p_activity_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  a record;
  joined int;
begin
  if uid is null then
    return 'not_authenticated';
  end if;

  select id, status, expires_at, capacity
    into a
  from public.activities
  where id = p_activity_id
  for update;

  if not found then
    return 'not_found';
  end if;
  if a.status <> 'open' then
    return 'closed';
  end if;
  if a.expires_at is not null and a.expires_at <= now() then
    return 'expired';
  end if;

  -- already an active member → idempotent success
  if exists (
    select 1 from public.activity_members m
    where m.activity_id = p_activity_id and m.user_id = uid and m.state = 'joined'
  ) then
    return 'ok';
  end if;

  if a.capacity is not null then
    select count(*) into joined
    from public.activity_members m
    where m.activity_id = p_activity_id and m.state = 'joined';
    if joined >= a.capacity then
      return 'full';
    end if;
  end if;

  insert into public.activity_members (activity_id, user_id, role, state, joined_at, left_at)
  values (p_activity_id, uid, 'member', 'joined', now(), null)
  on conflict (activity_id, user_id) do update
    set state = 'joined', joined_at = now(), left_at = null;

  return 'ok';
end;
$$;

revoke all on function public.join_room(uuid) from public;
grant execute on function public.join_room(uuid) to authenticated;
