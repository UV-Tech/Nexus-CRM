-- =============================================================================
-- Nexus CRM — initial schema
-- Multi-tenant lead-management CRM. Every business is an "organization" (tenant);
-- users belong to one or more organizations with a role. All tenant data is
-- isolated through Row-Level Security keyed on organization membership.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Profiles: 1:1 with auth.users, holds display info.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Organizations: the tenant boundary.
-- intake_token authenticates inbound webhook leads (Facebook/IG/WhatsApp/etc).
-- -----------------------------------------------------------------------------
create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  intake_token uuid not null default gen_random_uuid(),
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Membership: which user belongs to which org, and their role.
-- -----------------------------------------------------------------------------
create type public.org_role as enum ('owner', 'admin', 'agent');

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            public.org_role not null default 'agent',
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index on public.organization_members (user_id);

-- -----------------------------------------------------------------------------
-- Pipeline stages: fully customizable per organization (flexibility requirement).
-- -----------------------------------------------------------------------------
create table public.pipeline_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  position        integer not null default 0,
  color           text not null default '#6366f1',
  is_won          boolean not null default false,
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index on public.pipeline_stages (organization_id, position);

-- -----------------------------------------------------------------------------
-- Leads: the core record. custom_data (jsonb) keeps the model flexible so each
-- tenant can attach arbitrary fields without schema migrations.
-- -----------------------------------------------------------------------------
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stage_id        uuid references public.pipeline_stages (id) on delete set null,
  assigned_to     uuid references auth.users (id) on delete set null,
  name            text not null,
  email           text,
  phone           text,
  company         text,
  source          text not null default 'manual',  -- manual | facebook | instagram | whatsapp | webhook | ...
  value           numeric(12,2) default 0,
  notes           text,
  custom_data     jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.leads (organization_id, created_at desc);
create index on public.leads (organization_id, stage_id);
create index on public.leads (organization_id, assigned_to);

-- -----------------------------------------------------------------------------
-- Activity log: timeline of everything that happens to a lead.
-- -----------------------------------------------------------------------------
create table public.lead_activities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id         uuid not null references public.leads (id) on delete cascade,
  author_id       uuid references auth.users (id) on delete set null,
  type            text not null default 'note',  -- note | stage_change | created | assigned | call | email
  body            text,
  created_at      timestamptz not null default now()
);

create index on public.lead_activities (lead_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Helper: is the current user a member of a given organization?
-- SECURITY DEFINER so RLS policies can call it without recursing into the
-- organization_members policy.
-- -----------------------------------------------------------------------------
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org uuid, roles public.org_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org
      and user_id = auth.uid()
      and role = any(roles)
  );
$$;

-- -----------------------------------------------------------------------------
-- updated_at trigger for leads
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- New-user bootstrap: create a profile row whenever an auth user is created.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Provision a default organization + starter pipeline for a brand-new user.
-- Called from the app (RPC) right after the first login.
-- -----------------------------------------------------------------------------
create or replace function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  base_slug  text;
  final_slug text;
  n          integer := 0;
begin
  base_slug := regexp_replace(lower(coalesce(nullif(trim(org_name), ''), 'org')), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'org'; end if;
  final_slug := base_slug;

  while exists (select 1 from public.organizations where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.organizations (name, slug, created_by)
  values (coalesce(nullif(trim(org_name), ''), 'My Organization'), final_slug, auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  insert into public.pipeline_stages (organization_id, name, position, color, is_won, is_lost) values
    (new_org_id, 'New',         0, '#6366f1', false, false),
    (new_org_id, 'Contacted',   1, '#0ea5e9', false, false),
    (new_org_id, 'Qualified',   2, '#f59e0b', false, false),
    (new_org_id, 'Proposal',    3, '#8b5cf6', false, false),
    (new_org_id, 'Won',         4, '#22c55e', true,  false),
    (new_org_id, 'Lost',        5, '#ef4444', false, true);

  return new_org_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Rotate an organization's intake token (owners/admins only). SECURITY DEFINER
-- with an explicit role check so it can update regardless of column policies.
-- -----------------------------------------------------------------------------
create or replace function public.regenerate_intake_token(org uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token uuid;
begin
  if not public.has_org_role(org, array['owner','admin']::public.org_role[]) then
    raise exception 'not authorized';
  end if;

  update public.organizations
    set intake_token = gen_random_uuid()
    where id = org
    returning intake_token into new_token;

  return new_token;
end;
$$;

-- =============================================================================
-- Row-Level Security
-- =============================================================================
alter table public.profiles             enable row level security;
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.pipeline_stages      enable row level security;
alter table public.leads                enable row level security;
alter table public.lead_activities      enable row level security;

-- profiles: a user sees/edits only their own profile.
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

-- organizations: members can read; owners/admins can update; any auth user can create.
create policy orgs_select on public.organizations
  for select using (public.is_org_member(id));
create policy orgs_update on public.organizations
  for update using (public.has_org_role(id, array['owner','admin']::public.org_role[]));
create policy orgs_insert on public.organizations
  for insert with check (created_by = auth.uid());

-- organization_members: members can see the roster; owners/admins manage it.
create policy members_select on public.organization_members
  for select using (public.is_org_member(organization_id));
create policy members_insert on public.organization_members
  for insert with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));
create policy members_update on public.organization_members
  for update using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));
create policy members_delete on public.organization_members
  for delete using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));

-- pipeline_stages: any member reads; owners/admins write.
create policy stages_select on public.pipeline_stages
  for select using (public.is_org_member(organization_id));
create policy stages_write on public.pipeline_stages
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));

-- leads: any member of the org can read and write its leads.
create policy leads_select on public.leads
  for select using (public.is_org_member(organization_id));
create policy leads_write on public.leads
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- lead_activities: scoped to org membership.
create policy activities_select on public.lead_activities
  for select using (public.is_org_member(organization_id));
create policy activities_write on public.lead_activities
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
