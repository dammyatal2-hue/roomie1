alter table public.listings add column if not exists view_count bigint not null default 0;

create or replace function public.increment_listing_view(target_listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
  set view_count = view_count + 1
  where id = target_listing_id and status = 'published';
$$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;
