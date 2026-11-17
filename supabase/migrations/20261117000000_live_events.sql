-- Live Pune hackathon feed (Devpost). Synced by supabase/functions/sync-live-events
-- or scripts/sync-devpost.mjs. Kept out of the shipped static bundle.

create table if not exists public.live_events (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source text not null default 'devpost',
  title text not null check (char_length(title) <= 240),
  tagline text,
  official_url text not null check (official_url ~* '^https://' and char_length(official_url) <= 2048 and position('@' in official_url) = 0),
  starts_on date,
  ends_on date,
  deadline_on date,
  location text not null default 'Pune',
  organiser text,
  category text,
  themes text[] not null default '{}' check (cardinality(themes) <= 12),
  prize_display text check (prize_display is null or char_length(prize_display) <= 200),
  registrations_count integer,
  open_state text not null check (open_state in ('open', 'upcoming')),
  mode text not null default 'unknown' check (mode in ('online', 'offline', 'hybrid', 'unknown')),
  thumbnail_url text,
  synced_at timestamptz not null default now(),
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists live_events_published_state
  on public.live_events (published, open_state, deadline_on asc nulls last);

alter table public.live_events enable row level security;
alter table public.live_events force row level security;   -- defense in depth: even the owner goes through RLS

drop policy if exists "Published live events are publicly readable" on public.live_events;
create policy "Published live events are publicly readable"
  on public.live_events
  for select
  to anon, authenticated
  using (published = true);

-- Sync writes via the service role only; anon/authenticated cannot mutate.
revoke insert, update, delete, truncate on public.live_events from anon, authenticated;
grant select on public.live_events to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_events'
  ) then
    alter publication supabase_realtime add table public.live_events;
  end if;
end $$;
