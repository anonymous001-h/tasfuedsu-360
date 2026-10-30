/*
# Study quiz feature, chat access fixes

## 1. Chat access fixes
- conversation_participants: members can now see the other members of conversations they belong to (needed to show the other student's name in Connect+ and chat headers). Admins still see everything.
- A helper function `is_conversation_member` checks membership without re-triggering the policy (avoids recursive RLS).
- messages INSERT: only the signed-in sender can insert, and only into a conversation they belong to. Broadcast channels accept posts only from admins.
- messages UPDATE: limited to conversation members and admins (previously any signed-in user could edit any message).

## 2. Study feature (new tables)
- study_subjects: subjects students can study. Anyone signed in can read; only admins can create, edit, or delete.
- study_questions: question bank per subject with options, the correct option index, and an optional explanation. Only admins can read this table directly, so students cannot see answers before submitting.
- study_attempts: a record of each submitted quiz (score and total). Students can read only their own attempts.

## 3. Quiz functions (secure server-side scoring)
- start_quiz(subject, count): returns a random set of questions WITHOUT answers.
- submit_quiz(subject, answers): scores the answers on the server, stores the attempt, and returns the score with the correct answers and explanations.

## Security
- RLS enabled on all new tables with separate policies per action.
- Grants limited to the authenticated role. Functions are not callable by anonymous users.
*/

-- 1. Helper to check conversation membership without recursive policy evaluation
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv AND user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid) TO authenticated;

-- 2. Participants: members can see other members of their own conversations
DROP POLICY IF EXISTS "read_participants" ON public.conversation_participants;
CREATE POLICY "read_participants" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_conversation_member(conversation_id));

-- 3. Messages: sender must be the signed-in user and a member (broadcasts: admins only)
DROP POLICY IF EXISTS "insert_messages" ON public.messages;
CREATE POLICY "insert_messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_conversation_member(conversation_id)
      OR (
        public.is_admin()
        AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.type = 'broadcast')
      )
    )
  );

DROP POLICY IF EXISTS "update_messages_read" ON public.messages;
CREATE POLICY "update_messages_read" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_conversation_member(conversation_id) OR public.is_admin())
  WITH CHECK (public.is_conversation_member(conversation_id) OR public.is_admin());

-- 4. Study subjects
CREATE TABLE IF NOT EXISTS public.study_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_subjects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_subjects TO authenticated;

DROP POLICY IF EXISTS "read_study_subjects" ON public.study_subjects;
CREATE POLICY "read_study_subjects" ON public.study_subjects
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_study_subjects_admin" ON public.study_subjects;
CREATE POLICY "insert_study_subjects_admin" ON public.study_subjects
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_study_subjects_admin" ON public.study_subjects;
CREATE POLICY "update_study_subjects_admin" ON public.study_subjects
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_study_subjects_admin" ON public.study_subjects;
CREATE POLICY "delete_study_subjects_admin" ON public.study_subjects
  FOR DELETE TO authenticated USING (public.is_admin());

-- 5. Study questions (question bank, admin-only direct access)
CREATE TABLE IF NOT EXISTS public.study_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_questions_options_array CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) BETWEEN 2 AND 6),
  CONSTRAINT study_questions_correct_in_range CHECK (correct_index >= 0 AND correct_index < jsonb_array_length(options))
);

CREATE INDEX IF NOT EXISTS study_questions_subject_idx ON public.study_questions(subject_id);

ALTER TABLE public.study_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_questions TO authenticated;

DROP POLICY IF EXISTS "read_study_questions_admin" ON public.study_questions;
CREATE POLICY "read_study_questions_admin" ON public.study_questions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_study_questions_admin" ON public.study_questions;
CREATE POLICY "insert_study_questions_admin" ON public.study_questions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_study_questions_admin" ON public.study_questions;
CREATE POLICY "update_study_questions_admin" ON public.study_questions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_study_questions_admin" ON public.study_questions;
CREATE POLICY "delete_study_questions_admin" ON public.study_questions
  FOR DELETE TO authenticated USING (public.is_admin());

-- 6. Study attempts (results history)
CREATE TABLE IF NOT EXISTS public.study_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  subject_id uuid NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  score int NOT NULL,
  total int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_attempts_user_idx ON public.study_attempts(user_id);

ALTER TABLE public.study_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.study_attempts TO authenticated;

DROP POLICY IF EXISTS "read_own_study_attempts" ON public.study_attempts;
CREATE POLICY "read_own_study_attempts" ON public.study_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- 7. Quiz functions
CREATE OR REPLACE FUNCTION public.start_quiz(p_subject_id uuid, p_count int)
RETURNS TABLE (id uuid, question text, options jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.question, q.options
  FROM public.study_questions q
  WHERE auth.uid() IS NOT NULL AND q.subject_id = p_subject_id
  ORDER BY random()
  LIMIT GREATEST(1, LEAST(COALESCE(p_count, 10), 100));
$$;

CREATE OR REPLACE FUNCTION public.submit_quiz(p_subject_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_score int;
  v_details jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH a AS (
    SELECT (x->>'question_id')::uuid AS qid, NULLIF(x->>'selected_index', '')::int AS sel
    FROM jsonb_array_elements(p_answers) x
  ),
  j AS (
    SELECT q.id, q.question, q.options, q.correct_index, q.explanation, a.sel
    FROM a
    JOIN public.study_questions q ON q.id = a.qid AND q.subject_id = p_subject_id
  )
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE sel = correct_index)::int,
    COALESCE(jsonb_agg(jsonb_build_object(
      'question_id', id,
      'question', question,
      'options', options,
      'correct_index', correct_index,
      'selected_index', sel,
      'explanation', explanation
    )), '[]'::jsonb)
  INTO v_total, v_score, v_details
  FROM j;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No valid questions submitted';
  END IF;

  INSERT INTO public.study_attempts (user_id, subject_id, score, total)
  VALUES (auth.uid(), p_subject_id, v_score, v_total);

  RETURN jsonb_build_object('score', v_score, 'total', v_total, 'details', v_details);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_quiz(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_quiz(uuid, int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) TO authenticated;
