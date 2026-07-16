-- Push sender (deploy-free): on a new chat/quick room message, notify every
-- OTHER joined member via the Expo Push API — directly from Postgres using
-- pg_net. No edge function, no access token, no committed secret (the Expo push
-- endpoint needs no auth; it just takes valid ExponentPushTokens). pg_net is
-- async so it never blocks the insert. Recipients' tokens are read here with
-- trigger (definer) privileges, so push_tokens RLS is not in the way.
create extension if not exists pg_net;

create or replace function public.notify_room_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title  text;
  v_author text;
  v_body   text;
  v_tokens text[];
begin
  -- Only real messages notify — system events (joins/edits) do not.
  if new.type not in ('chat', 'quick') then
    return new;
  end if;

  select coalesce(nullif(trim(title_text), ''), 'NearbyNow')
    into v_title
    from public.activities
   where id = new.activity_id;

  select coalesce(nullif(trim(display_name), ''), 'Someone')
    into v_author
    from public.profiles
   where id = new.user_id;

  v_body := case
    when new.type = 'quick' then v_author || ' sent a quick update'
    else v_author || ' sent a message'
  end;

  -- Recipients: joined members of this room, excluding the author, that have a
  -- registered Expo token.
  select array_agg(pt.token)
    into v_tokens
    from public.activity_members m
    join public.push_tokens pt on pt.user_id = m.user_id
   where m.activity_id = new.activity_id
     and m.state = 'joined'
     and m.user_id <> new.user_id
     and pt.token like 'ExponentPushToken%';

  if v_tokens is null or array_length(v_tokens, 1) is null then
    return new;
  end if;

  -- Expo accepts `to` as an array → one request fans out to all recipients.
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'to', to_jsonb(v_tokens),
      'sound', 'default',
      'title', v_title,
      'body', v_body,
      'data', jsonb_build_object('activityId', new.activity_id)
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_room_message on public.room_events;
create trigger trg_notify_room_message
  after insert on public.room_events
  for each row execute function public.notify_room_message();
