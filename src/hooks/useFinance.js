import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { toast } from '../components/Toast';

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

const DEFAULT_DISCARDED_TEST_IDS = [
  '022afa44-0294-4396-af36-dfe47e53e409', // Sebas test $37.400
  '3f3a1096-9b2a-4267-8533-484f1a765584', // Juan Vefa test $24.200
  '91bd48a0-6baf-467b-8dd3-e170f63e4b11', // Empty test $44.000
];

export function useFinance() {
  const { activeBrand, profile } = useAuth();
  const { activeLocationId, isAllLocations } = useLocation();
  const brandId = activeBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [loading, setLoading] = useState(true);
  const [financialConfig, setFinancialConfig] = useState(null);
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  // 1. Fetch raw orders to compute real-time operational revenue and fiados
  const fetchFinancialOrders = useCallback(async () => {
    if (!brandId) return;
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, status, total_amount, paid_amount, payment_status, payment_method,
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
      setOrders(data || []);
    } catch (err) {
      console.error('[useFinance] fetchFinancialOrders error:', err);
    }
  }, [brandId, isAllLocations, activeLocationId]);

  // 2. Fetch or initialize brand financial configuration
  const fetchFinancialConfig = useCallback(async () => {
    if (!brandId) return;
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      if (error) {
        console.error('[useFinance] brand config error:', error);
        return;
      }

      const existingFin = data?.config?.financials || null;
      if (existingFin) {
        const existingDiscarded = Array.isArray(existingFin.discarded_order_ids)
          ? existingFin.discarded_order_ids
          : DEFAULT_DISCARDED_TEST_IDS;

        // Clean out legacy accounts if they have 0 balance and were not added manually
        let cleanAccounts = existingFin.accounts || DEFAULT_ACCOUNTS;
        cleanAccounts = cleanAccounts.filter(a => {
          if ((a.id === 'acc_daviplata_main' || a.id === 'acc_bold_main') && Number(a.balance || 0) === 0 && !a.manually_added) {
            return false;
          }
          return true;
        });

        if (cleanAccounts.length === 0) {
          cleanAccounts = DEFAULT_ACCOUNTS;
        }

        setFinancialConfig({
          ...existingFin,
          accounts: cleanAccounts,
          discarded_order_ids: Array.from(new Set([...existingDiscarded, ...DEFAULT_DISCARDED_TEST_IDS]))
        });
      } else {
        // Fallback or uninitialized state
        const initialTemplate = {
          is_initialized: false,
          opening_balance: null,
          accounts: DEFAULT_ACCOUNTS,
          expenses: [],
          ledger: [],
          custom_receivables: [],
          payables: [],
          discarded_order_ids: DEFAULT_DISCARDED_TEST_IDS
        };
        setFinancialConfig(initialTemplate);
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

  // 3. Helper to persist financialConfig into brands.config.financials
  const persistConfig = useCallback(async (newFinConfig) => {
    if (!brandId) return;
    setSaving(true);
    try {
      setFinancialConfig(newFinConfig);
      localStorage.setItem(`aa_financials_${brandId}`, JSON.stringify(newFinConfig));

      const { data: brandData } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      const currentConfig = brandData?.config || {};
      const updatedConfig = {
        ...currentConfig,
        financials: newFinConfig
      };

      const { error } = await supabase
        .from('brands')
        .update({ config: updatedConfig })
        .eq('id', brandId);

      if (error) throw error;
    } catch (err) {
      console.error('[useFinance] persistConfig error:', err);
      toast.error('Error guardando datos financieros: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [brandId]);

  // 4. Accounts list with calculated balance
  const accounts = useMemo(() => {
    return financialConfig?.accounts || DEFAULT_ACCOUNTS;
  }, [financialConfig]);

  // Set of discarded order IDs
  const discardedSet = useMemo(() => {
    const list = financialConfig?.discarded_order_ids || DEFAULT_DISCARDED_TEST_IDS;
    return new Set(list);
  }, [financialConfig]);

  // 5. Compute Receivables (Fiados) merging orders + initial opening receivables
  const { activeReceivables, discardedReceivables, allReceivables } = useMemo(() => {
    const all = [];

    // From orders
    (orders || []).forEach(order => {
      if (order.status === 'cancelled') return;
      const isUnpaid = order.payment_status === 'pending' ||
        String(order.payment_method || '').toLowerCase().includes('fiado') ||
        String(order.delivery_notes || '').toLowerCase().includes('fiado');

      const total = Number(order.total_amount || 0);
      const paid = Number(order.paid_amount || 0);
      const remaining = Math.max(0, total - paid);

      if (isUnpaid && remaining > 0) {
        let name = order.customer_name || 'Cliente sin nombre';
        if (order.delivery_notes && order.delivery_notes.includes('FIADO - Cuenta por cobrar:')) {
          const match = order.delivery_notes.match(/FIADO - Cuenta por cobrar:\s*([^\[]+)/);
          if (match && match[1]) name = match[1].trim();
        }

        const createdAt = new Date(order.created_at);
        const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        let agingCategory = 'current'; // 0-7 days
        if (ageDays > 14) agingCategory = 'danger'; // 15+ days
        else if (ageDays > 7) agingCategory = 'warning'; // 8-14 days

        const isDiscarded = discardedSet.has(order.id);

        all.push({
          id: order.id,
          orderId: order.id,
          customerName: name,
          customerPhone: order.customer_phone || '',
          address: order.delivery_address || '',
          totalAmount: total,
          paidAmount: paid,
          balanceDue: remaining,
          createdAt: order.created_at,
          ageDays,
          agingCategory,
          type: 'order_receivable',
          status: 'pending',
          isDiscarded
        });
      }
    });

    // From custom opening receivables (if any)
    const customRecs = financialConfig?.custom_receivables || [];
    customRecs.forEach(c => {
      if (c.balanceDue > 0) {
        const isDiscarded = discardedSet.has(c.id);
        all.push({
          ...c,
          type: 'opening_receivable',
          isDiscarded
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

  // 6. Expenses list
  const expenses = useMemo(() => {
    return (financialConfig?.expenses || []).sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  }, [financialConfig]);

  // 7. Ledger movements
  const ledger = useMemo(() => {
    return (financialConfig?.ledger || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [financialConfig]);

  // 8. Financial KPIs & Aggregates
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

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  /**
   * Completes the Opening Balance Wizard
   */
  const setInitialBalance = useCallback(async ({
    openingDate = new Date().toISOString(),
    accountsBalances = {},
    initialReceivables = [],
    initialPayables = [],
  }) => {
    if (!financialConfig) return;

    const updatedAccounts = accounts.map(acc => {
      const initBal = Number(accountsBalances[acc.id] || 0);
      return {
        ...acc,
        initial_balance: initBal,
        balance: initBal
      };
    });

    const newLedgerEntries = [];
    const timestamp = openingDate || new Date().toISOString();

    updatedAccounts.forEach(acc => {
      if (acc.balance > 0) {
        newLedgerEntries.push({
          id: `leg_${Date.now()}_${acc.id}`,
          timestamp,
          type: 'credit',
          amount: acc.balance,
          accountId: acc.id,
          accountName: acc.name,
          category: 'Asiento de Apertura',
          concept: `Saldo Inicial en ${acc.name}`,
          balanceAfter: acc.balance
        });
      }
    });

    const formattedCustomReceivables = (initialReceivables || []).map((r, idx) => ({
      id: `rec_init_${Date.now()}_${idx}`,
      customerName: r.customerName || 'Cliente Histórico',
      customerPhone: r.phone || '',
      totalAmount: Number(r.amount || 0),
      paidAmount: 0,
      balanceDue: Number(r.amount || 0),
      notes: r.notes || 'Deuda anterior a ALUNA',
      createdAt: timestamp,
      ageDays: 30,
      agingCategory: 'warning',
      status: 'pending',
      isDiscarded: false
    }));

    const formattedPayables = (initialPayables || []).map((p, idx) => ({
      id: `pay_init_${Date.now()}_${idx}`,
      supplierName: p.supplierName || 'Distribuidora / Proveedor',
      amount: Number(p.amount || 0),
      balanceDue: Number(p.amount || 0),
      notes: p.notes || 'Factura previa por pagar',
      createdAt: timestamp,
      status: 'pending'
    }));

    const newFinConfig = {
      ...financialConfig,
      is_initialized: true,
      opening_balance: {
        date: timestamp,
        totalInitialCashOnHand: updatedAccounts.reduce((s, a) => s + a.balance, 0),
        totalInitialReceivables: formattedCustomReceivables.reduce((s, r) => s + r.balanceDue, 0),
        totalInitialPayables: formattedPayables.reduce((s, p) => s + p.balanceDue, 0),
      },
      accounts: updatedAccounts,
      custom_receivables: formattedCustomReceivables,
      payables: formattedPayables,
      ledger: [...newLedgerEntries, ...(financialConfig.ledger || [])]
    };

    await persistConfig(newFinConfig);
    toast.success('¡Balance de Apertura configurado con éxito! Tu patrimonio real está cargado.');
  }, [financialConfig, accounts, persistConfig]);

  /**
   * Registers a new operational expense
   */
  const recordExpense = useCallback(async ({
    category,
    amount,
    description,
    accountId,
    beneficiary = '',
    receiptUrl = null
  }) => {
    if (!financialConfig) return;
    const expenseAmount = Number(amount || 0);
    if (expenseAmount <= 0) {
      toast.error('El monto del gasto debe ser mayor a 0');
      return;
    }

    const targetAccount = accounts.find(a => a.id === accountId) || accounts[0];
    const newAccountBalance = Math.max(0, Number(targetAccount.balance || 0) - expenseAmount);

    const updatedAccounts = accounts.map(a => {
      if (a.id === targetAccount.id) {
        return { ...a, balance: newAccountBalance };
      }
      return a;
    });

    const newExpense = {
      id: `exp_${Date.now()}`,
      category,
      amount: expenseAmount,
      description,
      beneficiary,
      receiptUrl,
      accountId: targetAccount.id,
      accountName: targetAccount.name,
      date: new Date().toISOString()
    };

    const newLedgerEntry = {
      id: `leg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'debit',
      amount: expenseAmount,
      accountId: targetAccount.id,
      accountName: targetAccount.name,
      category: 'Gasto Operativo',
      concept: `Egreso: ${description} (${category})`,
      balanceAfter: newAccountBalance
    };

    const newFinConfig = {
      ...financialConfig,
      accounts: updatedAccounts,
      expenses: [newExpense, ...(financialConfig.expenses || [])],
      ledger: [newLedgerEntry, ...(financialConfig.ledger || [])]
    };

    await persistConfig(newFinConfig);
    toast.success(`Gasto de $${expenseAmount.toLocaleString('es-CO')} registrado en ${targetAccount.name}`);
  }, [financialConfig, accounts, persistConfig]);

  /**
   * Transfers funds between pockets
   */
  const transferBetweenAccounts = useCallback(async ({
    fromAccountId,
    toAccountId,
    amount,
    notes = ''
  }) => {
    if (!financialConfig) return;
    const transferAmount = Number(amount || 0);
    if (transferAmount <= 0) {
      toast.error('El monto a transferir debe ser mayor a 0');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('La cuenta origen y destino deben ser distintas');
      return;
    }

    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc) {
      toast.error('Cuenta no encontrada');
      return;
    }

    const updatedAccounts = accounts.map(a => {
      if (a.id === fromAccountId) {
        return { ...a, balance: Math.max(0, Number(a.balance || 0) - transferAmount) };
      }
      if (a.id === toAccountId) {
        return { ...a, balance: Number(a.balance || 0) + transferAmount };
      }
      return a;
    });

    const now = new Date().toISOString();
    const ledgerOut = {
      id: `leg_xfer_out_${Date.now()}`,
      timestamp: now,
      type: 'debit',
      amount: transferAmount,
      accountId: fromAcc.id,
      accountName: fromAcc.name,
      category: 'Transferencia entre Cuentas',
      concept: `Salida hacia ${toAcc.name} ${notes ? `(${notes})` : ''}`,
      balanceAfter: Math.max(0, Number(fromAcc.balance || 0) - transferAmount)
    };

    const ledgerIn = {
      id: `leg_xfer_in_${Date.now()}`,
      timestamp: now,
      type: 'credit',
      amount: transferAmount,
      accountId: toAcc.id,
      accountName: toAcc.name,
      category: 'Transferencia entre Cuentas',
      concept: `Entrada desde ${fromAcc.name} ${notes ? `(${notes})` : ''}`,
      balanceAfter: Number(toAcc.balance || 0) + transferAmount
    };

    const newFinConfig = {
      ...financialConfig,
      accounts: updatedAccounts,
      ledger: [ledgerIn, ledgerOut, ...(financialConfig.ledger || [])]
    };

    await persistConfig(newFinConfig);
    toast.success(`Transferidos $${transferAmount.toLocaleString('es-CO')} de ${fromAcc.name} a ${toAcc.name}`);
  }, [financialConfig, accounts, persistConfig]);

  /**
   * Settles a receivable into a chosen account
   */
  const settleReceivable = useCallback(async ({
    receivableId,
    amountToPay,
    accountId,
    notes = '',
    isHistorical = false
  }) => {
    if (!financialConfig) return;
    const targetReceivable = allReceivables.find(r => r.id === receivableId);
    if (!targetReceivable) {
      toast.error('Fiado / Cartera no encontrado');
      return;
    }

    const payAmount = Number(amountToPay || targetReceivable.balanceDue);
    const targetAccount = accounts.find(a => a.id === accountId) || accounts[0];

    if (targetReceivable.orderId) {
      const newPaid = Number(targetReceivable.paidAmount || 0) + payAmount;
      const isFullyPaid = newPaid >= Number(targetReceivable.totalAmount);
      await supabase
        .from('orders')
        .update({
          paid_amount: newPaid,
          payment_status: isFullyPaid ? 'paid' : 'pending',
          payment_method: isHistorical ? `${targetAccount.name} (Ajuste Histórico)` : targetAccount.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetReceivable.orderId);
    }

    let updatedCustomRecs = financialConfig?.custom_receivables || [];
    if (targetReceivable.type === 'opening_receivable') {
      updatedCustomRecs = updatedCustomRecs.map(cr => {
        if (cr.id === receivableId) {
          const newBal = Math.max(0, Number(cr.balanceDue) - payAmount);
          return {
            ...cr,
            paidAmount: Number(cr.paidAmount || 0) + payAmount,
            balanceDue: newBal,
            status: newBal === 0 ? 'paid' : 'partial'
          };
        }
        return cr;
      });
    }

    let updatedAccounts = accounts;
    let newLedgerEntries = financialConfig?.ledger || [];

    if (!isHistorical) {
      const newBalance = Number(targetAccount.balance || 0) + payAmount;
      updatedAccounts = accounts.map(a => {
        if (a.id === targetAccount.id) return { ...a, balance: newBalance };
        return a;
      });

      const ledgerEntry = {
        id: `leg_rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'credit',
        amount: payAmount,
        accountId: targetAccount.id,
        accountName: targetAccount.name,
        category: 'Cobro de Cartera',
        concept: `Recaudo fiado de ${targetReceivable.customerName} ${notes ? `(${notes})` : ''}`,
        balanceAfter: newBalance
      };
      newLedgerEntries = [ledgerEntry, ...newLedgerEntries];
    }

    const newFinConfig = {
      ...financialConfig,
      accounts: updatedAccounts,
      custom_receivables: updatedCustomRecs,
      ledger: newLedgerEntries
    };

    await persistConfig(newFinConfig);
    await fetchFinancialOrders();
    toast.success(`Cobro de $${payAmount.toLocaleString('es-CO')} registrado con éxito`);
  }, [financialConfig, allReceivables, accounts, persistConfig, fetchFinancialOrders]);

  /**
   * Discards a test receivable from active cartera
   */
  const discardReceivable = useCallback(async (receivableId) => {
    if (!receivableId || !financialConfig) return;
    try {
      const currentDiscarded = financialConfig.discarded_order_ids || [];
      const updatedDiscarded = Array.from(new Set([...currentDiscarded, receivableId]));

      supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Pedido de prueba descartado',
          payment_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', receivableId)
        .then(() => fetchFinancialOrders());

      const newFinConfig = {
        ...financialConfig,
        discarded_order_ids: updatedDiscarded
      };

      await persistConfig(newFinConfig);
      toast.success('Pedido de prueba descartado de la cartera');
    } catch (err) {
      console.error('[useFinance] discardReceivable error:', err);
      toast.error('Error al descartar prueba: ' + err.message);
    }
  }, [financialConfig, persistConfig, fetchFinancialOrders]);

  /**
   * Restores a previously discarded receivable back to active cartera
   */
  const restoreReceivable = useCallback(async (receivableId) => {
    if (!receivableId || !financialConfig) return;
    try {
      const currentDiscarded = financialConfig.discarded_order_ids || [];
      const updatedDiscarded = currentDiscarded.filter(id => id !== receivableId);

      supabase
        .from('orders')
        .update({
          status: 'delivered',
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', receivableId)
        .then(() => fetchFinancialOrders());

      const newFinConfig = {
        ...financialConfig,
        discarded_order_ids: updatedDiscarded
      };

      await persistConfig(newFinConfig);
      toast.success('Pedido restaurado a la cartera activa');
    } catch (err) {
      console.error('[useFinance] restoreReceivable error:', err);
      toast.error('Error al restaurar: ' + err.message);
    }
  }, [financialConfig, persistConfig, fetchFinancialOrders]);

  /**
   * Adds a new custom financial account/pocket
   */
  const createAccount = useCallback(async ({ name, type = 'digital_wallet', initialBalance = 0 }) => {
    if (!financialConfig) return;
    const newId = `acc_${Date.now()}`;
    const initBal = Number(initialBalance || 0);

    const newAcc = {
      id: newId,
      name,
      type,
      balance: initBal,
      initial_balance: initBal,
      is_default: false,
      manually_added: true
    };

    const updatedAccounts = [...accounts, newAcc];
    let newLedger = financialConfig?.ledger || [];

    if (initBal > 0) {
      newLedger = [{
        id: `leg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'credit',
        amount: initBal,
        accountId: newId,
        accountName: name,
        category: 'Apertura de Cuenta',
        concept: `Saldo inicial creado para ${name}`,
        balanceAfter: initBal
      }, ...newLedger];
    }

    const newFinConfig = {
      ...financialConfig,
      accounts: updatedAccounts,
      ledger: newLedger
    };

    await persistConfig(newFinConfig);
    toast.success(`Bolsillo "${name}" creado exitosamente`);
  }, [financialConfig, accounts, persistConfig]);

  /**
   * Edits an existing account
   */
  const editAccount = useCallback(async ({ id, name, type }) => {
    if (!financialConfig || !id) return;
    const updatedAccounts = accounts.map(a => {
      if (a.id === id) {
        return { ...a, name, type, manually_added: true };
      }
      return a;
    });

    const newFinConfig = {
      ...financialConfig,
      accounts: updatedAccounts
    };

    await persistConfig(newFinConfig);
    toast.success(`Bolsillo "${name}" actualizado`);
  }, [financialConfig, accounts, persistConfig]);

  /**
   * Deletes an account/pocket
   */
  const deleteAccount = useCallback(async (accountId) => {
    if (!financialConfig || !accountId) return;
    const target = accounts.find(a => a.id === accountId);
    if (!target) return;

    if (accounts.length <= 1) {
      toast.error('Debes mantener al menos una cuenta activa');
      return;
    }

    const updatedAccounts = accounts.filter(a => a.id !== accountId);

    const newFinConfig = {
      ...financialConfig,
      accounts: updatedAccounts
    };

    await persistConfig(newFinConfig);
    toast.success(`Bolsillo "${target.name}" eliminado`);
  }, [financialConfig, accounts, persistConfig]);

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
    setInitialBalance,
    recordExpense,
    transferBetweenAccounts,
    settleReceivable,
    discardReceivable,
    restoreReceivable,
    createAccount,
    editAccount,
    deleteAccount
  };
}
