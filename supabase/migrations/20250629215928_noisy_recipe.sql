/*
  # Create storage bucket for skill videos

  1. Storage Setup
    - Create 'skill-videos' bucket for video uploads
    - Set up RLS policies for secure access
    - Configure public access for verified videos

  2. Security
    - Users can upload videos for their own skills
    - Public read access for verified videos
    - File size and type restrictions
*/

-- Create storage bucket for skill videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skill-videos',
  'skill-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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