create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_comments_post_created_idx on public.post_comments(post_id, created_at);
alter table public.post_comments enable row level security;

drop policy if exists "comments read" on public.post_comments;
create policy "comments read" on public.post_comments for select using (true);

drop policy if exists "comments create" on public.post_comments;
create policy "comments create" on public.post_comments for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "comments own update" on public.post_comments;
create policy "comments own update" on public.post_comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "comments own delete" on public.post_comments;
create policy "comments own delete" on public.post_comments for delete to authenticated using (author_id = auth.uid());
