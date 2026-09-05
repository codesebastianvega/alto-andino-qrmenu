// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const { brand_id: brandId, location_id: locationId, message, history, draft, features } = await req.json();
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);
    if (!UUID_PATTERN.test(brandId || '') || typeof message !== 'string' || !message.trim()) return jsonResponse({ error: 'Invalid request' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!supabaseUrl || !anonKey || !apiKey) throw new Error('Required environment variables are missing');
    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse({ error: 'Invalid session' }, 401);

    const [{ data: brand }, { data: profile }, locationsRes, categoriesRes, productsRes, ingredientsRes] = await Promise.all([
      supabase.from('brands').select('id,name,owner_id').eq('id', brandId).maybeSingle(),
      supabase.from('profiles').select('id,brand_id,role').eq('id', userData.user.id).maybeSingle(),
      supabase.from('locations').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('is_active', true),
      supabase.from('categories').select('id,name,slug').eq('brand_id', brandId).eq('is_active', true).order('sort_order').limit(100),
      supabase.from('products').select('id,category_id,name,description,price,image_url,recipe_id,is_active').eq('brand_id', brandId).eq('is_addon', false).limit(500),
      supabase.from('ingredients').select('id,name,purchase_price,purchase_quantity,purchase_unit,usage_unit,unit_cost,is_active').eq('brand_id', brandId).eq('is_active', true).limit(500),
    ]);
    if (!brand) return jsonResponse({ error: 'Brand not found' }, 404);
    const allowedRoles = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
    const canManage = brand.owner_id === userData.user.id || profile?.role === 'superadmin' || (profile?.brand_id === brandId && allowedRoles.has(profile?.role));
    if (!canManage) return jsonResponse({ error: 'Forbidden for this brand' }, 403);

    const realContext = {
      brand: { id: brand.id, name: brand.name },
      selected_location_id: UUID_PATTERN.test(locationId || '') ? locationId : null,
      active_locations: locationsRes.count || 0,
      active_categories: categoriesRes.data?.length || 0,
      existing_categories: (categoriesRes.data || []).map((category) => ({ id: category.id, name: category.name })),
      active_products: productsRes.data?.length || 0,
      existing_products: (productsRes.data || []).map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        category_id: product.category_id,
        recipe_id: product.recipe_id,
        is_active: product.is_active,
      })),
      existing_ingredients: (ingredientsRes.data || []).map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        purchase_price: ingredient.purchase_price,
        purchase_quantity: ingredient.purchase_quantity,
        purchase_unit: ingredient.purchase_unit,
        usage_unit: ingredient.usage_unit,
        unit_cost: ingredient.unit_cost,
      })),
      available_tools: ['opening_audit', 'create_location_with_approval', 'create_catalog_with_approval', 'create_costed_product_with_approval', 'consolidate_categories_with_approval', 'update_business_hours_with_approval', 'create_payment_method_with_approval', 'update_printing_settings_with_approval', 'create_modifier_group_with_approval', 'open_admin_module'],
      current_catalog_draft: draft && typeof draft === 'object' ? draft : {},
      enabled_features: { recipes: features?.recipes_enabled === true },
    };
    const safeHistory = Array.isArray(history)
      ? history.slice(-8).filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string').map((item) => ({ role: item.role, content: item.content.slice(0, 600) }))
      : [];
    const systemInstruction = [
      `Eres Aluna, copiloto administrativo de ${brand.name}.`,
      'Responde solo con base en CONTEXTO_REAL y las herramientas disponibles.',
      'No inventes datos del negocio, productos, precios, direcciones, costos ni configuraciones.',
      'No afirmes que ejecutaste cambios. Toda escritura requiere una propuesta visible y aprobación humana posterior.',
      'Nunca digas que una propuesta fue enviada, está procesándose, se registró o se creó: esta función solo conversa y no ejecuta escrituras.',
      'Si quieren crear un plato o producto, usa intent create_catalog y extrae literalmente cualquier dato dado en catalog_draft. Conserva CURRENT_CATALOG_DRAFT; no borres datos previos.',
      'Si el usuario menciona o describe una categoría que ya aparece en existing_categories, usa exactamente su nombre. No propongas crear una variante duplicada.',
      'Antes de decir si un producto existe, compara su nombre con existing_products. No uses intent audit para buscar un producto: audit es exclusivamente para revisar la preparación general del negocio.',
      'Si el producto mencionado ya existe, dilo claramente e indica si tiene recipe_id. No propongas crear otro producto con el mismo nombre.',
      'Si existe y no tiene receta, usa intent create_costed_product. La interfaz mostrará su card real y permitirá crear y vincular la receta sin duplicar el producto.',
      'Para este MVP procesa exactamente un producto por conversación. Si el mensaje contiene una receta, extrae sus ingredientes y cantidades en recipe_draft.',
      'Compara cada ingrediente con existing_ingredients por nombre. Conserva literalmente cantidades y unidades; no inventes precios de compra.',
      'Si el usuario autoriza cantidades aproximadas o sugeridas, toma los ingredientes visibles en la descripción del producto seleccionado y propone cantidades conservadoras para una porción. Marca quantities_are_estimates=true y no vuelvas a pedir la lista.',
      'Cuando recipe_draft tenga al menos un ingrediente, no hagas otra pregunta: confirma en una frase que la propuesta está lista para revisión y devuelve suggested_replies=[].',
      'Para un catálogo necesitas: category_name, product_name, description y price. Tags y requires_kitchen son opcionales.',
      'Si enabled_features.recipes es true y quieren crear un producto o plato, recomienda ingredientes -> receta -> costo por porción -> precio/margen -> producto y usa intent create_costed_product.',
      'La falta de ingredientes, cantidades o costos nunca debe bloquear la creación comercial. Explica brevemente que dentro del flujo podrán elegir crear ahora sin receta/costos y completarlos después. Si piden explícitamente creación rápida usa create_catalog.',
      'Pregunta solamente por el siguiente dato obligatorio faltante. No repitas explicaciones ni listas largas.',
      'Cuando hagas una pregunta o el usuario deba elegir, devuelve 2 a 4 suggested_replies cortas y accionables. Usa únicamente valores u opciones presentes en el mensaje, historial o CONTEXTO_REAL; nunca inventes alternativas. Las suggested_replies sirven para responder datos, no pueden aprobar, crear, guardar, eliminar ni afirmar ejecución. Si la propuesta está completa devuelve [] y deja que la interfaz muestre el botón real de revisión.',
      'Usa intent audit para revisar apertura, create_location para crear sede, create_catalog para creación rápida, create_costed_product para producto con receta/costos, consolidate_catalog para consolidar categorías, update_business_hours para horarios, create_payment_method para pagos, update_printing_settings para impresión, create_modifier_group para extras/modificadores, y general para lo demás.',
      'Si la capacidad aún no existe, dilo claramente. Responde en español, directo y en máximo 45 palabras.',
    ].join('\n');
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: `CONTEXTO_REAL:\n${JSON.stringify(realContext)}\n\nHISTORIAL_RECIENTE:\n${JSON.stringify(safeHistory)}\n\nMENSAJE_ACTUAL:\n${message.trim().slice(0, 12000)}` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              reply: { type: 'STRING' },
              intent: { type: 'STRING', enum: ['audit', 'create_location', 'create_catalog', 'create_costed_product', 'consolidate_catalog', 'update_business_hours', 'create_payment_method', 'update_printing_settings', 'create_modifier_group', 'general'] },
              catalog_draft: {
                type: 'OBJECT',
                properties: {
                  category_name: { type: 'STRING' },
                  product_name: { type: 'STRING' },
                  description: { type: 'STRING' },
                  price: { type: 'NUMBER' },
                  tags: { type: 'ARRAY', items: { type: 'STRING' } },
                  requires_kitchen: { type: 'BOOLEAN' },
                },
                required: ['category_name', 'product_name', 'description', 'price', 'tags', 'requires_kitchen'],
              },
              recipe_draft: {
                type: 'OBJECT',
                properties: {
                  servings: { type: 'NUMBER' },
                  quantities_are_estimates: { type: 'BOOLEAN' },
                  ingredients: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        name: { type: 'STRING' },
                        recipe_quantity: { type: 'NUMBER' },
                        usage_unit: { type: 'STRING' },
                      },
                      required: ['name', 'recipe_quantity', 'usage_unit'],
                    },
                  },
                },
                required: ['servings', 'quantities_are_estimates', 'ingredients'],
              },
              missing_fields: { type: 'ARRAY', items: { type: 'STRING' } },
              suggested_replies: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['reply', 'intent', 'catalog_draft', 'recipe_draft', 'missing_fields', 'suggested_replies'],
          },
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return jsonResponse({ error: 'Gemini request failed' }, 502);
    const rawText = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
    const parsed = JSON.parse(rawText || '{}');
    const allowedIntents = new Set(['audit', 'create_location', 'create_catalog', 'create_costed_product', 'consolidate_catalog', 'update_business_hours', 'create_payment_method', 'update_printing_settings', 'create_modifier_group', 'general']);
    const previousDraft = draft && typeof draft === 'object' ? draft : {};
    const parsedDraft = parsed.catalog_draft && typeof parsed.catalog_draft === 'object' ? parsed.catalog_draft : {};
    const stringValue = (next: unknown, previous: unknown) => typeof next === 'string' && next.trim() ? next.trim() : typeof previous === 'string' ? previous : '';
    const priceValue = Number(parsedDraft.price) > 0 ? Number(parsedDraft.price) : Number(previousDraft.price) > 0 ? Number(previousDraft.price) : 0;
    const catalogDraft = {
      category_name: stringValue(parsedDraft.category_name, previousDraft.category_name),
      product_name: stringValue(parsedDraft.product_name, previousDraft.product_name),
      description: stringValue(parsedDraft.description, previousDraft.description),
      price: priceValue,
      tags: Array.isArray(parsedDraft.tags) && parsedDraft.tags.length ? parsedDraft.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 10) : Array.isArray(previousDraft.tags) ? previousDraft.tags : [],
      requires_kitchen: typeof parsedDraft.requires_kitchen === 'boolean' ? parsedDraft.requires_kitchen : previousDraft.requires_kitchen !== false,
    };
    const requiredDraftFields = ['category_name', 'product_name', 'description', 'price'];
    const missingFields = requiredDraftFields.filter((field) => field === 'price' ? catalogDraft.price <= 0 : !catalogDraft[field as keyof typeof catalogDraft]);
    const suggestedReplies = Array.isArray(parsed.suggested_replies)
      ? [...new Set(parsed.suggested_replies.filter((reply: unknown) => typeof reply === 'string').map((reply: string) => reply.trim()).filter(Boolean))].slice(0, 4)
      : [];
    const normalizeName = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedMessage = normalizeName(message);
    const productMatchedInMessage = (productsRes.data || [])
      .filter((product) => {
        const normalizedProductName = normalizeName(product.name);
        return normalizedProductName.length >= 3 && normalizedMessage.includes(normalizedProductName);
      })
      .sort((left, right) => normalizeName(right.name).length - normalizeName(left.name).length)[0] || null;
    const previousSelectedProductId = typeof previousDraft.existing_product?.id === 'string' ? previousDraft.existing_product.id : null;
    const matchedProduct = productMatchedInMessage || (productsRes.data || []).find((product) => product.id === previousSelectedProductId) || null;
    const matchedCategory = matchedProduct ? (categoriesRes.data || []).find((category) => category.id === matchedProduct.category_id) : null;
    const previousRecipeIngredients = Array.isArray(previousDraft.recipe_draft?.ingredients) ? previousDraft.recipe_draft.ingredients : [];
    const parsedRecipeIngredients = Array.isArray(parsed.recipe_draft?.ingredients) && parsed.recipe_draft.ingredients.length ? parsed.recipe_draft.ingredients.slice(0, 50) : previousRecipeIngredients.slice(0, 50);
    const recipeDraft = {
      servings: Number(parsed.recipe_draft?.servings) > 0 ? Number(parsed.recipe_draft.servings) : 1,
      quantities_are_estimates: parsed.recipe_draft?.quantities_are_estimates === true,
      ingredients: parsedRecipeIngredients.map((item: Record<string, unknown>) => {
        const existing = (ingredientsRes.data || []).find((ingredient) => normalizeName(ingredient.name) === normalizeName(item.name));
        return {
          name: typeof item.name === 'string' ? item.name.trim().slice(0, 120) : '',
          recipe_quantity: Number(item.recipe_quantity) > 0 ? Number(item.recipe_quantity) : 0,
          usage_unit: typeof item.usage_unit === 'string' ? item.usage_unit.trim().slice(0, 40) : '',
          existing_ingredient_id: existing?.id || null,
          purchase_price: existing?.purchase_price || 0,
          purchase_quantity: existing?.purchase_quantity || 0,
          purchase_unit: existing?.purchase_unit || item.usage_unit || '',
          unit_cost: existing?.unit_cost || 0,
        };
      }).filter((item) => item.name),
    };
    return jsonResponse({
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : 'No pude interpretar esa solicitud con suficiente precisión.',
      intent: allowedIntents.has(parsed.intent) ? parsed.intent : 'general',
      catalog_draft: catalogDraft,
      missing_fields: missingFields,
      suggested_replies: suggestedReplies,
      proposal_ready: parsed.intent === 'create_catalog' && missingFields.length === 0,
      matched_product: matchedProduct ? { ...matchedProduct, category_name: matchedCategory?.name || '' } : null,
      recipe_draft: recipeDraft,
      existing_categories: (categoriesRes.data || []).map((category) => ({
        id: category.id,
        name: category.name,
        product_count: (productsRes.data || []).filter((product) => product.category_id === category.id).length,
      })),
    });
  } catch (error) {
    console.error('aluna-agent-chat error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'No fue posible conversar con Aluna' }, 500);
  }
});
