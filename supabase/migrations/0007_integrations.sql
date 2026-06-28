-- =============================================================================
-- Integrations + WhatsApp inbox + message templates
-- Per-org connections to external tools (Facebook, Instagram, Google Ads,
-- WhatsApp), a built-in WhatsApp inbox, and reusable message templates.
-- =============================================================================

-- ---- Connected integrations -------------------------------------------------
create table public.integrations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider        text not null,  -- facebook | instagram | google_ads | whatsapp
  status          text not null default 'disconnected',  -- connected | disconnected
  account_label   text,
  -- Tokens / account ids live here. Treated as secret; never sent to the client
  -- except where a page explicitly needs it.
  config          jsonb not null default '{}'::jsonb,
  connected_at    timestamptz,
  created_at      timestamptz not null default now(),
  unique (organization_id, provider)
);

alter table public.integrations enable row level security;

create policy integrations_select on public.integrations
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy integrations_write on public.integrations
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin())
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin());

-- ---- Reusable message templates --------------------------------------------
create table public.message_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  category        text not null default 'general',
  body            text not null,
  created_at      timestamptz not null default now()
);

create index on public.message_templates (organization_id);

alter table public.message_templates enable row level security;

create policy templates_select on public.message_templates
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy templates_write on public.message_templates
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

-- ---- WhatsApp conversations + messages --------------------------------------
create table public.wa_conversations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_name    text,
  contact_phone   text not null,
  lead_id         uuid references public.leads (id) on delete set null,
  last_message_at timestamptz not null default now(),
  unread          integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (organization_id, contact_phone)
);

create index on public.wa_conversations (organization_id, last_message_at desc);

create table public.wa_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null references public.wa_conversations (id) on delete cascade,
  direction       text not null,  -- in | out
  body            text not null,
  status          text not null default 'sent',  -- sent | queued | delivered | read | pending
  created_at      timestamptz not null default now()
);

create index on public.wa_messages (conversation_id, created_at);

alter table public.wa_conversations enable row level security;
alter table public.wa_messages      enable row level security;

create policy wac_all on public.wa_conversations
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

create policy wam_all on public.wa_messages
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

-- Atomically bump a conversation's unread counter (avoids read-modify-write
-- races when several inbound messages arrive at once).
create or replace function public.wa_increment_unread(convo uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wa_conversations set unread = unread + 1 where id = convo;
$$;
