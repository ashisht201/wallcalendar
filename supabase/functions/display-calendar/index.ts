import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { accessCode, timeMin, timeMax } = body;

    if (!accessCode) {
      console.error('No access code provided');
      return new Response(
        JSON.stringify({ error: 'Access code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the display session by access code
    const { data: displaySession, error: sessionError } = await supabase
      .from('display_sessions')
      .select('id, user_id, is_active')
      .eq('access_code', accessCode.toUpperCase())
      .single();

    if (sessionError || !displaySession) {
      console.error('Display session lookup error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid access code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!displaySession.is_active) {
      return new Response(
        JSON.stringify({ error: 'This display has been deactivated' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last accessed timestamp
    await supabase
      .from('display_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', displaySession.id);

    // Get the user's stored refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('refresh_token')
      .eq('user_id', displaySession.user_id)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token lookup error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'No Google account linked. Please sign in on the primary device.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the refresh token to get a fresh access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to refresh Google token. Please re-authenticate on primary device.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenResult = await tokenResponse.json();
    const accessToken = tokenResult.access_token;

    // Fetch Google Calendar events
    const calendarTimeMin = timeMin || new Date().toISOString();
    const calendarTimeMax = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(calendarTimeMin)}&` +
      `timeMax=${encodeURIComponent(calendarTimeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', calendarResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch calendar events' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const calendarData = await calendarResponse.json();

    // Transform events to a simpler format
    const events = (calendarData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      colorId: event.colorId,
    }));

    console.log(`Display ${accessCode}: Fetched ${events.length} calendar events`);

    return new Response(
      JSON.stringify({ events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in display-calendar function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
