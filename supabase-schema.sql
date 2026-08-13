-- Sean-fhaclan & Auld Sayins — Supabase schema
--
-- Run this once: Supabase dashboard → your project → SQL Editor → New query →
-- paste this whole file → Run. Safe to run more than once (uses "if not exists").
--
-- This creates two tables:
--   favourites   — which proverb IDs each logged-in visitor has starred
--   suggestions  — proverbs visitors submit via the "Suggest a proverb" form
--
-- Row-level security (RLS) is turned on for both, so from the public site a
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
