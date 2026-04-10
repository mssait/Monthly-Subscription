-- ============================================================
-- MIGRATION 0002: Row Level Security Policies
-- ============================================================

-- Enable RLS
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log  ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Helper functions
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_user_role_in_org(p_org_id UUID)
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    );
$$;

CREATE OR REPLACE FUNCTION is_org_staff_or_above(p_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM org_members
        WHERE org_id = p_org_id
        AND user_id = auth.uid()
        AND role IN ('org_admin', 'org_staff')
    );
$$;

-- ----------------------------------------------------------------
-- organizations policies
-- ----------------------------------------------------------------

CREATE POLICY "super_admin_all_orgs"
ON organizations FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "org_members_view_own_org"
ON organizations FOR SELECT TO authenticated
USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "org_admin_update_own_org"
ON organizations FOR UPDATE TO authenticated
USING (get_user_role_in_org(id) = 'org_admin')
WITH CHECK (get_user_role_in_org(id) = 'org_admin');

-- ----------------------------------------------------------------
-- org_members policies
-- ----------------------------------------------------------------

CREATE POLICY "view_own_memberships"
ON org_members FOR SELECT TO authenticated
USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR is_super_admin()
);

CREATE POLICY "org_admin_manage_members"
ON org_members FOR INSERT TO authenticated
WITH CHECK (get_user_role_in_org(org_id) = 'org_admin' OR is_super_admin());

CREATE POLICY "org_admin_delete_members"
ON org_members FOR DELETE TO authenticated
USING (get_user_role_in_org(org_id) = 'org_admin' OR is_super_admin());

-- ----------------------------------------------------------------
-- members (donors) policies
-- ----------------------------------------------------------------

CREATE POLICY "staff_view_members"
ON members FOR SELECT TO authenticated
USING (
    is_org_staff_or_above(org_id)
    OR user_id = auth.uid()
    OR is_super_admin()
);

CREATE POLICY "staff_insert_members"
ON members FOR INSERT TO authenticated
WITH CHECK (is_org_staff_or_above(org_id) OR is_super_admin());

CREATE POLICY "staff_update_members"
ON members FOR UPDATE TO authenticated
USING (is_org_staff_or_above(org_id) OR is_super_admin());

CREATE POLICY "admin_delete_members"
ON members FOR DELETE TO authenticated
USING (get_user_role_in_org(org_id) = 'org_admin' OR is_super_admin());

-- ----------------------------------------------------------------
-- subscription_plans policies
-- ----------------------------------------------------------------

CREATE POLICY "any_member_view_plans"
ON subscription_plans FOR SELECT TO authenticated
USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR is_super_admin()
);

CREATE POLICY "staff_manage_plans"
ON subscription_plans FOR ALL TO authenticated
USING (is_org_staff_or_above(org_id) OR is_super_admin())
WITH CHECK (is_org_staff_or_above(org_id) OR is_super_admin());

-- ----------------------------------------------------------------
-- subscriptions policies
-- ----------------------------------------------------------------

CREATE POLICY "staff_view_subscriptions"
ON subscriptions FOR SELECT TO authenticated
USING (
    is_org_staff_or_above(org_id)
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_super_admin()
);

CREATE POLICY "staff_insert_subscriptions"
ON subscriptions FOR INSERT TO authenticated
WITH CHECK (is_org_staff_or_above(org_id) OR is_super_admin());

CREATE POLICY "staff_update_subscriptions"
ON subscriptions FOR UPDATE TO authenticated
USING (is_org_staff_or_above(org_id) OR is_super_admin());

-- ----------------------------------------------------------------
-- payments policies
-- ----------------------------------------------------------------

CREATE POLICY "staff_view_payments"
ON payments FOR SELECT TO authenticated
USING (
    is_org_staff_or_above(org_id)
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_super_admin()
);

CREATE POLICY "staff_insert_payments"
ON payments FOR INSERT TO authenticated
WITH CHECK (is_org_staff_or_above(org_id) OR is_super_admin());

CREATE POLICY "staff_update_payments"
ON payments FOR UPDATE TO authenticated
USING (is_org_staff_or_above(org_id) OR is_super_admin());

-- ----------------------------------------------------------------
-- payment_audit_log policies
-- ----------------------------------------------------------------

CREATE POLICY "staff_view_audit"
ON payment_audit_log FOR SELECT TO authenticated
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_staff')
    )
    OR is_super_admin()
);

CREATE POLICY "system_insert_audit"
ON payment_audit_log FOR INSERT TO authenticated
WITH CHECK (TRUE);
