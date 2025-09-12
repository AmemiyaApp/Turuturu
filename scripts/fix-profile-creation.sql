-- Additional RLS policy to allow profile creation
-- This should be run in Supabase SQL editor

-- Allow users to create their own profile
CREATE POLICY "Users can create own profile" ON "Profile"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Alternative: Allow anyone to create profiles during signup
-- (More permissive but needed for social login)
DROP POLICY IF EXISTS "Allow profile creation during signup" ON "Profile";
CREATE POLICY "Allow profile creation during signup" ON "Profile"
  FOR INSERT WITH CHECK (true);