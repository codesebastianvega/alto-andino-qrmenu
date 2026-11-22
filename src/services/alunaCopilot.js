import { supabase } from '../config/supabase';
import { buildPriceUpdateBody } from '../utils/alunaPriceUpdate';
import { buildHoursUpdateBody } from '../utils/alunaHours';
import { assertVisibilityTask, buildGlobalVisibilityBody, buildLocationVisibilityUpdate } from '../utils/alunaVisibility';
import { buildPurchaseBody } from '../utils/alunaPurchase';
import { inventoryCapability, INVENTORY_CONTRACT } from '../../supabase/functions/_shared/alunaInventoryRules.js';

export async function loadAlunaPurchaseContext(brandId) {
  const brandResult = await supabase.from('brands').select('id,owner_id,is_active,subscription_status,trial_end_date,payment_verified,plans(id,name,slug,is_custom_pricing)').eq('id', brandId).single();
  if (brandResult.error || !brandResult.data?.plans) throw new Error('No pude comprobar tu plan. Conserva tu solicitud; no he guardado movimientos.');
  const brand = brandResult.data;
  const features = await supabase.from('plan_features').select('feature_key,is_included').eq('plan_id', brand.plans.id).eq('feature_key', 'inventory');
  if (features.error) throw new Error('No pude comprobar si tu plan permite inventario. No he guardado movimientos.');
  const capability = inventoryCapability(brand, Object.fromEntries((features.data || []).map((item) => [item.feature_key, item.is_included])));
  if (!capability.allowed) return { capability, executorReady: false };
  const userResult = await supabase.auth.getUser();
  const actor = userResult.data?.user;
  if (userResult.error || !actor) throw new Error('No pude comprobar tu sesión. No he guardado movimientos.');
  if (brand.owner_id !== actor.id) {
    const profile = await supabase.from('profiles').select('brand_id,role').eq('id', actor.id).single();
    if (profile.error || !(profile.data?.role === 'superadmin' || (profile.data?.brand_id === brandId && ['owner', 'admin', 'manager', 'encargado'].includes(profile.data?.role)))) return { capability: { ...capability, allowed: false, reason: 'permission' }, executorReady: false };
  }
  const readiness = await supabase.functions.invoke('aluna-inventory-action', { method: 'GET' });
  const executorReady = !readiness.error && readiness.data?.contract === INVENTORY_CONTRACT && readiness.data?.ready === true;
  if (!executorReady) return { capability, executorReady: false };
  const [ingredients, locations] = await Promise.all([
    supabase.from('ingredients').select('id,name,usage_unit,stock_current,unit_cost').eq('brand_id', brandId).eq('is_active', true),
    supabase.from('locations').select('id,name').eq('brand_id', brandId).eq('is_active', true),
  ]);
  if (ingredients.error || locations.error) throw new Error('No pude consultar el inventario de tu negocio. No he guardado movimientos.');
  const ids = (locations.data || []).map((item) => item.id);
  const inventory = ids.length ? await supabase.from('location_inventory').select('location_id,ingredient_id,stock_quantity').in('location_id', ids) : { data: [] };
  if (inventory.error) throw new Error('No pude consultar el stock de las sedes. No he guardado movimientos.');
  return { capability, executorReady, ingredients: ingredients.data || [], locations: locations.data || [], inventory: inventory.data || [] };
}

export async function executeAlunaPurchase(task, brandId) {
  const current = await loadAlunaPurchaseContext(brandId);
  if (!current.capability.allowed || !current.executorReady) throw new Error('El registro de compras no está disponible para tu cuenta ahora. No vuelvas a aprobar esta propuesta.');
  const { data, error } = await supabase.functions.invoke('aluna-inventory-action', { body: buildPurchaseBody(task, brandId) });
  const saved = data?.updated_ingredients?.find((item) => item.id === task.ingredient.id);
  if (error || !data?.success || data.updated_ingredients?.length !== 1 || !saved || Number(saved.stock_current) !== Number(task.ingredient.stock_current || 0) + task.normalized.added || Math.abs(Number(saved.unit_cost) - task.normalized.unit_cost) > 1e-8 || !Number.isFinite(Number(saved.unit_cost))) throw new Error('No pude confirmar la compra. Revisa el inventario antes de iniciar otra; no repetiré el movimiento a ciegas.');
  return data;
}

