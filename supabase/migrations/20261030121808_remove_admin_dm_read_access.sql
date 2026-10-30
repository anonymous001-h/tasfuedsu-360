DROP POLICY IF EXISTS "read_conversations" ON conversations;
CREATE POLICY "read_conversations" ON conversations FOR SELECT
  TO authenticated
  USING (
    type = 'broadcast'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "read_participants" ON conversation_participants;
CREATE POLICY "read_participants" ON conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "read_messages" ON messages;
CREATE POLICY "read_messages" ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.type = 'broadcast'
          OR EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "update_messages_read" ON messages;
CREATE POLICY "update_messages_read" ON messages FOR UPDATE
  TO authenticated
  USING (
    is_conversation_member(conversation_id)
    OR (is_admin() AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.type = 'broadcast'))
  )
  WITH CHECK (
    is_conversation_member(conversation_id)
    OR (is_admin() AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.type = 'broadcast'))
  );

DROP POLICY IF EXISTS "read_reactions" ON message_reactions;
CREATE POLICY "read_reactions" ON message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = (SELECT m.conversation_id FROM messages m WHERE m.id = message_reactions.message_id)
        AND (
          c.type = 'broadcast'
          OR EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()
          )
        )
    )
  );
