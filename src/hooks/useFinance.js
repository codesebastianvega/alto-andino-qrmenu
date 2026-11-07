import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { toast } from '../components/Toast';
import {
  DEFAULT_DISCARDED_TEST_IDS,
  parseCustomerInfo,
  backfillUnlinkedOrders,
} from '../utils/customerSync';
import { useFinanceActions } from './finance/useFinanceActions';

const DEFAULT_ACCOUNTS = [
  { id: 'acc_cash_main', name: 'Gaveta Física (Efectivo)', type: 'cash', balance: 0, is_default: true },
  { id: 'acc_nequi_main', name: 'Nequi / Bre-B', type: 'digital_wallet', balance: 0, is_default: false },
];

export const EXPENSE_CATEGORIES = [
  { id: 'supplies', label: 'Insumos y Materia Prima', icon: 'solar:box-minimalistic-bold', color: 'emerald' },
  { id: 'payroll', label: 'Nómina y Turnos', icon: 'solar:users-group-rounded-bold', color: 'blue' },
  { id: 'rent', label: 'Arriendo de Local / Cocina', icon: 'solar:home-bold', color: 'amber' },
  { id: 'utilities', label: 'Servicios Públicos (Luz, Gas, Agua)', icon: 'solar:bolt-bold', color: 'purple' },
  { id: 'logistics', label: 'Domicilios y Logística', icon: 'solar:scooter-bold', color: 'rose' },
  { id: 'maintenance', label: 'Mantenimiento y Equipos', icon: 'solar:wrench-bold', color: 'slate' },
  { id: 'marketing', label: 'Publicidad y Redes', icon: 'solar:megaphone-bold', color: 'pink' },
  { id: 'other', label: 'Otros Gastos Menores', icon: 'solar:bill-list-bold', color: 'gray' },
];

