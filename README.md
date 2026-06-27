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
  won/lost). Kanban board + quick-move controls.
- **Channel intake** — a per-org webhook URL ingests leads from Facebook Lead
  Ads, Instagram, WhatsApp, Zapier/Make, or custom forms.
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

In the Supabase SQL editor, paste and run the contents of
`supabase/migrations/0001_init.sql`. This creates all tables, RLS policies, and
helper functions.

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

- Email invitations for teammates (UI placeholder exists; roster is live).
- Drag-and-drop on the Kanban board (currently a quick-move dropdown).
- Custom-field *definitions* UI (the `custom_data` column already stores them).
- Multi-organization switching for users in more than one workspace.
- Signed webhook verification (HMAC) for direct Meta/WhatsApp integrations.
- Reporting / analytics and CSV import-export.
