// @ts-ignore Deno imports are resolved by the Supabase Edge runtime.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const ALLOWED_ACTIONS = new Set(['update_product', 'update_category', 'update_ingredient', 'adjust_location_inventory']);
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
const PRODUCT_SELECT = 'id,brand_id,category_id,name,description,price,cost,margin,stock_status,stock_quantity,barcode,image_url,is_active,tags,variants,modifier_groups,config_options,is_addon,recipe_id,sort_order,packaging_fee,is_upsell,requires_kitchen,subcategory,updated_at,brand_concept,visibility_mode';
const CATEGORY_SELECT = 'id,brand_id,name,slug,icon,sort_order,is_active,banner_image_url,banner_title,banner_description,accent_color,available_from,available_to,visibility_config,tint_class,target_id';
const INGREDIENT_SELECT = 'id,brand_id,name,description,sku,category,purchase_price,purchase_unit,purchase_quantity,usage_unit,unit_cost,stock_current,stock_min,is_active,created_at,updated_at,selling_price,is_modifier,category_id,portion_size,provider_id';
const INVENTORY_SELECT = 'id,location_id,product_id,ingredient_id,stock_quantity,min_stock,created_at,updated_at';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type ActionName = 'update_product' | 'update_category' | 'update_ingredient' | 'adjust_location_inventory';
type AnyRow = Record<string, unknown>;

