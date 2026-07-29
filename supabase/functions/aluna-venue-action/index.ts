// @ts-ignore: Supabase Edge Functions run on Deno.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set([
  'create_table_area',
  'create_restaurant_table',
  'update_restaurant_table',
  'update_staff_member',
]);
const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);

type JsonObject = Record<string, unknown>;
type Operation = 'create' | 'update' | 'deactivate' | 'restore';

const response = (body: JsonObject, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasOnly = (value: JsonObject, allowed: string[]) => Object.keys(value).every((key) => allowed.includes(key));
const cleanText = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const nullableUuid = (value: unknown) => value === null || value === undefined || value === ''
  ? null
  : (typeof value === 'string' && UUID.test(value) ? value : undefined);

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
  let conversationId: string | null = null;
  let changeSetId: string | null = null;
  let actionId: string | null = null;

  try {
    const body: JsonObject = await req.json();
    if (!isObject(body) || !hasOnly(body, [
      'action',
      'brand_id',
      'location_id',
      'conversation_id',
      'idempotency_key',
      'approved',
      'proposal',
    ])) {
      return response({ error: 'Unexpected request fields' }, 400);
    }

    const actionName = typeof body.action === 'string' ? body.action : '';
    brandId = typeof body.brand_id === 'string' ? body.brand_id : null;
    locationId = nullableUuid(body.location_id) ?? null;
    conversationId = nullableUuid(body.conversation_id) ?? null;
    const idempotencyKey = nullableUuid(body.idempotency_key);

    if (!brandId || !UUID.test(brandId) || !ACTIONS.has(actionName) || body.approved !== true || !isObject(body.proposal)) {
      return response({ error: 'Invalid or unapproved action' }, 400);
    }
    if (body.location_id !== undefined && nullableUuid(body.location_id) === undefined) {
      return response({ error: 'Invalid location_id' }, 400);
    }
    if (body.conversation_id !== undefined && nullableUuid(body.conversation_id) === undefined) {
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
    const canManage = brand.owner_id === actorId
      || profile?.role === 'superadmin'
      || (profile?.brand_id === brandId && MANAGER_ROLES.has(profile?.role));
    if (!canManage) return response({ error: 'Forbidden for this brand' }, 403);

    if (locationId) {
      const { data: location } = await admin.from('locations').select('id').eq('id', locationId).eq('brand_id', brandId).maybeSingle();
      if (!location) return response({ error: 'Location does not belong to this brand' }, 400);
    }
    if (conversationId) {
      const { data: conversation } = await admin.from('agent_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('brand_id', brandId)
        .eq('user_id', actorId)
        .maybeSingle();
      if (!conversation) return response({ error: 'Conversation does not belong to this user and brand' }, 400);
    }
    if (idempotencyKey) {
      const { data: previous, error: previousError } = await admin.from('agent_actions')
        .select('id,change_set_id,status,entity_id,result_data,error_message,executed_at')
        .eq('brand_id', brandId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (previousError) throw previousError;
      if (previous) {
        const replayStatus = previous.status === 'completed' ? 200 : previous.status === 'failed' ? 409 : 202;
        return response({
          success: previous.status === 'completed',
          replayed: true,
          previous,
        }, replayStatus);
      }
    }

    const proposal = body.proposal;
    const approvedAt = new Date().toISOString();

    const createTrace = async (config: {
      title: string;
      summary: string;
      risk: 'low' | 'medium' | 'high';
      entityType: string;
      operation: Operation;
      before?: JsonObject | null;
      proposed: JsonObject;
    }) => {
      const { data: changeSet, error: changeError } = await admin!.from('agent_change_sets').insert({
        conversation_id: conversationId,
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
        {
          brand_id: brandId,
          location_id: locationId,
          conversation_id: conversationId,
          change_set_id: changeSet.id,
          action_id: action.id,
          actor_id: actorId,
          event_type: 'approved',
          event_data: { proposal: config.proposed },
        },
        {
          brand_id: brandId,
          location_id: locationId,
          conversation_id: conversationId,
          change_set_id: changeSet.id,
          action_id: action.id,
          actor_id: actorId,
          event_type: 'execution_started',
          event_data: {},
        },
      ]);
      if (auditError) throw auditError;
    };

    const completeTrace = async (entityId: string, before: JsonObject | null, after: JsonObject) => {
      const executedAt = new Date().toISOString();
      const result = { before, after };
      const results = await Promise.all([
        admin!.from('agent_actions').update({
          status: 'completed',
          entity_id: entityId,
          result_data: result,
          executed_at: executedAt,
        }).eq('id', actionId),
        admin!.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSetId),
        admin!.from('agent_audit_log').insert({
          brand_id: brandId,
          location_id: locationId,
          conversation_id: conversationId,
          change_set_id: changeSetId,
          action_id: actionId,
          actor_id: actorId,
          event_type: 'action_completed',
          event_data: result,
        }),
      ]);
      const traceError = results.find((item) => item.error)?.error;
      if (traceError) throw traceError;
      return result;
    };

    if (actionName === 'create_table_area') {
      if (!locationId) return response({ error: 'location_id is required to create a table area' }, 400);
      if (!hasOnly(proposal, ['name', 'sort_order'])) return response({ error: 'Unexpected table area fields' }, 400);
      const name = cleanText(proposal.name, 100);
      const sortOrder = proposal.sort_order ?? 0;
      if (!name || typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
        return response({ error: 'Invalid table area proposal' }, 400);
      }

      const { data: duplicate, error: duplicateError } = await admin.from('table_areas')
        .select('id,name,sort_order,brand_id,location_id,created_at')
        .eq('brand_id', brandId)
        .eq('location_id', locationId)
        .ilike('name', name)
        .limit(1);
      if (duplicateError) throw duplicateError;
      if (duplicate?.length) return response({ error: 'A table area with this name already exists at this location', existing: duplicate[0] }, 409);

      const proposed = { brand_id: brandId, location_id: locationId, name, sort_order: sortOrder };
      await createTrace({
        title: `Crear área ${name}`,
        summary: `Aluna creará el área aprobada en ${brand.name}.`,
        risk: 'low',
        entityType: 'table_area',
        operation: 'create',
        proposed,
      });
      const { data: created, error: createError } = await admin.from('table_areas').insert(proposed).select('id').single();
      if (createError) throw createError;
      const { data: verified, error: verifyError } = await admin.from('table_areas')
        .select('id,name,sort_order,brand_id,location_id,created_at')
        .eq('id', created.id)
        .eq('brand_id', brandId)
        .eq('location_id', locationId)
        .single();
      if (verifyError || !verified) throw verifyError || new Error('Created table area could not be verified');
      const trace = await completeTrace(verified.id, null, verified);
      return response({ success: true, change_set_id: changeSetId, area: verified, trace });
    }

    if (actionName === 'create_restaurant_table') {
      if (!locationId) return response({ error: 'location_id is required to create a restaurant table' }, 400);
      if (!hasOnly(proposal, ['table_number', 'area_id', 'is_active'])) return response({ error: 'Unexpected restaurant table fields' }, 400);
      const tableNumber = cleanText(proposal.table_number, 40);
      const areaId = nullableUuid(proposal.area_id);
      const isActive = proposal.is_active === undefined ? true : proposal.is_active;
      if (!tableNumber || areaId === undefined || typeof isActive !== 'boolean') return response({ error: 'Invalid restaurant table proposal' }, 400);

      if (areaId) {
        const { data: area } = await admin.from('table_areas').select('id').eq('id', areaId).eq('brand_id', brandId).eq('location_id', locationId).maybeSingle();
        if (!area) return response({ error: 'Area does not belong to this brand and location' }, 400);
      }
      const { data: duplicate, error: duplicateError } = await admin.from('restaurant_tables')
        .select('id,table_number,area_id,is_active,brand_id,location_id')
        .eq('brand_id', brandId)
        .eq('location_id', locationId)
        .ilike('table_number', tableNumber)
        .limit(1);
      if (duplicateError) throw duplicateError;
      if (duplicate?.length) return response({ error: 'A table with this identifier already exists at this location', existing: duplicate[0] }, 409);

      const proposed = { brand_id: brandId, location_id: locationId, table_number: tableNumber, area_id: areaId, is_active: isActive };
      await createTrace({
        title: `Crear mesa ${tableNumber}`,
        summary: `Aluna creará la mesa aprobada en ${brand.name}.`,
        risk: 'low',
        entityType: 'restaurant_table',
        operation: 'create',
        proposed,
      });
      const { data: created, error: createError } = await admin.from('restaurant_tables').insert(proposed).select('id').single();
      if (createError) throw createError;
      const { data: verified, error: verifyError } = await admin.from('restaurant_tables')
        .select('id,table_number,area_id,is_active,physical_status,brand_id,location_id,created_at,updated_at')
        .eq('id', created.id)
        .eq('brand_id', brandId)
        .eq('location_id', locationId)
        .single();
      if (verifyError || !verified) throw verifyError || new Error('Created restaurant table could not be verified');
      const trace = await completeTrace(verified.id, null, verified);
      return response({ success: true, change_set_id: changeSetId, table: verified, trace });
    }

    if (actionName === 'update_restaurant_table') {
      if (!locationId) return response({ error: 'location_id is required to update a restaurant table' }, 400);
      if (!hasOnly(proposal, ['table_id', 'table_number', 'area_id', 'is_active'])) return response({ error: 'Unexpected restaurant table fields' }, 400);
      const tableId = nullableUuid(proposal.table_id);
      if (!tableId) return response({ error: 'A valid table_id is required' }, 400);
      if (Object.keys(proposal).length < 2) return response({ error: 'At least one restaurant table change is required' }, 400);

      const { data: before, error: beforeError } = await admin.from('restaurant_tables')
        .select('id,table_number,area_id,is_active,physical_status,brand_id,location_id,created_at,updated_at')
        .eq('id', tableId)
        .eq('brand_id', brandId)
        .eq('location_id', locationId)
        .maybeSingle();
      if (beforeError) throw beforeError;
      if (!before) return response({ error: 'Restaurant table not found in this brand and location' }, 404);

      const updates: JsonObject = { updated_at: approvedAt };
      if (proposal.table_number !== undefined) {
        const tableNumber = cleanText(proposal.table_number, 40);
        if (!tableNumber) return response({ error: 'Invalid table_number' }, 400);
        const { data: duplicate, error: duplicateError } = await admin.from('restaurant_tables')
          .select('id')
          .eq('brand_id', brandId)
          .eq('location_id', locationId)
          .ilike('table_number', tableNumber)
          .neq('id', tableId)
          .limit(1);
        if (duplicateError) throw duplicateError;
        if (duplicate?.length) return response({ error: 'A table with this identifier already exists at this location', existing: duplicate[0] }, 409);
        updates.table_number = tableNumber;
      }
      if (proposal.area_id !== undefined) {
        const areaId = nullableUuid(proposal.area_id);
        if (areaId === undefined) return response({ error: 'Invalid area_id' }, 400);
        if (areaId) {
          const { data: area } = await admin.from('table_areas').select('id').eq('id', areaId).eq('brand_id', brandId).eq('location_id', locationId).maybeSingle();
          if (!area) return response({ error: 'Area does not belong to this brand and location' }, 400);
        }
        updates.area_id = areaId;
      }
      if (proposal.is_active !== undefined) {
        if (typeof proposal.is_active !== 'boolean') return response({ error: 'is_active must be boolean' }, 400);
        updates.is_active = proposal.is_active;
      }

      const operation: Operation = proposal.is_active === false ? 'deactivate' : proposal.is_active === true && before.is_active === false ? 'restore' : 'update';
      await createTrace({
        title: `Actualizar mesa ${before.table_number}`,
        summary: `Aluna aplicará únicamente los cambios aprobados a la mesa de ${brand.name}.`,
        risk: operation === 'deactivate' ? 'medium' : 'low',
        entityType: 'restaurant_table',
        operation,
        before,
        proposed: { table_id: tableId, ...updates },
      });
      const { error: updateError } = await admin.from('restaurant_tables')
        .update(updates)
        .eq('id', tableId)
        .eq('brand_id', brandId)
        .eq('location_id', locationId);
      if (updateError) throw updateError;
      const { data: verified, error: verifyError } = await admin.from('restaurant_tables')
        .select('id,table_number,area_id,is_active,physical_status,brand_id,location_id,created_at,updated_at')
        .eq('id', tableId)
        .eq('brand_id', brandId)
        .eq('location_id', locationId)
        .single();
      if (verifyError || !verified) throw verifyError || new Error('Updated restaurant table could not be verified');
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'updated_at' && verified[key] !== value) throw new Error(`Restaurant table verification failed for ${key}`);
      }
      const trace = await completeTrace(verified.id, before, verified);
      return response({ success: true, change_set_id: changeSetId, table: verified, trace });
    }

    if (!hasOnly(proposal, ['staff_id', 'is_active'])) return response({ error: 'Staff may only be activated or deactivated' }, 400);
    const staffId = nullableUuid(proposal.staff_id);
    if (!staffId || typeof proposal.is_active !== 'boolean') return response({ error: 'A valid staff_id and boolean is_active are required' }, 400);

    const { data: before, error: beforeError } = await admin.from('staff')
      .select('id,name,role,brand_id,location_id,location_ids,access_all_locations,is_active,commission_rate')
      .eq('id', staffId)
      .eq('brand_id', brandId)
      .maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return response({ error: 'Staff member not found in this brand' }, 404);
    if (locationId && !before.access_all_locations && before.location_id !== locationId && !(before.location_ids || []).includes(locationId)) {
      return response({ error: 'Staff member is not assigned to this location' }, 403);
    }
    if (before.is_active === proposal.is_active) {
      const unchangedOperation: Operation = proposal.is_active ? 'restore' : 'deactivate';
      await createTrace({
        title: `${proposal.is_active ? 'Activar' : 'Desactivar'} a ${before.name}`,
        summary: `El estado aprobado ya estaba aplicado; Aluna verificó al integrante sin modificar su rol, acceso ni PIN.`,
        risk: 'low',
        entityType: 'staff',
        operation: unchangedOperation,
        before,
        proposed: { staff_id: staffId, is_active: proposal.is_active },
      });
      const trace = await completeTrace(before.id, before, before);
      return response({ success: true, unchanged: true, change_set_id: changeSetId, staff: before, trace });
    }

    const operation: Operation = proposal.is_active ? 'restore' : 'deactivate';
    const proposed = { staff_id: staffId, is_active: proposal.is_active };
    await createTrace({
      title: `${proposal.is_active ? 'Activar' : 'Desactivar'} a ${before.name}`,
      summary: `Aluna ${proposal.is_active ? 'activará' : 'desactivará'} al integrante aprobado sin modificar su rol, acceso ni PIN.`,
      risk: proposal.is_active ? 'medium' : 'high',
      entityType: 'staff',
      operation,
      before,
      proposed,
    });
    const { error: updateError } = await admin.from('staff')
      .update({ is_active: proposal.is_active })
      .eq('id', staffId)
      .eq('brand_id', brandId);
    if (updateError) throw updateError;
    const { data: verified, error: verifyError } = await admin.from('staff')
      .select('id,name,role,brand_id,location_id,location_ids,access_all_locations,is_active,commission_rate')
      .eq('id', staffId)
      .eq('brand_id', brandId)
      .single();
    if (verifyError || !verified || verified.is_active !== proposal.is_active) {
      throw verifyError || new Error('Staff status update could not be verified');
    }
    const trace = await completeTrace(verified.id, before, verified);
    return response({ success: true, change_set_id: changeSetId, staff: verified, trace });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('aluna-venue-action error', message);
    if (admin && brandId && actorId && changeSetId) {
      const executedAt = new Date().toISOString();
      await Promise.allSettled([
        actionId
          ? admin.from('agent_actions').update({ status: 'failed', error_message: message.slice(0, 500), executed_at: executedAt }).eq('id', actionId)
          : Promise.resolve(),
        admin.from('agent_change_sets').update({ status: 'failed', executed_at: executedAt }).eq('id', changeSetId),
        admin.from('agent_audit_log').insert({
          brand_id: brandId,
          location_id: locationId,
          conversation_id: conversationId,
          change_set_id: changeSetId,
          action_id: actionId,
          actor_id: actorId,
          event_type: 'action_failed',
          event_data: { message: message.slice(0, 500) },
        }),
      ]);
    }
    return response({ error: 'No fue posible ejecutar la acción de sedes, mesas o staff de Aluna' }, 500);
  }
});
