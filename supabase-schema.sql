-- Sean-fhaclan & Auld Sayins — Supabase schema
--
-- Run this once: Supabase dashboard → your project → SQL Editor → New query →
-- paste this whole file → Run. Safe to run more than once (uses "if not exists")
-- — if you already ran an earlier version of this file, just re-run the whole
-- thing again; nothing will be duplicated or broken.
--
-- This creates three tables:
--   favourites   — which proverb IDs each logged-in visitor has starred
--   suggestions  — proverbs visitors submit via the "Suggest a proverb" form
--   subscribers  — who's opted into the email newsletter and/or push notifications
--
-- Row-level security (RLS) is turned on for all three, so from the public site a
-- visitor can only ever read or write their OWN rows — never anyone else's.
-- You (the project owner) can see everything regardless, via the Table Editor
-- in the Supabase dashboard, which uses your own admin access and bypasses
-- these policies entirely.

create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proverb_id integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, proverb_id)
);

alter table public.favourites enable row level security;

drop policy if exists "Users can view their own favourites" on public.favourites;
create policy "Users can view their own favourites"
  on public.favourites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own favourites" on public.favourites;
create policy "Users can add their own favourites"
  on public.favourites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own favourites" on public.favourites;
create policy "Users can remove their own favourites"
  on public.favourites for delete
  using (auth.uid() = user_id);


create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  scots_text text,
  gaelic_text text,
  english_text text,
  meaning text,
  submitted_by text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

drop policy if exists "Users can view their own suggestions" on public.suggestions;
create policy "Users can view their own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can submit suggestions" on public.suggestions;
create policy "Users can submit suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

-- No update/delete policies for suggestions on purpose — once submitted, a
-- visitor can't edit or withdraw it from the public site. You review and
-- change "status" (pending → approved/rejected) from the Table Editor.


create table if not exists public.subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  newsletter_opt_in boolean not null default false,
  push_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

drop policy if exists "Users can view their own subscriber row" on public.subscribers;
create policy "Users can view their own subscriber row"
  on public.subscribers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own subscriber row" on public.subscribers;
create policy "Users can create their own subscriber row"
  on public.subscribers for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscriber row" on public.subscribers;
create policy "Users can update their own subscriber row"
  on public.subscribers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The "Stay updated" toggles on the site write to this table via upsert (insert
-- the first time, update after that), which is why both an insert and an update
-- policy are needed above. No delete policy — turning a toggle off just sets the
-- relevant column back to false, it never removes the row.
