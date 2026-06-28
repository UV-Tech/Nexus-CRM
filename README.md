# Nexus CRM

A flexible, **multi-tenant** CRM for lead management. Onboard multiple client
businesses, capture leads from Facebook, Instagram, WhatsApp (or any tool), and
move them through a fully customizable pipeline. Built with Next.js (App Router)
and Supabase (Postgres + Auth) with tenant isolation enforced by Row-Level
Security.

## What's inside

- **Multi-tenancy** — every business is an *organization*; users join orgs with a
  role (`owner` / `admin` / `agent`). All data is isolated via Postgres RLS.
- **Lead management** — leads with contact details, source, value, notes, and a
  flexible `custom_data` JSON field. Per-lead activity timeline.
- **Customizable pipeline** — each org defines its own stages (name, color,
  won/lost). **Drag-and-drop** Kanban board.
- **Custom lead fields** — each org defines its own fields (text/number/date/
  dropdown/checkbox); they render on every lead form and export.
- **Channel intake** — a per-org webhook URL ingests leads from Facebook Lead
  Ads, Instagram, WhatsApp, Zapier/Make, or custom forms.
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
in order (`0001_init.sql`, then `0002_custom_fields.sql`). These create all
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

Open http://localhost:3000, create a workspace, and you're in.

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

- Sending invite links by email (links are generated; delivery is manual).
- A platform-owner/super-admin console to provision and oversee tenants.
- Signed webhook verification (HMAC) for direct Meta/WhatsApp integrations.
- Time-series reporting and CSV export of reports.

### Recently added

- Drag-and-drop Kanban board.
- Custom lead field definitions (UI + storage).
- CSV import / export.
- Lead search, stage/source filters, and lead deletion.
- Team invitations via shareable invite links (migration 0003).
- Multi-organization switching (active-org cookie + sidebar switcher).
- Lead assignment to team members.
- Reports page (win rate, leads by source, pipeline by stage).
