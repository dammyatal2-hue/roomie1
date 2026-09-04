alter table public.profiles
  add column if not exists gender text
  check (gender is null or gender in ('woman', 'man', 'non-binary', 'prefer-not-to-say'));
