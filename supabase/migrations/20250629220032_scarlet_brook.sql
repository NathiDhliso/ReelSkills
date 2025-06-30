/*
  # Storage Setup for Skill Videos

  1. Storage Bucket
    - Creates `skill-videos` bucket for video uploads
    - 100MB file size limit
    - Supports common video formats

  2. Security Policies
    - Users can upload videos for their own skills
    - Users can view their own videos
    - Public can view verified skill videos
    - Users can manage their own video files

  Note: RLS and policies are managed through Supabase's storage system
*/

-- Create storage bucket for skill videos (only if it doesn't exist)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  SELECT 
    'skill-videos',
    'skill-videos',
    true,
    104857600, -- 100MB limit
    ARRAY['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'skill-videos'
  );
EXCEPTION
  WHEN others THEN
    -- Bucket might already exist, continue
    NULL;
END $$;

-- Update skills table to better support video storage
DO $$
BEGIN
  -- Add storage_path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'skills' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE skills ADD COLUMN storage_path text;
  END IF;

  -- Add video_file_size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'skills' AND column_name = 'video_file_size'
  ) THEN
    ALTER TABLE skills ADD COLUMN video_file_size bigint;
  END IF;

  -- Add video_duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'skills' AND column_name = 'video_duration'
  ) THEN
    ALTER TABLE skills ADD COLUMN video_duration integer; -- duration in seconds
  END IF;
END $$;

-- Create function to generate storage path for skills
CREATE OR REPLACE FUNCTION generate_skill_video_path(skill_id uuid, file_extension text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'skills/' || skill_id::text || '/video.' || file_extension;
END;
$$;

-- Create function to check if user owns skill
CREATE OR REPLACE FUNCTION user_owns_skill(skill_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM skills s
    JOIN profiles p ON s.profile_id = p.id
    WHERE s.id = skill_id AND p.user_id = user_owns_skill.user_id
  );
END;
$$;

-- Create function to check if skill video is verified
CREATE OR REPLACE FUNCTION skill_video_is_verified(skill_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM skills
    WHERE id = skill_id AND video_verified = true
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Note: Storage policies will be created through the Supabase dashboard or via the management API
-- This is because direct SQL access to storage.objects policies requires superuser privileges

-- Create a view for easier video management
CREATE OR REPLACE VIEW skill_videos AS
SELECT 
  s.id as skill_id,
  s.name as skill_name,
  s.video_demo_url,
  s.storage_path,
  s.video_file_size,
  s.video_duration,
  s.video_verified,
  s.video_uploaded_at,
  p.user_id,
  p.first_name,
  p.last_name
FROM skills s
JOIN profiles p ON s.profile_id = p.id
WHERE s.storage_path IS NOT NULL OR s.video_demo_url IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON skill_videos TO authenticated;

-- Create RLS policy for the view
ALTER VIEW skill_videos SET (security_barrier = true);

-- Create policy for skill_videos view access
CREATE POLICY "Users can view own skill videos via view" ON skills
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = skills.profile_id AND p.user_id = auth.uid()
  )
);

-- Create policy for public verified videos
CREATE POLICY "Public can view verified skill videos via view" ON skills
FOR SELECT TO anon, authenticated
USING (video_verified = true);