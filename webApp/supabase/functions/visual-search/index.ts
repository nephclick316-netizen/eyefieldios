import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = "AIzaSyBzUDDX0-ZtupJzDZvk11wIhJcFNwRZxko";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[visual-search] Received request");
    
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Google Vision API
    console.log("[visual-search] Calling Google Vision API");
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'WEB_DETECTION', maxResults: 10 }
              ],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    console.log("[visual-search] Vision API response received");

    if (visionData.error) {
      throw new Error(visionData.error.message);
    }

    const annotations = visionData.responses[0];
    const labels = annotations.labelAnnotations?.map((l: any) => l.description) || [];
    const webEntities = annotations.webDetection?.webEntities
      ?.filter((e: any) => e.description)
      .map((e: any) => e.description) || [];

    // Combine and deduplicate keywords
    const keywords = Array.from(new Set([...labels, ...webEntities]));

    return new Response(JSON.stringify({ keywords }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("[visual-search] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})