async function functionErrorMessage(error, fallback) {
  try {
    const payload = await error?.context?.clone?.().json();
    if (payload?.error) return payload.error;
  } catch {
    // The response body is not always available (for example, network failures).
  }
  return error?.message || fallback;
}

export async function runOpeningAudit({ brandId, locationId = null }) {
  if (!brandId) throw new Error('Selecciona una marca antes de iniciar la auditoría.');

  const { data, error } = await supabase.functions.invoke('aluna-opening-audit', {
    body: {
      brand_id: brandId,
      location_id: locationId && locationId !== 'all' ? locationId : null,
    },
  });

  if (error) {
    const isNetworkFailure = error.name === 'FunctionsFetchError'
      || /failed to send a request/i.test(error.message || '');
    throw new Error(
      isNetworkFailure
        ? 'El auditor de Aluna todavía no está publicado en Supabase.'
        : error.message || 'No fue posible ejecutar la auditoría.',
    );
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listAlunaChanges({ brandId }) {
  const { data, error } = await supabase
    .from('agent_change_sets')
    .select('id,title,summary,status,risk_level,created_at,executed_at,location_id,agent_actions(id,tool_name,status,error_message)')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message || 'No fue posible cargar el historial de Aluna.');
  return data || [];
}

export async function executeAlunaAction({ brandId, action, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-agent-action', {
    body: { brand_id: brandId, action, proposal, approved: true },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible ejecutar la acción.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function chatWithAluna({ brandId, locationId = null, message, history = [], draft = {}, features = {} }) {
  const { data, error } = await supabase.functions.invoke('aluna-agent-chat', {
    body: { brand_id: brandId, location_id: locationId, message, history, draft, features },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible conversar con Aluna.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listAlunaConversationProducts(brandId) {
  const products = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('products')
      .select('id,name,price,description,recipe_id,category_id,is_active,stock_status,updated_at')
      .eq('brand_id', brandId).eq('is_addon', false).order('id').range(offset, offset + 499);
    if (error) throw new Error('No pude consultar tu carta. Intenta de nuevo; no he guardado cambios.');
    products.push(...(data || []));
    if (!data || data.length < 500) return products;
  }
}

export async function executeAlunaKitchenAction({ brandId, locationId = null, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-kitchen-action', {
    body: { brand_id: brandId, location_id: locationId, action: 'create_costed_product', proposal, approved: true },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible ejecutar el flujo gastronómico.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function executeAlunaCatalogManagementAction({ brandId, locationId = null, action, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-catalog-management-action', {
    body: { brand_id: brandId, location_id: locationId, action, proposal, approved: true },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible actualizar el producto.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function executeAlunaPriceUpdate(input) {
  const { data, error } = await supabase.functions.invoke('aluna-catalog-management-action', {
    body: buildPriceUpdateBody(input),
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible actualizar el precio.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function executeAlunaOperationsAction({ brandId, locationId = null, action, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-operations-action', {
    body: {
      brand_id: brandId,
      location_id: locationId && locationId !== 'all' ? locationId : null,
      action,
      proposal,
      approved: true,
      idempotency_key: crypto.randomUUID(),
    },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible ejecutar la acción operativa.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function loadAlunaHoursContext(brandId) {
  const [locationsResult, hoursResult] = await Promise.all([
    supabase.from('locations').select('id,name').eq('brand_id', brandId).eq('is_active', true).order('name'),
    supabase.from('business_hours').select('location_id,day_of_week,open_time,close_time,is_closed').eq('brand_id', brandId),
  ]);
  if (locationsResult.error || hoursResult.error) throw new Error('No pude consultar las sedes y sus horarios. No he guardado cambios.');
  return { locations: locationsResult.data || [], hours: hoursResult.data || [] };
}

export async function executeAlunaHoursUpdate(task, brandId) {
  const { data, error } = await supabase.functions.invoke('aluna-operations-action', { body: buildHoursUpdateBody(task, brandId) });
  if (error || data?.error) throw new Error('No pude confirmar el guardado de los horarios. Revisa el horario actual antes de preparar otra propuesta.');
  return data;
}

export async function loadAlunaVisibilityContext(brandId) {
  const [products, locationsResult] = await Promise.all([
    listAlunaConversationProducts(brandId),
    supabase.from('locations').select('id,name').eq('brand_id', brandId).eq('is_active', true).order('name'),
  ]);
  if (locationsResult.error) throw new Error('No pude consultar las sedes.');
  const locations = locationsResult.data || [];
  const statusResult = locations.length ? await supabase.from('location_product_status').select('id,location_id,product_id,is_active,stock_status,updated_at').in('location_id', locations.map((item) => item.id)) : { data: [] };
  if (statusResult.error) throw new Error('No pude consultar la visibilidad de la sede.');
  return { products, locations, statuses: statusResult.data || [] };
}

export async function executeAlunaVisibilityUpdate(task, brandId) {
  assertVisibilityTask(task);
  // Recheck both references under the authenticated session. RLS remains enabled.
  const { data: product, error: productError } = await supabase.from('products').select('id,is_active,updated_at').eq('id', task.product.id).eq('brand_id', brandId).single();
  if (productError || !product || product.is_active !== task.product.is_active || product.updated_at !== task.product.updated_at) throw new Error('El producto cambió. Prepara una nueva propuesta.');
  if (task.global) {
    const { data, error } = await supabase.functions.invoke('aluna-catalog-management-action', { body: buildGlobalVisibilityBody(task, brandId) });
    if (error || data?.error || data?.result?.record?.id !== product.id || data.result.record.is_active !== task.target) throw new Error('No pude confirmar el cambio.');
    return data.result.record;
  }
  const { data: location, error: locationError } = await supabase.from('locations').select('id').eq('id', task.location.id).eq('brand_id', brandId).eq('is_active', true).single();
  if (locationError || !location) throw new Error('La sede ya no está disponible en este negocio.');
  const plan = buildLocationVisibilityUpdate(task, new Date().toISOString());
  let query = supabase.from('location_product_status').update(plan.changes)
    .eq('id', plan.id).eq('location_id', plan.location_id).eq('product_id', plan.product_id).eq('is_active', plan.before);
  query = plan.updated_at ? query.eq('updated_at', plan.updated_at) : query.is('updated_at', null);
  const { data: saved, error } = await query.select('id,location_id,product_id,is_active,stock_status,updated_at').single();
  if (error || saved?.is_active !== task.target || saved.product_id !== product.id || saved.location_id !== location.id) throw new Error('No pude confirmar el cambio. Revisa el estado actual.');
  return saved;
}

export async function executeAlunaBrandWebAction({ brandId, action, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-brand-web-action', {
    body: {
      brand_id: brandId,
      action,
      proposal,
      approved: true,
      idempotency_key: crypto.randomUUID(),
    },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible ejecutar el cambio web o de marca.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function executeAlunaInventoryAction({ brandId, locationId = null, action, proposal }) {
  if (action !== 'generate_shopping_list') throw new Error('Para registrar una compra necesito una propuesta vigente con cantidad y costo confirmados.');
  const availability = await loadAlunaPurchaseContext(brandId);
  if (!availability.capability.allowed || !availability.executorReady) throw new Error('La operación de inventario no está disponible para tu cuenta ahora. No he guardado movimientos.');
  const { data, error } = await supabase.functions.invoke('aluna-inventory-action', {
    body: {
      brand_id: brandId,
      location_id: locationId && locationId !== 'all' ? locationId : null,
      action,
      proposal,
      approved: true,
      idempotency_key: crypto.randomUUID(),
    },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible ejecutar la acción de inventario.'));
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function executeAlunaVenueAction({ brandId, locationId = null, action, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-venue-action', {
    body: {
      brand_id: brandId,
      location_id: locationId && locationId !== 'all' ? locationId : null,
      action,
      proposal,
      approved: true,
      idempotency_key: crypto.randomUUID(),
    },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'No fue posible gestionar mesas o áreas.'));
  if (data?.error) throw new Error(data.error);
  return data;
}



