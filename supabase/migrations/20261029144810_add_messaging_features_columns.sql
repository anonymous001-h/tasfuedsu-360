/*
# Enhance messaging: replies, forwarding, soft-delete, reactions

1. Modified Tables
- `messages`:
  - `reply_to_id` (uuid, nullable) — references another message in the same conversation for quoted replies.
  - `forwarded_from_id` (uuid, nullable) — references the original message a forwarded copy came from.
  - `deleted_at` (timestamptz, nullable) — soft-delete timestamp; when set, the message body is hidden in the UI.
- New table `message_reactions`:
  - `id` (uuid, primary key)
  - `message_id` (uuid, references messages, cascade delete)
  - `user_id` (uuid, references auth.users, cascade delete)
  - `emoji` (text, the reaction emoji)
  - `created_at` (timestamptz, default now())
  - Unique constraint on (message_id, user_id, emoji) so a user can only add a given emoji once per message.

2. Security
- Enable RLS on `message_reactions`.
- Grant SELECT, INSERT, DELETE on `message_reactions` to authenticated.
- SELECT: any user who can read the parent message's conversation.
- INSERT: authenticated users can react (owner is auth.uid()).
- DELETE: only the reacting user can remove their own reaction.
- Add DELETE policy on `messages`: the sender can delete their own message (RLS USING sender_id = auth.uid()).
- Grant DELETE on `messages` to authenticated.

3. Notes
- Soft delete is preferred: we set `deleted_at` and the UI hides the body. Hard delete remains allowed for the sender via the DELETE policy.
- Realtime already covers `messages`; we add `message_reactions` to the realtime publication.
*/
-- Add columns to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_from_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;

-- Allow message sender to delete their own messages
DROP POLICY IF EXISTS "delete_own_messages" ON public.messages;
CREATE POLICY "delete_own_messages" ON public.messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid());

GRANT DELETE ON public.messages TO authenticated;

-- Reactions policies
DROP POLICY IF EXISTS "read_reactions" ON public.message_reactions;
CREATE POLICY "read_reactions" ON public.message_reactions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = (SELECT messages.conversation_id FROM public.messages WHERE messages.id = message_reactions.message_id)
      AND (c.type = 'broadcast' OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "insert_reactions" ON public.message_reactions;
CREATE POLICY "insert_reactions" ON public.message_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reactions" ON public.message_reactions;
CREATE POLICY "delete_own_reactions" ON public.message_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add reactions to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Index for fast reaction lookups
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
