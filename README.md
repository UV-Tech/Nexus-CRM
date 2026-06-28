# Nexus CRM

A flexible, **multi-tenant** CRM for lead management. Onboard multiple client
businesses, capture leads from Facebook, Instagram, WhatsApp (or any tool), and
move them through a fully customizable pipeline. Built with Next.js (App Router)
and Supabase (Postgres + Auth) with tenant isolation enforced by Row-Level
Security.

## What's inside

- **Platform admin (owner) console** — a closed model where you, the platform
  owner, provision each business and invite its owner; full oversight at
  `/admin`. Self-serve org creation is disabled.
- **Multi-tenancy** — every business is an *organization*; users join orgs with a
  role (`owner` / `admin` / `agent`). All data is isolated via Postgres RLS,
  verified by an automated isolation test.
- **Lead management** — leads with contact details, source, value, notes, and a
  flexible `custom_data` JSON field. Per-lead activity timeline.
- **Customizable pipeline** — each org defines its own stages (name, color,
  won/lost). **Drag-and-drop** Kanban board.
- **Custom lead fields** — each org defines its own fields (text/number/date/
  dropdown/checkbox); they render on every lead form and export.
- **Channel intake** — a per-org webhook URL ingests leads from Facebook Lead
  Ads, Instagram, WhatsApp, Zapier/Make, or custom forms.
- **Automations** — an n8n-style node canvas (React Flow) to build flows that
  run on lead events (created / stage changed / assigned). Organize in folders,
  enable/disable, and generate a flow from plain text with the local "agent".
- **Search, filter, CSV import/export** — find leads fast and move data in/out.
- **Auth** — email/password sign-up provisions a workspace + starter pipeline.

## Tech stack

| Layer    | Choice                                   |
| -------- | ---------------------------------------- |
| Frontend | Next.js 14 (App Router), React, Tailwind |
| Backend  | Next.js Server Actions + Route Handlers  |
| Database | Supabase Postgres with Row-Level Security|
| Auth     | Supabase Auth                            |

## Getting started

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), create a project. From **Project
Settings → API** copy the project URL, the `anon` key, and the `service_role` key.

### 2. Run the migration

In the Supabase SQL editor, run the migration files in `supabase/migrations/`
in order (`0001` → `0002` → `0003` → `0004` → `0005` → `0006`). These create all
tables, RLS policies, and helper functions.

> For local development with the Supabase CLI: `supabase db reset` will apply
> migrations in `supabase/migrations/`.

### 3. Configure environment

```bash
cp .env.example .env.local
# fill in the three values from step 1
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### 5. Become the platform admin (you, the owner)

This is a **closed** platform: only a platform admin provisions businesses.
Create your account first (sign up at `/login?mode=signup`), then promote it
once via SQL:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'you@example.com';
```

Now `/admin` is yours: add a business, copy the generated invite link, and send
it to that business's owner. They sign up, accept the invite, and land in an
interactive setup **wizard** (`/welcome`) that tailors their pipeline and
fields to their business type, lets them invite teammates, and is fully
skippable — everything stays editable in Settings afterwards.

As platform admin you can also "Open" any business to work inside it with full
access, **suspend / reactivate** a business, and every access is recorded in
the per-org **activity log**. The lead-intake webhook supports optional
**HMAC-SHA256 signing** (per-org secret in Settings).

## Multi-tenancy & data isolation

Isolation is enforced by **Postgres Row-Level Security**, not application code:

- Every tenant table carries `organization_id`, and each RLS policy checks
  `is_org_member(organization_id)`. A user simply cannot read rows for an org
  they don't belong to — the database refuses, regardless of the query.
- The lead-intake webhook is the only path that bypasses RLS (service role); it
  is scoped to a single org by the per-org `intake_token`.
- Platform admins get full access through additive admin-only RLS policies, so
  granting that power never weakens tenant isolation for normal users.

**Prove it:** run `supabase/tests/rls_isolation_test.sql` in the SQL editor. It
creates two orgs, then asserts (as each user) that neither can read the other's
data across every table. It runs in a transaction and rolls back — no data is
changed. A leak fails the test with an error.

## Connecting a lead channel

In **Settings → Lead intake webhook** you'll find a URL like:

```
https://your-app/api/webhooks/leads?token=<org-intake-token>
```

POST JSON to it from any source:

```bash
curl -X POST "https://your-app/api/webhooks/leads?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@acme.com","phone":"+15551234","source":"facebook","custom":{"campaign":"spring"}}'
```

- Facebook Lead Ads / Instagram / WhatsApp: connect via the integration's
  webhook setting, or bridge through Zapier/Make pointing at this URL.
- The `GET` handler answers Meta's `hub.challenge` verification handshake.
- Unknown top-level fields are stored in the lead's `custom_data`.

## Project layout

```
src/
  app/
    (app)/              # authenticated area (sidebar layout)
      dashboard/        # stats + recent leads
      leads/            # list, create, detail, server actions
      pipeline/         # Kanban board
      settings/         # stages, intake webhook, team
    api/webhooks/leads/ # inbound lead intake (service-role, token-auth)
    login/              # sign in / sign up + auth actions
    onboarding/         # name your first organization
  lib/
    supabase/           # browser / server / middleware clients
    org.ts              # resolves the active organization
    types.ts            # shared domain types
supabase/migrations/    # schema + RLS
```

## Roadmap / not yet built

- **Integrations screen**: OAuth connections for Facebook/Instagram (ad
  accounts, pages, lead forms), Google Ads, and WhatsApp (inbox + reply +
  templates). The automation actions for these channels are scaffolded and run
  once the integration is connected.
- Sending invite links by email (links are generated; delivery is manual).
- Replacing the local automation generator with the Claude API.
- Per-tenant plan limits & billing (Stripe).
- Time-series reporting and CSV export of reports.

### Recently added

- Automations: node-canvas editor, folders, local AI builder, execution engine
  wired into lead create / stage change / assignment (migration 0006).
- Interactive, animated onboarding wizard (`/welcome`) tailored by business
  type, with editable pipeline/fields, team invites, and skip (migration 0005).
- Activity (audit) log incl. platform-admin access; per-org view in Settings.
- Suspend / reactivate a business from the admin console.
- Optional HMAC-SHA256 webhook signature verification (per-org secret).
- Platform-admin console: closed onboarding, provision a business + owner
  invite link, full-access oversight (migration 0004).
- Automated RLS data-isolation test (`supabase/tests`).
- Team invitations, multi-org switching, lead assignment, reports.
- Drag-and-drop Kanban, custom lead fields, CSV import/export, search/filter.
