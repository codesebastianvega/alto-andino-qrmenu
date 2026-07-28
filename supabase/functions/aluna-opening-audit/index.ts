// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

type Finding = {
  key: string;
  label: string;
  status: 'ready' | 'warning' | 'blocked';
  severity: 'low' | 'medium' | 'high';
  message: string;
  evidence: Record<string, unknown>;
  suggested_action?: string;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const authorization = req.headers.get('Authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);

    const { brand_id: brandId, location_id: locationId } = await req.json();
    if (typeof brandId !== 'string' || !UUID_PATTERN.test(brandId)) {
      return jsonResponse({ error: 'Invalid brand_id' }, 400);
    }
    if (locationId != null && (typeof locationId !== 'string' || !UUID_PATTERN.test(locationId))) {
      return jsonResponse({ error: 'Invalid location_id' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) throw new Error('Supabase environment is incomplete');

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse({ error: 'Invalid session' }, 401);

    const [{ data: brand, error: brandError }, { data: profile, error: profileError }] = await Promise.all([
      supabase.from('brands').select('*').eq('id', brandId).maybeSingle(),
      supabase.from('profiles').select('id,brand_id,role').eq('id', userData.user.id).maybeSingle(),
    ]);
    if (brandError) throw brandError;
    if (profileError) throw profileError;
    if (!brand) return jsonResponse({ error: 'Brand not found' }, 404);

    const allowedRoles = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
    const canManage = brand.owner_id === userData.user.id
      || profile?.role === 'superadmin'
      || (profile?.brand_id === brandId && allowedRoles.has(profile?.role));
    if (!canManage) return jsonResponse({ error: 'Forbidden for this brand' }, 403);

    if (locationId) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id,brand_id,name,is_active')
        .eq('id', locationId)
        .eq('brand_id', brandId)
        .maybeSingle();
      if (locationError) throw locationError;
      if (!location) return jsonResponse({ error: 'Location does not belong to this brand' }, 400);
    }

    const brandQuery = <T>(table: string) => supabase.from(table).select('*').eq('brand_id', brandId) as T;
    const [
      settingsRes,
      locationsRes,
      hoursRes,
      categoriesRes,
      productsRes,
      recipesRes,
      modifiersRes,
      paymentsRes,
      homeRes,
    ] = await Promise.all([
      supabase.from('restaurant_settings').select('*').eq('brand_id', brandId),
      supabase.from('locations').select('*').eq('brand_id', brandId).eq('is_active', true),
      supabase.from('business_hours').select('*').eq('brand_id', brandId),
      supabase.from('categories').select('*').eq('brand_id', brandId).eq('is_active', true),
      supabase.from('products').select('id,name,description,price,image_url,tags,recipe_id,is_active,is_addon,stock_status,category_id').eq('brand_id', brandId).eq('is_active', true),
      brandQuery<any>('recipes'),
      brandQuery<any>('modifier_groups'),
      brandQuery<any>('payment_methods'),
      supabase.from('home_settings').select('*').eq('brand_id', brandId).limit(1),
    ]);

    const queryErrors = [settingsRes, locationsRes, hoursRes, categoriesRes, productsRes, recipesRes, modifiersRes, paymentsRes, homeRes]
      .map((result: { error?: { message?: string } | null }) => result.error?.message)
      .filter(Boolean);
    if (queryErrors.length > 0) {
      console.error('Opening audit query errors', queryErrors);
      return jsonResponse({ error: 'Could not read all opening data', details: queryErrors }, 500);
    }

    const settings = settingsRes.data?.find((row: Record<string, unknown>) => row.location_id == null)
      || settingsRes.data?.[0]
      || null;
    const locations = locationsRes.data || [];
    const relevantLocationIds = locationId ? [locationId] : locations.map((row: { id: string }) => row.id);
    const hours = (hoursRes.data || []).filter((row: Record<string, unknown>) =>
      row.location_id == null || relevantLocationIds.includes(row.location_id as string)
    );
    const categories = categoriesRes.data || [];
    const products = (productsRes.data || []).filter((product: Record<string, unknown>) => product.is_addon !== true);
    const activeProducts = products.filter((product: Record<string, unknown>) => product.stock_status !== 'out');
    const recipes = recipesRes.data || [];
    const modifiers = modifiersRes.data || [];
    const payments = paymentsRes.data || [];
    const home = homeRes.data?.[0] || null;

    const missingImages = products.filter((product: Record<string, unknown>) => !product.image_url).length;
    const missingDescriptions = products.filter((product: Record<string, unknown>) => !String(product.description || '').trim()).length;
    const invalidPrices = products.filter((product: Record<string, unknown>) => Number(product.price || 0) <= 0).length;
    const missingRecipes = products.filter((product: Record<string, unknown>) => !product.recipe_id).length;
    const missingTags = products.filter((product: Record<string, unknown>) => !Array.isArray(product.tags) || product.tags.length === 0).length;
    const activePayments = payments.filter((method: Record<string, unknown>) => method.is_active !== false);

    const findings: Finding[] = [
      {
        key: 'business_identity',
        label: 'Identidad comercial',
        status: brand.name && (settings?.logo_url || brand.logo_url) ? 'ready' : 'warning',
        severity: 'medium',
        message: brand.name && (settings?.logo_url || brand.logo_url)
          ? 'Nombre y logotipo configurados.'
          : 'Falta completar el nombre o el logotipo del negocio.',
        evidence: { business_name: settings?.business_name || brand.name || null, has_logo: Boolean(settings?.logo_url || brand.logo_url) },
        suggested_action: 'Completar Identidad Visual.',
      },
      {
        key: 'locations',
        label: 'Sedes activas',
        status: locations.length > 0 ? 'ready' : 'blocked',
        severity: 'high',
        message: locations.length > 0 ? `${locations.length} sede(s) activa(s).` : 'No hay sedes activas.',
        evidence: { active_locations: locations.length },
        suggested_action: 'Crear y activar al menos una sede.',
      },
      {
        key: 'business_hours',
        label: 'Horarios',
        status: hours.length > 0 ? 'ready' : 'warning',
        severity: 'medium',
        message: hours.length > 0 ? 'Hay horarios configurados.' : 'No hay horarios configurados para el alcance seleccionado.',
        evidence: { configured_rows: hours.length },
        suggested_action: 'Configurar horarios de atención.',
      },
      {
        key: 'catalog',
        label: 'Catálogo activo',
        status: categories.length > 0 && activeProducts.length > 0 ? 'ready' : 'blocked',
        severity: 'high',
        message: `${categories.length} categoría(s) y ${activeProducts.length} producto(s) disponible(s).`,
        evidence: { categories: categories.length, active_products: activeProducts.length },
        suggested_action: 'Crear categorías y productos activos.',
      },
      {
        key: 'product_content',
        label: 'Contenido de productos',
        status: missingImages + missingDescriptions + invalidPrices === 0 ? 'ready' : 'warning',
        severity: 'medium',
        message: missingImages + missingDescriptions + invalidPrices === 0
          ? 'Todos los productos tienen imagen, descripción y precio válido.'
          : 'Hay productos con información comercial incompleta.',
        evidence: { total: products.length, missing_images: missingImages, missing_descriptions: missingDescriptions, invalid_prices: invalidPrices },
        suggested_action: 'Completar fotos, descripciones y precios.',
      },
      {
        key: 'recipes_costs',
        label: 'Recetas y costos',
        status: products.length > 0 && missingRecipes === 0 ? 'ready' : 'warning',
        severity: 'medium',
        message: `${recipes.length} receta(s); ${missingRecipes} producto(s) sin receta vinculada.`,
        evidence: { recipes: recipes.length, products_without_recipe: missingRecipes },
        suggested_action: 'Vincular recetas para calcular costos y márgenes.',
      },
      {
        key: 'dietary_data',
        label: 'Dietas y alérgenos',
        status: products.length > 0 && missingTags === 0 ? 'ready' : 'warning',
        severity: 'high',
        message: `${missingTags} producto(s) sin etiquetas dietarias o de alérgenos.`,
        evidence: { products_without_tags: missingTags },
        suggested_action: 'Revisar etiquetas y alérgenos producto por producto.',
      },
      {
        key: 'modifiers',
        label: 'Modificadores',
        status: modifiers.length > 0 ? 'ready' : 'warning',
        severity: 'low',
        message: modifiers.length > 0 ? `${modifiers.length} grupo(s) de modificadores configurado(s).` : 'No hay modificadores configurados.',
        evidence: { modifier_groups: modifiers.length },
        suggested_action: 'Configurar extras y opciones si el menú los necesita.',
      },
      {
        key: 'payment_methods',
        label: 'Métodos de pago',
        status: activePayments.length > 0 ? 'ready' : 'blocked',
        severity: 'high',
        message: activePayments.length > 0 ? `${activePayments.length} método(s) de pago activo(s).` : 'No hay métodos de pago activos.',
        evidence: { active_payment_methods: activePayments.length },
        suggested_action: 'Activar al menos un método de pago.',
      },
      {
        key: 'printing',
        label: 'Impresión y cocina',
        status: settings?.printing_enabled || settings?.kitchen_printing_enabled ? 'ready' : 'warning',
        severity: 'medium',
        message: settings?.printing_enabled || settings?.kitchen_printing_enabled
          ? 'La impresión operativa está habilitada.'
          : 'La impresión no está habilitada; el KDS puede seguir funcionando.',
        evidence: {
          printing_enabled: Boolean(settings?.printing_enabled),
          kitchen_printing_enabled: Boolean(settings?.kitchen_printing_enabled),
          paper_width: settings?.thermal_paper_width || null,
        },
        suggested_action: 'Realizar una prueba de recibo y comanda.',
      },
      {
        key: 'web_presence',
        label: 'Presencia web',
        status: home ? 'ready' : 'warning',
        severity: 'low',
        message: home ? 'La portada de la marca tiene configuración propia.' : 'La portada utiliza contenido de respaldo.',
        evidence: { has_home_settings: Boolean(home) },
        suggested_action: 'Personalizar la portada y el contacto.',
      },
    ];

    const weights = { ready: 1, warning: 0.5, blocked: 0 };
    const score = Math.round(findings.reduce((sum, item) => sum + weights[item.status], 0) / findings.length * 100);
    const blockers = findings.filter((item) => item.status === 'blocked');

    return jsonResponse({
      audit_version: 1,
      generated_at: new Date().toISOString(),
      brand: { id: brand.id, name: brand.name },
      location_id: locationId || null,
      score,
      readiness: blockers.length > 0 ? 'not_ready' : score >= 85 ? 'ready' : 'needs_attention',
      summary: {
        ready: findings.filter((item) => item.status === 'ready').length,
        warnings: findings.filter((item) => item.status === 'warning').length,
        blockers: blockers.length,
      },
      findings,
    });
  } catch (error) {
    console.error('aluna-opening-audit error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'No fue posible auditar la apertura' }, 500);
  }
});
