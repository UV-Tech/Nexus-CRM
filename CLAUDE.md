# Nexus CRM — project memory

This file is read automatically by Claude Code at the start of every session.
It is the durable context for this project so a fresh local session is fully
briefed without the previous chat history.

## What this is

A flexible, **multi-tenant SaaS CRM** for lead management with channel
integrations (Facebook, Instagram, WhatsApp, Google Ads) and a visual
automation builder. Built greenfield.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript + Tailwind
- Supabase (Postgres + Auth); tenant isolation via Postgres **Row-Level Security**
- framer-motion (animations), @xyflow/react (automation node canvas)
- Server Actions for mutations; Route Handlers for webhooks

## Core model & key decisions

- **Tenant = `organization`.** Users join orgs via `organization_members` with a
  role: `owner | admin | agent`. ALL tenant tables carry `organization_id` and
  every RLS policy checks `is_org_member(organization_id)`. This is the
  non-negotiable isolation guarantee — never add a tenant table without RLS.
- **Closed platform.** Self-serve org creation is disabled. A **platform admin**
  (row in `platform_admins`) provisions businesses at `/admin` and sends an
  invite link to each business owner. `is_platform_admin()` gets additive
  full-access RLS policies (combined with OR) so admin access never weakens
  tenant isolation.
- **Flexibility:** custom fields stored in `leads.custom_data` (jsonb) with
  per-org definitions; pipeline stages are per-org and customizable.
- **Automations:** stored as a node graph (jsonb) in `automations.graph`; the
  engine (`src/lib/automations/engine.ts`) runs on lead events. Internal actions
  (assign / move stage / note / set field / queue WhatsApp) run for real;
  external sends (email/notify) are recorded pending an integration.
- **Integrations:** connection rows in `integrations` with credentials in
  `config` jsonb. Live OAuth needs registered vendor apps; until then creds are
  entered manually. Each provider has an interactive setup guide.

## Conventions

- Mutations live in `actions.ts` files marked `"use server"`. Those files may
  export **only async functions** — put shared types elsewhere (e.g. a `lib`
  module), never `export interface` from a `"use server"` file.
- Provide dynamic-option dropdowns (stage/member/field) by passing org data into
  client components; don't hardcode.
- `logAudit(orgId, action, detail?)` is best-effort and must never throw.
- Webhooks bypass RLS via the service-role client and are scoped by the per-org
  `intake_token` (and optional HMAC). Never expose `service_role` to the browser.
- Dev branch: **`claude/crm-lead-management-e7jbsd`**. Commit + push there.
  Always run `npm run typecheck` and `npm run build` before committing.

## File map

```
src/app/(app)/            authenticated area (sidebar layout)
  dashboard/ leads/ pipeline/ reports/ settings/
  automations/ automations/[id]/   list + node-canvas editor
  integrations/ integrations/[provider]/ .../guide/   cards, connect, guides
  inbox/ inbox/templates/    WhatsApp inbox + templates
src/app/admin/            platform-admin console (gated by is_platform_admin)
src/app/welcome/          animated onboarding wizard (owner, first run)
src/app/invite/[token]/   accept invitation
src/app/api/webhooks/leads|whatsapp/   inbound webhooks (service role)
src/lib/                  supabase clients, org context, automations, integrations, audit, csv
supabase/migrations/      0001..0007 (apply in order)
supabase/tests/           rls_isolation_test.sql (proves no cross-tenant leak)
```

## Migrations (apply in order)

0001 init (orgs/members/stages/leads/activities + RLS + helpers) ·
0002 custom fields · 0003 invitations · 0004 platform admin (closed creation,
full-access policies) · 0005 audit + suspend + onboarding + webhook secret ·
0006 automations · 0007 integrations + WhatsApp inbox + templates.

## Current status

Done: multi-tenancy, leads, pipeline (drag&drop), custom fields, CSV import/
export, search/filter, invitations, multi-org switch, assignment, reports,
platform-admin console, onboarding wizard, audit log, suspend, HMAC webhooks,
automations (canvas + local AI builder + engine), integrations screen, WhatsApp
inbox + templates + inbound webhook, per-provider setup guides, CI.

Pending (needs the user / live creds): live OAuth for Meta/Google/WhatsApp;
ad-data pulls; email delivery of invites; swap local automation generator for
the Claude API; billing/plan limits.

## Run locally with self-hosted Supabase

`bash scripts/setup-selfhost.sh` clones Supabase, starts the Docker stack, runs
all migrations, and writes `.env.local`. Then `npm install && npm run dev`
(http://localhost:3000). Make yourself platform admin:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'YOUR_EMAIL';
```

See SETUP.md for the manual checklist and per-provider guides.
