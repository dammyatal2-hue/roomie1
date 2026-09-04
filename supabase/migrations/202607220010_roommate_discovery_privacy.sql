alter table public.profiles
  add column if not exists roommate_discoverable boolean not null default false,
  add column if not exists looking_for_country text,
  add column if not exists looking_for_city text;

create index if not exists profiles_roommate_discovery_idx
  on public.profiles(roommate_discoverable, looking_for_country, looking_for_city)
  where roommate_discoverable = true;
