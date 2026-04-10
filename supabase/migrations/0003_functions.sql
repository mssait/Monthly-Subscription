-- ============================================================
-- MIGRATION 0003: DB Functions and Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate member number per org (MEM-0001, MEM-0002, ...)
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    next_seq INT;
BEGIN
    SELECT COUNT(*) + 1 INTO next_seq FROM members WHERE org_id = NEW.org_id;
    NEW.member_number := 'MEM-' || LPAD(next_seq::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_member_number
    BEFORE INSERT ON members
    FOR EACH ROW WHEN (NEW.member_number IS NULL)
    EXECUTE FUNCTION generate_member_number();

-- Auto-generate receipt number per org (ORG-REC-00001)
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    next_seq INT;
    org_prefix TEXT;
BEGIN
    SELECT UPPER(LEFT(slug, 3)) INTO org_prefix FROM organizations WHERE id = NEW.org_id;
    SELECT COUNT(*) + 1 INTO next_seq FROM payments WHERE org_id = NEW.org_id;
    NEW.receipt_number := org_prefix || '-REC-' || LPAD(next_seq::TEXT, 5, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_receipt_number
    BEFORE INSERT ON payments
    FOR EACH ROW WHEN (NEW.receipt_number IS NULL)
    EXECUTE FUNCTION generate_receipt_number();

-- Audit log on payment status change
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
        INSERT INTO payment_audit_log(payment_id, org_id, old_status, new_status, changed_by)
        VALUES (NEW.id, NEW.org_id, OLD.payment_status, NEW.payment_status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_audit
    AFTER UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION log_payment_status_change();

-- ----------------------------------------------------------------
-- RPC: record_manual_payment
-- Atomically insert payment + update subscription in one call
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_manual_payment(
    p_org_id            UUID,
    p_member_id         UUID,
    p_subscription_id   UUID,
    p_amount            NUMERIC,
    p_payment_method    payment_method,
    p_payment_date      DATE,
    p_reference_number  TEXT DEFAULT NULL,
    p_period_start      DATE DEFAULT NULL,
    p_period_end        DATE DEFAULT NULL,
    p_notes             TEXT DEFAULT NULL,
    p_next_due_date     DATE DEFAULT NULL
)
RETURNS payments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_payment payments;
BEGIN
    -- Insert payment record
    INSERT INTO payments (
        org_id, member_id, subscription_id, amount, payment_method,
        payment_status, payment_date, reference_number, period_start, period_end,
        notes, created_by, collected_by
    ) VALUES (
        p_org_id, p_member_id, p_subscription_id, p_amount, p_payment_method,
        'paid', p_payment_date, p_reference_number, p_period_start, p_period_end,
        p_notes, auth.uid(), auth.uid()
    )
    RETURNING * INTO v_payment;

    -- Update subscription next_due_date and reactivate if overdue
    IF p_subscription_id IS NOT NULL AND p_next_due_date IS NOT NULL THEN
        UPDATE subscriptions
        SET
            next_due_date = p_next_due_date,
            status = CASE WHEN status = 'overdue' THEN 'active' ELSE status END
        WHERE id = p_subscription_id AND org_id = p_org_id;
    END IF;

    RETURN v_payment;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: get_org_dashboard_stats — single round-trip for dashboard
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_org_dashboard_stats(p_org_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_members',          (SELECT COUNT(*) FROM members WHERE org_id = p_org_id AND status = 'active'),
        'active_subscriptions',   (SELECT COUNT(*) FROM subscriptions WHERE org_id = p_org_id AND status = 'active'),
        'overdue_subscriptions',  (SELECT COUNT(*) FROM subscriptions WHERE org_id = p_org_id AND status = 'overdue'),
        'collection_this_month',  (
            SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE org_id = p_org_id
            AND payment_status = 'paid'
            AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE)
        ),
        'collection_last_month',  (
            SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE org_id = p_org_id
            AND payment_status = 'paid'
            AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        ),
        'monthly_trend', (
            SELECT json_agg(row_to_json(t)) FROM (
                SELECT
                    TO_CHAR(DATE_TRUNC('month', payment_date), 'Mon YYYY') AS month,
                    SUM(amount) AS total
                FROM payments
                WHERE org_id = p_org_id
                AND payment_status = 'paid'
                AND payment_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', payment_date)
                ORDER BY DATE_TRUNC('month', payment_date)
            ) t
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- Daily job: mark overdue subscriptions
-- Call this via pg_cron or external cron
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION mark_overdue_subscriptions()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE subscriptions
    SET status = 'overdue'
    WHERE status = 'active'
    AND next_due_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
