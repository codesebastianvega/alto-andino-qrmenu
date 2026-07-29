// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACTIONS = new Set(['update_business_profile', 'update_branding_urls', 'update_web_content']);
const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
const BUSINESS_TYPES = new Set(['restaurant', 'cafe', 'bakery', 'dark_kitchen', 'store', 'other']);

type JsonObject = Record<string, unknown>;

const jsonResponse = (body: JsonObject, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const matchesSubset = (actual: JsonObject | null | undefined, expected: JsonObject) => Object.entries(expected)
  .every(([key, value]) => JSON.stringify(actual?.[key] ?? null) === JSON.stringify(value ?? null));

function assertOnlyKeys(value: JsonObject, allowed: Set<string>) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`UNSUPPORTED_FIELDS:${unknown.join(',')}`);
}

function optionalText(value: unknown, maxLength: number, field: string, nullable = true) {
  if (value === undefined) return undefined;
  if (value === null && nullable) return null;
  if (typeof value !== 'string') throw new Error(`INVALID_FIELD:${field}`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error(`INVALID_FIELD:${field}`);
  return normalized || (nullable ? null : '');
}

function optionalUrl(value: unknown, field: string) {
  const normalized = optionalText(value, 2048, field);
  if (normalized === undefined || normalized === null) return normalized;
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error(`INVALID_URL:${field}`);
  }
}

function sanitizeProfile(proposal: JsonObject) {
  const allowed = new Set(['name', 'slug', 'email', 'phone', 'city', 'country', 'address', 'description', 'whatsapp', 'instagram', 'google_maps_url', 'business_type', 'legal_name', 'legal_id']);
  assertOnlyKeys(proposal, allowed);
  const brand: JsonObject = {};
  const settings: JsonObject = {};
  for (const [field, max] of Object.entries({ name: 120, email: 254, phone: 40, city: 100, country: 80, address: 240, description: 1200, whatsapp: 40, instagram: 100 })) {
    const value = optionalText(proposal[field], max, field, field !== 'name');
    if (value !== undefined) brand[field] = value;
  }
  if (brand.name === '') throw new Error('INVALID_FIELD:name');
  if (typeof brand.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.email)) throw new Error('INVALID_FIELD:email');
  if (proposal.slug !== undefined) {
    const slug = optionalText(proposal.slug, 100, 'slug', false);
    if (!slug || !SLUG_PATTERN.test(slug)) throw new Error('INVALID_FIELD:slug');
    brand.slug = slug;
  }
  if (proposal.google_maps_url !== undefined) brand.google_maps_url = optionalUrl(proposal.google_maps_url, 'google_maps_url');
  if (proposal.business_type !== undefined) {
    if (typeof proposal.business_type !== 'string' || !BUSINESS_TYPES.has(proposal.business_type)) throw new Error('INVALID_FIELD:business_type');
    brand.business_type = proposal.business_type;
  }
  for (const field of ['legal_name', 'legal_id']) {
    const value = optionalText(proposal[field], field === 'legal_name' ? 180 : 80, field);
    if (value !== undefined) settings[field] = value;
  }
  if (!Object.keys(brand).length && !Object.keys(settings).length) throw new Error('EMPTY_PROPOSAL');
  return { brand, settings };
}

function sanitizeBranding(proposal: JsonObject) {
  assertOnlyKeys(proposal, new Set(['logo_url', 'favicon_url']));
  const result: JsonObject = {};
  for (const field of ['logo_url', 'favicon_url']) {
    if (proposal[field] !== undefined) result[field] = optionalUrl(proposal[field], field);
  }
  if (!Object.keys(result).length) throw new Error('EMPTY_PROPOSAL');
  return result;
}

const WEB_TEXT_LIMITS: Record<string, number> = {
  hero_h1: 240, hero_subtitle: 800, hero_emojis: 100, featured_items_title: 160,
  experiences_h1: 240, experiences_subtitle: 800, experiences_tag: 100,
  concierge_h1: 240, concierge_subtitle: 800, concierge_prompt_template: 4000,
  event_planner_prompt_template: 4000, event_planner_h1: 240, event_planner_subtitle: 800,
  menu_banner_title: 240, menu_banner_subtitle: 800, menu_banner_tag: 100,
  menu_hero_title: 240, menu_hero_subtitle: 800,
};
const WEB_URL_FIELDS = new Set(['experiences_img', 'concierge_img', 'event_planner_img', 'menu_banner_img', 'welcome_bg_img', 'hero_background_image']);