export function useFinance() {
  const { activeBrand, profile } = useAuth();
  const { activeLocationId, isAllLocations } = useLocation();
  const brandId = activeBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [loading, setLoading] = useState(true);
  const [financialConfig, setFinancialConfig] = useState(null);
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchFinancialOrders = useCallback(async () => {
    if (!brandId) return;
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, customer_id, status, total_amount, paid_amount, payment_status, payment_method,
          customer_name, customer_phone, delivery_address, delivery_notes,
          created_at, delivered_at, location_id,
          order_items ( id, quantity, unit_price, products ( id, name ) ),
          order_payments ( id, amount, payment_method_id, payment_methods ( name, type ) )
        `)
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[useFinance] orders error:', error);
        return;
      }
      const fetched = data || [];
      setOrders(fetched);
      backfillUnlinkedOrders(brandId, fetched, new Set(DEFAULT_DISCARDED_TEST_IDS));
    } catch (err) {
      console.error('[useFinance] fetchFinancialOrders error:', err);
    }
  }, [brandId, isAllLocations, activeLocationId]);

  const fetchFinancialConfig = useCallback(async () => {
    if (!brandId) return;
    try {
      let existingFin = null;

      // 1. Capa A: restaurant_settings (concept 'financials_config')
      try {
        const { data: setRow } = await supabase
          .from('restaurant_settings')
          .select('brand_concepts')
          .eq('brand_id', brandId)
          .single();
        const concepts = Array.isArray(setRow?.brand_concepts) ? setRow.brand_concepts : [];
        const finConcept = concepts.find(c => c && c.id === 'financials_config');
        if (finConcept?.data) {
          existingFin = finConcept.data;
        }
      } catch (errSet) {
        console.warn('[useFinance] read restaurant_settings notice:', errSet);
      }

      // 2. Capa B: brands.config.financials
      if (!existingFin) {
        try {
          const { data: brandRow } = await supabase
            .from('brands')
            .select('config')
            .eq('id', brandId)
            .single();
          if (brandRow?.config?.financials) {
            existingFin = brandRow.config.financials;
          }
        } catch (errBrand) {
          console.warn('[useFinance] read brands config notice:', errBrand);
        }
      }

      // 3. Capa C: LocalStorage de emergencia (resiliencia offline/inmediata)
      if (!existingFin) {
        try {
          const cached = localStorage.getItem(`aa_financials_${brandId}`);
          if (cached) {
            existingFin = JSON.parse(cached);
          }
        } catch (errCache) {
          console.warn('[useFinance] read localStorage notice:', errCache);
        }
      }

      if (existingFin) {
        const existingDiscarded = Array.isArray(existingFin.discarded_order_ids)
          ? existingFin.discarded_order_ids
          : DEFAULT_DISCARDED_TEST_IDS;

        let cleanAccounts = (existingFin.accounts || DEFAULT_ACCOUNTS).filter(a => {
          if ((a.id === 'acc_daviplata_main' || a.id === 'acc_bold_main') && Number(a.balance || 0) === 0 && !a.manually_added) {
            return false;
          }
          return true;
        });

        if (cleanAccounts.length === 0) cleanAccounts = DEFAULT_ACCOUNTS;

        // Auto-sincronizar bolsillos existentes hacia payment_methods
        if (brandId && cleanAccounts.length > 0) {
          supabase
            .from('payment_methods')
            .select('name')
            .eq('brand_id', brandId)
            .then(({ data: existingPMs }) => {
              const existingNames = new Set((existingPMs || []).map(p => (p.name || '').toLowerCase().trim()));
              cleanAccounts.forEach(async (acc) => {
                const accName = acc.name?.trim();
                if (accName && !existingNames.has(accName.toLowerCase())) {
                  const methodType = acc.type === 'cash' ? 'cash' : (acc.type === 'bank' || acc.type === 'card' ? 'card' : 'transfer');
                  await supabase.from('payment_methods').insert([{
                    brand_id: brandId,
                    name: accName,
                    type: methodType,
                    is_active: true,
                    instructions: `Pago vía ${accName}`
                  }]);
                }
              });
            })
            .catch(err => console.warn('[useFinance] sync payment_methods error:', err));
        }

        setFinancialConfig({
          ...existingFin,
          accounts: cleanAccounts,
          discarded_order_ids: Array.from(new Set([...existingDiscarded, ...DEFAULT_DISCARDED_TEST_IDS]))
        });
      } else {
        setFinancialConfig({
          is_initialized: false,
          opening_balance: null,
          accounts: DEFAULT_ACCOUNTS,
          expenses: [],
          ledger: [],
          custom_receivables: [],
          payables: [],
          discarded_order_ids: DEFAULT_DISCARDED_TEST_IDS
        });
      }
    } catch (err) {
      console.error('[useFinance] fetchFinancialConfig error:', err);
    }
  }, [brandId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFinancialConfig(), fetchFinancialOrders()]);
    setLoading(false);
  }, [fetchFinancialConfig, fetchFinancialOrders]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const persistConfig = useCallback(async (newFinConfig) => {
    if (!brandId) return;
    setSaving(true);
    try {
      // 1. Guardar en memoria y en localStorage inmediatamente
      setFinancialConfig(newFinConfig);
      localStorage.setItem(`aa_financials_${brandId}`, JSON.stringify(newFinConfig));

      // 2. Persistir en restaurant_settings (donde los administradores y gerentes tienen acceso RLS garantizado)
      try {
        const { data: setRow } = await supabase
          .from('restaurant_settings')
          .select('id, brand_concepts')
          .eq('brand_id', brandId)
          .single();

        if (setRow) {
          let concepts = Array.isArray(setRow.brand_concepts) ? [...setRow.brand_concepts] : [];
          const idx = concepts.findIndex(c => c && c.id === 'financials_config');
          const finConcept = {
            id: 'financials_config',
            updated_at: new Date().toISOString(),
            data: newFinConfig
          };
          if (idx >= 0) concepts[idx] = finConcept;
          else concepts.push(finConcept);

          await supabase
            .from('restaurant_settings')
            .update({ brand_concepts: concepts, updated_at: new Date().toISOString() })
            .eq('id', setRow.id);
        }
      } catch (errRS) {
        console.warn('[useFinance] persist restaurant_settings notice:', errRS);
      }

      // 3. Persistir en brands.config
      try {
        const { data: brandData } = await supabase
          .from('brands')
          .select('config')
          .eq('id', brandId)
          .single();

        await supabase
          .from('brands')
          .update({ config: { ...(brandData?.config || {}), financials: newFinConfig } })
          .eq('id', brandId);
      } catch (errBrand) {
        console.warn('[useFinance] persist brands notice:', errBrand);
      }

      // 4. Sincronizar vía endpoint serverless /api/save-finances (Service Role garantizado)
      fetch('/api/save-finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, financials: newFinConfig })
      }).catch(errApi => console.warn('[useFinance] /api/save-finances async notice:', errApi));

    } catch (err) {
      console.error('[useFinance] persistConfig error:', err);
      toast.error('Error guardando datos financieros: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [brandId]);

  const accounts = useMemo(() => financialConfig?.accounts || DEFAULT_ACCOUNTS, [financialConfig]);

  const discardedSet = useMemo(() => {
    return new Set(financialConfig?.discarded_order_ids || DEFAULT_DISCARDED_TEST_IDS);
  }, [financialConfig]);

  const { activeReceivables, discardedReceivables, allReceivables } = useMemo(() => {
    const all = [];

    (orders || []).forEach(order => {
      if (order.status === 'cancelled') return;
      const isUnpaid = order.payment_status === 'pending' ||
        String(order.payment_method || '').toLowerCase().includes('fiado') ||
        String(order.delivery_notes || '').toLowerCase().includes('fiado');

      const total = Number(order.total_amount || 0);
      const paid = Number(order.paid_amount || 0);
      const remaining = Math.max(0, total - paid);

      if (isUnpaid && remaining > 0) {
        const parsed = parseCustomerInfo(order.customer_name, order.delivery_address, order.delivery_notes);
        const name = parsed.cleanName !== 'Sin nombre' ? parsed.cleanName : (order.customer_name || 'Cliente sin nombre');
        const address = parsed.address || order.delivery_address || '';

        const createdAt = new Date(order.created_at);
        const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const agingCategory = ageDays > 14 ? 'danger' : ageDays > 7 ? 'warning' : 'current';

        all.push({
          id: order.id,
          orderId: order.id,
          customerId: order.customer_id || null,
          customerName: name,
          customerPhone: order.customer_phone || '',
          address,
          totalAmount: total,
          paidAmount: paid,
          balanceDue: remaining,
          createdAt: order.created_at,
          ageDays,
          agingCategory,
          type: 'order_receivable',
          status: 'pending',
          isDiscarded: discardedSet.has(order.id)
        });
      }
    });

    (financialConfig?.custom_receivables || []).forEach(c => {
      if (c.balanceDue > 0) {
        all.push({
          ...c,
          type: 'opening_receivable',
          isDiscarded: discardedSet.has(c.id)
        });
      }
    });

    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      allReceivables: all,
      activeReceivables: all.filter(r => !r.isDiscarded),
      discardedReceivables: all.filter(r => r.isDiscarded)
    };
  }, [orders, financialConfig, discardedSet]);

  const receivables = activeReceivables;

  const expenses = useMemo(() => {
    return (financialConfig?.expenses || []).sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  }, [financialConfig]);

  const ledger = useMemo(() => {
    return (financialConfig?.ledger || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [financialConfig]);

  const metrics = useMemo(() => {
    const cashOnHand = accounts.reduce((acc, a) => acc + Number(a.balance || 0), 0);
    const totalReceivables = activeReceivables.reduce((acc, r) => acc + Number(r.balanceDue || 0), 0);

    const agingBreakdown = {
      current: activeReceivables.filter(r => r.agingCategory === 'current').reduce((s, r) => s + r.balanceDue, 0),
      warning: activeReceivables.filter(r => r.agingCategory === 'warning').reduce((s, r) => s + r.balanceDue, 0),
      danger: activeReceivables.filter(r => r.agingCategory === 'danger').reduce((s, r) => s + r.balanceDue, 0),
    };

    const payables = financialConfig?.payables || [];
    const totalPayables = payables.reduce((acc, p) => acc + Number(p.balanceDue || p.amount || 0), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date || e.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalExpensesMonth = currentMonthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const currentMonthOrders = orders.filter(o => {
      if (o.status !== 'delivered') return false;
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const grossSalesMonth = currentMonthOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
    const collectedSalesMonth = currentMonthOrders.reduce((acc, o) => acc + Number(o.paid_amount || 0), 0);
    const netProfitMonth = collectedSalesMonth - totalExpensesMonth;

    return {
      cashOnHand,
      totalReceivables,
      receivablesCount: activeReceivables.length,
      discardedCount: discardedReceivables.length,
      agingBreakdown,
      totalPayables,
      grossSalesMonth,
      collectedSalesMonth,
      totalExpensesMonth,
      netProfitMonth,
      isInitialized: Boolean(financialConfig?.is_initialized)
    };
  }, [accounts, activeReceivables, discardedReceivables, expenses, orders, financialConfig]);

  const actions = useFinanceActions({
    brandId,
    financialConfig,
    accounts,
    allReceivables,
    persistConfig,
    fetchFinancialOrders
  });

  return {
    loading,
    saving,
    accounts,
    receivables,
    activeReceivables,
    discardedReceivables,
    allReceivables,
    expenses,
    ledger,
    metrics,
    refreshAll,
    ...actions
  };
}
