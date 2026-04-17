-- Migration: dynamic registration flow + remove hardcoded demo entities

-- 1) Ensure player profile has only required onboarding fields
-- Convert auth identifiers to text for Clerk `user_xxx` ids.
alter table public.users
  alter column id type text using id::text;

alter table public.player_profiles
  alter column user_id type text using user_id::text;

alter table public.payment_submissions
  alter column user_id type text using user_id::text;

alter table public.player_profiles
  add column if not exists username text,
  add column if not exists bgmi_ign text,
  add column if not exists role_preference preferred_role;

-- 2) Create tournament registrations table for auto-pipeline state
create table if not exists public.tournament_registrations (
  user_id text primary key references public.users(id) on delete cascade,
  tournament_id text not null default 'gfl-s2',
  status text not null default 'profile_completed', -- profile_completed | payment_submitted | payment_rejected | registered
  payment_status text not null default 'unpaid',   -- unpaid | submitted | confirmed | rejected
  updated_at timestamptz not null default now()
);

alter table public.tournament_registrations enable row level security;

drop policy if exists "users read own registration" on public.tournament_registrations;
create policy "users read own registration"
  on public.tournament_registrations
  for select
  using (auth.uid()::text = user_id);

drop policy if exists "users upsert own registration" on public.tournament_registrations;
create policy "users upsert own registration"
  on public.tournament_registrations
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- 3) Remove previous demo rows (if present)
delete from public.auction_pool where session_id = '11111111-1111-1111-1111-111111111111';
delete from public.auction_sessions where id = '11111111-1111-1111-1111-111111111111';
delete from public.match_results where team_id in ('team-1', 'team-2', 'team-3');
delete from public.team_players where team_id in ('team-1', 'team-2', 'team-3');
delete from public.teams where id in ('team-1', 'team-2', 'team-3');
delete from public.captains where id in ('cap-1', 'cap-2', 'cap-3');
delete from public.auction_players where id in ('p-1','p-2','p-3','p-4','p-5','p-6','p-7','p-8','p-9');

-- 4) Keep tournament row but align id/name for current season
update public.tournaments
set id = 'gfl-s2',
    name = 'GFL Season 2'
where id = 'gfl-s1';

insert into public.tournaments (id, name, timezone, launch_at, starts_at, registration_open, prize_pool_inr, format)
values ('gfl-s2', 'GFL Season 2', 'Asia/Kolkata', '2026-04-15T19:00:00+05:30', '2026-04-18T21:00:00+05:30', true, 150, '3 captains draft auction players')
on conflict (id) do update set name = excluded.name, prize_pool_inr = excluded.prize_pool_inr;
