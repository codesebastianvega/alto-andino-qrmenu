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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const authorization = req.headers.get('Authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);

    const body = await req.json();
    const brandId = body.brand_id;
    if (!UUID_PATTERN.test(brandId || '') || body.action !== 'create_location' || body.approved !== true) {
      return jsonResponse({ error: 'Invalid or unapproved action' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Supabase environment is incomplete');

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse({ error: 'Invalid session' }, 401);

    const [{ data: brand }, { data: profile }] = await Promise.all([
      admin.from('brands').select('id,name,owner_id').eq('id', brandId).maybeSingle(),
      admin.from('profiles').select('id,brand_id,role').eq('id', userData.user.id).maybeSingle(),
    ]);
    if (!brand) return jsonResponse({ error: 'Brand not found' }, 404);
    const allowedRoles = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
    const canManage = brand.owner_id === userData.user.id
      || profile?.role === 'superadmin'
      || (profile?.brand_id === brandId && allowedRoles.has(profile?.role));
    if (!canManage) return jsonResponse({ error: 'Forbidden for this brand' }, 403);

    const proposal = body.proposal || {};
    const name = typeof proposal.name === 'string' ? proposal.name.trim().slice(0, 120) : '';
    const address = typeof proposal.address === 'string' ? proposal.address.trim().slice(0, 240) : '';
    const phone = typeof proposal.phone === 'string' ? proposal.phone.trim().slice(0, 40) : '';
    const whatsapp = typeof proposal.whatsapp === 'string' ? proposal.whatsapp.trim().slice(0, 40) : '';
    if (!name || !address) return jsonResponse({ error: 'Name and address are required' }, 400);

    const { count: activeLocationCount, error: countError } = await admin
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);
    if (countError) throw countError;

    const locationPayload = {
      brand_id: brandId,
      name,
      address,
      phone: phone || null,
      whatsapp: whatsapp || phone || null,
      is_main: (activeLocationCount || 0) === 0,
      is_active: true,
      operational_modes: ['dine_in', 'takeaway', 'delivery'],
      delivery_radius_km: 5,
      independent_payments: false,
    };
    const approvedAt = new Date().toISOString();
    const { data: changeSet, error: changeSetError } = await admin.from('agent_change_sets').insert({
      brand_id: brandId,
      created_by: userData.user.id,
      approved_by: userData.user.id,
      approved_at: approvedAt,
      title: `Crear sede ${name}`,
      summary: `Aluna creará una sede activa para ${brand.name}.`,
      status: 'executing',
      risk_level: 'medium',
      proposed_actions: [{ tool: 'create_location', data: locationPayload }],
      approval_snapshot: { approved: true, approved_at: approvedAt, proposal: locationPayload },
    }).select('id').single();
    if (changeSetError) throw changeSetError;

    const { data: action, error: actionError } = await admin.from('agent_actions').insert({
      change_set_id: changeSet.id,
      brand_id: brandId,
      sequence: 1,
      tool_name: 'create_location',
      entity_type: 'location',
      operation: 'create',
      status: 'executing',
      proposed_data: locationPayload,
    }).select('id').single();
    if (actionError) throw actionError;

    await admin.from('agent_audit_log').insert([
      { brand_id: brandId, change_set_id: changeSet.id, action_id: action.id, actor_id: userData.user.id, event_type: 'approved', event_data: { proposal: locationPayload } },
      { brand_id: brandId, change_set_id: changeSet.id, action_id: action.id, actor_id: userData.user.id, event_type: 'execution_started', event_data: {} },
    ]);

    const { data: location, error: locationError } = await admin.from('locations').insert(locationPayload).select('*').single();
    if (locationError) {
      await Promise.all([
        admin.from('agent_actions').update({ status: 'failed', error_message: locationError.message, executed_at: new Date().toISOString() }).eq('id', action.id),
        admin.from('agent_change_sets').update({ status: 'failed', executed_at: new Date().toISOString() }).eq('id', changeSet.id),
        admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSet.id, action_id: action.id, actor_id: userData.user.id, event_type: 'action_failed', event_data: { message: locationError.message } }),
      ]);
      return jsonResponse({ error: 'No fue posible crear la sede' }, 500);
    }

    const defaultHours = Array.from({ length: 7 }, (_, day) => ({
      brand_id: brandId,
      location_id: location.id,
      day_of_week: day,
      open_time: '08:00',
      close_time: '22:00',
      is_closed: false,
    }));
    const { error: hoursError } = await admin.from('business_hours').insert(defaultHours);
    const executedAt = new Date().toISOString();
    await Promise.all([
      admin.from('agent_actions').update({ status: 'completed', entity_id: location.id, result_data: { location, default_hours_created: !hoursError }, executed_at: executedAt }).eq('id', action.id),
      admin.from('agent_change_sets').update({ status: hoursError ? 'partially_failed' : 'completed', location_id: location.id, executed_at: executedAt }).eq('id', changeSet.id),
      admin.from('agent_audit_log').insert({ brand_id: brandId, location_id: location.id, change_set_id: changeSet.id, action_id: action.id, actor_id: userData.user.id, event_type: 'action_completed', event_data: { location_id: location.id, default_hours_created: !hoursError } }),
    ]);

    return jsonResponse({
      success: true,
      change_set_id: changeSet.id,
      location,
      default_hours_created: !hoursError,
      warning: hoursError ? 'La sede fue creada, pero debes configurar sus horarios.' : null,
    });
  } catch (error) {
    console.error('aluna-agent-action error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'No fue posible ejecutar la acción de Aluna' }, 500);
  }
});
