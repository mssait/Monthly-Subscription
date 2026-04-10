-- ============================================================
-- MIGRATION 0001: Initial Schema
-- ============================================================

-- uuid-ossp not needed — using gen_random_uuid() which is built into PostgreSQL 13+

-- ----------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------

CREATE TYPE org_type AS ENUM ('masjid', 'temple', 'church', 'gurudwara', 'other');
CREATE TYPE org_status AS ENUM ('active', 'suspended', 'trial', 'cancelled');
CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'org_staff', 'member');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time', 'custom');
CREATE TYPE subscription_status AS ENUM ('active', 'overdue', 'paused', 'cancelled', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'waived');
CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'card', 'net_banking', 'cheque', 'bank_transfer', 'other');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'deceased');

-- ----------------------------------------------------------------
-- TABLE: organizations (tenants)
-- ----------------------------------------------------------------

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    org_type        org_type NOT NULL DEFAULT 'masjid',
    status          org_status NOT NULL DEFAULT 'trial',
    logo_url        TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    pincode         TEXT,
    phone           TEXT,
    email           TEXT,
    website         TEXT,
    -- Per-org Cashfree credentials (secret stored encrypted at app layer)
    cashfree_app_id TEXT,
    cashfree_secret TEXT,
    cashfree_env    TEXT NOT NULL DEFAULT 'sandbox',
    timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency        TEXT NOT NULL DEFAULT 'INR',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- TABLE: org_members (auth users linked to orgs with roles)
-- ----------------------------------------------------------------

CREATE TABLE org_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        user_role NOT NULL DEFAULT 'member',
    invited_by  UUID REFERENCES auth.users(id),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org_id  ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);

-- ----------------------------------------------------------------
-- TABLE: members (donors/subscribers — may not have auth login)
-- ----------------------------------------------------------------

CREATE TABLE members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES auth.users(id),
    member_number   TEXT,
    first_name      TEXT NOT NULL,
    last_name       TEXT,
    phone           TEXT NOT NULL,
    email           TEXT,
    address         TEXT,
    city            TEXT,
    pincode         TEXT,
    membership_type TEXT,
    status          member_status NOT NULL DEFAULT 'active',
    notes           TEXT,
    avatar_url      TEXT,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, phone)
);

CREATE INDEX idx_members_org_id ON members(org_id);
CREATE INDEX idx_members_status  ON members(status);

-- ----------------------------------------------------------------
-- TABLE: subscription_plans
-- ----------------------------------------------------------------

CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    amount          NUMERIC(10,2) NOT NULL,
    billing_cycle   billing_cycle NOT NULL,
    custom_days     INT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    allows_partial  BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_org_id ON subscription_plans(org_id);

-- ----------------------------------------------------------------
-- TABLE: subscriptions
-- ----------------------------------------------------------------

CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status          subscription_status NOT NULL DEFAULT 'active',
    start_date      DATE NOT NULL,
    end_date        DATE,
    next_due_date   DATE,
    amount_override NUMERIC(10,2),
    notes           TEXT,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org_id    ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status    ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_due  ON subscriptions(next_due_date);

-- ----------------------------------------------------------------
-- TABLE: payments
-- ----------------------------------------------------------------

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    member_id           UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    amount              NUMERIC(10,2) NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'INR',
    payment_method      payment_method NOT NULL,
    payment_status      payment_status NOT NULL DEFAULT 'pending',
    -- Cashfree fields
    cf_order_id         TEXT,
    cf_payment_id       TEXT,
    cf_signature        TEXT,
    -- Manual payment fields
    reference_number    TEXT,
    receipt_number      TEXT UNIQUE,
    collected_by        UUID REFERENCES auth.users(id),
    payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start        DATE,
    period_end          DATE,
    notes               TEXT,
    created_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_org_id          ON payments(org_id);
CREATE INDEX idx_payments_member_id       ON payments(member_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status          ON payments(payment_status);
CREATE INDEX idx_payments_date            ON payments(payment_date);
CREATE INDEX idx_payments_cf_order        ON payments(cf_order_id);

-- ----------------------------------------------------------------
-- TABLE: payment_audit_log (append-only)
-- ----------------------------------------------------------------

CREATE TABLE payment_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id  UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL,
    old_status  payment_status,
    new_status  payment_status NOT NULL,
    changed_by  UUID REFERENCES auth.users(id),
    notes       TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_payment_id ON payment_audit_log(payment_id);
