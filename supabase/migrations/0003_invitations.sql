-- =============================================================================
-- Team invitations (link-based)
-- An owner/admin creates an invitation; the invite link carries a token. A
-- signed-in user opens the link and accepts, which adds them to the org.
-- =============================================================================

create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text,
  role            public.org_role not null default 'agent',
  token           uuid not null default gen_random_uuid(),
  invited_by      uuid references auth.users (id) on delete set null,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index on public.invitations (organization_id);
create unique index on public.invitations (token);

alter table public.invitations enable row level security;

-- Members can see their org's invitations; owners/admins manage them.
create policy invitations_select on public.invitations
  for select using (public.is_org_member(organization_id));
create policy invitations_write on public.invitations
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));

-- -----------------------------------------------------------------------------
-- Accept an invitation by token. SECURITY DEFINER so the invitee (not yet a
-- member, so RLS would block them) can read the invite and join the org.
-- Returns the organization id joined.
-- -----------------------------------------------------------------------------
create or replace function public.accept_invitation(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations;
begin
  select * into inv from public.invitations where token = invite_token;

  if inv.id is null then
    raise exception 'invitation not found';
  end if;
  if inv.accepted_at is not null then
    raise exception 'invitation already used';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (inv.organization_id, auth.uid(), inv.role)
  on conflict (organization_id, user_id) do nothing;

  update public.invitations set accepted_at = now() where id = inv.id;

  return inv.organization_id;
end;
$$;

-- Preview an invitation (org name + status) before accepting. SECURITY DEFINER
-- so the not-yet-member invitee can see what they're joining.
create or replace function public.invitation_preview(invite_token uuid)
returns table (organization_name text, role public.org_role, accepted boolean)
language sql
security definer
set search_path = public
stable
as $$
  select o.name, i.role, (i.accepted_at is not null)
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = invite_token;
$$;
