-- =============================================================================
-- Audit log, business suspension, onboarding state, and webhook signing secret
-- =============================================================================

-- ---- Organization columns ---------------------------------------------------
alter table public.organizations
  add column suspended_at  timestamptz,
  add column onboarded_at  timestamptz,
  add column business_type text,
  add column webhook_secret text not null default encode(gen_random_bytes(24), 'hex');

-- ---- Audit log --------------------------------------------------------------
-- Tracks notable actions, including platform-admin access to a tenant.
create table public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_id        uuid references auth.users (id) on delete set null,
  action          text not null,   -- e.g. lead.create, admin.open_business, member.invite
  detail          text,
  created_at      timestamptz not null default now()
);

create index on public.audit_log (organization_id, created_at desc);

alter table public.audit_log enable row level security;

-- Members can read their org's log; platform admins read everything.
create policy audit_select on public.audit_log
  for select using (
    public.is_org_member(organization_id) or public.is_platform_admin()
  );

-- Anyone acting within an org (member or platform admin) can append entries.
create policy audit_insert on public.audit_log
  for insert with check (
    public.is_org_member(organization_id) or public.is_platform_admin()
  );

-- ---- Suspend / reactivate a business (platform-admin only) -------------------
create or replace function public.admin_set_suspended(org uuid, suspend boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;

  update public.organizations
    set suspended_at = case when suspend then now() else null end
    where id = org;
end;
$$;

-- ---- Extend admin_org_stats with suspended state ----------------------------
-- The 0004 version returns a different row shape; a return-type change requires
-- dropping the function first (CREATE OR REPLACE cannot alter OUT params).
drop function if exists public.admin_org_stats();
create or replace function public.admin_org_stats()
returns table (
  id uuid,
  name text,
  slug text,
  created_at timestamptz,
  suspended boolean,
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
    (o.suspended_at is not null),
    (select count(*) from public.organization_members m where m.organization_id = o.id),
    (select count(*) from public.leads l where l.organization_id = o.id),
    (select count(*) from public.invitations i where i.organization_id = o.id and i.accepted_at is null)
  from public.organizations o
  where public.is_platform_admin()
  order by o.created_at desc;
$$;

-- ---- Rotate a webhook signing secret (owners/admins) -------------------------
create or replace function public.regenerate_webhook_secret(org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_secret text;
begin
  if not (public.has_org_role(org, array['owner','admin']::public.org_role[])
          or public.is_platform_admin()) then
    raise exception 'not authorized';
  end if;

  update public.organizations
    set webhook_secret = encode(gen_random_bytes(24), 'hex')
    where id = org
    returning webhook_secret into new_secret;

  return new_secret;
end;
$$;
