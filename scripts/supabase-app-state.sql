-- Run this in Supabase SQL Editor once.
-- It creates one shared row/table for Acumen app data.

create table if not exists public.app_state (
  id text primary key,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  data jsonb not null
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_select_public" on public.app_state;
create policy "app_state_select_public"
on public.app_state
for select
to anon
using (true);

drop policy if exists "app_state_insert_public" on public.app_state;
create policy "app_state_insert_public"
on public.app_state
for insert
to anon
with check (id = 'default');

drop policy if exists "app_state_update_public" on public.app_state;
create policy "app_state_update_public"
on public.app_state
for update
to anon
using (id = 'default')
with check (id = 'default');
