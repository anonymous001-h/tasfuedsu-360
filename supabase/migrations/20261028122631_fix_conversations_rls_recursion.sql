/*
# Fix infinite recursion in conversations RLS policies

## Problem
The `read_conversations` SELECT policy on `conversations` checks `conversation_participants`,
and the `read_participants` SELECT policy on `conversation_participants` checks `conversations`.
This creates a circular dependency → "infinite recursion detected in policy for relation conversations".

## Fix
- `read_participants`: remove the subquery to `conversations`. Only check `user_id = auth.uid()` or `is_admin()`.
- `read_conversations`: keep the subquery to `conversation_participants` (now safe since participants no longer references conversations back).

## Security
- No grants changed. Policies remain scoped to `authenticated`.
- Users can still only see conversations they participate in, broadcasts, or (if admin) all.
*/

DROP POLICY IF EXISTS "read_participants" ON conversation_participants;
CREATE POLICY "read_participants" ON conversation_participants FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "read_conversations" ON conversations;
CREATE POLICY "read_conversations" ON conversations FOR SELECT
  TO authenticated USING (
    type = 'broadcast' OR is_admin() OR created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );
