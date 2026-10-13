// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set in environment variables');
    }

    const requestedModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const modelsToTry = [requestedModel, 'gemini-1.5-flash'];
    let geminiResponse: Response | null = null;
    let geminiError: unknown = null;

    for (const currentModel of modelsToTry) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt.trim().slice(0, 12000) }]
            }]
          })
        });
        if (res.ok) {
          geminiResponse = res;
          break;
        } else {
          geminiError = await res.text();
        }
      } catch (err) {
        geminiError = err;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      console.error('Gemini API Error:', geminiError);
      throw new Error('Error generating content with Gemini: ' + String(geminiError));
    }

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(data.error?.message || 'Error generating content with Gemini');
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
