-- Campus board (text/photo/video posts) + community profiles, linked to Supabase Auth.
-- Local shared stack is fine for dev; apply the same file to the hosted project later.

create table if not exists public.community_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null default '',
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.create_community_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.community_profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    ''
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_community_profile on auth.users;
create trigger on_auth_user_created_community_profile
  after insert on auth.users
  for each row execute function public.create_community_profile();

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'student',
  body text not null check (char_length(body) between 1 and 500),
  media_path text,
  media_type text check (media_type in ('photo', 'video')),
  created_at timestamptz not null default now()
);

create index if not exists community_posts_created on public.community_posts (created_at desc);

alter table public.community_profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_profiles force row level security;
alter table public.community_posts force row level security;

drop policy if exists "Community profiles are readable" on public.community_profiles;
create policy "Community profiles are readable"
  on public.community_profiles for select to anon, authenticated using (true);

drop policy if exists "Own profile is editable" on public.community_profiles;
create policy "Own profile is editable"
  on public.community_profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Posts are readable by everyone" on public.community_posts;
create policy "Posts are readable by everyone"
  on public.community_posts for select to anon, authenticated using (true);

drop policy if exists "Authenticated users post as themselves" on public.community_posts;
create policy "Authenticated users post as themselves"
  on public.community_posts for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors delete their own posts" on public.community_posts;
create policy "Authors delete their own posts"
  on public.community_posts for delete to authenticated
  using (auth.uid() = author_id);

revoke insert, update, delete, truncate on public.community_profiles from anon, authenticated;
revoke truncate on public.community_profiles from anon, authenticated;
grant select on public.community_profiles to anon, authenticated;
grant update (handle, display_name, avatar_url) on public.community_profiles to authenticated;

revoke insert, update, delete, truncate on public.community_posts from anon;
revoke update, delete, truncate on public.community_posts from authenticated;
grant select on public.community_posts to anon, authenticated;
grant insert (author_id, author_name, body, media_path, media_type) on public.community_posts to authenticated;
grant delete on public.community_posts to authenticated;

-- Media bucket for photos/videos attached to posts.
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

drop policy if exists "Community media is publicly readable" on storage.objects;
create policy "Community media is publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'community-media');

drop policy if exists "Users upload to their own folder" on storage.objects;
create policy "Users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users replace their own media" on storage.objects;
create policy "Users replace their own media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_posts'
  ) then
    alter publication supabase_realtime add table public.community_posts;
  end if;
end $$;
