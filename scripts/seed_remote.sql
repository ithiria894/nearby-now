do $$
declare
  u uuid;
  a uuid;
  i int;
  j int;
  long_room_count int := 5;
  total_activities int := 60;
  long_history_len int := 200;
begin
  select id into u from auth.users order by created_at desc limit 1;
  if u is null then
    raise exception 'No auth.users found. Create a user via the app first.';
  end if;

  insert into public.profiles (id, display_name)
  values (u, 'Test User')
  on conflict (id) do update set display_name = excluded.display_name;

  for i in 1..total_activities loop
    insert into public.activities (
      id, creator_id, title_text, status, created_at
    ) values (
      gen_random_uuid(),
      u,
      '[TEST] Activity ' || i,
      'open',
      now() - (i || ' minutes')::interval
    ) returning id into a;

    insert into public.activity_members (
      activity_id, user_id, role, state, joined_at
    ) values (
      a, u, 'creator', 'joined', now() - (i || ' minutes')::interval
    ) on conflict do nothing;

    insert into public.room_events (activity_id, user_id, type, content, created_at)
    values
      (a, u, 'system', '{"k":"room.system.joined"}', now() - (i || ' minutes')::interval),
      (a, u, 'chat', '[TEST] Hello world #' || i, now() - (i || ' minutes')::interval);

    if i <= long_room_count then
      for j in 1..long_history_len loop
        insert into public.room_events (activity_id, user_id, type, content, created_at)
        values (
          a,
          u,
          'chat',
          '[TEST] msg ' || j || ' in room ' || i,
          now() - ((i * 10 + j) || ' seconds')::interval
        );
      end loop;
    end if;
  end loop;
end $$;