class HttpError extends Error {
  status: number;
  details?: Record<string, unknown>;
  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

const isObject = (value: unknown): value is AnyRow => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const errorMessage = (value: unknown) => value instanceof Error
  ? value.message
  : isObject(value) && typeof value.message === 'string' ? value.message : 'Unknown error';
const assertUuid = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new HttpError(400, `${field} must be a UUID`);
  return value;
};
const assertNoExtraKeys = (value: AnyRow, allowed: string[], label: string) => {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length) throw new HttpError(400, `${label} contains unsupported fields`, { fields: extras });
};
const cleanText = (value: unknown, field: string, max: number, nullable = false) => {
  if (value === null && nullable) return null;
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const result = value.trim();
  if (!result && !nullable) throw new HttpError(400, `${field} is required`);
  if (result.length > max) throw new HttpError(400, `${field} is too long`);
  return result || null;
};
const cleanNumber = (value: unknown, field: string, min = 0, max = 1_000_000_000) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}`);
  }
  return value;
};
const cleanInteger = (value: unknown, field: string, min = 0, max = 1_000_000_000) => {
  const result = cleanNumber(value, field, min, max);
  if (!Number.isInteger(result)) throw new HttpError(400, `${field} must be an integer`);
  return result;
};
const canonicalize = (value: unknown): Json => {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isObject(value)) return Object.keys(value).sort().reduce((result, key) => {
    result[key] = canonicalize(value[key]);
    return result;
  }, {} as Record<string, Json>);
  return String(value);
};
const sha256 = async (value: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(value)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

async function enforceOptimisticLock(before: AnyRow, proposal: AnyRow) {
  const beforeHash = await sha256(before);
  if (proposal.before_hash !== undefined) {
    if (typeof proposal.before_hash !== 'string' || !/^[0-9a-f]{64}$/i.test(proposal.before_hash)) {
      throw new HttpError(400, 'before_hash must be a SHA-256 hash');
    }
    if (proposal.before_hash.toLowerCase() !== beforeHash) {
      throw new HttpError(409, 'The record changed after the proposal was prepared', { current_hash: beforeHash, current: before });
    }
  }
  if (proposal.expected_updated_at !== undefined) {
    if (typeof proposal.expected_updated_at !== 'string' || !before.updated_at) {
      throw new HttpError(400, 'expected_updated_at is not supported for this record');
    }
    const expectedTime = Date.parse(proposal.expected_updated_at);
    const currentTime = Date.parse(String(before.updated_at));
    if (!Number.isFinite(expectedTime)) throw new HttpError(400, 'expected_updated_at must be an ISO date');
    if (expectedTime !== currentTime) {
      throw new HttpError(409, 'The record changed after the proposal was prepared', { current_hash: beforeHash, current: before });
    }
  }
  return beforeHash;
}

async function verifyBrandReference(admin: any, table: string, id: unknown, brandId: string, field: string) {
  if (id === null) return null;
  const uuid = assertUuid(id, field);
  const { data, error } = await admin.from(table).select('id').eq('id', uuid).eq('brand_id', brandId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(400, `${field} does not belong to this brand`);
  return uuid;
}

function sanitizeProductChanges(raw: unknown) {
  if (!isObject(raw)) throw new HttpError(400, 'changes must be an object');
  const allowed = ['name','description','price','cost','category_id','stock_status','stock_quantity','barcode','image_url','is_active','tags','variants','modifier_groups','config_options','is_addon','recipe_id','sort_order','packaging_fee','is_upsell','requires_kitchen','subcategory','brand_concept','visibility_mode'];
  assertNoExtraKeys(raw, allowed, 'changes');
  const out: AnyRow = {};
  if ('name' in raw) out.name = cleanText(raw.name, 'name', 120);
  if ('description' in raw) out.description = cleanText(raw.description, 'description', 1200, true);
  if ('price' in raw) out.price = cleanNumber(raw.price, 'price');
  if ('cost' in raw) out.cost = cleanNumber(raw.cost, 'cost');
  if ('category_id' in raw) out.category_id = raw.category_id === null ? null : assertUuid(raw.category_id, 'category_id');
  if ('stock_status' in raw) {
    if (!['in', 'out', 'low'].includes(String(raw.stock_status))) throw new HttpError(400, 'stock_status is invalid');
    out.stock_status = raw.stock_status;
  }
  if ('stock_quantity' in raw) out.stock_quantity = cleanInteger(raw.stock_quantity, 'stock_quantity');
  for (const field of ['barcode','image_url','subcategory','brand_concept'] as const) if (field in raw) out[field] = cleanText(raw[field], field, field === 'image_url' ? 2048 : 160, true);
  for (const field of ['is_active','is_addon','is_upsell','requires_kitchen'] as const) {
    if (field in raw) {
      if (typeof raw[field] !== 'boolean') throw new HttpError(400, `${field} must be boolean`);
      out[field] = raw[field];
    }
  }
  if ('tags' in raw) {
    if (!Array.isArray(raw.tags) || raw.tags.length > 20 || raw.tags.some((item) => typeof item !== 'string' || !item.trim() || item.length > 40)) throw new HttpError(400, 'tags is invalid');
    out.tags = [...new Set(raw.tags.map((item) => item.trim()))];
  }
  if ('modifier_groups' in raw) {
    if (!Array.isArray(raw.modifier_groups) || raw.modifier_groups.length > 50 || raw.modifier_groups.some((item) => typeof item !== 'string' || item.length > 120)) throw new HttpError(400, 'modifier_groups is invalid');
    out.modifier_groups = raw.modifier_groups;
  }
  for (const field of ['variants','config_options'] as const) {
    if (field in raw) {
      if (field === 'variants' ? !Array.isArray(raw[field]) : !isObject(raw[field])) throw new HttpError(400, `${field} is invalid`);
      if (JSON.stringify(raw[field]).length > 30_000) throw new HttpError(400, `${field} is too large`);
      out[field] = raw[field];
    }
  }
  if ('recipe_id' in raw) out.recipe_id = raw.recipe_id === null ? null : assertUuid(raw.recipe_id, 'recipe_id');
  if ('sort_order' in raw) out.sort_order = cleanInteger(raw.sort_order, 'sort_order', 0, 100_000);
  if ('packaging_fee' in raw) out.packaging_fee = cleanNumber(raw.packaging_fee, 'packaging_fee');
  if ('visibility_mode' in raw) {
    if (!['all', 'specific'].includes(String(raw.visibility_mode))) throw new HttpError(400, 'visibility_mode is invalid');
    out.visibility_mode = raw.visibility_mode;
  }
  if (!Object.keys(out).length) throw new HttpError(400, 'At least one product change is required');
  return out;
}

function sanitizeCategoryChanges(raw: unknown) {
  if (!isObject(raw)) throw new HttpError(400, 'changes must be an object');
  const allowed = ['name','slug','icon','sort_order','is_active','banner_image_url','banner_title','banner_description','accent_color','available_from','available_to','visibility_config','tint_class','target_id'];
  assertNoExtraKeys(raw, allowed, 'changes');
  const out: AnyRow = {};
  if ('name' in raw) out.name = cleanText(raw.name, 'name', 100);
  if ('slug' in raw) {
    const slug = cleanText(raw.slug, 'slug', 100);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug))) throw new HttpError(400, 'slug is invalid');
    out.slug = slug;
  }
  if ('icon' in raw) out.icon = cleanText(raw.icon, 'icon', 80, true);
  if ('sort_order' in raw) out.sort_order = cleanInteger(raw.sort_order, 'sort_order', 0, 100_000);
  if ('is_active' in raw) {
    if (typeof raw.is_active !== 'boolean') throw new HttpError(400, 'is_active must be boolean');
    out.is_active = raw.is_active;
  }
  for (const field of ['banner_image_url','banner_title','banner_description','tint_class','target_id'] as const) if (field in raw) out[field] = cleanText(raw[field], field, field === 'banner_description' ? 500 : field === 'banner_image_url' ? 2048 : 160, true);
  if ('accent_color' in raw) {
    if (typeof raw.accent_color !== 'string' || !HEX_COLOR_PATTERN.test(raw.accent_color)) throw new HttpError(400, 'accent_color must be a hex color');
    out.accent_color = raw.accent_color;
  }
  for (const field of ['available_from','available_to'] as const) if (field in raw) {
    if (raw[field] !== null && (typeof raw[field] !== 'string' || !TIME_PATTERN.test(raw[field]))) throw new HttpError(400, `${field} must be a valid time`);
    out[field] = raw[field];
  }
  if ('visibility_config' in raw) {
    if (!isObject(raw.visibility_config) || JSON.stringify(raw.visibility_config).length > 10_000) throw new HttpError(400, 'visibility_config is invalid');
    out.visibility_config = raw.visibility_config;
  }
  if (!Object.keys(out).length) throw new HttpError(400, 'At least one category change is required');
  return out;
}

function sanitizeIngredientChanges(raw: unknown, before: AnyRow) {
  if (!isObject(raw)) throw new HttpError(400, 'changes must be an object');
  const allowed = ['name','description','sku','category','purchase_price','purchase_unit','purchase_quantity','usage_unit','stock_current','stock_min','is_active','selling_price','is_modifier','category_id','portion_size','provider_id'];
  assertNoExtraKeys(raw, allowed, 'changes');
  const out: AnyRow = {};
  for (const field of ['name','description','sku','category','purchase_unit','usage_unit'] as const) if (field in raw) out[field] = cleanText(raw[field], field, field === 'description' ? 800 : 120, field !== 'name');
  for (const field of ['purchase_price','stock_current','stock_min','selling_price','portion_size'] as const) if (field in raw) out[field] = cleanNumber(raw[field], field);
  if ('purchase_quantity' in raw) out.purchase_quantity = cleanNumber(raw.purchase_quantity, 'purchase_quantity', 0.000001);
  for (const field of ['is_active','is_modifier'] as const) if (field in raw) {
    if (typeof raw[field] !== 'boolean') throw new HttpError(400, `${field} must be boolean`);
    out[field] = raw[field];
  }
  for (const field of ['category_id','provider_id'] as const) if (field in raw) out[field] = raw[field] === null ? null : assertUuid(raw[field], field);
  if ('purchase_price' in out || 'purchase_quantity' in out) {
    const price = Number(out.purchase_price ?? before.purchase_price ?? 0);
    const quantity = Number(out.purchase_quantity ?? before.purchase_quantity ?? 1);
    if (quantity <= 0) throw new HttpError(400, 'purchase_quantity must be greater than zero');
    out.unit_cost = price / quantity;
  }
  if (!Object.keys(out).length) throw new HttpError(400, 'At least one ingredient change is required');
  return out;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let admin: any = null;
  let trace: { brandId?: string; changeSetId?: string; actionId?: string; actorId?: string; locationId?: string } = {};
  try {
    const authorization = req.headers.get('Authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'Authentication required');
    const body = await req.json();
    if (!isObject(body)) throw new HttpError(400, 'JSON body is required');
    assertNoExtraKeys(body, ['brand_id','action','proposal','approved','idempotency_key','conversation_id'], 'body');
    const brandId = assertUuid(body.brand_id, 'brand_id');
    const idempotencyKey = assertUuid(body.idempotency_key, 'idempotency_key');
    const action = body.action as ActionName;
    if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) throw new HttpError(400, 'Unsupported action');
    if (body.approved !== true) throw new HttpError(400, 'Explicit approval is required');
    if (!isObject(body.proposal)) throw new HttpError(400, 'proposal must be an object');
    const conversationId = body.conversation_id === undefined || body.conversation_id === null ? null : assertUuid(body.conversation_id, 'conversation_id');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Supabase environment is incomplete');
    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) throw new HttpError(401, 'Invalid session');
    trace = { brandId, actorId: userData.user.id };

    const [{ data: brand }, { data: profile }] = await Promise.all([
      admin.from('brands').select('id,name,owner_id').eq('id', brandId).maybeSingle(),
      admin.from('profiles').select('id,brand_id,role').eq('id', userData.user.id).maybeSingle(),
    ]);
    if (!brand) throw new HttpError(404, 'Brand not found');
    const canManage = brand.owner_id === userData.user.id || profile?.role === 'superadmin' || (profile?.brand_id === brandId && ALLOWED_ROLES.has(profile?.role));
    if (!canManage) throw new HttpError(403, 'Forbidden for this brand');
    if (conversationId) {
      const { data: conversation } = await admin.from('agent_conversations').select('id').eq('id', conversationId).eq('brand_id', brandId).eq('user_id', userData.user.id).maybeSingle();
      if (!conversation) throw new HttpError(400, 'conversation_id is invalid for this user and brand');
    }

    const { data: replay } = await admin.from('agent_actions').select('id,status,result_data,error_message,change_set_id,brand_id').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (replay) {
      if (replay.brand_id !== brandId) throw new HttpError(409, 'Idempotency key is already in use');
      if (replay.status === 'completed') return jsonResponse({ success: true, replayed: true, change_set_id: replay.change_set_id, action_id: replay.id, result: replay.result_data });
      throw new HttpError(409, 'This idempotent action already exists', { status: replay.status, change_set_id: replay.change_set_id, action_id: replay.id });
    }

    const proposal = body.proposal;
    let table = '';
    let select = '';
    let entityType = '';
    let entityId = '';
    let locationId: string | null = null;
    let before: AnyRow | null = null;
    let changes: AnyRow = {};
    let operation = 'update';
    let title = '';
    let result: AnyRow;

    if (action === 'adjust_location_inventory') {
      assertNoExtraKeys(proposal, ['location_id','ingredient_id','product_id','stock_quantity','min_stock','expected_updated_at','before_hash'], 'proposal');
      locationId = assertUuid(proposal.location_id, 'location_id');
      trace.locationId = locationId;
      const ingredientId = proposal.ingredient_id === undefined || proposal.ingredient_id === null ? null : assertUuid(proposal.ingredient_id, 'ingredient_id');
      const productId = proposal.product_id === undefined || proposal.product_id === null ? null : assertUuid(proposal.product_id, 'product_id');
      if ((ingredientId ? 1 : 0) + (productId ? 1 : 0) !== 1) throw new HttpError(400, 'Provide exactly one of ingredient_id or product_id');
      const { data: location } = await admin.from('locations').select('id').eq('id', locationId).eq('brand_id', brandId).maybeSingle();
      if (!location) throw new HttpError(400, 'location_id does not belong to this brand');
      if (ingredientId) await verifyBrandReference(admin, 'ingredients', ingredientId, brandId, 'ingredient_id');
      if (productId) await verifyBrandReference(admin, 'products', productId, brandId, 'product_id');
      let inventoryQuery = admin.from('location_inventory').select(INVENTORY_SELECT).eq('location_id', locationId);
      inventoryQuery = ingredientId ? inventoryQuery.eq('ingredient_id', ingredientId) : inventoryQuery.eq('product_id', productId);
      const { data: inventories, error: inventoryError } = await inventoryQuery.limit(2);
      if (inventoryError) throw inventoryError;
      if ((inventories || []).length > 1) throw new HttpError(409, 'More than one inventory record exists for this entity and location');
      before = inventories?.[0] || null;
      if (before) await enforceOptimisticLock(before, proposal);
      else if (proposal.expected_updated_at !== undefined || proposal.before_hash !== undefined) throw new HttpError(409, 'Inventory record does not exist yet', { current: null });
      if (proposal.stock_quantity === undefined && proposal.min_stock === undefined) throw new HttpError(400, 'stock_quantity or min_stock is required');
      changes = {};
      if (proposal.stock_quantity !== undefined) changes.stock_quantity = cleanNumber(proposal.stock_quantity, 'stock_quantity');
      if (proposal.min_stock !== undefined) changes.min_stock = cleanNumber(proposal.min_stock, 'min_stock');
      table = 'location_inventory'; select = INVENTORY_SELECT; entityType = 'location_inventory'; entityId = before ? String(before.id) : crypto.randomUUID();
      operation = before ? 'update' : 'create';
      title = `Ajustar inventario de sede`;
      if (!before) changes = { id: entityId, location_id: locationId, ingredient_id: ingredientId, product_id: productId, ...changes };
      else changes.updated_at = new Date().toISOString();
    } else {
      assertNoExtraKeys(proposal, ['entity_id','changes','expected_updated_at','before_hash'], 'proposal');
      entityId = assertUuid(proposal.entity_id, 'entity_id');
      if (action === 'update_product') { table = 'products'; select = PRODUCT_SELECT; entityType = 'product'; }
      if (action === 'update_category') { table = 'categories'; select = CATEGORY_SELECT; entityType = 'category'; }
      if (action === 'update_ingredient') { table = 'ingredients'; select = INGREDIENT_SELECT; entityType = 'ingredient'; }
      const { data: row, error: rowError } = await admin.from(table).select(select).eq('id', entityId).eq('brand_id', brandId).maybeSingle();
      if (rowError) throw rowError;
      if (!row) throw new HttpError(404, `${entityType} not found in this brand`);
      before = row;
      await enforceOptimisticLock(before, proposal);
      if (action === 'update_product') changes = sanitizeProductChanges(proposal.changes);
      if (action === 'update_category') changes = sanitizeCategoryChanges(proposal.changes);
      if (action === 'update_ingredient') changes = sanitizeIngredientChanges(proposal.changes, before);
      if (action === 'update_product') {
        if ('category_id' in changes) await verifyBrandReference(admin, 'categories', changes.category_id, brandId, 'category_id');
        if ('recipe_id' in changes) await verifyBrandReference(admin, 'recipes', changes.recipe_id, brandId, 'recipe_id');
        if ('price' in changes || 'cost' in changes) {
          const price = Number(changes.price ?? before.price ?? 0);
          const cost = Number(changes.cost ?? before.cost ?? 0);
          changes.margin = price > 0 ? ((price - cost) / price) * 100 : 0;
        }
        changes.updated_at = new Date().toISOString();
      }
      if (action === 'update_ingredient') {
        if ('category_id' in changes) await verifyBrandReference(admin, 'ingredient_categories', changes.category_id, brandId, 'category_id');
        if ('provider_id' in changes) await verifyBrandReference(admin, 'providers', changes.provider_id, brandId, 'provider_id');
        changes.updated_at = new Date().toISOString();
      }
      if ('is_active' in changes && changes.is_active !== before.is_active) operation = changes.is_active ? 'restore' : 'deactivate';
      title = `${operation === 'deactivate' ? 'Desactivar' : operation === 'restore' ? 'Activar' : 'Actualizar'} ${String(before.name || entityType)}`;
    }

    const riskLevel = operation === 'deactivate' || operation === 'restore' ? 'high' : action === 'adjust_location_inventory' ? 'medium' : 'low';
    const approvedAt = new Date().toISOString();
    const beforeHash = before ? await sha256(before) : null;
    const { data: changeSet, error: changeSetError } = await admin.from('agent_change_sets').insert({
      conversation_id: conversationId, brand_id: brandId, location_id: locationId, created_by: userData.user.id,
      approved_by: userData.user.id, approved_at: approvedAt, title,
      summary: `Cambio aprobado para ${brand.name}.`, status: 'executing', risk_level: riskLevel,
      proposed_actions: [{ tool: action, entity_type: entityType, entity_id: entityId, data: changes }],
      approval_snapshot: { approved: true, approved_at: approvedAt, before_hash: beforeHash, before, proposal: changes, idempotency_key: idempotencyKey },
    }).select('id').single();
    if (changeSetError) throw changeSetError;
    trace.changeSetId = changeSet.id;
    const { data: agentAction, error: actionError } = await admin.from('agent_actions').insert({
      change_set_id: changeSet.id, brand_id: brandId, location_id: locationId, sequence: 1, tool_name: action,
      entity_type: entityType, entity_id: entityId, operation, status: 'executing', idempotency_key: idempotencyKey,
      before_data: before, proposed_data: changes,
    }).select('id').single();
    if (actionError) throw actionError;
    trace.actionId = agentAction.id;
    const { error: auditStartError } = await admin.from('agent_audit_log').insert([
      { brand_id: brandId, location_id: locationId, conversation_id: conversationId, change_set_id: changeSet.id, action_id: agentAction.id, actor_id: userData.user.id, event_type: 'approved', event_data: { before_hash: beforeHash, risk_level: riskLevel } },
      { brand_id: brandId, location_id: locationId, conversation_id: conversationId, change_set_id: changeSet.id, action_id: agentAction.id, actor_id: userData.user.id, event_type: 'execution_started', event_data: { tool: action } },
    ]);
    if (auditStartError) throw auditStartError;

    if (operation === 'create') {
      const { data, error } = await admin.from(table).insert(changes).select(select).single();
      if (error) throw error;
      result = data;
    } else {
      let mutation = admin.from(table).update(changes).eq('id', entityId);
      if (table !== 'location_inventory') mutation = mutation.eq('brand_id', brandId);
      if (before?.updated_at && proposal.expected_updated_at) mutation = mutation.eq('updated_at', before.updated_at);
      const { data, error } = await mutation.select(select).maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(409, 'The record changed during execution');
      result = data;
    }

    const { data: verified, error: verifyError } = await admin.from(table).select(select).eq('id', entityId).maybeSingle();
    if (verifyError || !verified) throw verifyError || new Error('Write verification failed');
    if (table !== 'location_inventory' && verified.brand_id !== brandId) throw new Error('Brand verification failed after write');
    if (table === 'location_inventory' && verified.location_id !== locationId) throw new Error('Location verification failed after write');
    const resultHash = await sha256(verified);
    const executedAt = new Date().toISOString();
    const completionWrites = await Promise.all([
      admin.from('agent_actions').update({ status: 'completed', entity_id: entityId, result_data: { record: verified, result_hash: resultHash }, executed_at: executedAt }).eq('id', agentAction.id),
      admin.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSet.id),
      admin.from('agent_audit_log').insert({ brand_id: brandId, location_id: locationId, conversation_id: conversationId, change_set_id: changeSet.id, action_id: agentAction.id, actor_id: userData.user.id, event_type: 'action_completed', event_data: { entity_id: entityId, before_hash: beforeHash, result_hash: resultHash } }),
    ]);
    const completionError = completionWrites.find((write) => write.error)?.error;
    if (completionError) throw completionError;
    return jsonResponse({ success: true, replayed: false, change_set_id: changeSet.id, action_id: agentAction.id, result: { record: result, result_hash: resultHash } });
  } catch (error) {
    const message = errorMessage(error);
    console.error('aluna-catalog-management-action error', message);
    if (admin && trace.changeSetId) {
      const now = new Date().toISOString();
      await Promise.all([
        trace.actionId ? admin.from('agent_actions').update({ status: 'failed', error_message: message.slice(0, 500), executed_at: now }).eq('id', trace.actionId) : Promise.resolve(),
        admin.from('agent_change_sets').update({ status: 'failed', executed_at: now }).eq('id', trace.changeSetId),
        admin.from('agent_audit_log').insert({ brand_id: trace.brandId, location_id: trace.locationId || null, change_set_id: trace.changeSetId, action_id: trace.actionId || null, actor_id: trace.actorId, event_type: 'action_failed', event_data: { message: message.slice(0, 500) } }),
      ]);
    }
    if (error instanceof HttpError) return jsonResponse({ error: error.message, ...(error.details || {}) }, error.status);
    return jsonResponse({ error: 'No fue posible ejecutar la gestión de catálogo' }, 500);
  }
});
