-- =============================================================================
-- Platform super-admin layer
-- Adds a platform owner role that sits ABOVE all tenants. The platform owner
-- provisions businesses (organizations), invites each business owner, and has
-- full access to all tenant data. Self-serve organization creation is closed:
-- only a platform admin can create an organization.
-- =============================================================================

create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- A user may read their own platform-admin row (so the app can check status).
create policy platform_admins_self on public.platform_admins
  for select using (user_id = auth.uid());

-- Is the current user a platform admin? SECURITY DEFINER so it bypasses the
-- table's own RLS and can be called safely from other policies.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Full-access RLS for platform admins.
-- Postgres combines multiple PERMISSIVE policies with OR, so adding these
-- alongside the existing tenant policies grants platform admins access to
-- every row without weakening tenant isolation for normal users.
-- -----------------------------------------------------------------------------
create policy orgs_admin_all on public.organizations
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy members_admin_all on public.organization_members
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy stages_admin_all on public.pipeline_stages
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy leads_admin_all on public.leads
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy activities_admin_all on public.lead_activities
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy cfd_admin_all on public.custom_field_definitions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy invitations_admin_all on public.invitations
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- -----------------------------------------------------------------------------
-- Close self-serve org creation: create_organization now requires a platform
-- admin. (Business owners join via invitation, they do not create orgs.)
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
  if not public.is_platform_admin() then
    raise exception 'only a platform admin can create an organization';
  end if;

  base_slug := regexp_replace(lower(coalesce(nullif(trim(org_name), ''), 'org')), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'org'; end if;
  final_slug := base_slug;

  while exists (select 1 from public.organizations where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.organizations (name, slug, created_by)
  values (coalesce(nullif(trim(org_name), ''), 'New Organization'), final_slug, auth.uid())
  returning id into new_org_id;

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
-- Provision a business: create the org + starter pipeline + an OWNER invitation
-- in one step. Returns the new org id and the invite token to share with the
-- business owner. Platform-admin only.
-- -----------------------------------------------------------------------------
create or replace function public.admin_create_business(org_name text, owner_email text)
returns table (organization_id uuid, invite_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_token  uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;

  new_org_id := public.create_organization(org_name);

  insert into public.invitations (organization_id, email, role, invited_by)
  values (new_org_id, nullif(trim(owner_email), ''), 'owner', auth.uid())
  returning token into new_token;

  return query select new_org_id, new_token;
end;
$$;

-- -----------------------------------------------------------------------------
-- Per-organization stats for the admin console (counts only by default, but the
-- admin has full data access too). Platform-admin only.
-- -----------------------------------------------------------------------------
create or replace function public.admin_org_stats()
returns table (
  id uuid,
  name text,
  slug text,
  created_at timestamptz,
  member_count bigint,
  lead_count bigint,
  pending_invites bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.id,
    o.name,
    o.slug,
    o.created_at,
    (select count(*) from public.organization_members m where m.organization_id = o.id),
    (select count(*) from public.leads l where l.organization_id = o.id),
    (select count(*) from public.invitations i where i.organization_id = o.id and i.accepted_at is null)
  from public.organizations o
  where public.is_platform_admin()
  order by o.created_at desc;
$$;
