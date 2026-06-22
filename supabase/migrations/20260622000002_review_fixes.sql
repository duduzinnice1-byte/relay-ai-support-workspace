-- Review fixes: race-free per-org ticket numbering, audit actor binding,
-- and full replica identity so realtime DELETE events carry filter columns.

-- 1) Per-org ticket number counter (atomic, batch-safe).
create table if not exists public.org_ticket_counters (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  next_number bigint not null default 0
);
alter table public.org_ticket_counters enable row level security;
-- No policies: only the SECURITY DEFINER trigger (which bypasses RLS) touches it.

create or replace function public.set_ticket_number()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.org_ticket_counters (organization_id, next_number)
  values (new.organization_id, 1)
  on conflict (organization_id)
  do update set next_number = public.org_ticket_counters.next_number + 1
  returning next_number into new.number;
  return new;
end;
$$;
revoke execute on function public.set_ticket_number() from public, anon, authenticated;

-- Backfill counters for any orgs that already have tickets.
insert into public.org_ticket_counters (organization_id, next_number)
select organization_id, max(number) from public.tickets group by organization_id
on conflict (organization_id)
do update set next_number = greatest(public.org_ticket_counters.next_number, excluded.next_number);

-- 2) Bind ticket_events.actor_id to the caller (audit integrity).
drop policy if exists ticket_events_insert on public.ticket_events;
create policy ticket_events_insert on public.ticket_events for insert to authenticated
  with check (
    private.is_org_member(organization_id)
    and (actor_id = (select auth.uid()) or actor_id is null)
  );

-- 3) Full replica identity so realtime DELETE payloads include filter columns.
alter table public.tickets replica identity full;
alter table public.ticket_comments replica identity full;
alter table public.ticket_events replica identity full;
