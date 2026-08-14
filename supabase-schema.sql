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

drop policy if exists "Anyone can view approved suggestions" on public.suggestions;
create policy "Anyone can view approved suggestions"
  on public.suggestions for select
  using (status = 'approved');

-- Postgres OR's multiple select policies together, so the net effect of the
-- two select policies above is: a logged-in visitor can see their own
-- suggestions regardless of status (useful for "did mine get approved?"),
-- and everyone — including visitors who aren't logged in — can see anything
-- with status = 'approved', which is what powers the public
-- suggested-abairtean.html page.
--
-- No update/delete policies for suggestions on purpose — once submitted, a
-- visitor can't edit or withdraw it from the public site. You review and
-- change "status" (pending → approved/rejected) from the Table Editor — that's
-- also how a suggestion gets onto suggested-abairtean.html (set it to
-- "approved") and how you'd remove one from there again (set it back to
-- "pending", or "rejected", or delete the row).


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


create table if not exists public.game_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  games_played integer not null default 0,
  games_won integer not null default 0,
  last_played_day integer,
  last_result text,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

alter table public.game_stats enable row level security;

drop policy if exists "Users can view their own game stats" on public.game_stats;
create policy "Users can view their own game stats"
  on public.game_stats for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own game stats" on public.game_stats;
create policy "Users can create their own game stats"
  on public.game_stats for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own game stats" on public.game_stats;
create policy "Users can update their own game stats"
  on public.game_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One row per (user, game) — "game" is a free-text short code (no CHECK
-- constraint, so new games just need a new code, no migration required).
-- Four in use so far: 'wordle' (Am Facal, Gaelic), 'bee' (Seillean, Gaelic),
-- 'wordle-sco' (The Wurd, Scots), 'bee-sco' (Bumbee, Scots).
-- "last_played_day" is the day-index of the puzzle they most recently completed
-- (see wurd.html/geama.html), used to work out whether today continues their
-- streak, resets it, or whether they've already played today's puzzle. Same
-- upsert pattern as subscribers above, hence the insert + update policies.
