import { useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';

export function useFinanceActions({
  brandId,
  financialConfig,
  accounts,
  allReceivables,
  persistConfig,
  fetchFinancialOrders
}) {
  const setInitialBalance = useCallback(async ({
    openingDate = new Date().toISOString(),
    accountsBalances = {},
    initialReceivables = [],
    initialPayables = [],
  }) => {
    if (!financialConfig) return;

    const updatedAccounts = accounts.map(acc => {
      const initBal = Number(accountsBalances[acc.id] || 0);
      return { ...acc, initial_balance: initBal, balance: initBal };
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

    const updatedAccounts = accounts.map(a =>
      a.id === targetAccount.id ? { ...a, balance: newAccountBalance } : a
    );

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

    await persistConfig({
      ...financialConfig,
      accounts: updatedAccounts,
      expenses: [newExpense, ...(financialConfig.expenses || [])],
      ledger: [newLedgerEntry, ...(financialConfig.ledger || [])]
    });
    toast.success(`Gasto de $${expenseAmount.toLocaleString('es-CO')} registrado en ${targetAccount.name}`);
  }, [financialConfig, accounts, persistConfig]);

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
      if (a.id === fromAccountId) return { ...a, balance: Math.max(0, Number(a.balance || 0) - transferAmount) };
      if (a.id === toAccountId) return { ...a, balance: Number(a.balance || 0) + transferAmount };
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

    await persistConfig({
      ...financialConfig,
      accounts: updatedAccounts,
      ledger: [ledgerIn, ledgerOut, ...(financialConfig.ledger || [])]
    });
    toast.success(`Transferidos $${transferAmount.toLocaleString('es-CO')} de ${fromAcc.name} a ${toAcc.name}`);
  }, [financialConfig, accounts, persistConfig]);

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
      updatedAccounts = accounts.map(a => (a.id === targetAccount.id ? { ...a, balance: newBalance } : a));
      newLedgerEntries = [{
        id: `leg_rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'credit',
        amount: payAmount,
        accountId: targetAccount.id,
        accountName: targetAccount.name,
        category: 'Cobro de Cartera',
        concept: `Recaudo fiado de ${targetReceivable.customerName} ${notes ? `(${notes})` : ''}`,
        balanceAfter: newBalance
      }, ...newLedgerEntries];
    }

    await persistConfig({
      ...financialConfig,
      accounts: updatedAccounts,
      custom_receivables: updatedCustomRecs,
      ledger: newLedgerEntries
    });
    await fetchFinancialOrders();
    toast.success(`Cobro de $${payAmount.toLocaleString('es-CO')} registrado con éxito`);
  }, [financialConfig, allReceivables, accounts, persistConfig, fetchFinancialOrders]);

  const discardReceivable = useCallback(async (receivableId) => {
    if (!receivableId || !financialConfig) return;
    try {
      const updatedDiscarded = Array.from(new Set([...(financialConfig.discarded_order_ids || []), receivableId]));
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

      await persistConfig({ ...financialConfig, discarded_order_ids: updatedDiscarded });
      toast.success('Pedido de prueba descartado de la cartera');
    } catch (err) {
      toast.error('Error al descartar prueba: ' + err.message);
    }
  }, [financialConfig, persistConfig, fetchFinancialOrders]);

  const restoreReceivable = useCallback(async (receivableId) => {
    if (!receivableId || !financialConfig) return;
    try {
      const updatedDiscarded = (financialConfig.discarded_order_ids || []).filter(id => id !== receivableId);
      supabase
        .from('orders')
        .update({
          status: 'delivered',
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', receivableId)
        .then(() => fetchFinancialOrders());

      await persistConfig({ ...financialConfig, discarded_order_ids: updatedDiscarded });
      toast.success('Pedido restaurado a la cartera activa');
    } catch (err) {
      toast.error('Error al restaurar: ' + err.message);
    }
  }, [financialConfig, persistConfig, fetchFinancialOrders]);

  const createAccount = useCallback(async ({ name, type = 'digital_wallet', initialBalance = 0 }) => {
    if (!financialConfig || !name) return;
    const cleanName = name.trim();
    const newId = `acc_${Date.now()}`;
    const initBal = Number(initialBalance || 0);
    const newAcc = {
      id: newId,
      name: cleanName,
      type,
      balance: initBal,
      initial_balance: initBal,
      is_default: false,
      manually_added: true
    };

    let newLedger = financialConfig?.ledger || [];
    if (initBal > 0) {
      newLedger = [{
        id: `leg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'credit',
        amount: initBal,
        accountId: newId,
        accountName: cleanName,
        category: 'Apertura de Cuenta',
        concept: `Saldo inicial creado para ${cleanName}`,
        balanceAfter: initBal
      }, ...newLedger];
    }

    await persistConfig({
      ...financialConfig,
      accounts: [...accounts, newAcc],
      ledger: newLedger
    });

    // 🔗 Auto-sync with public.payment_methods
    if (brandId) {
      try {
        const { data: existing } = await supabase
          .from('payment_methods')
          .select('id, name')
          .eq('brand_id', brandId)
          .ilike('name', cleanName);

        if (!existing || existing.length === 0) {
          const isCash = type === 'cash' || /efectivo|gaveta/i.test(cleanName);
          const methodType = isCash ? 'cash' : (type === 'bank' || type === 'card' ? 'card' : 'digital_wallet');
          await supabase
            .from('payment_methods')
            .insert([{
              brand_id: brandId,
              name: cleanName,
              type: methodType,
              icon: isCash ? 'solar:money-bag-bold' : (methodType === 'card' ? 'solar:card-2-bold' : 'solar:wallet-bold'),
              is_active: true,
              details: {
                bank_name: cleanName,
                instructions: 'Pago vía ' + cleanName
              }
            }]);
        }
      } catch (pmErr) {
        console.warn('[useFinanceActions] auto-sync payment_method error:', pmErr);
      }
    }

    toast.success(`Bolsillo "${cleanName}" creado y sincronizado con Medios de Pago`);
  }, [financialConfig, accounts, persistConfig, brandId]);

  const editAccount = useCallback(async ({ id, name, type }) => {
    if (!financialConfig || !id) return;
    const target = accounts.find(a => a.id === id);
    const oldName = target?.name;
    const cleanName = (name || '').trim();

    const updatedAccounts = accounts.map(a =>
      a.id === id ? { ...a, name: cleanName, type, manually_added: true } : a
    );
    await persistConfig({ ...financialConfig, accounts: updatedAccounts });

    if (brandId && oldName && cleanName && oldName !== cleanName) {
      try {
        await supabase
          .from('payment_methods')
          .update({ name: cleanName })
          .eq('brand_id', brandId)
          .ilike('name', oldName);
      } catch (pmErr) {
        console.warn('[useFinanceActions] auto-rename payment_method error:', pmErr);
      }
    }

    toast.success(`Bolsillo "${cleanName}" actualizado`);
  }, [financialConfig, accounts, persistConfig, brandId]);

  const deleteAccount = useCallback(async (accountId) => {
    if (!financialConfig || !accountId) return;
    const target = accounts.find(a => a.id === accountId);
    if (!target) return;
    if (accounts.length <= 1) {
      toast.error('Debes mantener al menos una cuenta activa');
      return;
    }
    await persistConfig({
      ...financialConfig,
      accounts: accounts.filter(a => a.id !== accountId)
    });

    if (brandId && target.name) {
      try {
        await supabase
          .from('payment_methods')
          .update({ is_active: false })
          .eq('brand_id', brandId)
          .ilike('name', target.name.trim());
      } catch (pmErr) {
        console.warn('[useFinanceActions] auto-deactivate payment_method error:', pmErr);
      }
    }

    toast.success(`Bolsillo "${target.name}" eliminado`);
  }, [financialConfig, accounts, persistConfig, brandId]);

  return {
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