function sanitizeFeaturedItems(value: unknown) {
  if (!Array.isArray(value) || value.length > 8) throw new Error('INVALID_FIELD:featured_items');
  return value.map((item, index) => {
    if (!isObject(item)) throw new Error(`INVALID_FIELD:featured_items[${index}]`);
    assertOnlyKeys(item, new Set(['product_id', 'name', 'img', 'price']));
    if (!UUID_PATTERN.test(String(item.product_id || ''))) throw new Error(`INVALID_FIELD:featured_items[${index}].product_id`);
    const price = Number(item.price);
    if (!Number.isFinite(price) || price < 0) throw new Error(`INVALID_FIELD:featured_items[${index}].price`);
    return {
      product_id: item.product_id,
      name: optionalText(item.name, 120, `featured_items[${index}].name`, false) || 'Producto',
      img: item.img ? optionalUrl(item.img, `featured_items[${index}].img`) : '',
      price,
    };
  });
}

function sanitizeReviews(value: unknown) {
  if (!Array.isArray(value) || value.length > 20) throw new Error('INVALID_FIELD:reviews');
  return value.map((item, index) => {
    if (!isObject(item)) throw new Error(`INVALID_FIELD:reviews[${index}]`);
    assertOnlyKeys(item, new Set(['name', 'role', 'text', 'rating', 'img']));
    const rating = Number(item.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error(`INVALID_FIELD:reviews[${index}].rating`);
    return {
      name: optionalText(item.name, 100, `reviews[${index}].name`, false) || '',
      role: optionalText(item.role, 100, `reviews[${index}].role`) || '',
      text: optionalText(item.text, 1000, `reviews[${index}].text`, false) || '',
      rating,
      img: item.img ? optionalUrl(item.img, `reviews[${index}].img`) : '',
    };
  });
}

function sanitizeWeb(proposal: JsonObject) {
  const allowed = new Set([...Object.keys(WEB_TEXT_LIMITS), ...WEB_URL_FIELDS, 'featured_items', 'reviews', 'concierge_bg_color', 'event_planner_bg_color']);
  assertOnlyKeys(proposal, allowed);
  const result: JsonObject = {};
  for (const [field, max] of Object.entries(WEB_TEXT_LIMITS)) {
    const value = optionalText(proposal[field], max, field);
    if (value !== undefined) result[field] = value;
  }
  for (const field of WEB_URL_FIELDS) {
    if (proposal[field] !== undefined) result[field] = optionalUrl(proposal[field], field);
  }
  for (const field of ['concierge_bg_color', 'event_planner_bg_color']) {
    if (proposal[field] !== undefined) {
      const color = optionalText(proposal[field], 32, field);
      if (color !== null && color !== undefined && !/^#[0-9a-f]{3,8}$/i.test(color)) throw new Error(`INVALID_FIELD:${field}`);
      result[field] = color;
    }
  }
  if (proposal.featured_items !== undefined) result.featured_items = sanitizeFeaturedItems(proposal.featured_items);
  if (proposal.reviews !== undefined) result.reviews = sanitizeReviews(proposal.reviews);
  if (!Object.keys(result).length) throw new Error('EMPTY_PROPOSAL');
  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let actionId: string | null = null;
  let changeSetId: string | null = null;
  let brandId: string | null = null;
  let actorId: string | null = null;
  let admin: ReturnType<typeof createClient> | null = null;
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);
    const body = await req.json();
    brandId = body.brand_id;
    if (!UUID_PATTERN.test(brandId || '') || !ACTIONS.has(body.action) || body.approved !== true || !isObject(body.proposal)) {
      return jsonResponse({ error: 'Invalid or unapproved action' }, 400);
    }
    const idempotencyKey = body.idempotency_key;
    if (idempotencyKey !== undefined && !UUID_PATTERN.test(idempotencyKey)) return jsonResponse({ error: 'Invalid idempotency key' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publicKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !publicKey || !serviceKey) throw new Error('SUPABASE_ENV_INCOMPLETE');
    const caller = createClient(supabaseUrl, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse({ error: 'Invalid session' }, 401);
    actorId = userData.user.id;

    const [{ data: brand, error: brandError }, { data: profile, error: profileError }] = await Promise.all([
      admin.from('brands').select('id,name,owner_id').eq('id', brandId).maybeSingle(),
      admin.from('profiles').select('id,brand_id,role').eq('id', actorId).maybeSingle(),
    ]);
    if (brandError || profileError) throw brandError || profileError;
    if (!brand) return jsonResponse({ error: 'Brand not found' }, 404);
    const canManage = brand.owner_id === actorId || profile?.role === 'superadmin' || (profile?.brand_id === brandId && MANAGER_ROLES.has(profile?.role));
    if (!canManage) return jsonResponse({ error: 'Forbidden for this brand' }, 403);

    if (idempotencyKey) {
      const { data: existing, error } = await admin.from('agent_actions').select('id,status,result_data,change_set_id,tool_name').eq('brand_id', brandId).eq('idempotency_key', idempotencyKey).maybeSingle();
      if (error) throw error;
      if (existing?.status === 'completed' && existing.tool_name === body.action) return jsonResponse({ success: true, replayed: true, change_set_id: existing.change_set_id, action_id: existing.id, result: existing.result_data });
      if (existing) return jsonResponse({ error: 'Action with this idempotency key is already in progress or failed' }, 409);
    }

    const { data: globalSettings, error: settingsReadError } = await admin.from('restaurant_settings').select('*').eq('brand_id', brandId).is('location_id', null).maybeSingle();
    if (settingsReadError) throw settingsReadError;
    let proposed: JsonObject;
    let before: JsonObject;
    if (body.action === 'update_business_profile') {
      proposed = sanitizeProfile(body.proposal);
      const { data: currentBrand, error } = await admin.from('brands').select('id,name,slug,email,phone,city,country,address,description,whatsapp,instagram,google_maps_url,business_type').eq('id', brandId).single();
      if (error) throw error;
      before = { brand: currentBrand, settings: globalSettings ? { id: globalSettings.id, legal_name: globalSettings.legal_name, legal_id: globalSettings.legal_id } : null };
    } else if (body.action === 'update_branding_urls') {
      proposed = sanitizeBranding(body.proposal);
      const { data: currentBrand, error } = await admin.from('brands').select('id,name,logo_url').eq('id', brandId).single();
      if (error) throw error;
      before = { brand: currentBrand, settings: globalSettings ? { id: globalSettings.id, logo_url: globalSettings.logo_url, favicon_url: globalSettings.favicon_url } : null };
    } else {
      proposed = sanitizeWeb(body.proposal);
      const { data: currentHome, error } = await admin.from('home_settings').select('*').eq('brand_id', brandId).maybeSingle();
      if (error) throw error;
      before = { home_settings: currentHome };
      const featured = proposed.featured_items as Array<{ product_id: string }> | undefined;
      if (featured?.length) {
        const ids = [...new Set(featured.map((item) => item.product_id))];
        const { data: products, error: productError } = await admin.from('products').select('id').eq('brand_id', brandId).in('id', ids);
        if (productError) throw productError;
        if ((products || []).length !== ids.length) return jsonResponse({ error: 'Featured products must belong to this brand' }, 400);
      }
    }

    const approvedAt = new Date().toISOString();
    const { data: changeSet, error: changeSetError } = await admin.from('agent_change_sets').insert({
      brand_id: brandId, created_by: actorId, approved_by: actorId, approved_at: approvedAt,
      title: body.action, summary: `Cambio aprobado de Aluna para ${brand.name}.`, status: 'executing', risk_level: 'medium',
      proposed_actions: [{ tool: body.action, data: proposed }], approval_snapshot: { approved: true, approved_at: approvedAt, before, proposed },
    }).select('id').single();
    if (changeSetError) throw changeSetError;
    changeSetId = changeSet.id;
    const actionPayload: JsonObject = {
      change_set_id: changeSetId, brand_id: brandId, sequence: 1, tool_name: body.action,
      entity_type: body.action === 'update_web_content' ? 'home_settings' : 'brand', operation: 'update', status: 'executing', before_data: before, proposed_data: proposed,
    };
    if (idempotencyKey) actionPayload.idempotency_key = idempotencyKey;
    const { data: action, error: actionError } = await admin.from('agent_actions').insert(actionPayload).select('id').single();
    if (actionError) throw actionError;
    actionId = action.id;
    const { error: auditStartError } = await admin.from('agent_audit_log').insert([
      { brand_id: brandId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'approved', event_data: { before, proposed } },
      { brand_id: brandId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'execution_started', event_data: { tool: body.action } },
    ]);
    if (auditStartError) throw auditStartError;

    let result: JsonObject;
    if (body.action === 'update_business_profile') {
      const profileProposal = proposed as { brand: JsonObject; settings: JsonObject };
      if (Object.keys(profileProposal.brand).length) {
        const { error } = await admin.from('brands').update(profileProposal.brand).eq('id', brandId);
        if (error) throw error;
      }
      if (Object.keys(profileProposal.settings).length) {
        const query = globalSettings
          ? admin.from('restaurant_settings').update(profileProposal.settings).eq('id', globalSettings.id).eq('brand_id', brandId)
          : admin.from('restaurant_settings').insert({ brand_id: brandId, location_id: null, business_name: profileProposal.brand.name || brand.name, ...profileProposal.settings });
        const { error } = await query;
        if (error) throw error;
      }
      const [{ data: verifiedBrand, error: verifyBrandError }, { data: verifiedSettings, error: verifySettingsError }] = await Promise.all([
        admin.from('brands').select('id,name,slug,email,phone,city,country,address,description,whatsapp,instagram,google_maps_url,business_type').eq('id', brandId).single(),
        admin.from('restaurant_settings').select('id,legal_name,legal_id').eq('brand_id', brandId).is('location_id', null).maybeSingle(),
      ]);
      if (verifyBrandError || verifySettingsError) throw verifyBrandError || verifySettingsError;
      if (!matchesSubset(verifiedBrand, profileProposal.brand) || !matchesSubset(verifiedSettings, profileProposal.settings)) throw new Error('VERIFY_FAILED');
      result = { brand: verifiedBrand, settings: verifiedSettings };
    } else if (body.action === 'update_branding_urls') {
      const settingsPayload: JsonObject = {};
      if ('logo_url' in proposed) settingsPayload.logo_url = proposed.logo_url;
      if ('favicon_url' in proposed) settingsPayload.favicon_url = proposed.favicon_url;
      if ('logo_url' in proposed) {
        const { error } = await admin.from('brands').update({ logo_url: proposed.logo_url }).eq('id', brandId);
        if (error) throw error;
      }
      const query = globalSettings
        ? admin.from('restaurant_settings').update(settingsPayload).eq('id', globalSettings.id).eq('brand_id', brandId)
        : admin.from('restaurant_settings').insert({ brand_id: brandId, location_id: null, business_name: brand.name, ...settingsPayload });
      const { error } = await query;
      if (error) throw error;
      const [{ data: verifiedBrand, error: verifyBrandError }, { data: verifiedSettings, error: verifySettingsError }] = await Promise.all([
        admin.from('brands').select('id,logo_url').eq('id', brandId).single(),
        admin.from('restaurant_settings').select('id,logo_url,favicon_url').eq('brand_id', brandId).is('location_id', null).single(),
      ]);
      if (verifyBrandError || verifySettingsError) throw verifyBrandError || verifySettingsError;
      if (('logo_url' in proposed && (verifiedBrand.logo_url ?? null) !== (proposed.logo_url ?? null)) || !matchesSubset(verifiedSettings, settingsPayload)) throw new Error('VERIFY_FAILED');
      result = { brand: verifiedBrand, settings: verifiedSettings };
    } else {
      const { data: existingHome, error: homeReadError } = await admin.from('home_settings').select('id').eq('brand_id', brandId).maybeSingle();
      if (homeReadError) throw homeReadError;
      const query = existingHome
        ? admin.from('home_settings').update({ ...proposed, updated_at: new Date().toISOString() }).eq('id', existingHome.id).eq('brand_id', brandId)
        : admin.from('home_settings').insert({ brand_id: brandId, ...proposed });
      const { error } = await query;
      if (error) throw error;
      const { data: verifiedHome, error: verifyError } = await admin.from('home_settings').select('*').eq('brand_id', brandId).single();
      if (verifyError) throw verifyError;
      if (!matchesSubset(verifiedHome, proposed)) throw new Error('VERIFY_FAILED');
      result = { home_settings: verifiedHome };
    }

    const executedAt = new Date().toISOString();
    const completionWrites = await Promise.all([
      admin.from('agent_actions').update({ status: 'completed', result_data: result, executed_at: executedAt }).eq('id', actionId).eq('brand_id', brandId),
      admin.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSetId).eq('brand_id', brandId),
      admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'completed', event_data: { before, after: result, verified: true } }),
    ]);
    const completionError = completionWrites.find((write) => write.error)?.error;
    if (completionError) throw completionError;
    return jsonResponse({ success: true, change_set_id: changeSetId, action_id: actionId, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    console.error('aluna-brand-web-action error', message);
    if (admin && brandId && changeSetId) {
      const executedAt = new Date().toISOString();
      await Promise.all([
        actionId ? admin.from('agent_actions').update({ status: 'failed', error_message: message.slice(0, 500), executed_at: executedAt }).eq('id', actionId).eq('brand_id', brandId) : Promise.resolve(),
        admin.from('agent_change_sets').update({ status: 'failed', executed_at: executedAt }).eq('id', changeSetId).eq('brand_id', brandId),
        admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'action_failed', event_data: { message: message.slice(0, 500) } }),
      ]);
    }
    if (message.startsWith('INVALID_') || message.startsWith('UNSUPPORTED_FIELDS') || message === 'EMPTY_PROPOSAL') return jsonResponse({ error: message }, 400);
    return jsonResponse({ error: 'No fue posible ejecutar el cambio de marca o web de Aluna' }, 500);
  }
});
