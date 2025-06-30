/*
  # Fix NULL email values in profiles table

  1. Data Cleanup
    - Update any profiles with NULL email using data from auth.users
    - Handle edge cases where auth.users might not have email
    
  2. Schema Updates
    - Safely add NOT NULL constraint to email column
    - Add unique constraint on email column
    
  3. Safety Measures
    - Use conditional logic to avoid errors on re-run
    - Preserve existing data integrity
*/

-- First, ensure the email column exists (in case previous migration didn't complete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Update profiles with NULL email by getting email from auth.users
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id 
  AND profiles.email IS NULL 
  AND auth.users.email IS NOT NULL;

-- For any remaining NULL emails (edge case), set a placeholder that can be updated later
UPDATE profiles 
SET email = 'user-' || id || '@placeholder.local'
WHERE email IS NULL;

-- Now safely add the NOT NULL constraint
DO $$
BEGIN
  -- Check if the column allows NULL values
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' 
      AND column_name = 'email' 
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
  END IF;
END $$;

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