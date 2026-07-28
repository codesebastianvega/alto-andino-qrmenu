import { supabase } from '../config/supabase';

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

export async function executeAlunaAction({ brandId, action, proposal }) {
  const { data, error } = await supabase.functions.invoke('aluna-agent-action', {
    body: { brand_id: brandId, action, proposal, approved: true },
  });
  if (error) throw new Error(error.message || 'No fue posible ejecutar la acción.');
  if (data?.error) throw new Error(data.error);
  return data;
}
