// @ts-ignore: Supabase Edge Functions run on Deno.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(['batch_stock_entry', 'generate_shopping_list']);
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);

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

    if (!brandId || !UUID.test(brandId) || !ACTIONS.has(actionName)) {
      return response({ error: 'Invalid brand_id or action' }, 400);
    }
    if (actionName === 'batch_stock_entry' && (body.approved !== true || !isObject(body.proposal))) {
      return response({ error: 'batch_stock_entry requires approval and proposal' }, 400);
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
      || (profile?.brand_id === brandId && ALLOWED_ROLES.has(profile?.role));
    if (!canManage) return response({ error: 'Forbidden for this brand' }, 403);

    if (idempotencyKey) {
      const { data: previous } = await admin.from('agent_actions')
        .select('id,change_set_id,status,result_data,error_message')
        .eq('brand_id', brandId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (previous?.status === 'completed') {
        return response({ success: true, replayed: true, result: previous.result_data });
      }
      if (previous) {
        return response({ error: 'Action with this idempotency key already exists', previous }, 409);
      }
    }

    // ─── ACTION 1: GENERATE SHOPPING LIST (READ / ADVISORY) ───
    if (actionName === 'generate_shopping_list') {
      const { data: ingredients, error: ingError } = await admin
        .from('ingredients')
        .select('id,name,purchase_price,purchase_quantity,purchase_unit,usage_unit,unit_cost,stock_current,stock_min')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('name');
      if (ingError) throw ingError;

      const itemsNeeded = (ingredients || [])
        .filter((ing) => (ing.stock_current ?? 0) <= (ing.stock_min ?? 0))
        .map((ing) => {
          const current = Number(ing.stock_current) || 0;
          const min = Number(ing.stock_min) || 0;
          const targetMultiplier = 2;
          const needed = Math.max(1, Math.ceil(min * targetMultiplier - current));
          const unitCost = Number(ing.unit_cost) || 0;
          const purchasePrice = Number(ing.purchase_price) || (unitCost * (Number(ing.purchase_quantity) || 1));
          const estimatedCost = Math.round(needed * unitCost);

          return {
            id: ing.id,
            name: ing.name,
            stock_current: current,
            stock_min: min,
            quantity_needed: needed,
            usage_unit: ing.usage_unit || 'unidad',
            estimated_cost: estimatedCost,
          };
        });

      const totalEstimatedCost = itemsNeeded.reduce((acc, curr) => acc + curr.estimated_cost, 0);
      const formattedLines = itemsNeeded.map(
        (item) => `• ${item.name}: ${item.quantity_needed} ${item.usage_unit} (Stock actual: ${item.stock_current} / Mínimo: ${item.stock_min})`
      );

      const formattedText = itemsNeeded.length > 0
        ? `🛒 *Lista de Mercado Sugerida por Aluna*\n\n` +
          formattedLines.join('\n') +
          `\n\n*Total estimado:* $ ${totalEstimatedCost.toLocaleString('es-CO')} COP`
        : 'Todos los insumos tienen stock por encima del nivel mínimo configurado.';

      return response({
        success: true,
        items_count: itemsNeeded.length,
        items: itemsNeeded,
        total_estimated_cost: totalEstimatedCost,
        formatted_text: formattedText,
      });
    }

    // ─── ACTION 2: BATCH STOCK ENTRY (WRITE WITH AUDIT TRACE) ───
    if (actionName === 'batch_stock_entry') {
      const proposal = body.proposal as JsonObject;
      const entries = proposal?.entries;
      if (!Array.isArray(entries) || entries.length === 0 || entries.length > 50) {
        return response({ error: 'entries must be an array between 1 and 50 items' }, 400);
      }

      const parsedEntries = [];
      for (const raw of entries) {
        if (!isObject(raw)) throw new Error('INVALID_ENTRY');
        const id = nullableUuid(raw.ingredient_id);
        const name = cleanText(raw.ingredient_name, 120);
        const added = Number(raw.quantity_added);
        const unitCost = raw.unit_cost !== undefined ? Number(raw.unit_cost) : null;
        if ((!id && !name) || !Number.isFinite(added) || added <= 0 || added > 1_000_000) {
          throw new Error('INVALID_ENTRY');
        }
        parsedEntries.push({ id, name, added, unitCost });
      }

      // Fetch existing ingredients for this brand
      const ids = parsedEntries.map((e) => e.id).filter(Boolean) as string[];
      let existingIngredients: Array<JsonObject> = [];
      if (ids.length > 0) {
        const { data: byIds, error: idErr } = await admin
          .from('ingredients')
          .select('id,name,stock_current,stock_min,usage_unit,unit_cost')
          .eq('brand_id', brandId)
          .in('id', ids);
        if (idErr) throw idErr;
        existingIngredients = byIds || [];
      }

      // Also search by name if ID was missing
      const missingNameEntries = parsedEntries.filter((e) => !e.id && e.name);
      if (missingNameEntries.length > 0) {
        const { data: allActive, error: nameErr } = await admin
          .from('ingredients')
          .select('id,name,stock_current,stock_min,usage_unit,unit_cost')
          .eq('brand_id', brandId)
          .eq('is_active', true);
        if (nameErr) throw nameErr;

        for (const entry of missingNameEntries) {
          const match = (allActive || []).find(
            (i) => String(i.name).toLowerCase().trim() === entry.name.toLowerCase()
          );
          if (match) {
            entry.id = match.id as string;
            existingIngredients.push(match);
          }
        }
      }

      const ingMap = new Map(existingIngredients.map((i) => [i.id, i]));
      const resolvedUpdates = [];
      for (const entry of parsedEntries) {
        if (!entry.id || !ingMap.has(entry.id)) {
          return response({ error: `Insumo no encontrado: ${entry.name || entry.id}` }, 404);
        }
        const currentIng = ingMap.get(entry.id)!;
        const currentStock = Number(currentIng.stock_current) || 0;
        const newStock = currentStock + entry.added;
        resolvedUpdates.push({
          id: entry.id,
          name: currentIng.name,
          usage_unit: currentIng.usage_unit || 'unidad',
          before_stock: currentStock,
          added: entry.added,
          after_stock: newStock,
          unit_cost: entry.unitCost ?? currentIng.unit_cost,
        });
      }

      const approvedAt = new Date().toISOString();

      // Create trace
      const { data: changeSet, error: csError } = await admin.from('agent_change_sets').insert({
        brand_id: brandId,
        location_id: locationId,
        created_by: actorId,
        approved_by: actorId,
        approved_at: approvedAt,
        title: `Entrada masiva de stock (${resolvedUpdates.length} insumos)`,
        summary: `Aluna registrará el ingreso de ${resolvedUpdates.length} insumos al inventario de ${brand.name}.`,
        status: 'executing',
        risk_level: 'medium',
        proposed_actions: [{ tool: 'batch_stock_entry', data: { entries: resolvedUpdates } }],
        approval_snapshot: { approved: true, approved_at: approvedAt, entries: resolvedUpdates },
      }).select('id').single();
      if (csError) throw csError;
      changeSetId = changeSet.id;

      const { data: action, error: actError } = await admin.from('agent_actions').insert({
        change_set_id: changeSet.id,
        brand_id: brandId,
        location_id: locationId,
        sequence: 1,
        tool_name: 'batch_stock_entry',
        entity_type: 'ingredients',
        operation: 'update',
        status: 'executing',
        before_data: { ingredients: resolvedUpdates.map((u) => ({ id: u.id, stock: u.before_stock })) },
        proposed_data: { entries: resolvedUpdates },
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      }).select('id').single();
      if (actError) throw actError;
      actionId = action.id;

      await admin.from('agent_audit_log').insert([
        { brand_id: brandId, location_id: locationId, change_set_id: changeSet.id, action_id: action.id, actor_id: actorId, event_type: 'approved', event_data: { entries: resolvedUpdates } },
        { brand_id: brandId, location_id: locationId, change_set_id: changeSet.id, action_id: action.id, actor_id: actorId, event_type: 'execution_started', event_data: {} },
      ]);

      // Apply updates to ingredients table
      const updatedRows = [];
      for (const update of resolvedUpdates) {
        const updatePayload: JsonObject = { stock_current: update.after_stock };
        if (update.unit_cost !== null && update.unit_cost !== undefined) {
          updatePayload.unit_cost = update.unit_cost;
        }
        const { data: saved, error: updateError } = await admin
          .from('ingredients')
          .update(updatePayload)
          .eq('id', update.id)
          .eq('brand_id', brandId)
          .select('id,name,stock_current,stock_min,usage_unit,unit_cost')
          .single();
        if (updateError) throw updateError;
        updatedRows.push(saved);

        // Also sync location_inventory if locationId is given
        if (locationId) {
          const { data: locInv } = await admin
            .from('location_inventory')
            .select('id,stock_quantity')
            .eq('location_id', locationId)
            .eq('ingredient_id', update.id)
            .maybeSingle();

          if (locInv) {
            await admin
              .from('location_inventory')
              .update({ stock_quantity: (Number(locInv.stock_quantity) || 0) + update.added })
              .eq('id', locInv.id);
          }
        }
      }

      const executedAt = new Date().toISOString();
      await Promise.all([
        admin.from('agent_actions').update({ status: 'completed', result_data: { entries: updatedRows }, executed_at: executedAt }).eq('id', actionId),
        admin.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSetId),
        admin.from('agent_audit_log').insert({ brand_id: brandId, location_id: locationId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'action_completed', event_data: { entries: updatedRows } }),
      ]);

      return response({
        success: true,
        change_set_id: changeSetId,
        updated_ingredients: updatedRows,
      });
    }

    return response({ error: 'Acción no soportada' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('aluna-inventory-action error', message);
    if (admin && brandId && actorId && changeSetId) {
      const executedAt = new Date().toISOString();
      await Promise.allSettled([
        actionId ? admin.from('agent_actions').update({ status: 'failed', error_message: message.slice(0, 500), executed_at: executedAt }).eq('id', actionId) : Promise.resolve(),
        admin.from('agent_change_sets').update({ status: 'failed', executed_at: executedAt }).eq('id', changeSetId),
        admin.from('agent_audit_log').insert({ brand_id: brandId, location_id: locationId, change_set_id: changeSetId, action_id: actionId, actor_id: actorId, event_type: 'action_failed', event_data: { message: message.slice(0, 500) } }),
      ]);
    }
    return response({ error: 'No fue posible ejecutar la acción de inventario de Aluna' }, 500);
  }
});
