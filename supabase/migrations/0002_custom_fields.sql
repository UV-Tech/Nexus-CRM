-- =============================================================================
-- Custom field definitions
-- Lets each organization define its own lead fields without schema changes.
-- Values are stored on leads.custom_data (jsonb), keyed by `key`.
-- =============================================================================

create table public.custom_field_definitions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key             text not null,   -- stable machine key used in leads.custom_data
  label           text not null,   -- human label shown in the UI
  field_type      text not null default 'text',  -- text | number | date | select | checkbox
  options         jsonb not null default '[]'::jsonb,  -- for select: ["A","B"]
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (organization_id, key)
);

create index on public.custom_field_definitions (organization_id, position);

alter table public.custom_field_definitions enable row level security;

-- Any member can read the field definitions (needed to render forms).
create policy cfd_select on public.custom_field_definitions
  for select using (public.is_org_member(organization_id));

-- Only owners/admins can define or remove fields.
create policy cfd_write on public.custom_field_definitions
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));
