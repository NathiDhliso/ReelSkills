import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UploadVideoRequest {
  skillId: string;
  skillName: string;
  file: File;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const skillId = formData.get('skillId') as string
    const skillName = formData.get('skillName') as string

    if (!file || !skillId || !skillName) {
      throw new Error('Missing required fields: file, skillId, or skillName')
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      throw new Error('File must be a video')
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size must be less than 100MB')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'mp4'
    const fileName = `skill-videos/${skillId}/${timestamp}.${fileExtension}`

    // Convert File to ArrayBuffer for Supabase Storage
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('skill-videos')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('skill-videos')
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // Update skill record with video URL
    const { error: updateError } = await supabaseClient
      .from('skills')
      .update({
        video_demo_url: urlData.publicUrl,
        video_uploaded_at: new Date().toISOString()
      })
      .eq('id', skillId)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Don't throw here - the upload succeeded, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl: urlData.publicUrl,
        fileName: fileName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Upload function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Upload failed',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})