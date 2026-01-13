import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's Google OAuth token from identities
    const googleIdentity = user.identities?.find(
      (identity) => identity.provider === 'google'
    );

    if (!googleIdentity) {
      return new Response(
        JSON.stringify({ error: 'No Google account linked', needsAuth: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const accessToken = body.providerToken;
    const action = body.action || 'list'; // 'list', 'complete', 'uncomplete', 'create'
    
    if (!accessToken) {
      console.error('No provider token in request body');
      return new Response(
        JSON.stringify({ error: 'No Google access token available. Please sign in again.', needsAuth: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, get the default task list
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
      
      if (taskListsResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Google token expired. Please sign in again.', needsAuth: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch task lists. Make sure Google Tasks API is enabled.' }),
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

    // Handle different actions
    if (action === 'complete' || action === 'uncomplete') {
      const taskId = body.taskId;
      if (!taskId) {
        return new Response(
          JSON.stringify({ error: 'Task ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateResponse = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${defaultTaskListId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: action === 'complete' ? 'completed' : 'needsAction',
            completed: action === 'complete' ? new Date().toISOString() : null,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update task:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to update task' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updatedTask = await updateResponse.json();
      return new Response(
        JSON.stringify({ task: updatedTask, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      const title = body.title;
      if (!title) {
        return new Response(
          JSON.stringify({ error: 'Task title required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const createResponse = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${defaultTaskListId}/tasks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            status: 'needsAction',
          }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Failed to create task:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create task' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newTask = await createResponse.json();
      return new Response(
        JSON.stringify({ task: newTask, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default action: list tasks
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
      status: task.status, // 'needsAction' or 'completed'
      due: task.due,
      completed: task.status === 'completed',
    }));

    console.log(`Fetched ${tasks.length} tasks for user ${user.id}`);

    return new Response(
      JSON.stringify({ tasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-tasks function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
