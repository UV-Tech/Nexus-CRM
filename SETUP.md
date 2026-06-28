# Going-live checklist

Everything in the app is built and passes `npm run build`. What's left needs a
real backend and (for live integrations) vendor app registration — the physical
steps to do when you're at your computer. Work top to bottom.

## 1. Create the Supabase project (~3 min)

1. At [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. **Project Settings → API** → copy the **Project URL**, the **anon** key and
   the **service_role** key.

## 2. Apply the database (~2 min)

In the Supabase **SQL editor**, run each migration file in order:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_custom_fields.sql
supabase/migrations/0003_invitations.sql
supabase/migrations/0004_platform_admin.sql
supabase/migrations/0005_audit_suspend_onboarding.sql
supabase/migrations/0006_automations.sql
supabase/migrations/0007_integrations.sql
```

(Or with the Supabase CLI: `supabase db push`.)

## 3. Configure env + run

```bash
cp .env.example .env.local      # fill in the 3 Supabase values from step 1
npm install
npm run dev                     # http://localhost:3000
```

## 4. Make yourself the platform admin (~1 min)

1. Sign up for an account at `/login?mode=signup`.
2. In the Supabase SQL editor:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'YOU@example.com';
```

3. Reload the app → you now have `/admin`. Add a business, copy its invite
   link, and send it to the business owner. They sign up, accept, and go
   through the setup wizard into their own isolated workspace.

## 5. Verify tenant isolation (recommended)

Run `supabase/tests/rls_isolation_test.sql` in the SQL editor. It proves one
org can't read another's data across every table, then rolls back (no data
changed). Any leak fails with an error.

## 6. Connect channels

Each lead channel posts to a per-org webhook (shown in **Settings** and the
**Integrations** screen):

- **Lead intake** (Facebook Lead Ads / forms / Zapier):
  `POST /api/webhooks/leads?token=<intake_token>` with JSON
  (`name`, `email`, `phone`, `source`, …). Optional HMAC signing via the
  per-org secret in Settings.
- **WhatsApp inbound**: point the Meta Cloud API webhook at
  `/api/webhooks/whatsapp?token=<intake_token>` and set the verify token to
  match the one saved on the WhatsApp integration.

> In-app guides: each provider has an interactive, step-by-step connection
> guide at **Integrations → (provider) → Step-by-step guide**. It shows exactly
> which value to copy from each vendor console and where to paste it, with the
> webhook URLs pre-filled for your workspace.

### Live OAuth (optional, later)

Facebook/Instagram/Google Ads/WhatsApp can be connected today by pasting
credentials on each provider's page under **Integrations**. To enable
one-click OAuth instead, register an app with the vendor and set the matching
env vars (see `.env.example`) — the UI switches to a consent-screen flow
automatically. Live ad-data pulls and WhatsApp send/receive turn on once those
credentials are present.

## 7. Deploy (optional)

Push to Vercel (or any Node host). Set the same env vars in the host's project
settings. The included GitHub Actions workflow (`.github/workflows/ci.yml`)
runs typecheck + build on every push.
