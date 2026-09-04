create table if not exists public.listing_favorites (user_id uuid references public.profiles(id) on delete cascade, listing_id uuid references public.listings(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,listing_id));
create table if not exists public.listing_views (user_id uuid references public.profiles(id) on delete cascade, listing_id uuid references public.listings(id) on delete cascade, viewed_at timestamptz not null default now(), primary key(user_id,listing_id));
alter table public.listing_favorites enable row level security; alter table public.listing_views enable row level security;
create policy "own favorites" on public.listing_favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own history" on public.listing_views for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
