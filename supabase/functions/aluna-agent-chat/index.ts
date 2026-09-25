// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const LIMITS_BY_PLAN: Record<string, number> = {
  plan_emprendedor: 30,
  plan_esencial: 100,
  plan_profesional: 300,
  plan_premium: 1000,
};

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

    const [{ data: brand }, { data: profile }, locationsRes, categoriesRes, productsRes, ingredientsRes, settingsRes, locationRes] = await Promise.all([
      supabase.from('brands').select('id,name,owner_id,plan_id,ai_generations_used,whatsapp').eq('id', brandId).maybeSingle(),
      supabase.from('profiles').select('id,brand_id,role').eq('id', userData.user.id).maybeSingle(),
      supabase.from('locations').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('is_active', true),
      supabase.from('categories').select('id,name,slug').eq('brand_id', brandId).eq('is_active', true).order('sort_order').limit(100),
      supabase.from('products').select('id,category_id,name,price,recipe_id,is_active').eq('brand_id', brandId).eq('is_addon', false).limit(300),
      supabase.from('ingredients').select('id,name,purchase_price,purchase_quantity,purchase_unit,usage_unit,unit_cost,is_active').eq('brand_id', brandId).eq('is_active', true).limit(100),
      supabase.from('restaurant_settings').select('whatsapp_number_orders,support_phone,is_service_fee_enabled,service_fee_percentage,primary_color').eq('brand_id', brandId).is('location_id', null).maybeSingle(),
      locationId && UUID_PATTERN.test(locationId)
        ? supabase.from('locations').select('id,name,delivery_fee,delivery_radius_km').eq('id', locationId).maybeSingle()
        : supabase.from('locations').select('id,name,delivery_fee,delivery_radius_km').eq('brand_id', brandId).eq('is_main', true).maybeSingle(),
    ]);
    if (!brand) return jsonResponse({ error: 'Brand not found' }, 404);
    const allowedRoles = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
    const canManage = brand.owner_id === userData.user.id || profile?.role === 'superadmin' || (profile?.brand_id === brandId && allowedRoles.has(profile?.role));
    if (!canManage) return jsonResponse({ error: 'Forbidden for this brand' }, 403);

    // ─── Quota & Usage Check (Sprint 3) ───
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: monthlyUsageCount } = await supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .gte('created_at', firstDayOfMonth);

    const currentUsage = monthlyUsageCount || 0;
    const planId = brand.plan_id || 'plan_esencial';
    const monthlyLimit = LIMITS_BY_PLAN[planId] || 100;

    if (currentUsage >= monthlyLimit) {
      return jsonResponse({
        reply: `Has alcanzado el límite mensual de consultas de IA para tu ${brand.name} (${currentUsage}/${monthlyLimit}). Para continuar usando Aluna con todas sus funciones agénticas, actualiza tu plan en Ajustes > Planes.`,
        intent: 'general',
        quota_exceeded: true,
        current_usage: currentUsage,
        monthly_limit: monthlyLimit,
        suggested_replies: ['Ver planes disponibles', 'Cerrar'],
      });
    }

    // ─── Match product locally without bloating the Gemini prompt ───
    const normalizeName = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedMessage = normalizeName(message);
    const productMatchedInMessage = (productsRes.data || [])
      .filter((product) => {
        const normalizedProductName = normalizeName(product.name);
        return normalizedProductName.length >= 3 && normalizedMessage.includes(normalizedProductName);
      })
      .sort((left, right) => normalizeName(right.name).length - normalizeName(left.name).length)[0] || null;

    const previousDraft = draft && typeof draft === 'object' ? draft : {};
    const previousSelectedProductId = typeof previousDraft.existing_product?.id === 'string' ? previousDraft.existing_product.id : null;
    const matchedProduct = productMatchedInMessage || (productsRes.data || []).find((product) => product.id === previousSelectedProductId) || null;
    const matchedCategory = matchedProduct ? (categoriesRes.data || []).find((category) => category.id === matchedProduct.category_id) : null;

    // ─── Compact Context (Sprint 3: ~90% token reduction) ───
    const realContext = {
      brand: { id: brand.id, name: brand.name },
      selected_location_id: UUID_PATTERN.test(locationId || '') ? locationId : null,
      active_locations: locationsRes.count || 0,
      active_categories: categoriesRes.data?.length || 0,
      existing_categories: (categoriesRes.data || []).map((category) => ({
        id: category.id,
        name: category.name,
        product_count: (productsRes.data || []).filter((product) => product.category_id === category.id).length,
      })),
      total_products: productsRes.data?.length || 0,
      sample_products: (productsRes.data || []).slice(0, 30).map((product) => product.name),
      matched_product: matchedProduct ? {
        id: matchedProduct.id,
        name: matchedProduct.name,
        price: matchedProduct.price,
        category_name: matchedCategory?.name || '',
        has_recipe: Boolean(matchedProduct.recipe_id),
      } : null,
      total_ingredients: ingredientsRes.data?.length || 0,
      sample_ingredients: (ingredientsRes.data || []).slice(0, 25).map((ingredient) => ({
        name: ingredient.name,
        unit_cost: ingredient.unit_cost,
        usage_unit: ingredient.usage_unit,
      })),
      delivery_settings: locationRes?.data ? {
        delivery_fee: locationRes.data.delivery_fee,
        delivery_radius_km: locationRes.data.delivery_radius_km,
      } : null,
      restaurant_settings: settingsRes?.data ? {
        whatsapp_number_orders: settingsRes.data.whatsapp_number_orders || brand.whatsapp || null,
        support_phone: settingsRes.data.support_phone,
        is_service_fee_enabled: settingsRes.data.is_service_fee_enabled,
        service_fee_percentage: settingsRes.data.service_fee_percentage,
        primary_color: settingsRes.data.primary_color,
      } : null,
      available_tools: [
        'opening_audit', 'create_location_with_approval', 'create_catalog_with_approval',
        'create_costed_product_with_approval', 'consolidate_categories_with_approval',
        'update_business_hours_with_approval', 'create_payment_method_with_approval',
        'update_printing_settings_with_approval', 'create_modifier_group_with_approval',
        'update_delivery_settings_with_approval', 'update_support_whatsapp_with_approval',
        'update_service_fee_with_approval', 'update_web_content_with_approval',
        'update_branding_with_approval', 'batch_stock_entry_with_approval',
        'generate_shopping_list', 'open_admin_module'
      ],
      current_catalog_draft: previousDraft,
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
      'Antes de decir si un producto existe, revisa si coincide con matched_product o sample_products. No uses intent audit para buscar un producto.',
      'Si el producto mencionado ya existe, dilo claramente e indica si tiene receta. No propongas crear otro producto con el mismo nombre.',
      'Si existe y no tiene receta, usa intent create_costed_product. La interfaz mostrará su card real y permitirá crear y vincular la receta sin duplicar el producto.',
      'Para este MVP procesa exactamente un producto por conversación. Si el mensaje contiene una receta, extrae sus ingredientes y cantidades en recipe_draft.',
      'Si el usuario autoriza cantidades aproximadas o sugeridas, propone cantidades conservadoras para una porción. Marca quantities_are_estimates=true y no vuelvas a pedir la lista.',
      'Cuando recipe_draft tenga al menos un ingrediente, no hagas otra pregunta: confirma en una frase que la propuesta está lista para revisión y devuelve suggested_replies=[].',
      'Para un catálogo necesitas: category_name, product_name, description y price. Tags y requires_kitchen son opcionales.',
      'Si enabled_features.recipes es true y quieren crear un producto o plato, recomienda ingredientes -> receta -> costo por porción -> precio/margen -> producto y usa intent create_costed_product.',
      'La falta de ingredientes, cantidades o costos nunca debe bloquear la creación comercial. Explica brevemente que dentro del flujo podrán elegir crear ahora sin receta/costos y completarlos después. Si piden explícitamente creación rápida usa create_catalog.',
      'Pregunta solamente por el siguiente dato obligatorio faltante. No repitas explicaciones ni listas largas.',
      'Cuando hagas una pregunta o el usuario deba elegir, devuelve 2 a 4 suggested_replies cortas y accionables. Usa únicamente valores u opciones presentes en el mensaje, historial o CONTEXTO_REAL; nunca inventes alternativas.',
      'Usa intent audit para revisar apertura, create_location para crear sede, create_catalog para creación rápida, create_costed_product para producto con receta/costos, consolidate_catalog para consolidar categorías, update_business_hours para horarios, create_payment_method para pagos, update_printing_settings para impresión, create_modifier_group para extras/modificadores, update_delivery_settings para tarifas y cobertura de domicilios, update_support_whatsapp para WhatsApp y soporte, update_service_fee para propina o servicio sugerido, update_web_content para textos de portada y web, update_branding para color principal y logos, batch_stock_entry para registrar entrada de compras o insumos, generate_shopping_list para lista de compras del mercado, y general para lo demás.',
      'Si el usuario pide cambiar domicilio, tarifa, radio o cobertura, usa intent update_delivery_settings y extrae los números en operations_draft.',
      'Si el usuario pide cambiar WhatsApp de pedidos o soporte, usa intent update_support_whatsapp y extrae el número en operations_draft.',
      'Si el usuario pide activar o ajustar propina o porcentaje de servicio, usa intent update_service_fee y extrae en operations_draft.',
      'Si el usuario pide cambiar textos web o portada, usa intent update_web_content y extrae en web_draft.',
      'Si el usuario pide cambiar color principal de marca o logo, usa intent update_branding y extrae en web_draft.',
      'Si el usuario reporta que compró insumos o que llegaron compras (ej. llegaron 10 kg de arroz, 5 kg de carne), usa intent batch_stock_entry y extrae los insumos en inventory_draft.entries.',
      'Si el usuario pide qué hay que comprar, lista de mercado o insumos bajos de stock, usa intent generate_shopping_list.',
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
              intent: {
                type: 'STRING',
                enum: [
                  'audit', 'create_location', 'create_catalog', 'create_costed_product',
                  'consolidate_catalog', 'update_business_hours', 'create_payment_method',
                  'update_printing_settings', 'create_modifier_group',
                  'update_delivery_settings', 'update_support_whatsapp', 'update_service_fee',
                  'update_web_content', 'update_branding', 'batch_stock_entry',
                  'generate_shopping_list', 'general'
                ]
              },
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
              },
              operations_draft: {
                type: 'OBJECT',
                properties: {
                  delivery_fee: { type: 'NUMBER' },
                  delivery_radius_km: { type: 'NUMBER' },
                  whatsapp_number_orders: { type: 'STRING' },
                  support_phone: { type: 'STRING' },
                  service_fee_percentage: { type: 'NUMBER' },
                  is_service_fee_enabled: { type: 'BOOLEAN' },
                },
              },
              web_draft: {
                type: 'OBJECT',
                properties: {
                  hero_h1: { type: 'STRING' },
                  hero_subtitle: { type: 'STRING' },
                  menu_banner_title: { type: 'STRING' },
                  menu_banner_subtitle: { type: 'STRING' },
                  primary_color: { type: 'STRING' },
                },
              },
              inventory_draft: {
                type: 'OBJECT',
                properties: {
                  entries: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        ingredient_name: { type: 'STRING' },
                        quantity_added: { type: 'NUMBER' },
                        unit_cost: { type: 'NUMBER' },
                      },
                      required: ['ingredient_name', 'quantity_added'],
                    },
                  },
                },
              },
              missing_fields: { type: 'ARRAY', items: { type: 'STRING' } },
              suggested_replies: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['reply', 'intent'],
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) return jsonResponse({ error: 'Gemini request failed' }, 502);
    const rawText = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
    const parsed = JSON.parse(rawText || '{}');
    const allowedIntents = new Set([
      'audit', 'create_location', 'create_catalog', 'create_costed_product',
      'consolidate_catalog', 'update_business_hours', 'create_payment_method',
      'update_printing_settings', 'create_modifier_group',
      'update_delivery_settings', 'update_support_whatsapp', 'update_service_fee',
      'update_web_content', 'update_branding', 'batch_stock_entry',
      'generate_shopping_list', 'general'
    ]);
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

    // ─── Record AI Token Usage in ai_usage_logs (Sprint 3) ───
    try {
      const usageMeta = data?.usageMetadata || {};
      const promptTokens = usageMeta.promptTokenCount || 0;
      const responseTokens = usageMeta.candidatesTokenCount || 0;

      await supabase.from('ai_usage_logs').insert({
        brand_id: brandId,
        user_id: userData.user.id,
        prompt_tokens: promptTokens,
        response_tokens: responseTokens,
        model: model,
        intent: parsed.intent || 'general',
      });

      if (brand.ai_generations_used !== undefined) {
        await supabase
          .from('brands')
          .update({ ai_generations_used: (brand.ai_generations_used || 0) + 1 })
          .eq('id', brandId);
      }
    } catch (logErr) {
      console.warn('Failed to log AI usage:', logErr);
    }

    return jsonResponse({
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : 'No pude interpretar esa solicitud con suficiente precisión.',
      intent: allowedIntents.has(parsed.intent) ? parsed.intent : 'general',
      catalog_draft: catalogDraft,
      operations_draft: parsed.operations_draft && typeof parsed.operations_draft === 'object' ? parsed.operations_draft : null,
      web_draft: parsed.web_draft && typeof parsed.web_draft === 'object' ? parsed.web_draft : null,
      inventory_draft: parsed.inventory_draft && typeof parsed.inventory_draft === 'object' ? parsed.inventory_draft : null,
      current_delivery_fee: locationRes?.data?.delivery_fee ?? null,
      current_delivery_radius: locationRes?.data?.delivery_radius_km ?? null,
      current_whatsapp: settingsRes?.data?.whatsapp_number_orders || brand.whatsapp || null,
      current_service_fee: settingsRes?.data?.service_fee_percentage ?? null,
      current_service_fee_enabled: settingsRes?.data?.is_service_fee_enabled ?? null,
      current_primary_color: settingsRes?.data?.primary_color || null,
      missing_fields: missingFields,
      suggested_replies: suggestedReplies,
      proposal_ready: (parsed.intent === 'create_catalog' && missingFields.length === 0)
        || ['update_delivery_settings', 'update_support_whatsapp', 'update_service_fee', 'update_web_content', 'update_branding', 'batch_stock_entry', 'generate_shopping_list'].includes(parsed.intent),
      matched_product: matchedProduct ? { ...matchedProduct, category_name: matchedCategory?.name || '' } : null,
      recipe_draft: recipeDraft,
      current_usage: currentUsage + 1,
      monthly_limit: monthlyLimit,
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
