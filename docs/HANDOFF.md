# Session handoff

Use this to continue the project in a **new (local) Claude Code session**
without the previous chat history. Nothing is lost — the code is the source of
truth and the project context lives in the repo.

## To pick up where we left off

1. Clone and check out the working branch:
   ```bash
   git clone https://github.com/UV-Tech/Nexus-CRM.git
   cd Nexus-CRM
   git checkout claude/crm-lead-management-e7jbsd
   ```
2. Start Claude Code **inside that folder**. It auto-loads `CLAUDE.md`, which
   contains the full architecture, model, conventions, and status — so the new
   session is briefed immediately.
3. Read `CLAUDE.md` (project memory) and `SETUP.md` (going-live checklist).

## Bring it up locally (self-hosted Supabase)

```bash
bash scripts/setup-selfhost.sh      # Supabase via Docker + migrations + .env.local
npm install && npm run dev          # http://localhost:3000
```
Then sign up and make yourself platform admin (SQL in `CLAUDE.md`).

## State at handoff

- All features through "per-provider setup guides" are built, typecheck-clean,
  and build-clean (24+ routes). 7 migrations (`supabase/migrations/0001..0007`).
- The app has **not yet been run against a live database** from the cloud
  session (the remote container couldn't reach Docker image CDNs or approve the
  Supabase MCP). Running it locally is the immediate next step.

## Likely next tasks (see CLAUDE.md "Pending")

Live OAuth (Meta/Google/WhatsApp), ad-data pulls, email delivery of invites,
swap the local automation generator for the Claude API, billing/plan limits.

## Guardrails

- Keep every tenant table behind RLS keyed on `organization_id`.
- `"use server"` files export only async functions.
- Run `npm run typecheck` and `npm run build` before each commit; commit to the
  `claude/crm-lead-management-e7jbsd` branch.
