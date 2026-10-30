/*
# TASFUEDSU 360 — Core Schema

Creates the full data model for the student union governance platform.

## Tables (created first, policies second)
1. profiles — user profile + role (student/admin), extends auth.users
2. news — articles
3. library_resources — categorized study resources
4. events — campus events
5. calendar_entries — important dates
6. opportunities — scholarships/internships/etc
7. sug_members — SUG administration members
8. anonymous_submissions — anonymous feedback
9. conversations — chat rooms (dm/group/broadcast)
10. conversation_participants — M2M users<->conversations
11. messages — chat messages

## Security
- RLS on every table
- Content tables: authenticated SELECT, admin-only writes (via is_admin() SECURITY DEFINER fn)
- anonymous_submissions: anon+authenticated INSERT, admin-only SELECT/UPDATE
- conversations/participants/messages: participants see their own; broadcasts visible to all; admin sees all
- profiles: own read/update; admin can read all
- Trigger auto-creates profile row on signup
*/

-- ============================================================
-- PART 1: ALL TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  matric_number text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  type text NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf','document','link','video')),
  url text NOT NULL DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date,
  event_time text DEFAULT '',
  venue text DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  entry_date date NOT NULL,
  type text NOT NULL DEFAULT 'event' CHECK (type IN ('event','holiday','exam','deadline','meeting')),
  description text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'scholarship' CHECK (type IN ('scholarship','internship','volunteer','competition','grant')),
  deadline date,
  description text NOT NULL DEFAULT '',
  link text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sug_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  photo_url text DEFAULT '',
  term text DEFAULT '',
  status text NOT NULL DEFAULT 'current' CHECK (status IN ('current','past')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anonymous_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'complaint',
  message text NOT NULL,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT '',
  type text NOT NULL DEFAULT 'dm' CHECK (type IN ('dm','group','broadcast')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PART 2: ENABLE RLS + GRANTS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sug_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT ON public.news TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;

GRANT SELECT ON public.library_resources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.library_resources TO authenticated;

GRANT SELECT ON public.events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;

GRANT SELECT ON public.calendar_entries TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.calendar_entries TO authenticated;

GRANT SELECT ON public.opportunities TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;

GRANT SELECT ON public.sug_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sug_members TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.anonymous_submissions TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- ============================================================
-- PART 3: HELPER FUNCTION (profiles table now exists)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- ============================================================
-- PART 4: ALL POLICIES
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- news
DROP POLICY IF EXISTS "read_news" ON public.news;
CREATE POLICY "read_news" ON public.news FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_news_admin" ON public.news;
CREATE POLICY "write_news_admin" ON public.news FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_news_admin" ON public.news;
CREATE POLICY "update_news_admin" ON public.news FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_news_admin" ON public.news;
CREATE POLICY "delete_news_admin" ON public.news FOR DELETE TO authenticated USING (public.is_admin());

-- library_resources
DROP POLICY IF EXISTS "read_library" ON public.library_resources;
CREATE POLICY "read_library" ON public.library_resources FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_library_admin" ON public.library_resources;
CREATE POLICY "write_library_admin" ON public.library_resources FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_library_admin" ON public.library_resources;
CREATE POLICY "update_library_admin" ON public.library_resources FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_library_admin" ON public.library_resources;
CREATE POLICY "delete_library_admin" ON public.library_resources FOR DELETE TO authenticated USING (public.is_admin());

-- events
DROP POLICY IF EXISTS "read_events" ON public.events;
CREATE POLICY "read_events" ON public.events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_events_admin" ON public.events;
CREATE POLICY "write_events_admin" ON public.events FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_events_admin" ON public.events;
CREATE POLICY "update_events_admin" ON public.events FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_events_admin" ON public.events;
CREATE POLICY "delete_events_admin" ON public.events FOR DELETE TO authenticated USING (public.is_admin());

-- calendar_entries
DROP POLICY IF EXISTS "read_calendar" ON public.calendar_entries;
CREATE POLICY "read_calendar" ON public.calendar_entries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_calendar_admin" ON public.calendar_entries;
CREATE POLICY "write_calendar_admin" ON public.calendar_entries FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_calendar_admin" ON public.calendar_entries;
CREATE POLICY "update_calendar_admin" ON public.calendar_entries FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_calendar_admin" ON public.calendar_entries;
CREATE POLICY "delete_calendar_admin" ON public.calendar_entries FOR DELETE TO authenticated USING (public.is_admin());

-- opportunities
DROP POLICY IF EXISTS "read_opportunities" ON public.opportunities;
CREATE POLICY "read_opportunities" ON public.opportunities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_opportunities_admin" ON public.opportunities;
CREATE POLICY "write_opportunities_admin" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_opportunities_admin" ON public.opportunities;
CREATE POLICY "update_opportunities_admin" ON public.opportunities FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_opportunities_admin" ON public.opportunities;
CREATE POLICY "delete_opportunities_admin" ON public.opportunities FOR DELETE TO authenticated USING (public.is_admin());

-- sug_members
DROP POLICY IF EXISTS "read_sug" ON public.sug_members;
CREATE POLICY "read_sug" ON public.sug_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_sug_admin" ON public.sug_members;
CREATE POLICY "write_sug_admin" ON public.sug_members FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_sug_admin" ON public.sug_members;
CREATE POLICY "update_sug_admin" ON public.sug_members FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_sug_admin" ON public.sug_members;
CREATE POLICY "delete_sug_admin" ON public.sug_members FOR DELETE TO authenticated USING (public.is_admin());

-- anonymous_submissions
DROP POLICY IF EXISTS "insert_anonymous" ON public.anonymous_submissions;
CREATE POLICY "insert_anonymous" ON public.anonymous_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "read_anonymous_admin" ON public.anonymous_submissions;
CREATE POLICY "read_anonymous_admin" ON public.anonymous_submissions
  FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "update_anonymous_admin" ON public.anonymous_submissions;
CREATE POLICY "update_anonymous_admin" ON public.anonymous_submissions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- conversations
DROP POLICY IF EXISTS "read_conversations" ON public.conversations;
CREATE POLICY "read_conversations" ON public.conversations
  FOR SELECT TO authenticated USING (
    type = 'broadcast' OR public.is_admin() OR
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "create_conversation" ON public.conversations;
CREATE POLICY "create_conversation" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_conversation_admin" ON public.conversations;
CREATE POLICY "update_conversation_admin" ON public.conversations
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- conversation_participants
DROP POLICY IF EXISTS "read_participants" ON public.conversation_participants;
CREATE POLICY "read_participants" ON public.conversation_participants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.type = 'broadcast' OR public.is_admin() OR c.created_by = auth.uid())) OR
    user_id = auth.uid()
  );
DROP POLICY IF EXISTS "insert_participants" ON public.conversation_participants;
CREATE POLICY "insert_participants" ON public.conversation_participants
  FOR INSERT TO authenticated WITH CHECK (true);

-- messages
DROP POLICY IF EXISTS "read_messages" ON public.messages;
CREATE POLICY "read_messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.type = 'broadcast' OR public.is_admin() OR
      EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "insert_messages" ON public.messages;
CREATE POLICY "insert_messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_messages_read" ON public.messages;
CREATE POLICY "update_messages_read" ON public.messages
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PART 5: REALTIME + TRIGGER
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, matric_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'matric_number', ''),
    'student'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
