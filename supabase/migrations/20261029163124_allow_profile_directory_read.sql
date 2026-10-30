/*
# Allow authenticated users to read all profiles (messaging directory)

## Why
The existing `select_own_profile` policy only lets a user read their own profile row
(`auth.uid() = id OR is_admin()`). The Connect+ messaging search queries the `profiles`
table to find students by name/matric number, so every other profile is filtered out
by RLS and searches always return "No students found."

## Changes
- Drop the restrictive `select_own_profile` SELECT policy.
- Add a new `read_all_profiles` SELECT policy that allows any authenticated user to
  read all profile rows. This is required for a user directory / messaging search.
- The UPDATE policy stays owner-only (`auth.uid() = id`), so users still cannot edit
  anyone else's profile. Role/bio/avatar columns are only writable by the owner (or
  an admin via separate logic), so exposing SELECT is safe.
- No grants change; `authenticated` already has SELECT on `profiles`.

## Security notes
1. This makes profile information (display name, department, matric number, avatar)
   visible to all signed-in users. This is the standard behavior for a student
   directory / messaging app and is the intended design.
2. Write access is unchanged — only the owner can update their own profile.
*/

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "read_all_profiles" ON public.profiles;
CREATE POLICY "read_all_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
