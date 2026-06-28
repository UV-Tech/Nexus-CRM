-- =============================================================================
-- RLS data-isolation test
-- Proves that a member of organization A cannot read ANY data belonging to
-- organization B, across every tenant table. Run in the Supabase SQL editor
-- (or `psql`) AFTER applying migrations 0001–0004.
--
-- The whole test runs inside a transaction and ROLLS BACK at the end, so it
-- never changes your data. A failed assertion aborts with an error message.
-- =============================================================================

begin;

-- ---- Setup (runs as the table owner, which bypasses RLS) --------------------
-- Two fake users.
insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user-a@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b@test.local');

-- Two organizations.
insert into public.organizations (id, name, slug)
values
  ('a0000000-0000-0000-0000-000000000000', 'Org A', 'test-org-a'),
  ('b0000000-0000-0000-0000-000000000000', 'Org B', 'test-org-b');

-- Each user belongs to their own org only.
insert into public.organization_members (organization_id, user_id, role)
values
  ('a0000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner'),
  ('b0000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'owner');

-- A stage + leads in each org.
insert into public.pipeline_stages (id, organization_id, name, position)
values
  ('a1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'New', 0),
  ('b1000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'New', 0);

insert into public.leads (organization_id, stage_id, name)
values
  ('a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'A Lead 1'),
  ('a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'A Lead 2'),
  ('b0000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'B Lead 1'),
  ('b0000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'B Lead 2'),
  ('b0000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'B Lead 3');

-- ---- Act as user A (member of Org A only) -----------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

do $$
begin
  -- Sees exactly Org A's 2 leads.
  assert (select count(*) from public.leads) = 2,
    'FAIL: user A should see exactly 2 leads (their own org)';
  -- Sees ZERO of Org B's leads — the core isolation guarantee.
  assert (select count(*) from public.leads
          where organization_id = 'b0000000-0000-0000-0000-000000000000') = 0,
    'LEAK: user A can read Org B leads';
  -- Same for every other tenant table.
  assert (select count(*) from public.organizations) = 1,
    'LEAK: user A can see more than their own organization';
  assert (select count(*) from public.pipeline_stages
          where organization_id = 'b0000000-0000-0000-0000-000000000000') = 0,
    'LEAK: user A can read Org B pipeline stages';
  assert (select count(*) from public.organization_members
          where organization_id = 'b0000000-0000-0000-0000-000000000000') = 0,
    'LEAK: user A can read Org B membership';
  raise notice 'User A isolation checks passed';
end $$;

reset role;
reset request.jwt.claims;

-- ---- Act as user B (member of Org B only) -----------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

do $$
begin
  assert (select count(*) from public.leads) = 3,
    'FAIL: user B should see exactly 3 leads (their own org)';
  assert (select count(*) from public.leads
          where organization_id = 'a0000000-0000-0000-0000-000000000000') = 0,
    'LEAK: user B can read Org A leads';
  assert (select count(*) from public.organizations) = 1,
    'LEAK: user B can see more than their own organization';
  raise notice 'User B isolation checks passed';
end $$;

reset role;
reset request.jwt.claims;

-- Never persist test data.
rollback;

-- If you reached here with no error, isolation holds across all tenant tables.
