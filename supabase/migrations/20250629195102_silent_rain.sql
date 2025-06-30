/*
  # Add email column to profiles table

  1. Changes
    - Add `email` column to `profiles` table
    - Set column as NOT NULL with unique constraint
    - Update existing profiles to use auth.users email if available

  2. Security
    - No RLS changes needed as table already has proper policies
*/

-- Add email column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Update existing profiles with email from auth.users if they don't have one
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- Make email column NOT NULL and add unique constraint
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_email_key' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;