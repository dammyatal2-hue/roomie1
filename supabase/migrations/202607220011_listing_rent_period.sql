alter table public.listings
  add column if not exists rent_period text not null default 'month'
  check (rent_period in ('night', 'week', 'month'));
