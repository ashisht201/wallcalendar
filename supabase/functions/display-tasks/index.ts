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
    const { accessCode } = body;

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

    // Get the user's stored refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('refresh_token')
      .eq('user_id', displaySession.user_id)
      .maybeSingle();

    if (tokenError) {
      console.error('Token lookup error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to lookup token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData) {
      console.error('No refresh token found for user:', displaySession.user_id);
      return new Response(
        JSON.stringify({ error: 'No Google account linked. Please sign out and sign in again on the primary device.' }),
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

    // Get the default task list
    const taskListsResponse = await fetch(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!taskListsResponse.ok) {
      const errorText = await taskListsResponse.text();
      console.error('Google Tasks API error (lists):', taskListsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch task lists' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskListsData = await taskListsResponse.json();
    const defaultTaskListId = taskListsData.items?.[0]?.id;

    if (!defaultTaskListId) {
      return new Response(
        JSON.stringify({ tasks: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch tasks from the default list
    const tasksResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${defaultTaskListId}/tasks?showCompleted=true&maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!tasksResponse.ok) {
      const errorText = await tasksResponse.text();
      console.error('Google Tasks API error:', tasksResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tasksData = await tasksResponse.json();

    // Transform tasks to a simpler format
    const tasks = (tasksData.items || []).map((task: any) => ({
      id: task.id,
      title: task.title || 'Untitled Task',
      notes: task.notes,
      status: task.status,
      due: task.due,
      completed: task.status === 'completed',
    }));

    console.log(`Display ${accessCode}: Fetched ${tasks.length} tasks`);

    return new Response(
      JSON.stringify({ tasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in display-tasks function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
