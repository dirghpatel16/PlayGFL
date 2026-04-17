-- PlayGFL production schema for Supabase/Postgres

create extension if not exists "pgcrypto";

create type user_role as enum ('player', 'captain', 'admin');
create type preferred_role as enum ('Assaulter', 'Support', 'IGL', 'Sniper', 'Flexible');
create type auction_state as enum ('waiting', 'drawing', 'player_reveal', 'selection', 'sold', 'complete');

create table if not exists public.users (
  id text primary key,
  username text unique not null,
  email text unique not null,
  email_verified boolean not null default false,
  role user_role not null default 'player',
  created_at timestamptz not null default now()
);

create table if not exists public.player_profiles (
  user_id text primary key references public.users(id) on delete cascade,
  username text,
  avatar_url text,
  bgmi_name text,
  bgmi_ign text,
  bgmi_id text,
  role_preference preferred_role,
  preferred_roles preferred_role[] not null default '{}',
  bio text,
  region text,
  experience_level text,
  completion_percent int not null default 0,
  approved boolean not null default false,
  trial_registered boolean not null default false,
  shortlisted boolean not null default false,
  auction_pool boolean not null default false,
  stats jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_registrations (
  user_id text primary key references public.users(id) on delete cascade,
  tournament_id text not null default 'gfl-s2',
  status text not null default 'profile_completed', -- profile_completed | payment_submitted | payment_rejected | registered
  payment_status text not null default 'unpaid', -- unpaid | submitted | confirmed | rejected
  updated_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id text primary key,
  name text not null,
  timezone text not null,
  launch_at timestamptz not null,
  starts_at timestamptz not null,
  registration_open boolean not null default true,
  prize_pool_inr int not null,
  format text not null
);

create table if not exists public.captains (
  id text primary key,
  user_id text references public.users(id),
  name text not null,
  tag text not null,
  region text,
  purse_points int default 100
);

create table if not exists public.auction_players (
  id text primary key,
  profile_user_id text references public.users(id),
  name text not null,
  role preferred_role not null,
  region text,
  style text,
  sold_to_captain_id text references public.captains(id)
);

create table if not exists public.auction_sessions (
  id uuid primary key default gen_random_uuid(),
  tournament_id text not null references public.tournaments(id),
  state auction_state not null default 'waiting',
  current_player_id text references public.auction_players(id),
  current_captain_turn int not null default 0,
  announcer_line text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auction_pool (
  session_id uuid references public.auction_sessions(id) on delete cascade,
  player_id text references public.auction_players(id) on delete cascade,
  is_available boolean not null default true,
  draw_order bigint,
  drawn_at timestamptz,
  sold_at timestamptz,
  sold_to_captain_id text references public.captains(id),
  primary key (session_id, player_id)
);

create table if not exists public.auction_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.auction_sessions(id) on delete cascade,
  player_id text not null references public.auction_players(id),
  captain_id text references public.captains(id),
  state auction_state not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  tournament_id text not null references public.tournaments(id),
  captain_id text not null references public.captains(id),
  name text not null
);

create table if not exists public.team_players (
  team_id text references public.teams(id) on delete cascade,
  player_id text references public.auction_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, player_id)
);


create table if not exists public.payment_submissions (
  user_id text primary key references public.users(id) on delete cascade,
  status text not null default 'unpaid' -- unpaid | submitted | confirmed | rejected,
  utr text,
  payer_name text,
  screenshot_name text,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references public.teams(id) on delete cascade,
  match_number int,
  round_type text,
  map text,
  placement int not null,
  kills int not null default 0,
  is_golden_round boolean not null default false,
  nominated_player_kills int not null default 0,
  bonus_type text not null default 'none',
  placement_points int not null default 0,
  kill_points int not null default 0,
  bonus_points int not null default 0,
  golden_modifier_points int not null default 0,
  golden_round_bonus int not null default 0,
  total_points int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id text primary key,
  title text not null,
  body text not null,
  priority text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.player_profiles enable row level security;
alter table public.auction_sessions enable row level security;
alter table public.auction_pool enable row level security;
alter table public.auction_rounds enable row level security;
alter table public.auction_players enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;
alter table public.announcements enable row level security;
alter table public.captains enable row level security;
alter table public.tournaments enable row level security;
alter table public.payment_submissions enable row level security;
alter table public.match_results enable row level security;
alter table public.tournament_registrations enable row level security;

create policy "users can read users" on public.users for select using (true);
create policy "users can update own profile" on public.player_profiles for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "public read auction" on public.auction_sessions for select using (true);
create policy "public read auction_pool" on public.auction_pool for select using (true);
create policy "public read auction_rounds" on public.auction_rounds for select using (true);
create policy "public read auction_players" on public.auction_players for select using (true);
create policy "public read teams" on public.teams for select using (true);
create policy "public read team_players" on public.team_players for select using (true);
create policy "public read announcements" on public.announcements for select using (true);
create policy "public read captains" on public.captains for select using (true);
create policy "public read tournaments" on public.tournaments for select using (true);
create policy "users read own payment" on public.payment_submissions for select using (auth.uid()::text = user_id);
create policy "users create own payment" on public.payment_submissions for insert with check (auth.uid()::text = user_id);
create policy "public read match results" on public.match_results for select using (true);
create policy "users read own registration" on public.tournament_registrations for select using (auth.uid()::text = user_id);
create policy "users upsert own registration" on public.tournament_registrations for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
