/*
# Storage policies for media bucket
- Public read (anyone can view images/files)
- Authenticated users can upload
- Users can delete their own uploads
*/
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_upload" ON storage.objects;
CREATE POLICY "media_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid()) WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_owner_delete" ON storage.objects;
CREATE POLICY "media_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());
