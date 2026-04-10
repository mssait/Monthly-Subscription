-- ============================================================
-- SEED DATA (development only)
-- ============================================================

-- Sample organization
INSERT INTO organizations (id, slug, name, org_type, status, city, state, phone, email)
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'al-noor-masjid',
    'Al Noor Masjid',
    'masjid',
    'active',
    'Mumbai',
    'Maharashtra',
    '9876543210',
    'admin@alnoor.org'
);

-- Note: auth users are created via Supabase Auth, not seed SQL.
-- After signing up in dev, run this to make yourself a super_admin:
--   UPDATE org_members SET role = 'super_admin' WHERE user_id = '<your-user-id>';
-- Or use the Supabase dashboard to insert:
--   INSERT INTO org_members (org_id, user_id, role)
--   VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '<your-user-id>', 'org_admin');

-- Sample subscription plans
INSERT INTO subscription_plans (org_id, name, description, amount, billing_cycle)
VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'Monthly Sadaqah', 'Monthly recurring donation', 500.00, 'monthly'),
    ('aaaaaaaa-0000-0000-0000-000000000001', 'Annual Membership', 'Yearly masjid membership', 5000.00, 'yearly'),
    ('aaaaaaaa-0000-0000-0000-000000000001', 'Jumu''ah Collection', 'One-time Friday collection', 100.00, 'one_time');
