-- Supabase/Postgres schema suggestion for GFL MVP

create type user_role as enum ('player', 'captain', 'admin');
create type preferred_role as enum ('Assaulter', 'Support', 'IGL', 'Sniper', 'Flexible');
create type auction_state as enum ('waiting', 'player_reveal', 'selection', 'sold', 'complete');

create table users (
  id uuid primary key,
  username text unique not null,
  email text unique not null,
  email_verified boolean not null default false,
  role user_role not null default 'player',
  created_at timestamptz not null default now()
);

create table player_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  avatar_url text,
  bgmi_name text not null,
  bgmi_id text not null,
  preferred_roles preferred_role[] not null,
  bio text,
  region text,
  experience_level text,
  completion_percent int not null default 0,
  approved boolean not null default false,
  stats jsonb not null default '{}'
);

create table tournaments (
  id text primary key,
  name text not null,
  timezone text not null,
  launch_at timestamptz not null,
  starts_at timestamptz not null,
  registration_open boolean not null default true,
  prize_pool_inr int not null,
  format text not null
);

create table captains (
  id text primary key,
  user_id uuid references users(id),
  name text not null,
  tag text not null,
  region text,
  purse_points int
);

create table auction_players (
  id text primary key,
  profile_user_id uuid references users(id),
  name text not null,
  role preferred_role not null,
  region text,
  style text,
  sold_to_captain_id text references captains(id)
);

create table auction_rounds (
  id text primary key,
  tournament_id text references tournaments(id),
  round_number int not null,
  player_id text references auction_players(id),
  captain_id text references captains(id),
  state auction_state not null,
  created_at timestamptz default now()
);

create table teams (
  id text primary key,
  tournament_id text references tournaments(id),
  captain_id text references captains(id),
  name text not null
);

create table team_players (
  team_id text references teams(id),
  player_id text references auction_players(id),
  primary key (team_id, player_id)
);

create table announcements (
  id text primary key,
  title text not null,
  body text not null,
  priority text not null,
  created_at timestamptz default now()
);
