-- ============================================================================
-- Relay — initial schema: profiles, organizations, members/roles, and the
-- forward-looking support tables (customers, tickets, comments, events, tags,
-- subscriptions). Multi-tenant isolation is enforced with Row Level Security.
--
-- RLS approach (per Supabase best practices):
--   * auth.uid() is wrapped in (select auth.uid()) so it is evaluated once.
--   * Membership/role checks go through SECURITY DEFINER helpers in a private
--     schema to avoid recursive policy evaluation on organization_members.
--   * Every FK and every column used by a policy is indexed.
-- The file is written to be idempotent so it can be re-applied safely.
-- ============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open', 'pending', 'on_hold', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (mirrors auth.users, auto-provisioned on signup)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organizations + members
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' and char_length(slug) between 2 and 48),
  owner_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organizations_owner_id_idx on public.organizations (owner_id);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.user_role not null default 'agent',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index if not exists organization_members_user_id_idx on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER membership helpers (private schema, not exposed via API)
-- ---------------------------------------------------------------------------
create or replace function private.is_org_member(p_org uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(p_org uuid, p_roles public.user_role[])
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create or replace function private.shares_org_with(p_user uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.organization_members a
    join public.organization_members b on a.organization_id = b.organization_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user
  );
$$;

revoke execute on function
  private.is_org_member(uuid),
  private.has_org_role(uuid, public.user_role[]),
  private.shares_org_with(uuid)
from public, anon;

grant execute on function
  private.is_org_member(uuid),
  private.has_org_role(uuid, public.user_role[]),
  private.shares_org_with(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- create_organization: atomic org + admin membership (avoids RLS chicken-egg)
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(p_name text, p_slug text default null)
returns public.organizations
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_slug text;
  v_org public.organizations;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception 'Organization name must be at least 2 characters' using errcode = 'check_violation';
  end if;

  v_slug := lower(regexp_replace(coalesce(nullif(trim(p_slug), ''), p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if char_length(v_slug) < 2 then
    raise exception 'Could not derive a valid workspace URL from the name' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.organizations where slug = v_slug) then
    raise exception 'The workspace URL "%" is already taken', v_slug using errcode = 'unique_violation';
  end if;

  insert into public.organizations (name, slug, owner_id)
  values (trim(p_name), v_slug, v_uid)
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org.id, v_uid, 'admin');

  return v_org;
end;
$$;

revoke execute on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Forward-looking support tables
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_organization_id_idx on public.customers (organization_id);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number bigint not null,
  subject text not null check (char_length(subject) between 1 and 200),
  body text,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  category text,
  customer_id uuid references public.customers (id) on delete set null,
  assignee_id uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);
create index if not exists tickets_organization_id_idx on public.tickets (organization_id);
create index if not exists tickets_assignee_id_idx on public.tickets (assignee_id);
create index if not exists tickets_customer_id_idx on public.tickets (customer_id);
create index if not exists tickets_org_status_idx on public.tickets (organization_id, status);

-- Per-organization sequential ticket number (powers the RLY-#### reference)
create or replace function public.set_ticket_number()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.number is null then
    select coalesce(max(number), 0) + 1
    into new.number
    from public.tickets
    where organization_id = new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_set_number on public.tickets;
create trigger tickets_set_number before insert on public.tickets
  for each row execute function public.set_ticket_number();

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

-- Ticket-scoped membership helper (defined here, after tickets exists)
create or replace function private.is_ticket_member(p_ticket uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.tickets t
    join public.organization_members m on m.organization_id = t.organization_id
    where t.id = p_ticket and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_ticket_member(uuid) from public, anon;
grant execute on function private.is_ticket_member(uuid) to authenticated;

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ticket_comments_ticket_id_idx on public.ticket_comments (ticket_id);
create index if not exists ticket_comments_organization_id_idx on public.ticket_comments (organization_id);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ticket_events_ticket_id_idx on public.ticket_events (ticket_id);
create index if not exists ticket_events_organization_id_idx on public.ticket_events (organization_id);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index if not exists tags_organization_id_idx on public.tags (organization_id);

create table if not exists public.ticket_tags (
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (ticket_id, tag_id)
);
create index if not exists ticket_tags_tag_id_idx on public.ticket_tags (tag_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'agent',
  invited_by uuid references auth.users (id) on delete set null,
  token uuid not null default gen_random_uuid(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);
create index if not exists invitations_organization_id_idx on public.invitations (organization_id);

create table if not exists public.subscriptions (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.organization_members   enable row level security;
alter table public.customers              enable row level security;
alter table public.tickets                enable row level security;
alter table public.ticket_comments        enable row level security;
alter table public.ticket_events          enable row level security;
alter table public.tags                   enable row level security;
alter table public.ticket_tags            enable row level security;
alter table public.invitations            enable row level security;
alter table public.subscriptions          enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_org_with(id));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organizations -------------------------------------------------------------
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select to authenticated
  using (private.is_org_member(id));

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations for update to authenticated
  using (private.has_org_role(id, array['admin']::public.user_role[]))
  with check (private.has_org_role(id, array['admin']::public.user_role[]));

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations for delete to authenticated
  using (owner_id = (select auth.uid()));
-- NB: inserts happen only through public.create_organization (security definer).

-- organization_members ------------------------------------------------------
drop policy if exists members_select on public.organization_members;
create policy members_select on public.organization_members for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists members_insert on public.organization_members;
create policy members_insert on public.organization_members for insert to authenticated
  with check (private.has_org_role(organization_id, array['admin']::public.user_role[]));

drop policy if exists members_update on public.organization_members;
create policy members_update on public.organization_members for update to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.user_role[]))
  with check (private.has_org_role(organization_id, array['admin']::public.user_role[]));

drop policy if exists members_delete on public.organization_members;
create policy members_delete on public.organization_members for delete to authenticated
  using (
    private.has_org_role(organization_id, array['admin']::public.user_role[])
    or user_id = (select auth.uid())
  );

-- customers -----------------------------------------------------------------
drop policy if exists customers_member_read on public.customers;
create policy customers_member_read on public.customers for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists customers_member_write on public.customers;
create policy customers_member_write on public.customers for insert to authenticated
  with check (private.is_org_member(organization_id));

drop policy if exists customers_member_update on public.customers;
create policy customers_member_update on public.customers for update to authenticated
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

drop policy if exists customers_manager_delete on public.customers;
create policy customers_manager_delete on public.customers for delete to authenticated
  using (private.has_org_role(organization_id, array['admin', 'manager']::public.user_role[]));

-- tickets -------------------------------------------------------------------
drop policy if exists tickets_member_read on public.tickets;
create policy tickets_member_read on public.tickets for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists tickets_member_insert on public.tickets;
create policy tickets_member_insert on public.tickets for insert to authenticated
  with check (private.is_org_member(organization_id));

drop policy if exists tickets_member_update on public.tickets;
create policy tickets_member_update on public.tickets for update to authenticated
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

drop policy if exists tickets_manager_delete on public.tickets;
create policy tickets_manager_delete on public.tickets for delete to authenticated
  using (private.has_org_role(organization_id, array['admin', 'manager']::public.user_role[]));

-- ticket_comments -----------------------------------------------------------
drop policy if exists ticket_comments_read on public.ticket_comments;
create policy ticket_comments_read on public.ticket_comments for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists ticket_comments_insert on public.ticket_comments;
create policy ticket_comments_insert on public.ticket_comments for insert to authenticated
  with check (private.is_org_member(organization_id) and author_id = (select auth.uid()));

drop policy if exists ticket_comments_modify_own on public.ticket_comments;
create policy ticket_comments_modify_own on public.ticket_comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists ticket_comments_delete on public.ticket_comments;
create policy ticket_comments_delete on public.ticket_comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    or private.has_org_role(organization_id, array['admin', 'manager']::public.user_role[])
  );

-- ticket_events (append-only audit) -----------------------------------------
drop policy if exists ticket_events_read on public.ticket_events;
create policy ticket_events_read on public.ticket_events for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists ticket_events_insert on public.ticket_events;
create policy ticket_events_insert on public.ticket_events for insert to authenticated
  with check (private.is_org_member(organization_id));

-- tags ----------------------------------------------------------------------
drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists tags_manage on public.tags;
create policy tags_manage on public.tags for all to authenticated
  using (private.has_org_role(organization_id, array['admin', 'manager']::public.user_role[]))
  with check (private.has_org_role(organization_id, array['admin', 'manager']::public.user_role[]));

-- ticket_tags ---------------------------------------------------------------
drop policy if exists ticket_tags_read on public.ticket_tags;
create policy ticket_tags_read on public.ticket_tags for select to authenticated
  using (private.is_ticket_member(ticket_id));

drop policy if exists ticket_tags_write on public.ticket_tags;
create policy ticket_tags_write on public.ticket_tags for insert to authenticated
  with check (private.is_ticket_member(ticket_id));

drop policy if exists ticket_tags_delete on public.ticket_tags;
create policy ticket_tags_delete on public.ticket_tags for delete to authenticated
  using (private.is_ticket_member(ticket_id));

-- invitations ---------------------------------------------------------------
drop policy if exists invitations_admin_read on public.invitations;
create policy invitations_admin_read on public.invitations for select to authenticated
  using (private.has_org_role(organization_id, array['admin', 'manager']::public.user_role[]));

drop policy if exists invitations_admin_manage on public.invitations;
create policy invitations_admin_manage on public.invitations for all to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.user_role[]))
  with check (private.has_org_role(organization_id, array['admin']::public.user_role[]));

-- subscriptions -------------------------------------------------------------
drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists subscriptions_admin_manage on public.subscriptions;
create policy subscriptions_admin_manage on public.subscriptions for all to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.user_role[]))
  with check (private.has_org_role(organization_id, array['admin']::public.user_role[]));
