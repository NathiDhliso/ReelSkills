/*
  # Storage bucket and policies for skill videos

  1. Storage Setup
    - Create skill-videos bucket if it doesn't exist
    - Configure bucket settings for video uploads
  
  2. Security Policies
    - Users can upload videos for their own skills
    - Users can view their own uploaded videos
    - Public can view verified skill videos
    - Users can update/delete their own skill videos
*/

-- Create storage bucket for skill videos (only if it doesn't exist)
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

-- Enable RLS on storage.objects (safe to run multiple times)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload skill videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own skill videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view verified skill videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own skill videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own skill videos" ON storage.objects;

-- Policy: Users can upload videos for their own skills
CREATE POLICY "Users can upload skill videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'skill-videos' AND
  EXISTS (
    SELECT 1 FROM skills s
    JOIN profiles p ON s.profile_id = p.id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Policy: Users can view their own uploaded videos
CREATE POLICY "Users can view own skill videos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'skill-videos' AND
  EXISTS (
    SELECT 1 FROM skills s
    JOIN profiles p ON s.profile_id = p.id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Policy: Public can view verified skill videos
CREATE POLICY "Public can view verified skill videos" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'skill-videos' AND
  EXISTS (
    SELECT 1 FROM skills s
    WHERE s.video_verified = true
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Policy: Users can update their own skill videos
CREATE POLICY "Users can update own skill videos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'skill-videos' AND
  EXISTS (
    SELECT 1 FROM skills s
    JOIN profiles p ON s.profile_id = p.id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Policy: Users can delete their own skill videos
CREATE POLICY "Users can delete own skill videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'skill-videos' AND
  EXISTS (
    SELECT 1 FROM skills s
    JOIN profiles p ON s.profile_id = p.id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[2] = s.id::text
  )
);