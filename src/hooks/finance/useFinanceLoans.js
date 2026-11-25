import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../config/supabase';

export function useFinanceLoans(brandId) {
  const [state, setState] = useState({ brandId: null, loans: [], payments: [], loading: true, error: null });
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++request.current;
    if (!brandId) { setState({ brandId, loans: [], payments: [], loading: false, error: null }); return; }
    setState(s => ({ ...(s.brandId === brandId ? s : { brandId, loans: [], payments: [] }), loading: true, error: null }));
    try {
      const readAll = async table => {
        const rows = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from(table).select('*').eq('brand_id', brandId).order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 500) return rows;
        }
      };
      const [loans, payments] = await Promise.all([readAll('finance_loans'), readAll('finance_loan_payments')]);
      if (token === request.current) setState({ brandId, loans, payments, loading: false, error: null });
    } catch (error) {
      if (token === request.current) setState(s => ({ ...s, brandId, loading: false, error: error.message || 'No se pudieron cargar los préstamos.' }));
    }
  }, [brandId]);
  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    return () => { request.current += 1; window.removeEventListener('focus', refresh); };
  }, [refresh]);
  const record = useCallback(async (id, data) => {
    const { error } = await supabase.rpc('record_finance_loan', { p_brand: brandId, p_id: id, p_data: data });
    if (error) throw error;
    await refresh();
  }, [brandId, refresh]);
  const repay = useCallback(async (loanId, id, data) => {
    const { error } = await supabase.rpc('repay_finance_loan', { p_loan: loanId, p_id: id, p_data: data });
    if (error) throw error;
    await refresh();
  }, [refresh]);
  const current = state.brandId === brandId ? state : { loans: [], payments: [], loading: Boolean(brandId), error: null };
  return { ...current, refresh, record, repay };
}
