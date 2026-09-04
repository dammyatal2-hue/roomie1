create or replace function public.is_admin(target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=target_user_id and role='admin');
$$;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin(auth.uid()) then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_role_change on public.profiles;
create trigger protect_profile_role_change before update on public.profiles for each row execute function public.protect_profile_role();

drop policy if exists "admin listings read" on public.listings;
create policy "admin listings read" on public.listings for select to authenticated using(public.is_admin());
drop policy if exists "admin listings update" on public.listings;
create policy "admin listings update" on public.listings for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin requests read" on public.booking_requests;
create policy "admin requests read" on public.booking_requests for select to authenticated using(public.is_admin());
