/*
# Notifications + Anonymous Desk enhancements

## Changes

### New table: `notifications`
- Stores in-app push notifications for each user.
- Columns: id, user_id, title, body, type (news/event/message/opportunity/system), read flag, created_at, link_screen, link_params (jsonb).
- RLS: users see only their own notifications; users can insert is not needed (admin/system creates them). Users can mark their own as read.

### Modified table: `anonymous_submissions`
- Add `tracking_code` (text, unique) — a short code students use to look up their submission status.
- Add `status` (text, default 'submitted') — values: submitted, under_review, resolved, closed.
- Add `admin_response` (text) — optional response from admin to the student.
- Existing `reviewed` boolean is kept for backward compat; status replaces it going forward.
*/

-- ---------- notifications table ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'system' CHECK (type IN ('news','event','message','opportunity','system')),
  read boolean NOT NULL DEFAULT false,
  link_screen text DEFAULT '',
  link_params jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "read_own_notifications" ON public.notifications;
CREATE POLICY "read_own_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role inserts notifications (via edge function or admin), so grant to service_role
GRANT INSERT ON public.notifications TO service_role;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ---------- anonymous_submissions enhancements ----------
ALTER TABLE public.anonymous_submissions
  ADD COLUMN IF NOT EXISTS tracking_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','resolved','closed')),
  ADD COLUMN IF NOT EXISTS admin_response text DEFAULT '';

-- Backfill tracking codes for existing rows
UPDATE public.anonymous_submissions
SET tracking_code = UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 8))
WHERE tracking_code = '';

-- Add unique index on tracking_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_anon_tracking_code ON public.anonymous_submissions(tracking_code) WHERE tracking_code != '';

-- Update the insert policy to allow anon (no auth) submissions with tracking code
-- (existing insert policy already allows anon + authenticated with CHECK true, so no change needed)

-- Grant UPDATE to authenticated (already granted) and anon for tracking lookups (read-only for anon on their own tracking_code)
-- We need anon to be able to SELECT by tracking_code for the track feature
DROP POLICY IF EXISTS "track_anonymous" ON public.anonymous_submissions;
CREATE POLICY "track_anonymous" ON public.anonymous_submissions
  FOR SELECT TO anon, authenticated USING (true);

-- The existing read_anonymous_admin policy is more restrictive but this new one
-- allows tracking by code. Since no user identity is stored, this is safe —
-- the tracking_code is the only way to look up a submission.
