alter table public.profiles add column if not exists date_of_birth date, add column if not exists nationality text, add column if not exists phone_number text, add column if not exists country text, add column if not exists occupation text;

create or replace function public.handle_booking_request(p_request_id uuid, p_status public.request_status)
returns uuid security definer set search_path=public language plpgsql as $$
declare r public.booking_requests; conversation_id uuid;
begin
  if p_status not in ('accepted','declined') then raise exception 'Invalid status'; end if;
  select * into r from public.booking_requests where id=p_request_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Request not found'; end if;
  update public.booking_requests set status=p_status,updated_at=now() where id=p_request_id;
  insert into public.notifications(user_id,actor_id,type,entity_id,title,body) values(r.requester_id,auth.uid(),'request_'||p_status,r.id,'Request '||p_status,'Your booking request was '||p_status);
  if p_status='accepted' then
    insert into public.conversations(request_id) values(r.id) on conflict(request_id) do update set request_id=excluded.request_id returning id into conversation_id;
    insert into public.conversation_members(conversation_id,user_id) values(conversation_id,r.requester_id),(conversation_id,r.owner_id) on conflict do nothing;
  end if;
  return conversation_id;
end $$;
grant execute on function public.handle_booking_request(uuid,public.request_status) to authenticated;

create or replace function public.notify_new_request() returns trigger security definer set search_path=public language plpgsql as $$ begin insert into public.notifications(user_id,actor_id,type,entity_id,title,body) values(new.owner_id,new.requester_id,'new_request',new.id,'New booking request','Someone requested to join your listing'); return new; end $$;
drop trigger if exists booking_request_notification on public.booking_requests;
create trigger booking_request_notification after insert on public.booking_requests for each row execute function public.notify_new_request();
create or replace function public.notify_new_message() returns trigger security definer set search_path=public language plpgsql as $$ begin insert into public.notifications(user_id,actor_id,type,entity_id,title,body) select m.user_id,new.sender_id,'new_message',new.conversation_id,'New message',left(new.body,120) from public.conversation_members m where m.conversation_id=new.conversation_id and m.user_id<>new.sender_id; return new; end $$;
drop trigger if exists message_notification on public.messages;
create trigger message_notification after insert on public.messages for each row execute function public.notify_new_message();
