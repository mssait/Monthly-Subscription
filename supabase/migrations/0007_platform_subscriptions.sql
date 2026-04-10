-- ============================================================
-- MIGRATION 0007: Platform Subscription Billing
-- Znifa charges organisations a monthly SaaS fee.
-- This migration adds the tables that track:
--   1. platform_plans        — Znifa's own pricing tiers
--   2. org_platform_subs     — which plan each org is on
--   3. platform_payments     — payments made by orgs to Znifa
-- ============================================================

-- ----------------------------------------------------------------
-- ENUM: platform_plan_status
-- ----------------------------------------------------------------
CREATE TYPE platform_plan_status AS ENUM (
    'active',
    'trial',
    'past_due',
    'cancelled',
    'expired'
);

-- ----------------------------------------------------------------
-- ENUM: platform_interval
-- ----------------------------------------------------------------
CREATE TYPE platform_interval AS ENUM ('monthly', 'yearly');

-- ----------------------------------------------------------------
-- TABLE: platform_plans
-- The tiers offered by Znifa to holy places.
-- Seeded below — admins do not create these dynamically.
-- ----------------------------------------------------------------
CREATE TABLE platform_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,          -- 'Starter', 'Growth', 'Pro'
    slug            TEXT NOT NULL UNIQUE,   -- 'starter', 'growth', 'pro'
    description     TEXT,
    price_monthly   NUMERIC(10,2) NOT NULL, -- INR monthly price
    price_yearly    NUMERIC(10,2) NOT NULL, -- INR yearly price (usually discounted)
    max_members     INT,                    -- NULL = unlimited
    max_staff       INT,                    -- NULL = unlimited
    features        JSONB NOT NULL DEFAULT '[]',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- TABLE: org_platform_subs
-- One row per organisation tracking their active platform plan.
-- ----------------------------------------------------------------
CREATE TABLE org_platform_subs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES platform_plans(id),
    status              platform_plan_status NOT NULL DEFAULT 'trial',
    billing_interval    platform_interval NOT NULL DEFAULT 'monthly',
    trial_ends_at       TIMESTAMPTZ,        -- NULL after trial converts
    current_period_start TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    -- Cashfree metadata for the last order
    cf_order_id         TEXT,
    cf_payment_id       TEXT,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_platform_subs_org_id  ON org_platform_subs(org_id);
CREATE INDEX idx_org_platform_subs_status  ON org_platform_subs(status);
CREATE INDEX idx_org_platform_subs_period  ON org_platform_subs(current_period_end);

-- ----------------------------------------------------------------
-- TABLE: platform_payments
-- Record of every payment an org made to the Znifa platform.
-- ----------------------------------------------------------------
CREATE TABLE platform_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sub_id          UUID REFERENCES org_platform_subs(id) ON DELETE SET NULL,
    plan_id         UUID NOT NULL REFERENCES platform_plans(id),
    amount          NUMERIC(10,2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'INR',
    billing_interval platform_interval NOT NULL DEFAULT 'monthly',
    payment_status  payment_status NOT NULL DEFAULT 'pending',
    cf_order_id     TEXT UNIQUE,
    cf_payment_id   TEXT,
    period_start    TIMESTAMPTZ,
    period_end      TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_payments_org_id  ON platform_payments(org_id);
CREATE INDEX idx_platform_payments_status  ON platform_payments(payment_status);
CREATE INDEX idx_platform_payments_cf_order ON platform_payments(cf_order_id);

-- ----------------------------------------------------------------
-- TRIGGERS: updated_at
-- ----------------------------------------------------------------
CREATE TRIGGER trg_org_platform_subs_updated_at
    BEFORE UPDATE ON org_platform_subs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_platform_payments_updated_at
    BEFORE UPDATE ON platform_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
ALTER TABLE platform_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_platform_subs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_payments     ENABLE ROW LEVEL SECURITY;

-- Everyone can read platform plans (public pricing)
CREATE POLICY "public_read_platform_plans"
ON platform_plans FOR SELECT TO anon, authenticated
USING (is_active = TRUE);

-- Org members can see their own subscription row
CREATE POLICY "org_members_view_own_sub"
ON org_platform_subs FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Only service role / super admin can insert/update platform subs
CREATE POLICY "super_admin_manage_platform_subs"
ON org_platform_subs FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Org admins can see their platform payments
CREATE POLICY "org_admin_view_platform_payments"
ON platform_payments FOR SELECT TO authenticated
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_staff')
    )
    OR is_super_admin()
);

