-- Safety: report + block other users (pre-launch requirement for a
-- strangers-meet-in-person app).
--
-- user_reports: a user flags another user (optionally tied to an activity) for
--   moderation review. Insert-only for the reporter; NOT client-readable
--   (reports are for moderation, never exposed to other users).
-- user_blocks: a user blocks another. The blocker manages their own blocks.
--   The app hides a blocked user's activities + messages (client-side in v1;
--   a server-side join gate can follow in the security phase).

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint chk_report_not_self check (reporter_id <> reported_user_id),
  constraint chk_report_reason_len check (reason is null or char_length(reason) <= 1000)
);
alter table public.user_reports enable row level security;
-- insert-only for the reporter; deliberately NO select policy (moderation only).
drop policy if exists user_reports_insert_own on public.user_reports;
create policy user_reports_insert_own on public.user_reports
  for insert to authenticated with check (reporter_id = auth.uid());
revoke all on table public.user_reports from anon;
grant insert on table public.user_reports to authenticated;
create index if not exists user_reports_reported_idx
  on public.user_reports (reported_user_id);

create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint chk_block_not_self check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists user_blocks_select_own on public.user_blocks;
create policy user_blocks_select_own on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid());
drop policy if exists user_blocks_insert_own on public.user_blocks;
create policy user_blocks_insert_own on public.user_blocks
  for insert to authenticated with check (blocker_id = auth.uid());
drop policy if exists user_blocks_delete_own on public.user_blocks;
create policy user_blocks_delete_own on public.user_blocks
  for delete to authenticated using (blocker_id = auth.uid());
revoke all on table public.user_blocks from anon;
grant select, insert, delete on table public.user_blocks to authenticated;
create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_id);
