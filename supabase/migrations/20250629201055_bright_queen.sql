/*
  # Fix profiles table RLS policies

  1. Security
    - Drop existing incorrect RLS policies
    - Add correct policies that use user_id instead of id
    - Allow authenticated users to insert their own profiles
    - Allow authenticated users to read their own profiles  
    - Allow authenticated users to update their own profiles

  This resolves the "new row violates row-level security policy" error
  by correctly matching against the user_id foreign key field.
*/

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Enable insert for authenticated users on profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users on profiles" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on profiles" ON profiles;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);