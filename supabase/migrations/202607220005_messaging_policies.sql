create or replace function public.is_conversation_member(target_conversation_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.conversation_members
    where conversation_id = target_conversation_id and user_id = target_user_id
  );
$$;

grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

drop policy if exists "members read" on public.conversation_members;
create policy "members read" on public.conversation_members
for select to authenticated
using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages
for select to authenticated
using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages
for insert to authenticated
with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id, auth.uid()));
