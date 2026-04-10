-- ============================================================
-- MIGRATION 0005: Fix infinite recursion in org_members RLS
-- ============================================================
-- The original "view_own_memberships" policy caused infinite recursion because
-- it queried org_members inside an org_members policy (not in a SECURITY DEFINER context).
-- Fix: simplify to user_id = auth.uid() — no self-referencing subquery needed.

DROP POLICY IF EXISTS "view_own_memberships" ON org_members;

CREATE POLICY "view_own_memberships"
ON org_members FOR SELECT TO authenticated
USING (
    user_id = auth.uid()   -- user can always see their own membership rows
    OR is_super_admin()    -- is_super_admin() is SECURITY DEFINER, bypasses RLS safely
);
