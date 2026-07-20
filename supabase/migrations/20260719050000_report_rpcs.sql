-- Web report baseline (#71). RPCs that resolve the reported user SERVER-SIDE so
-- the client never needs the creator/author uid (the public payload never
-- exposes it). Both insert into user_reports (insert-only RLS from
-- 20260715160000). authenticated-only — guests have that role via anonymous
-- sign-in. Self-reports no-op (the table also CHECKs reporter <> reported).

create or replace function public.report_activity(p_activity_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  creator uuid;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  select creator_id into creator from public.activities where id = p_activity_id;
  if creator is null then
    raise exception 'not_found';
  end if;
  if creator = uid then
    return; -- can't report your own hangout
  end if;
  insert into public.user_reports (reporter_id, reported_user_id, activity_id, reason)
  values (uid, creator, p_activity_id, left(coalesce(p_reason, ''), 1000));
end;
$$;

create or replace function public.report_message(p_event_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  act uuid;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  select user_id, activity_id into target, act
  from public.room_events where id = p_event_id;
  if target is null or target = uid then
    return; -- system event, missing, or your own message
  end if;
  insert into public.user_reports (reporter_id, reported_user_id, activity_id, reason)
  values (uid, target, act, left(coalesce(p_reason, ''), 1000));
end;
$$;

revoke all on function public.report_activity(uuid, text) from public;
revoke all on function public.report_message(uuid, text) from public;
grant execute on function public.report_activity(uuid, text) to authenticated;
grant execute on function public.report_message(uuid, text) to authenticated;
