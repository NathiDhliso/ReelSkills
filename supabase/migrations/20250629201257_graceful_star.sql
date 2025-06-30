/*
  # Fix RLS policies for profiles table

  1. Security
    - Only add the missing read policy for users to access their own profiles
    - Skip policies that already exist to avoid conflicts
*/

-- Only create the read policy if it doesn't exist
-- The insert and update policies already exist based on the schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read their own profile'
  ) THEN
    CREATE POLICY "Users can read their own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;