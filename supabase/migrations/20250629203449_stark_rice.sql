/*
  # Fix Profile RLS Policies

  1. Security Changes
    - Drop all existing profile policies to avoid conflicts
    - Create proper RLS policies for authenticated users
    - Ensure users can only access their own profile data

  2. Policy Updates
    - Users can insert their own profile (auth.uid() = user_id)
    - Users can read their own profile (auth.uid() = user_id)  
    - Users can update their own profile (auth.uid() = user_id)
*/

-- Drop all existing policies on profiles table to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users on profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users on profiles" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

-- Create new policies with proper naming to avoid conflicts
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role full access for system operations
CREATE POLICY "profiles_service_role_all"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);