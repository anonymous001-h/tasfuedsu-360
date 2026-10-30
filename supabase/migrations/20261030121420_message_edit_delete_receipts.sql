/*
# Message editing, delete for everyone, and read-only message columns

## What changes
- Senders can edit their own text messages. Edited messages are marked with an edited time.
- "Delete for everyone" is handled by a function that only the sender can run. It clears the text and any media link.
- Direct updates to message text are blocked for app users. Only read receipts and per-user deletions can still be updated directly.

## New column
- messages.edited_at (timestamp, nullable): set when the sender edits the message text.

## Security
- REVOKE UPDATE on messages from anon and authenticated, then GRANT UPDATE only on read, read_by, and deleted_for. This stops members from rewriting other people's messages through the data API.
- edit_message(message, body): sender only, text messages only, not deleted, 1 to 4000 characters.
- delete_message_for_everyone(message): sender only.
- Both functions are callable only by signed-in users.
*/

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

REVOKE UPDATE ON public.messages FROM anon, authenticated;
GRANT UPDATE (read, read_by, deleted_for) ON public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.edit_message(p_message_id uuid, p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_body text := btrim(COALESCE(p_body, ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 4000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 4000 characters';
  END IF;

  UPDATE public.messages
  SET body = v_body, edited_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL
    AND media_url IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This message cannot be edited';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_message_for_everyone(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.messages
  SET body = '', media_url = NULL, deleted_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This message cannot be deleted';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.edit_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.edit_message(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_message_for_everyone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_message_for_everyone(uuid) TO authenticated;
