import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateInsightsRequest {
  profileId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const { profileId }: GenerateInsightsRequest = await req.json()

    if (!profileId) {
      throw new Error('Profile ID is required')
    }

    // Fetch user's skills
    const { data: skills, error: skillsError } = await supabaseClient
      .from('skills')
      .select('*')
      .eq('profile_id', profileId)

    if (skillsError) {
      throw new Error(`Failed to fetch skills: ${skillsError.message}`)
    }

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    // Return empty insights array - no mock data
    const insights = []

    return new Response(
      JSON.stringify({ insights }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})