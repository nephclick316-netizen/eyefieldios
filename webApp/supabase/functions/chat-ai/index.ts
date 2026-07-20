import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, userId } = await req.json();
    console.log(`[chat-ai] Received message from ${userId}: ${message}`);

    // Simple but smart response logic for the demo
    // In a production app, you would call an LLM API (OpenAI/Gemini) here
    let reply = "";
    const msg = message.toLowerCase();

    if (msg.includes("hello") || msg.includes("hi")) {
      reply = "Hello! I'm Endocard, your Cascadea AI assistant. I can help you find products, manage your echoes, or just chat. What's on your mind?";
    } else if (msg.includes("product") || msg.includes("shop") || msg.includes("buy")) {
      reply = "You can explore the latest products on the home page! If you're looking for something specific, try the visual search feature—just tap the camera icon in the search bar.";
    } else if (msg.includes("echo") || msg.includes("post")) {
      reply = "Echoes are a great way to share moments. You can post text, images, or even 15-second videos. Just head over to the Echoes tab and tap the '+' button!";
    } else if (msg.includes("who are you") || msg.includes("what is endocard")) {
      reply = "I am Endocard, the intelligent core of the Cascadea Super App. I'm here to make your experience seamless and help you navigate our ecosystem.";
    } else if (msg.includes("help")) {
      reply = "I can assist with: \n1. Navigating the app\n2. Finding products\n3. Explaining features like 'Pulses' and 'Echoes'\n4. General questions\n\nWhat do you need help with?";
    } else {
      reply = "That's interesting! As your AI assistant, I'm constantly learning. Is there something specific about Cascadea you'd like to know more about?";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("[chat-ai] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})