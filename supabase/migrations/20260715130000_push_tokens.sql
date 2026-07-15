-- Push notifications: store each user's Expo push token(s).
-- One user can have several devices, so the PK is (user_id, token).
-- RLS: a user manages ONLY their own tokens (scoped to auth.uid(), anon blocked)
-- — following the SECURITY_AUDIT hardening (no USING(true) here). The push
-- SENDER (edge function) reads recipients' tokens with the service_role key,
-- which bypasses RLS, so recipients' tokens do not need to be client-readable.

create table if not exists public.push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy push_tokens_select_own on public.push_tokens
  for select to authenticated using (user_id = auth.uid());
create policy push_tokens_insert_own on public.push_tokens
  for insert to authenticated with check (user_id = auth.uid());
create policy push_tokens_update_own on public.push_tokens
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy push_tokens_delete_own on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

revoke all on table public.push_tokens from anon;
grant select, insert, update, delete on table public.push_tokens to authenticated;

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
