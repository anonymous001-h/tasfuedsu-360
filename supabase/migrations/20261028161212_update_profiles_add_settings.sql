/*
# Update profiles, add app_settings, add download tracking

## Changes to profiles
- Add bio (text, nullable)
- Add department (text, nullable)  
- Add cover_photo_url (text, nullable)
- Add status (text, nullable, for online/away/busy)
- matric_number column kept but no longer used (do NOT drop — data safety)

## New Tables
- app_settings: key-value store for admin-configurable settings (splash image, etc.)
- download_log: track library resource downloads for download counts

## Security
- profiles: existing policies remain, new columns accessible to authenticated
- app_settings: SELECT for authenticated, INSERT/UPDATE for admin only
- download_log: INSERT for authenticated (record own), SELECT for all (count)
- Storage bucket: public-read for media, authenticated-write
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'online';

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON app_settings TO authenticated;
DROP POLICY IF EXISTS "select_settings" ON app_settings;
CREATE POLICY "select_settings" ON app_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "update_settings_admin" ON app_settings;
CREATE POLICY "update_settings_admin" ON app_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "insert_settings_admin" ON app_settings;
CREATE POLICY "insert_settings_admin" ON app_settings FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS download_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE download_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON download_log TO authenticated;
DROP POLICY IF EXISTS "select_downloads" ON download_log;
CREATE POLICY "select_downloads" ON download_log FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_download" ON download_log;
CREATE POLICY "insert_own_download" ON download_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
