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
    if (!UUID_PATTERN.test(brandId || '') || !['create_location', 'create_catalog', 'consolidate_categories'].includes(body.action) || body.approved !== true) {
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

    if (body.action === 'consolidate_categories') {
      const sourceId = body.proposal?.source_category_id;
      const targetId = body.proposal?.target_category_id;
      if (!UUID_PATTERN.test(sourceId || '') || !UUID_PATTERN.test(targetId || '') || sourceId === targetId) return jsonResponse({ error: 'Invalid category selection' }, 400);
      const { data: categories, error: categoriesError } = await admin.from('categories').select('*').eq('brand_id', brandId).in('id', [sourceId, targetId]);
      if (categoriesError) throw categoriesError;
      const source = categories?.find((category) => category.id === sourceId);
      const target = categories?.find((category) => category.id === targetId);
      if (!source || !target) return jsonResponse({ error: 'Categories do not belong to this brand' }, 400);
      const { count: productCount, error: countError } = await admin.from('products').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('category_id', sourceId);
      if (countError) throw countError;
      const approvedAt = new Date().toISOString();
      const { data: changeSet, error: changeSetError } = await admin.from('agent_change_sets').insert({
        brand_id: brandId, created_by: userData.user.id, approved_by: userData.user.id, approved_at: approvedAt,
        title: `Consolidar ${source.name} en ${target.name}`,
        summary: `Mover ${productCount || 0} producto(s) y desactivar la categoría duplicada.`,
        status: 'executing', risk_level: 'high',
        proposed_actions: [{ tool: 'consolidate_categories', source_category_id: sourceId, target_category_id: targetId, product_count: productCount || 0 }],
        approval_snapshot: { approved: true, approved_at: approvedAt, source, target, product_count: productCount || 0 },
      }).select('id').single();
      if (changeSetError) throw changeSetError;
      const { data: action, error: actionError } = await admin.from('agent_actions').insert({
        change_set_id: changeSet.id, brand_id: brandId, sequence: 1, tool_name: 'consolidate_categories', entity_type: 'category', entity_id: sourceId,
        operation: 'deactivate', status: 'executing', before_data: { source, target }, proposed_data: { source_category_id: sourceId, target_category_id: targetId, product_count: productCount || 0 },
      }).select('id').single();
      if (actionError) throw actionError;
      await admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSet.id, action_id: action.id, actor_id: userData.user.id, event_type: 'approved', event_data: { source, target, product_count: productCount || 0 } });

      const [{ error: productsError }, { data: sourceLinks, error: linksError }, { data: targetLinks }] = await Promise.all([
        admin.from('products').update({ category_id: targetId }).eq('brand_id', brandId).eq('category_id', sourceId),
        admin.from('location_categories').select('location_id,is_active').eq('category_id', sourceId),
        admin.from('location_categories').select('location_id').eq('category_id', targetId),
      ]);
      if (productsError || linksError) throw productsError || linksError;
      const targetLocationIds = new Set((targetLinks || []).map((link) => link.location_id));
      const missingTargetLinks = (sourceLinks || []).filter((link) => link.is_active !== false && !targetLocationIds.has(link.location_id)).map((link) => ({ location_id: link.location_id, category_id: targetId, is_active: true }));
      await Promise.all([
        admin.from('categories').update({ is_active: false }).eq('id', sourceId).eq('brand_id', brandId),
        admin.from('location_categories').update({ is_active: false }).eq('category_id', sourceId),
        ...(missingTargetLinks.length ? [admin.from('location_categories').insert(missingTargetLinks)] : []),
      ]);
      const executedAt = new Date().toISOString();
      await Promise.all([
        admin.from('agent_actions').update({ status: 'completed', result_data: { moved_products: productCount || 0, source_deactivated: true, target_category_id: targetId }, executed_at: executedAt }).eq('id', action.id),
        admin.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSet.id),
        admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSet.id, action_id: action.id, actor_id: userData.user.id, event_type: 'completed', event_data: { moved_products: productCount || 0, source_category_id: sourceId, target_category_id: targetId } }),
      ]);
      return jsonResponse({ success: true, change_set_id: changeSet.id, source_category: source, target_category: target, moved_products: productCount || 0 });
    }

    if (body.action === 'create_catalog') {
      const proposal = body.proposal || {};
      const categoryName = typeof proposal.category_name === 'string' ? proposal.category_name.trim().slice(0, 100) : '';
      const rawProducts = Array.isArray(proposal.products) ? proposal.products.slice(0, 10) : [];
      const products = rawProducts.map((item: Record<string, unknown>) => ({
        name: typeof item.name === 'string' ? item.name.trim().slice(0, 120) : '',
        description: typeof item.description === 'string' ? item.description.trim().slice(0, 800) : '',
        price: Number(item.price),
        tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 10) : [],
        requires_kitchen: item.requires_kitchen !== false,
      }));
      if (!categoryName || products.length === 0 || products.some((item) => !item.name || !item.description || !Number.isFinite(item.price) || item.price <= 0)) {
        return jsonResponse({ error: 'Category and complete product data are required' }, 400);
      }

      const baseSlug = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'categoria';
      const { data: matchingCategories, error: matchingCategoryError } = await admin
        .from('categories')
        .select('*')
        .eq('brand_id', brandId)
        .ilike('name', categoryName)
        .limit(1);
      if (matchingCategoryError) throw matchingCategoryError;
      const existingCategory = matchingCategories?.[0] || null;
      const shouldCreateCategory = !existingCategory;
      const slug = existingCategory?.slug || baseSlug;
      const categoryProposal = { brand_id: brandId, name: categoryName, slug, icon: '🍽️', is_active: true };
      const productProposals = products.map((item) => ({
        ...item,
        brand_id: brandId,
        category_id: null,
        cost: 0,
        margin: 0,
        stock_status: 'in',
        is_active: true,
        is_addon: false,
      }));
      const approvedAt = new Date().toISOString();
      const { data: changeSet, error: changeSetError } = await admin.from('agent_change_sets').insert({
        brand_id: brandId,
        created_by: userData.user.id,
        approved_by: userData.user.id,
        approved_at: approvedAt,
        title: `${shouldCreateCategory ? 'Crear' : 'Usar'} categoría ${categoryName} y crear ${products.length} producto(s)`,
        summary: `Aluna ${shouldCreateCategory ? 'creará' : 'reutilizará'} la categoría y agregará el catálogo aprobado para ${brand.name}.`,
        status: 'executing',
        risk_level: 'medium',
        proposed_actions: [...(shouldCreateCategory ? [{ tool: 'create_category', data: categoryProposal }] : []), ...productProposals.map((data) => ({ tool: 'create_product', data }))],
        approval_snapshot: { approved: true, approved_at: approvedAt, category: categoryProposal, reused_category_id: existingCategory?.id || null, products: productProposals },
      }).select('id').single();
      if (changeSetError) throw changeSetError;

      const productSequenceStart = shouldCreateCategory ? 2 : 1;
      const actionRows = [
        ...(shouldCreateCategory ? [{ change_set_id: changeSet.id, brand_id: brandId, sequence: 1, tool_name: 'create_category', entity_type: 'category', operation: 'create', status: 'executing', proposed_data: categoryProposal }] : []),
        ...productProposals.map((data, index) => ({ change_set_id: changeSet.id, brand_id: brandId, sequence: index + productSequenceStart, tool_name: 'create_product', entity_type: 'product', operation: 'create', status: 'executing', proposed_data: data })),
      ];
      const { data: actions, error: actionsError } = await admin.from('agent_actions').insert(actionRows).select('id,sequence');
      if (actionsError) throw actionsError;
      await admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSet.id, actor_id: userData.user.id, event_type: 'approved', event_data: { category: categoryProposal, reused_category_id: existingCategory?.id || null, product_count: products.length } });

      let category = existingCategory;
      if (!category) {
        const { data: createdCategory, error: categoryError } = await admin.from('categories').insert(categoryProposal).select('*').single();
        if (categoryError) throw categoryError;
        category = createdCategory;
      }
      const finalProductPayloads = productProposals.map((item) => ({ ...item, category_id: category.id }));
      const { data: createdProducts, error: productsError } = await admin.from('products').insert(finalProductPayloads).select('*');
      if (productsError) throw productsError;
      const savedProducts = createdProducts || [];

      const { data: activeLocations } = await admin.from('locations').select('id').eq('brand_id', brandId).eq('is_active', true);
      if (activeLocations?.length) {
        await Promise.all([
          ...(shouldCreateCategory ? [admin.from('location_categories').insert(activeLocations.map((location) => ({ location_id: location.id, category_id: category.id, is_active: true })))] : []),
          admin.from('location_product_status').insert(activeLocations.flatMap((location) => savedProducts.map((product) => ({ location_id: location.id, product_id: product.id, is_active: true, stock_status: 'in' })))),
          admin.from('location_product_prices').insert(activeLocations.flatMap((location) => savedProducts.map((product) => ({ location_id: location.id, product_id: product.id, price: product.price })))),
        ]);
      }

      const executedAt = new Date().toISOString();
      const actionBySequence = new Map((actions || []).map((action: { id: string; sequence: number }) => [action.sequence, action.id]));
      await Promise.all([
        ...(shouldCreateCategory ? [admin.from('agent_actions').update({ status: 'completed', entity_id: category.id, result_data: category, executed_at: executedAt }).eq('id', actionBySequence.get(1))] : []),
        ...savedProducts.map((product, index) => admin.from('agent_actions').update({ status: 'completed', entity_id: product.id, result_data: product, executed_at: executedAt }).eq('id', actionBySequence.get(index + productSequenceStart))),
        admin.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSet.id),
        admin.from('agent_audit_log').insert({ brand_id: brandId, change_set_id: changeSet.id, actor_id: userData.user.id, event_type: 'completed', event_data: { category_id: category.id, product_ids: savedProducts.map((product) => product.id) } }),
      ]);

      return jsonResponse({ success: true, change_set_id: changeSet.id, category, category_reused: !shouldCreateCategory, products: savedProducts, linked_locations: activeLocations?.length || 0 });
    }

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
