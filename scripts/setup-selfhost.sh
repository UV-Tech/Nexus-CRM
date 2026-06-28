#!/usr/bin/env bash
# =============================================================================
# Nexus CRM — one-command self-hosted Supabase setup.
# Clones Supabase, starts the local Docker stack, applies all migrations, and
# writes .env.local pointing the app at the local stack.
#
# Requirements: docker + docker compose, git. Run from anywhere:
#   bash scripts/setup-selfhost.sh
# Re-running is safe: it skips the clone if present and skips migrations if the
# schema is already applied.
# =============================================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SB_DIR="${SUPABASE_DIR:-$REPO_DIR/.supabase-selfhost}"

echo "==> Repo:     $REPO_DIR"
echo "==> Supabase: $SB_DIR"

command -v docker >/dev/null || { echo "Docker is required."; exit 1; }

# 1. Clone Supabase (shallow) if not already present.
if [ ! -d "$SB_DIR/docker" ]; then
  echo "==> Cloning Supabase (shallow)…"
  git clone --depth 1 https://github.com/supabase/supabase "$SB_DIR"
else
  echo "==> Supabase repo already present, reusing."
fi

cd "$SB_DIR/docker"

# 2. Prepare .env and enable email auto-confirm (so signups work without SMTP).
[ -f .env ] || cp .env.example .env
if grep -q '^ENABLE_EMAIL_AUTOCONFIRM=' .env; then
  sed -i.bak 's/^ENABLE_EMAIL_AUTOCONFIRM=.*/ENABLE_EMAIL_AUTOCONFIRM=true/' .env && rm -f .env.bak
fi

# 3. Start the stack.
echo "==> Pulling images (first run can take a few minutes)…"
docker compose pull
echo "==> Starting Supabase…"
docker compose up -d

# 4. Wait for Postgres to accept connections.
echo "==> Waiting for Postgres…"
for _ in $(seq 1 90); do
  if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    ok=1; break
  fi
  sleep 2
done
[ "${ok:-}" = 1 ] || { echo "Postgres did not become ready in time."; exit 1; }

# 5. Apply migrations (only if not already applied).
applied="$(docker compose exec -T db psql -tAU postgres -d postgres \
  -c "select to_regclass('public.organizations') is not null" 2>/dev/null || echo f)"
if echo "$applied" | grep -qi t; then
  echo "==> Schema already present, skipping migrations."
else
  echo "==> Applying migrations…"
  for f in "$REPO_DIR"/supabase/migrations/0*.sql; do
    echo "    >> $(basename "$f")"
    docker compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d postgres < "$f"
  done
fi

# 6. Write Nexus-CRM/.env.local from the stack's keys.
ANON="$(grep '^ANON_KEY=' .env | cut -d= -f2-)"
SVC="$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2-)"
cat > "$REPO_DIR/.env.local" <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
SUPABASE_SERVICE_ROLE_KEY=$SVC
EOF
echo "==> Wrote $REPO_DIR/.env.local"

cat <<EOF

✅ Supabase is up:
   - Studio:  http://localhost:8000  (login: DASHBOARD_USERNAME/PASSWORD in $SB_DIR/docker/.env)
   - API URL: http://localhost:8000

Next:
   cd "$REPO_DIR"
   npm install
   npm run dev          # http://localhost:3000

Then sign up at /login?mode=signup and make yourself platform admin in
Studio → SQL editor:

   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'YOUR_EMAIL';
EOF
