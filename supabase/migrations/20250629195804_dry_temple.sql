/*
  # Fix profiles table RLS policy

  1. Security
    - Enable RLS on profiles table
    - Add policy for authenticated users to insert their own profiles
    - Add policy for authenticated users to read their own profiles
    - Add policy for authenticated users to update their own profiles

  This resolves the "new row violates row-level security policy" error
  by allowing authenticated users to create and manage their own profile records.
*/

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users on profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read their own profile
CREATE POLICY "Enable read for authenticated users on profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Enable update for authenticated users on profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);