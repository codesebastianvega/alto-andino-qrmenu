import React, { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, Users, ArrowDownRight, ArrowRightLeft, Plus, 
  FileText, RefreshCw, Calendar
} from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import OpeningBalanceModal from '../components/admin/finance/OpeningBalanceModal';
import RecordExpenseModal from '../components/admin/finance/RecordExpenseModal';
import TransferFundsModal from '../components/admin/finance/TransferFundsModal';
import SettleReceivableModal from '../components/admin/finance/SettleReceivableModal';
import EditReceivableModal from '../components/admin/finance/EditReceivableModal';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import AccountModal from '../components/admin/finance/AccountModal';
import FinancePocketsGrid from '../components/admin/finance/FinancePocketsGrid';
import {
  FinanceReceivablesTab,
  FinanceExpensesTab,
  FinanceProfitLossTab,
  FinanceLedgerTab,
} from '../components/admin/finance/FinanceTabs';

export default function AdminFinance() {
  const {
    loading,
    accounts,
    activeReceivables,
    discardedReceivables,
    expenses,
    ledger,
    orders,
    metrics,
    setInitialBalance,
    recordExpense,
    transferBetweenAccounts,
    settleReceivable,
    discardReceivable,
    restoreReceivable,
    createAccount,
    editAccount,
    deleteAccount,
    refreshAll
  } = useFinance();
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id || localStorage.getItem('aa_active_brand_id');

  const [activeTab, setActiveTab] = useState('receivables'); // 'receivables' | 'expenses' | 'pnl' | 'ledger'
  const [receivableView, setReceivableView] = useState('active'); // 'active' | 'discarded'
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [selectedEditReceivable, setSelectedEditReceivable] = useState(null);

  const [periodFilter, setPeriodFilter] = useState('month'); // 'today' | '7days' | '15days' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start;
    let label = 'Este Mes';

    if (periodFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      label = 'Hoy';
    } else if (periodFilter === '7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      label = 'Últimos 7 Días';
    } else if (periodFilter === '15days') {
      start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      label = 'Últimos 15 Días';
    } else if (periodFilter === 'custom') {
      start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date(0);
      const customEnd = customEndDate ? new Date(customEndDate + 'T23:59:59') : end;
      return { start, end: customEnd, label: `${customStartDate || ''} a ${customEndDate || ''}` };
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'Este Mes';
    }

    return { start, end, label };
  }, [periodFilter, customStartDate, customEndDate]);

  const periodFilteredData = useMemo(() => {
    const { start, end } = dateRange;

    // Filter expenses
    const filteredExpenses = (expenses || []).filter(e => {
      const d = new Date(e.date || e.created_at);
      return d >= start && d <= end;
    });
    const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    // Filter delivered orders for revenue
    const filteredOrders = (orders || []).filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    const grossSales = deliveredOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const collectedSales = deliveredOrders.reduce((s, o) => s + Number(o.paid_amount || 0), 0);
    const netProfit = collectedSales - totalExpenses;

    // Filter ledger entries
    const filteredLedger = (ledger || []).filter(l => {
      const d = new Date(l.timestamp);
      return d >= start && d <= end;
    });

    return {
      filteredExpenses,
      totalExpenses,
      filteredOrders,
      deliveredOrders,
      grossSales,
      collectedSales,
      netProfit,
      filteredLedger
    };
  }, [expenses, orders, ledger, dateRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cargando Centro Financiero...</p>
      </div>
    );
  }

  const handleSaveReceivable = async (updatedData) => {
    try {
      const response = await fetch('/api/save-finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          action: 'update_order',
          orderId: updatedData.orderId,
          updates: {
            customer_name: updatedData.customerName,
            customer_phone: updatedData.customerPhone,
            delivery_address: updatedData.address,
            total_amount: updatedData.totalAmount,
            delivery_notes: updatedData.notes ? `[🤝 FIADO - Cuenta por cobrar: ${updatedData.customerName}] ${updatedData.notes}` : `[🤝 FIADO - Cuenta por cobrar: ${updatedData.customerName}]`
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al actualizar');
      toast.success('Cliente y fiado actualizados con éxito');
      await refreshAll();
    } catch (err) {
      toast.error('Error al actualizar fiado: ' + err.message);
    }
  };

  const handleSaveAccount = async (accountData) => {
    if (accountData.id) {
      await editAccount(accountData);
    } else {
      await createAccount(accountData);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
              ALUNA Finanzas Pro
            </span>
            <span className="text-gray-400 text-xs font-semibold">• Control Patrimonial & Cartera</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Centro de Finanzas & Contabilidad</h1>
          <p className="text-xs text-gray-500 mt-0.5">Control de liquidez, cuentas por cobrar, egresos y flujo de caja en tiempo real.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus size={16} /> Registrar Gasto
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <ArrowRightLeft size={16} /> Transferir
          </button>
          <button
            onClick={() => setShowOpeningModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200 transition-colors"
          >
            <Wallet size={16} /> Asiento de Apertura
          </button>
        </div>
      </div>

      {/* ─── ONBOARDING / OPENING BALANCE BANNER ────────────────────────────── */}
      {!metrics.isInitialized && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-gray-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">Paso Recomendado</span>
              <h3 className="text-base font-black text-white">Inicia tu negocio sin partir de $0</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5 max-w-xl">
                Carga el efectivo que ya tienes en tu gaveta, tus saldos en Nequi/Daviplata y los fiados que te deben clientes de días anteriores.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOpeningModal(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-black text-xs shadow-md shrink-0 transition-transform hover:scale-102"
          >
            Configurar Saldo Inicial
          </button>
        </div>
      )}

      {/* ─── FILTRO TEMPORAL / RANGO DE FECHAS ────────────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
            <Calendar size={16} />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-900 block leading-tight">Período de Análisis</span>
            <span className="text-[10px] text-gray-400 font-semibold">{dateRange.label}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'today', label: 'Hoy' },
            { id: '7days', label: '7 Días' },
            { id: '15days', label: '15 Días' },
            { id: 'month', label: 'Este Mes' },
            { id: 'custom', label: 'Personalizado' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPeriodFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                periodFilter === tab.id
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 focus:outline-hidden"
            />
            <span className="text-gray-400 text-xs font-bold">a</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* ─── ROW 1: KPIS EJECUTIVOS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Dinero Líquido (Bolsillos)</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              $ {metrics.cashOnHand.toLocaleString('es-CO')}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">{accounts.length} cuentas activas</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Cuentas por Cobrar (Fiados)</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              $ {metrics.totalReceivables.toLocaleString('es-CO')}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">{metrics.receivablesCount} pendientes en la calle</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Gastos Operativos (Mes)</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              $ {metrics.totalExpensesMonth.toLocaleString('es-CO')}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">{expenses.length} egresos asentados</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <ArrowDownRight size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Utilidad Operativa (Mes)</span>
            <div className={`text-2xl font-black mt-1 ${metrics.netProfitMonth >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              $ {metrics.netProfitMonth.toLocaleString('es-CO')}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">Recaudos (-) Gastos</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* ─── ROW 2: BOLSILLOS & CUENTAS EN TIEMPO REAL ──────────────────────── */}
      <FinancePocketsGrid
        accounts={accounts}
        cashOnHand={metrics.cashOnHand}
        onNewPocket={() => { setAccountToEdit(null); setShowAccountModal(true); }}
        onEditPocket={(acc) => { setAccountToEdit(acc); setShowAccountModal(true); }}
        onDeletePocket={deleteAccount}
      />

      {/* ─── TABS DE NAVEGACIÓN SECUNDARIA ─────────────────────────────────── */}
      <div className="border-b border-gray-200 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'receivables'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={15} /> Cuentas por Cobrar (Cartera)
          <span className="px-2 py-0.2 rounded-full bg-white/20 text-[10px]">{activeReceivables.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ArrowDownRight size={15} /> Gastos & Egresos
          <span className="px-2 py-0.2 rounded-full bg-white/20 text-[10px]">{expenses.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'pnl'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp size={15} /> Estado de Resultados (P&L)
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText size={15} /> Libro Mayor (Auditoría)
          <span className="px-2 py-0.2 rounded-full bg-white/20 text-[10px]">{ledger.length}</span>
        </button>
      </div>

      {/* ─── CONTENIDO DE TABS ────────────────────────────────────────────── */}
      {activeTab === 'receivables' && (
        <FinanceReceivablesTab
          receivableView={receivableView}
          setReceivableView={setReceivableView}
          activeReceivables={activeReceivables}
          discardedReceivables={discardedReceivables}
          agingBreakdown={metrics.agingBreakdown}
          onSelectReceivable={setSelectedReceivable}
          onDiscardReceivable={discardReceivable}
          onRestoreReceivable={restoreReceivable}
          onEditReceivable={setSelectedEditReceivable}
        />
      )}

      {activeTab === 'expenses' && (
        <FinanceExpensesTab
          expenses={expenses}
          onOpenExpenseModal={() => setShowExpenseModal(true)}
        />
      )}

      {activeTab === 'pnl' && (
        <FinanceProfitLossTab
          metrics={{
            ...metrics,
            grossSalesMonth: periodFilteredData.grossSales,
            collectedSalesMonth: periodFilteredData.collectedSales,
            totalExpensesMonth: periodFilteredData.totalExpenses,
            netProfitMonth: periodFilteredData.netProfit
          }}
          periodLabel={dateRange.label}
        />
      )}

      {activeTab === 'ledger' && (
        <FinanceLedgerTab ledger={periodFilteredData.filteredLedger} />
      )}

      {/* ─── MODALES ────────────────────────────────────────────────────────── */}
      <OpeningBalanceModal
        isOpen={showOpeningModal}
        onClose={() => setShowOpeningModal(false)}
        accounts={accounts}
        onSave={setInitialBalance}
      />

      <RecordExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        accounts={accounts}
        onSave={recordExpense}
      />

      <TransferFundsModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        accounts={accounts}
        onSave={transferBetweenAccounts}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => { setShowAccountModal(false); setAccountToEdit(null); }}
        onSave={handleSaveAccount}
        accountToEdit={accountToEdit}
      />


      {selectedEditReceivable && (
        <EditReceivableModal
          isOpen={Boolean(selectedEditReceivable)}
          onClose={() => setSelectedEditReceivable(null)}
          receivable={selectedEditReceivable}
          onSave={handleSaveReceivable}
        />
      )}

      {selectedReceivable && (
        <SettleReceivableModal
          isOpen={Boolean(selectedReceivable)}
          onClose={() => setSelectedReceivable(null)}
          receivable={selectedReceivable}
          accounts={accounts}
          onSave={settleReceivable}
        />
      )}
    </div>
  );
}
