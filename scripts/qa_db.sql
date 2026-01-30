\echo '==> Pick a random activity_id'
select id as activity_id from public.activities order by random() limit 1 \gset

\if :{?activity_id}
  \echo '==> activity_id is ' :activity_id
  \echo '==> get_room_events_page (latest 5)'
  select * from public.get_room_events_page(:'activity_id', 5, null, null, null);
\else
  \echo '==> No activities found. Create one first.'
\endif