-- ----------------------------------------------------------------
-- FUNCTION: get_org_platform_sub
-- Returns the current platform subscription for an org.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_org_platform_sub(p_org_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'sub_id',               s.id,
        'plan_id',              s.plan_id,
        'plan_name',            p.name,
        'plan_slug',            p.slug,
        'status',               s.status,
        'billing_interval',     s.billing_interval,
        'trial_ends_at',        s.trial_ends_at,
        'current_period_start', s.current_period_start,
        'current_period_end',   s.current_period_end,
        'cancel_at_period_end', s.cancel_at_period_end,
        'price_monthly',        p.price_monthly,
        'price_yearly',         p.price_yearly,
        'max_members',          p.max_members,
        'features',             p.features
    )
    INTO v_result
    FROM org_platform_subs s
    JOIN platform_plans p ON p.id = s.plan_id
    WHERE s.org_id = p_org_id;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- FUNCTION: activate_platform_sub
-- Called by the webhook after a successful payment.
-- Idempotent — safe to call multiple times with same cf_order_id.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION activate_platform_sub(
    p_org_id        UUID,
    p_plan_id       UUID,
    p_cf_order_id   TEXT,
    p_cf_payment_id TEXT,
    p_interval      platform_interval DEFAULT 'monthly',
    p_amount        NUMERIC DEFAULT 0
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_period_start  TIMESTAMPTZ := NOW();
    v_period_end    TIMESTAMPTZ;
    v_sub_id        UUID;
BEGIN
    -- Calculate period end
    IF p_interval = 'yearly' THEN
        v_period_end := v_period_start + INTERVAL '1 year';
    ELSE
        v_period_end := v_period_start + INTERVAL '1 month';
    END IF;

    -- Upsert org_platform_subs
    INSERT INTO org_platform_subs (
        org_id, plan_id, status, billing_interval,
        trial_ends_at, current_period_start, current_period_end,
        cf_order_id, cf_payment_id, cancel_at_period_end
    )
    VALUES (
        p_org_id, p_plan_id, 'active', p_interval,
        NULL, v_period_start, v_period_end,
        p_cf_order_id, p_cf_payment_id, FALSE
    )
    ON CONFLICT (org_id) DO UPDATE SET
        plan_id              = EXCLUDED.plan_id,
        status               = 'active',
        billing_interval     = EXCLUDED.billing_interval,
        trial_ends_at        = NULL,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end   = EXCLUDED.current_period_end,
        cf_order_id          = EXCLUDED.cf_order_id,
        cf_payment_id        = EXCLUDED.cf_payment_id,
        cancel_at_period_end = FALSE,
        updated_at           = NOW()
    RETURNING id INTO v_sub_id;

    -- Also update the organization status to 'active'
    UPDATE organizations SET status = 'active' WHERE id = p_org_id;

    -- Mark the platform_payment record as paid
    UPDATE platform_payments
    SET
        payment_status  = 'paid',
        cf_payment_id   = p_cf_payment_id,
        period_start    = v_period_start,
        period_end      = v_period_end,
        paid_at         = NOW(),
        sub_id          = v_sub_id
    WHERE cf_order_id = p_cf_order_id;
END;
$$;

-- ----------------------------------------------------------------
-- FUNCTION: start_org_trial
-- Auto-called from a trigger when an org is created, OR explicitly
-- from the /api/orgs/create route. Seeds a 14-day free trial on
-- the Starter plan.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION start_org_trial(p_org_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_starter_plan_id UUID;
BEGIN
    SELECT id INTO v_starter_plan_id FROM platform_plans WHERE slug = 'starter' LIMIT 1;

    INSERT INTO org_platform_subs (
        org_id, plan_id, status, billing_interval,
        trial_ends_at, current_period_start, current_period_end
    )
    VALUES (
        p_org_id, v_starter_plan_id, 'trial', 'monthly',
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '14 days'
    )
    ON CONFLICT (org_id) DO NOTHING;
END;
$$;

-- ----------------------------------------------------------------
-- SEED: Platform plans
-- ----------------------------------------------------------------
INSERT INTO platform_plans (name, slug, description, price_monthly, price_yearly, max_members, max_staff, features, sort_order) VALUES
(
    'Starter',
    'starter',
    'Perfect for small holy places just getting started',
    499,
    4999,
    100,
    2,
    '["Up to 100 members", "2 staff accounts", "Subscription plans", "Manual payments", "Basic reports", "Email support"]',
    1
),
(
    'Growth',
    'growth',
    'For growing communities with online payment needs',
    999,
    9999,
    500,
    5,
    '["Up to 500 members", "5 staff accounts", "Subscription plans", "Online payments via Cashfree", "Advanced reports & CSV export", "Priority support"]',
    2
),
(
    'Pro',
    'pro',
    'Unlimited everything for large organisations',
    1999,
    19999,
    NULL,
    NULL,
    '["Unlimited members", "Unlimited staff", "All payment methods", "Custom billing cycles", "Full analytics", "Dedicated support", "API access"]',
    3
);
