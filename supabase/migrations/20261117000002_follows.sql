-- Fork system: Dockers (followers) / Docking (following) / Fork (follow).
-- Instagram-style social layer for the board and profiles.

create table if not exists public.community_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  target_handle text not null
    check (char_length(target_handle) between 1 and 80 and target_handle ~ '^[a-z0-9_.-]+$'),
  created_at timestamptz not null default now(),
  primary key (follower_id, target_handle)
);

create index if not exists community_follows_target on public.community_follows (target_handle);

alter table public.community_follows enable row level security;
alter table public.community_follows force row level security;

drop policy if exists "Follows are readable" on public.community_follows;
create policy "Follows are readable"
  on public.community_follows for select to anon, authenticated using (true);

drop policy if exists "Users fork as themselves" on public.community_follows;
create policy "Users fork as themselves"
  on public.community_follows for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "Users unfork their own rows" on public.community_follows;
create policy "Users unfork their own rows"
  on public.community_follows for delete to authenticated
  using (auth.uid() = follower_id);

revoke insert, update, delete, truncate on public.community_follows from anon;
revoke truncate on public.community_follows from anon, authenticated;
grant select on public.community_follows to anon, authenticated;
grant insert, delete on public.community_follows to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_follows'
  ) then
    alter publication supabase_realtime add table public.community_follows;
  end if;
end $$;
