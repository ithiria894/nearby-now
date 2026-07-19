-- Web funnel metrics (#59 / WEB_PLAN §10, COLD_START §3). Insert-only event log.
-- No select policy → not readable via the API; query via SQL/service role only.
-- No PII beyond what the event names imply.

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  slug text,
  ref text,
  created_at timestamptz not null default now()
);

alter table public.funnel_events enable row level security;

-- anyone (guest or authed) may insert an event; nobody may select.
drop policy if exists funnel_events_insert_any on public.funnel_events;
create policy funnel_events_insert_any
  on public.funnel_events for insert to anon, authenticated with check (true);

grant insert on public.funnel_events to anon, authenticated;

create index if not exists funnel_events_event_created_idx
  on public.funnel_events (event, created_at desc);
