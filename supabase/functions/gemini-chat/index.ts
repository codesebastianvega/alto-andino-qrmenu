// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODES = new Set(['concierge', 'event', 'profile']);

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

async function fetchRows(baseUrl: string, anonKey: string, table: string, params: URLSearchParams) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`Catalog query failed: ${table} (${response.status})`);
  return await response.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { prompt, brand_id: brandId, location_id: locationId, mode: requestedMode } = await req.json();
    const mode = MODES.has(requestedMode) ? requestedMode : 'concierge';

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return jsonResponse({ error: 'Missing prompt' }, 400);
    }
    if (typeof brandId !== 'string' || !UUID_PATTERN.test(brandId)) {
      return jsonResponse({ error: 'Invalid brand_id' }, 400);
    }
    if (locationId != null && (typeof locationId !== 'string' || !UUID_PATTERN.test(locationId))) {
      return jsonResponse({ error: 'Invalid location_id' }, 400);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!apiKey || !supabaseUrl || !anonKey) throw new Error('Required environment variables are missing');

    const [brands, products, categories, allergens] = await Promise.all([
      fetchRows(supabaseUrl, anonKey, 'brands', new URLSearchParams({ id: `eq.${brandId}`, select: 'id,name', limit: '1' })),
      fetchRows(supabaseUrl, anonKey, 'products', new URLSearchParams({
        brand_id: `eq.${brandId}`,
        is_active: 'eq.true',
        is_addon: 'eq.false',
        select: 'id,name,description,price,tags,stock_status,category_id',
        order: 'sort_order.asc',
        limit: '100',
      })),
      fetchRows(supabaseUrl, anonKey, 'categories', new URLSearchParams({
        brand_id: `eq.${brandId}`,
        is_active: 'eq.true',
        select: 'id,name',
        limit: '100',
      })),
      fetchRows(supabaseUrl, anonKey, 'allergens', new URLSearchParams({
        brand_id: `eq.${brandId}`,
        select: 'name,type',
        limit: '100',
      })),
    ]);

    if (!brands?.[0]) return jsonResponse({ error: 'Brand not found' }, 404);

    let locationPrices: Array<{ product_id: string; price: number }> = [];
    let locationStatuses: Array<{ product_id: string; is_active: boolean }> = [];
    if (locationId) {
      [locationPrices, locationStatuses] = await Promise.all([
        fetchRows(supabaseUrl, anonKey, 'location_product_prices', new URLSearchParams({
          location_id: `eq.${locationId}`,
          select: 'product_id,price',
        })),
        fetchRows(supabaseUrl, anonKey, 'location_product_status', new URLSearchParams({
          location_id: `eq.${locationId}`,
          select: 'product_id,is_active',
        })),
      ]);
    }

    const priceMap = new Map(locationPrices.map((row) => [row.product_id, row.price]));
    const statusMap = new Map(locationStatuses.map((row) => [row.product_id, row.is_active]));
    const categoryMap = new Map(categories.map((row: { id: string; name: string }) => [row.id, row.name]));
    const availableProducts = products
      .filter((product: { id: string; stock_status?: string }) => statusMap.get(product.id) !== false && product.stock_status !== 'out')
      .map((product: Record<string, unknown>) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: priceMap.get(product.id) ?? product.price,
        category: categoryMap.get(product.category_id) || 'Sin categoría',
        tags: Array.isArray(product.tags) ? product.tags : [],
      }));

    if (availableProducts.length === 0) {
      return jsonResponse({
        reply: 'En este momento no tengo productos disponibles para recomendar.',
        products: [],
        has_enough_information: false,
      });
    }

    const knownAllergens = allergens.map((item: { name: string }) => item.name);
    const catalogContext = JSON.stringify({
      business: brands[0].name,
      products: availableProducts,
      registered_allergen_labels: knownAllergens,
    });
    const systemInstruction = [
      `Eres el asistente gastronómico de ${brands[0].name}.`,
      'Tu única fuente de verdad es CATALOGO_REAL. No uses conocimiento externo ni inventes.',
      'Nunca inventes productos, precios, ingredientes, promociones, disponibilidad o características nutricionales.',
      'Solo recomienda IDs presentes en CATALOGO_REAL. Si falta información, dilo claramente.',
      'No afirmes que un producto es seguro para una alergia. Indica los datos registrados y recomienda confirmar con el restaurante.',
      mode === 'event'
        ? 'Puedes proponer una idea de evento, pero la comida mencionada debe limitarse a productos reales del catálogo.'
        : mode === 'profile'
          ? 'Describe preferencias únicamente a partir de la solicitud actual; no inventes historial del cliente.'
          : 'Ayuda a elegir como máximo tres productos reales y explica brevemente por qué.',
      'Responde en español, de forma breve, amable y comercialmente útil.',
    ].join('\n');

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite';
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{
            role: 'user',
            parts: [{ text: `CATALOGO_REAL:\n${catalogContext}\n\nSOLICITUD:\n${prompt.trim().slice(0, 2000)}` }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                reply: { type: 'STRING' },
                product_ids: { type: 'ARRAY', items: { type: 'STRING' } },
                has_enough_information: { type: 'BOOLEAN' },
              },
              required: ['reply', 'product_ids', 'has_enough_information'],
            },
          },
        }),
      },
    );
    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error('Gemini API request failed', geminiResponse.status, geminiData?.error?.status);
      return jsonResponse({ error: 'Gemini request failed' }, 502);
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();
    const parsed = JSON.parse(rawText || '{}');
    const allowedProductMap = new Map(availableProducts.map((product) => [product.id, product]));
    const validatedIds = Array.isArray(parsed.product_ids)
      ? [...new Set(parsed.product_ids)].filter((id) => allowedProductMap.has(id)).slice(0, 3)
      : [];

    return jsonResponse({
      reply: typeof parsed.reply === 'string' && parsed.reply.trim()
        ? parsed.reply.trim()
        : 'No encontré suficiente información en el menú para responder con precisión.',
      product_ids: validatedIds,
      products: validatedIds.map((id) => allowedProductMap.get(id)),
      has_enough_information: Boolean(parsed.has_enough_information),
    });
  } catch (error) {
    console.error('gemini-chat error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'No fue posible consultar el catálogo con Gemini' }, 500);
  }
});
