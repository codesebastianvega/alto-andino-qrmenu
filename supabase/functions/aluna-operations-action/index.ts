// @ts-ignore: Supabase Edge Functions run on Deno.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ACTIONS = new Set([
  'update_business_hours',
  'create_payment_method',
  'update_printing_settings',
  'create_modifier_group',
]);
const PAYMENT_TYPES = new Set(['cash', 'transfer', 'card', 'digital_wallet', 'other']);
type JsonObject = Record<string, unknown>;

const response = (body: JsonObject, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasOnly = (value: JsonObject, allowed: string[]) => Object.keys(value).every((key) => allowed.includes(key));
const cleanText = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const nullableUuid = (value: unknown) => value === null || value === undefined || value === '' ? null : (typeof value === 'string' && UUID.test(value) ? value : undefined);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  const authorization = req.headers.get('Authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response({ error: 'Authentication required' }, 401);

  let admin: ReturnType<typeof createClient> | null = null;
  let actorId: string | null = null;
  let brandId: string | null = null;
  let locationId: string | null = null;
  let changeSetId: string | null = null;
  let actionId: string | null = null;

  try {
    const body: JsonObject = await req.json();
    if (!isObject(body) || !hasOnly(body, ['action', 'brand_id', 'location_id', 'conversation_id', 'idempotency_key', 'approved', 'proposal'])) {
      return response({ error: 'Unexpected request fields' }, 400);
    }
    const actionName = typeof body.action === 'string' ? body.action : '';
    brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
    locationId = nullableUuid(body.location_id) ?? null;
    const conversationId = nullableUuid(body.conversation_id);
    const idempotencyKey = nullableUuid(body.idempotency_key);
    if (!brandId || !UUID.test(brandId) || !ACTIONS.has(actionName) || body.approved !== true || !isObject(body.proposal)) {
      return response({ error: 'Invalid or unapproved action' }, 400);
    }
    if (body.location_id !== undefined && nullableUuid(body.location_id) === undefined) {
      return response({ error: 'Invalid location_id' }, 400);
    }
    if (body.conversation_id !== undefined && conversationId === undefined) {
      return response({ error: 'Invalid conversation_id' }, 400);
    }
    if (body.idempotency_key !== undefined && (idempotencyKey === undefined || idempotencyKey === null)) {
      return response({ error: 'Invalid idempotency_key' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Supabase environment is incomplete');

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) return response({ error: 'Invalid session' }, 401);
    actorId = userData.user.id;

    const [{ data: brand }, { data: profile }] = await Promise.all([
      admin.from('brands').select('id,name,owner_id').eq('id', brandId).maybeSingle(),
      admin.from('profiles').select('id,brand_id,role').eq('id', actorId).maybeSingle(),
    ]);
    if (!brand) return response({ error: 'Brand not found' }, 404);
    const allowedRoles = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
    const canManage = brand.owner_id === actorId
      || profile?.role === 'superadmin'
      || (profile?.brand_id === brandId && allowedRoles.has(profile?.role));
    if (!canManage) return response({ error: 'Forbidden for this brand' }, 403);

    if (locationId) {
      const { data: location } = await admin.from('locations').select('id').eq('id', locationId).eq('brand_id', brandId).maybeSingle();
      if (!location) return response({ error: 'Location does not belong to this brand' }, 400);
    }
    if (conversationId) {
      const { data: conversation } = await admin.from('agent_conversations').select('id').eq('id', conversationId).eq('brand_id', brandId).eq('user_id', actorId).maybeSingle();
      if (!conversation) return response({ error: 'Conversation does not belong to this user and brand' }, 400);
    }
    if (idempotencyKey) {
      const { data: previous } = await admin.from('agent_actions').select('id,change_set_id,status,result_data,error_message').eq('brand_id', brandId).eq('idempotency_key', idempotencyKey).maybeSingle();
      if (previous) return response({ error: 'This approved action was already submitted', previous }, 409);
    }

    const proposal = body.proposal;
    const approvedAt = new Date().toISOString();

    const createTrace = async (config: {
      title: string;
      summary: string;
      risk: 'low' | 'medium' | 'high';
      entityType: string;
      operation: 'create' | 'update';
      before?: JsonObject | null;
      proposed: JsonObject;
    }) => {
      const { data: changeSet, error: changeError } = await admin!.from('agent_change_sets').insert({
        conversation_id: conversationId || null,
        brand_id: brandId,
        location_id: locationId,
        created_by: actorId,
        approved_by: actorId,
        approved_at: approvedAt,
        title: config.title,
        summary: config.summary,
        status: 'executing',
        risk_level: config.risk,
        proposed_actions: [{ tool: actionName, data: config.proposed }],
        approval_snapshot: { approved: true, approved_at: approvedAt, proposal: config.proposed },
      }).select('id').single();
      if (changeError) throw changeError;
      changeSetId = changeSet.id;
      const { data: action, error: actionError } = await admin!.from('agent_actions').insert({
        change_set_id: changeSet.id,
        brand_id: brandId,
        location_id: locationId,
        sequence: 1,
        tool_name: actionName,
        entity_type: config.entityType,
        operation: config.operation,
        status: 'executing',
        before_data: config.before || null,
        proposed_data: config.proposed,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      }).select('id').single();
      if (actionError) throw actionError;
      actionId = action.id;
      const { error: auditError } = await admin!.from('agent_audit_log').insert([
        { brand_id: brandId, location_id: locationId, conversation_id: conversationId || null, change_set_id: changeSet.id, action_id: action.id, actor_id: actorId, event_type: 'approved', event_data: { proposal: config.proposed } },
        { brand_id: brandId, location_id: locationId, conversation_id: conversationId || null, change_set_id: changeSet.id, action_id: action.id, actor_id: actorId, event_type: 'execution_started', event_data: {} },
      ]);
      if (auditError) throw auditError;
      return { changeSet, action };
    };

    const completeTrace = async (entityId: string | null, result: JsonObject, partial = false) => {
      const executedAt = new Date().toISOString();
      await Promise.all([
        admin!.from('agent_actions').update({ status: partial ? 'failed' : 'completed', entity_id: entityId, result_data: result, error_message: partial ? 'La acción se completó parcialmente' : null, executed_at: executedAt }).eq('id', actionId),
        admin!.from('agent_change_sets').update({ status: partial ? 'partially_failed' : 'completed', executed_at: executedAt }).eq('id', changeSetId),
        admin!.from('agent_audit_log').insert({ brand_id: brandId, location_id: locationId, conversation_id: conversationId || null, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: partial ? 'action_failed' : 'action_completed', event_data: result }),
      ]);
    };

    if (actionName === 'update_business_hours') {
      if (!hasOnly(proposal, ['hours']) || !Array.isArray(proposal.hours) || proposal.hours.length < 1 || proposal.hours.length > 7) {
        return response({ error: 'hours must contain between 1 and 7 days' }, 400);
      }
      const hours = proposal.hours.map((raw) => {
        if (!isObject(raw) || !hasOnly(raw, ['day_of_week', 'open_time', 'close_time', 'is_closed'])) throw new Error('INVALID_HOURS');
        const day = raw.day_of_week;
        const closed = raw.is_closed === true;
        if (typeof day !== 'number' || !Number.isInteger(day) || day < 0 || day > 6 || typeof raw.is_closed !== 'boolean') throw new Error('INVALID_HOURS');
        if (!TIME.test(String(raw.open_time || '')) || !TIME.test(String(raw.close_time || ''))) throw new Error('INVALID_HOURS');
        return { day_of_week: day, open_time: raw.open_time, close_time: raw.close_time, is_closed: closed };
      });
      if (new Set(hours.map((item) => item.day_of_week)).size !== hours.length) return response({ error: 'Each day may appear only once' }, 400);
      const query = admin.from('business_hours').select('*').eq('brand_id', brandId).in('day_of_week', hours.map((item) => item.day_of_week));
      const { data: before, error: beforeError } = locationId ? await query.eq('location_id', locationId) : await query.is('location_id', null);
      if (beforeError) throw beforeError;
      const proposedRows = hours.map((item) => ({ ...item, brand_id: brandId, location_id: locationId, updated_at: approvedAt }));
      await createTrace({ title: 'Actualizar horarios de atención', summary: `Aluna actualizará ${hours.length} día(s) para ${brand.name}.`, risk: 'medium', entityType: 'business_hours', operation: 'update', before: { rows: before || [] }, proposed: { hours: proposedRows } });
      const existing = new Map((before || []).map((row: JsonObject) => [row.day_of_week, row]));
      const results = [];
      for (const row of proposedRows) {
        const current = existing.get(row.day_of_week) as JsonObject | undefined;
        const mutation = current?.id
          ? admin.from('business_hours').update(row).eq('id', current.id).eq('brand_id', brandId).select('*').single()
          : admin.from('business_hours').insert(row).select('*').single();
        const { data, error } = await mutation;
        if (error) throw error;
        results.push(data);
      }
      await completeTrace(null, { hours: results });
      return response({ success: true, change_set_id: changeSetId, hours: results });
    }

    if (actionName === 'create_payment_method') {
      if (!hasOnly(proposal, ['name', 'type', 'icon', 'is_active', 'location_ids'])) return response({ error: 'Unexpected payment fields' }, 400);
      const name = cleanText(proposal.name, 100);
      const type = typeof proposal.type === 'string' ? proposal.type : '';
      if (proposal.icon !== undefined && typeof proposal.icon !== 'string') return response({ error: 'icon must be a string' }, 400);
      const icon = cleanText(proposal.icon, 120) || 'solar:bill-list-bold';
      const isActive = proposal.is_active === undefined ? true : proposal.is_active;
      const rawLocationIds = proposal.location_ids === undefined ? (locationId ? [locationId] : []) : proposal.location_ids;
      if (!name || !PAYMENT_TYPES.has(type) || typeof isActive !== 'boolean' || !Array.isArray(rawLocationIds) || rawLocationIds.length > 25 || rawLocationIds.some((id) => typeof id !== 'string' || !UUID.test(id))) {
        return response({ error: 'Invalid payment method proposal' }, 400);
      }
      const locationIds = [...new Set(rawLocationIds as string[])];
      if (locationIds.length) {
        const { data: validLocations, error } = await admin.from('locations').select('id').eq('brand_id', brandId).in('id', locationIds);
        if (error) throw error;
        if ((validLocations || []).length !== locationIds.length) return response({ error: 'A selected location does not belong to this brand' }, 400);
      }
      const { data: duplicate, error: duplicateError } = await admin.from('payment_methods').select('id,name').eq('brand_id', brandId).ilike('name', name).limit(1);
      if (duplicateError) throw duplicateError;
      if (duplicate?.length) return response({ error: 'A payment method with this name already exists', existing: duplicate[0] }, 409);
      const payment = { brand_id: brandId, name, type, icon, is_active: isActive };
      await createTrace({ title: `Crear método de pago ${name}`, summary: `Aluna creará y activará el método de pago aprobado para ${brand.name}.`, risk: 'medium', entityType: 'payment_method', operation: 'create', proposed: { ...payment, location_ids: locationIds } });
      const { data: created, error: createError } = await admin.from('payment_methods').insert(payment).select('*').single();
      if (createError) throw createError;
      const links = locationIds.map((id) => ({ location_id: id, payment_method_id: created.id, is_active: isActive, config: {} }));
      const { error: linkError } = links.length ? await admin.from('location_payment_methods').insert(links) : { error: null };
      const result = { payment_method: created, linked_location_ids: linkError ? [] : locationIds, link_error: linkError?.message || null };
      await completeTrace(created.id, result, Boolean(linkError));
      return response({ success: !linkError, partial: Boolean(linkError), change_set_id: changeSetId, ...result }, linkError ? 207 : 200);
    }

    if (actionName === 'update_printing_settings') {
      if (!hasOnly(proposal, ['kitchen_print_enabled', 'receipt_print_enabled', 'thermal_paper_width']) || Object.keys(proposal).length === 0) {
        return response({ error: 'Unexpected or empty printing settings' }, 400);
      }
      const updates: JsonObject = {};
      for (const key of ['kitchen_print_enabled', 'receipt_print_enabled']) {
        if (proposal[key] !== undefined) {
          if (typeof proposal[key] !== 'boolean') return response({ error: `${key} must be boolean` }, 400);
          updates[key] = proposal[key];
        }
      }
      if (proposal.thermal_paper_width !== undefined) {
        if (typeof proposal.thermal_paper_width !== 'string' || !['50', '80'].includes(proposal.thermal_paper_width)) return response({ error: 'thermal_paper_width must be 50 or 80' }, 400);
        updates.thermal_paper_width = proposal.thermal_paper_width;
      }
      const query = admin.from('restaurant_settings').select('*').eq('brand_id', brandId);
      const { data: current, error: currentError } = locationId ? await query.eq('location_id', locationId).maybeSingle() : await query.is('location_id', null).maybeSingle();
      if (currentError) throw currentError;
      const settings = { ...updates, brand_id: brandId, location_id: locationId, updated_at: approvedAt };
      await createTrace({ title: 'Actualizar configuración de impresión', summary: `Aluna configurará comandas, recibos y papel térmico para ${brand.name}.`, risk: 'medium', entityType: 'restaurant_settings', operation: current ? 'update' : 'create', before: current || null, proposed: settings });
      const mutation = current?.id
        ? admin.from('restaurant_settings').update(settings).eq('id', current.id).eq('brand_id', brandId).select('*').single()
        : admin.from('restaurant_settings').insert(settings).select('*').single();
      const { data: saved, error: saveError } = await mutation;
      if (saveError) throw saveError;
      await completeTrace(saved.id, { settings: saved });
      return response({ success: true, change_set_id: changeSetId, settings: saved });
    }

    if (!hasOnly(proposal, ['name', 'description', 'is_required', 'min_select', 'max_select', 'is_submodifier', 'options', 'location_ids'])) {
      return response({ error: 'Unexpected modifier group fields' }, 400);
    }
    const name = cleanText(proposal.name, 120);
    if ((proposal.description !== undefined && typeof proposal.description !== 'string') || (proposal.is_submodifier !== undefined && typeof proposal.is_submodifier !== 'boolean')) {
      return response({ error: 'Invalid modifier group field types' }, 400);
    }
    const description = cleanText(proposal.description, 500);
    const isRequired = proposal.is_required === true;
    const isSubmodifier = proposal.is_submodifier === true;
    const minSelect = proposal.min_select ?? (isRequired ? 1 : 0);
    const maxSelect = proposal.max_select ?? 1;
    if (!name || typeof proposal.is_required !== 'boolean' || typeof minSelect !== 'number' || typeof maxSelect !== 'number' || !Number.isInteger(minSelect) || !Number.isInteger(maxSelect) || minSelect < 0 || maxSelect < 1 || minSelect > maxSelect || maxSelect > 50 || !Array.isArray(proposal.options) || proposal.options.length < 1 || proposal.options.length > 50) {
      return response({ error: 'Invalid modifier group proposal' }, 400);
    }
    const options = proposal.options.map((raw, index) => {
      if (!isObject(raw) || !hasOnly(raw, ['name', 'price', 'ingredient_id', 'nested_group_id', 'emoji', 'image_url', 'sort_order'])) throw new Error('INVALID_MODIFIERS');
      const optionName = cleanText(raw.name, 120);
      const price = raw.price ?? 0;
      const ingredientId = nullableUuid(raw.ingredient_id);
      const nestedGroupId = nullableUuid(raw.nested_group_id);
      const sortOrder = raw.sort_order ?? index;
      if ((raw.emoji !== undefined && raw.emoji !== null && typeof raw.emoji !== 'string') || (raw.image_url !== undefined && raw.image_url !== null && typeof raw.image_url !== 'string')) throw new Error('INVALID_MODIFIERS');
      if (!optionName || typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 999999999 || ingredientId === undefined || nestedGroupId === undefined || typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) throw new Error('INVALID_MODIFIERS');
      return { name: optionName, price, ingredient_id: ingredientId, nested_group_id: nestedGroupId, emoji: cleanText(raw.emoji, 20) || null, image_url: cleanText(raw.image_url, 1000) || null, sort_order: sortOrder };
    });
    if (new Set(options.map((item) => item.name.toLocaleLowerCase('es'))).size !== options.length) return response({ error: 'Modifier option names must be unique within the group' }, 400);
    const rawLocationIds = proposal.location_ids === undefined ? (locationId ? [locationId] : []) : proposal.location_ids;
    if (!Array.isArray(rawLocationIds) || rawLocationIds.length > 25 || rawLocationIds.some((id) => typeof id !== 'string' || !UUID.test(id))) return response({ error: 'Invalid location_ids' }, 400);
    const locationIds = [...new Set(rawLocationIds as string[])];
    if (locationIds.length) {
      const { data: valid, error } = await admin.from('locations').select('id').eq('brand_id', brandId).in('id', locationIds);
      if (error) throw error;
      if ((valid || []).length !== locationIds.length) return response({ error: 'A selected location does not belong to this brand' }, 400);
    }
    const ingredientIds = [...new Set(options.map((item) => item.ingredient_id).filter(Boolean) as string[])];
    const nestedGroupIds = [...new Set(options.map((item) => item.nested_group_id).filter(Boolean) as string[])];
    if (ingredientIds.length) {
      const { data: valid, error } = await admin.from('ingredients').select('id').eq('brand_id', brandId).in('id', ingredientIds);
      if (error) throw error;
      if ((valid || []).length !== ingredientIds.length) return response({ error: 'An ingredient does not belong to this brand' }, 400);
    }
    if (nestedGroupIds.length) {
      const { data: valid, error } = await admin.from('modifier_groups').select('id').eq('brand_id', brandId).in('id', nestedGroupIds);
      if (error) throw error;
      if ((valid || []).length !== nestedGroupIds.length) return response({ error: 'A nested group does not belong to this brand' }, 400);
    }
    const { data: duplicate, error: duplicateError } = await admin.from('modifier_groups').select('id,name').eq('brand_id', brandId).ilike('name', name).limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicate?.length) return response({ error: 'A modifier group with this name already exists', existing: duplicate[0] }, 409);
    const groupPayload = { brand_id: brandId, name, description, is_required: isRequired, min_select: minSelect, max_select: maxSelect, is_submodifier: isSubmodifier };
    await createTrace({ title: `Crear grupo de modificadores ${name}`, summary: `Aluna creará el grupo y ${options.length} opción(es) aprobadas para ${brand.name}.`, risk: 'medium', entityType: 'modifier_group', operation: 'create', proposed: { ...groupPayload, options, location_ids: locationIds } });
    const { data: group, error: groupError } = await admin.from('modifier_groups').insert(groupPayload).select('*').single();
    if (groupError) throw groupError;
    const { data: savedOptions, error: optionsError } = await admin.from('modifier_options').insert(options.map((item) => ({ ...item, group_id: group.id }))).select('*');
    const links = locationIds.map((id) => ({ location_id: id, modifier_group_id: group.id }));
    const { error: linksError } = !optionsError && links.length ? await admin.from('location_modifier_groups').insert(links) : { error: null };
    const partial = Boolean(optionsError || linksError);
    const result = { modifier_group: group, options: savedOptions || [], linked_location_ids: linksError ? [] : locationIds, options_error: optionsError?.message || null, link_error: linksError?.message || null };
    await completeTrace(group.id, result, partial);
    return response({ success: !partial, partial, change_set_id: changeSetId, ...result }, partial ? 207 : 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'INVALID_HOURS') return response({ error: 'Invalid business hours proposal' }, 400);
    if (message === 'INVALID_MODIFIERS') return response({ error: 'Invalid modifier option proposal' }, 400);
    console.error('aluna-operations-action error', message);
    if (admin && brandId && actorId && changeSetId) {
      const executedAt = new Date().toISOString();
      await Promise.allSettled([
        actionId ? admin.from('agent_actions').update({ status: 'failed', error_message: message.slice(0, 500), executed_at: executedAt }).eq('id', actionId) : Promise.resolve(),
        admin.from('agent_change_sets').update({ status: 'failed', executed_at: executedAt }).eq('id', changeSetId),
        admin.from('agent_audit_log').insert({ brand_id: brandId, location_id: locationId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'action_failed', event_data: { message: message.slice(0, 500) } }),
      ]);
    }
    return response({ error: 'No fue posible ejecutar la acción operativa de Aluna' }, 500);
  }
});
