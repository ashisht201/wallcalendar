const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // WAQI public API - using demo token for basic access
    // For production, get a free token from https://aqicn.org/data-platform/token/
    const WAQI_TOKEN = Deno.env.get('WAQI_API_TOKEN') || 'demo';
    
    // Juhu, Mumbai coordinates
    const lat = 19.0969;
    const lng = 72.8265;
    
    console.log('Fetching AQI data for Juhu, Mumbai...');
    
    // Try geo-based search first for nearest station
    const geoResponse = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${WAQI_TOKEN}`
    );
    
    const geoData = await geoResponse.json();
    console.log('WAQI response:', JSON.stringify(geoData));
    
    if (geoData.status === 'ok' && geoData.data) {
      const aqi = geoData.data.aqi;
      const station = geoData.data.city?.name || 'Mumbai';
      const time = geoData.data.time?.s || new Date().toISOString();
      
      return new Response(
        JSON.stringify({
          success: true,
          aqi: typeof aqi === 'number' ? aqi : parseInt(aqi) || null,
          station,
          time,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fallback to Mumbai search
    const fallbackResponse = await fetch(
      `https://api.waqi.info/feed/mumbai/?token=${WAQI_TOKEN}`
    );
    
    const fallbackData = await fallbackResponse.json();
    console.log('Fallback WAQI response:', JSON.stringify(fallbackData));
    
    if (fallbackData.status === 'ok' && fallbackData.data) {
      const aqi = fallbackData.data.aqi;
      const station = fallbackData.data.city?.name || 'Mumbai';
      
      return new Response(
        JSON.stringify({
          success: true,
          aqi: typeof aqi === 'number' ? aqi : parseInt(aqi) || null,
          station,
          time: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Unable to fetch AQI data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Error fetching AQI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
