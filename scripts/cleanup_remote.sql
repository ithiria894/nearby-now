begin;

delete from public.room_events
where activity_id in (
  select id from public.activities where title_text like '[TEST]%'
);

delete from public.activity_members
where activity_id in (
  select id from public.activities where title_text like '[TEST]%'
);

delete from public.activities
where title_text like '[TEST]%';

commit;
