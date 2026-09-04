create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  storage_path text not null,
  position integer not null check (position between 0 and 4),
  created_at timestamptz not null default now(),
  unique (user_id, position),
  unique (user_id, storage_path)
);

alter table public.profile_photos enable row level security;
drop policy if exists "profile photos read" on public.profile_photos;
create policy "profile photos read" on public.profile_photos for select using (true);
drop policy if exists "profile photos own insert" on public.profile_photos;
create policy "profile photos own insert" on public.profile_photos for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "profile photos own update" on public.profile_photos;
create policy "profile photos own update" on public.profile_photos for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "profile photos own delete" on public.profile_photos;
create policy "profile photos own delete" on public.profile_photos for delete to authenticated using (user_id = auth.uid());

drop policy if exists "preferences visible to members" on public.preferences;
create policy "preferences visible to members" on public.preferences for select to authenticated using (true);
