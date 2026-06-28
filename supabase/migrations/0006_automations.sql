-- =============================================================================
-- Automations
-- Organizations build automations on a node canvas (n8n-style). Each automation
-- is a graph (nodes + edges) stored as JSONB, optionally filed in a folder.
-- =============================================================================

create table public.automation_folders (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  position        integer not null default 0,
  created_at      timestamptz not null default now()
);

create index on public.automation_folders (organization_id, position);

create table public.automations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  folder_id       uuid references public.automation_folders (id) on delete set null,
  name            text not null default 'Untitled automation',
  description     text,
  enabled         boolean not null default false,
  -- graph = { "nodes": [...], "edges": [...] }
  graph           jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.automations (organization_id, folder_id);

create trigger automations_touch_updated_at
  before update on public.automations
  for each row execute function public.touch_updated_at();

-- Execution log.
create table public.automation_runs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  automation_id   uuid references public.automations (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete set null,
  status          text not null default 'success',  -- success | error | skipped
  detail          text,
  created_at      timestamptz not null default now()
);

create index on public.automation_runs (organization_id, created_at desc);
create index on public.automation_runs (automation_id, created_at desc);

-- ---- RLS --------------------------------------------------------------------
alter table public.automation_folders enable row level security;
alter table public.automations        enable row level security;
alter table public.automation_runs    enable row level security;

create policy af_select on public.automation_folders
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy af_write on public.automation_folders
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin())
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin());

create policy au_select on public.automations
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy au_write on public.automations
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin())
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin());

create policy ar_select on public.automation_runs
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy ar_insert on public.automation_runs
  for insert with check (public.is_org_member(organization_id) or public.is_platform_admin());
