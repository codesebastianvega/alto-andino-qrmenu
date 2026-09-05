import { supabase } from '../config/supabase';

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
