/*
# Function to check if email exists in auth.users
# Used by forgot password flow to validate before sending reset
*/
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
