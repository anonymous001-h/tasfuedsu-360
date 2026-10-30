/*
# Add engagement features: likes, comments (threaded), bookmarks

## New Tables
- `likes` — likes on news articles and events. One per user per target.
- `comments` — threaded comments on news and events. Supports parent_id for replies.
- `bookmarks` — user bookmarks for news articles and events. One per user per target.

## Columns
### likes
- id (uuid PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid())
- target_type ('news' | 'event')
- target_id (uuid)
- created_at (timestamptz)

### comments
- id (uuid PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid())
- target_type ('news' | 'event')
- target_id (uuid)
- parent_id (uuid, nullable, FK to comments.id for threaded replies)
- body (text, NOT NULL)
- created_at (timestamptz)

### bookmarks
- id (uuid PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid())
- target_type ('news' | 'event')
- target_id (uuid)
- created_at (timestamptz)

## Security
- RLS enabled on all three tables.
- Grants to authenticated only (app has sign-in).
- Likes: users can read all, insert/delete own only.
- Comments: users can read all, insert own, update/delete own.
- Bookmarks: users can read/insert/delete own only.
- Unique constraints prevent duplicate likes and bookmarks.
*/

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('news', 'event')),
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON likes TO authenticated;
DROP POLICY IF EXISTS "select_likes" ON likes;
CREATE POLICY "select_likes" ON likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_like" ON likes;
CREATE POLICY "insert_own_like" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_like" ON likes;
CREATE POLICY "delete_own_like" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('news', 'event')),
  target_id uuid NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO authenticated;
DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments" ON comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_comment" ON comments;
CREATE POLICY "insert_own_comment" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_comment" ON comments;
CREATE POLICY "update_own_comment" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_comment" ON comments;
CREATE POLICY "delete_own_comment" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at);

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('news', 'event')),
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON bookmarks TO authenticated;
DROP POLICY IF EXISTS "select_own_bookmarks" ON bookmarks;
CREATE POLICY "select_own_bookmarks" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bookmark" ON bookmarks;
CREATE POLICY "insert_own_bookmark" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bookmark" ON bookmarks;
CREATE POLICY "delete_own_bookmark" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
