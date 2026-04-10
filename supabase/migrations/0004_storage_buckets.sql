-- ============================================================
-- MIGRATION 0004: Storage Buckets
-- ============================================================

-- Public bucket for org logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'org-logos',
    'org-logos',
    TRUE,
    5242880,  -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

-- Private bucket for payment receipts / documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-docs',
    'payment-docs',
    FALSE,
    10485760,  -- 10MB
    ARRAY['image/png', 'image/jpeg', 'application/pdf']
);

-- Storage RLS for org-logos: org admins can upload, anyone can read
CREATE POLICY "org_logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

CREATE POLICY "org_admin_upload_logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::TEXT FROM organizations o
        WHERE get_user_role_in_org(o.id) = 'org_admin'
    )
);

CREATE POLICY "org_admin_delete_logo"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::TEXT FROM organizations o
        WHERE get_user_role_in_org(o.id) = 'org_admin'
    )
);

-- Storage RLS for payment-docs: org staff can upload, org members can read their own
CREATE POLICY "org_staff_upload_payment_doc"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'payment-docs'
    AND (storage.foldername(name))[1] IN (
        SELECT org_id::TEXT FROM org_members
        WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_staff')
    )
);

CREATE POLICY "org_staff_read_payment_doc"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'payment-docs'
    AND (storage.foldername(name))[1] IN (
        SELECT org_id::TEXT FROM org_members WHERE user_id = auth.uid()
    )
);
