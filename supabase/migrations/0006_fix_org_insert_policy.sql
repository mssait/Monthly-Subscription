-- ============================================================
-- MIGRATION 0006: Allow authenticated users to insert organizations
-- ============================================================
-- During registration, a new user creates their org via the API route.
-- The service role key bypasses RLS, but as a safety net we also allow
-- any authenticated user to INSERT an org (they become org_admin after).

CREATE POLICY "authenticated_insert_org"
ON organizations FOR INSERT TO authenticated
WITH CHECK (true);
