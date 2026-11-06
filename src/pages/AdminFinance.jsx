import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, DollarSign, TrendingUp, TrendingDown, Users, 
  ArrowUpRight, ArrowDownRight, ArrowRightLeft, Plus, 
  Calendar, Check, Clock, AlertTriangle, ShieldCheck, 
  Tag, Download, FileText, Smartphone, Banknote, RefreshCw, Trash2, Edit2
} from 'lucide-react';
import { useFinance, EXPENSE_CATEGORIES } from '../hooks/useFinance';
import OpeningBalanceModal from '../components/admin/finance/OpeningBalanceModal';
import RecordExpenseModal from '../components/admin/finance/RecordExpenseModal';
import TransferFundsModal from '../components/admin/finance/TransferFundsModal';
import SettleReceivableModal from '../components/admin/finance/SettleReceivableModal';
import AccountModal from '../components/admin/finance/AccountModal';

export default function AdminFinance() {
  const {
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
  } = useFinance();

  const [activeTab, setActiveTab] = useState('receivables'); // 'receivables' | 'expenses' | 'pnl' | 'ledger'
  const [receivableView, setReceivableView] = useState('active'); // 'active' | 'discarded'
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [selectedReceivable, setSelectedReceivable] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cargando Centro Financiero...</p>
      </div>
    );
  }

  const currentReceivablesList = receivableView === 'active' ? activeReceivables : discardedReceivables;

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

      {/* ─── ONBOARDING / OPENING BALANCE BANNER (If not initialized) ─────────── */}
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

      {/* ─── ROW 1: KPIS EJECUTIVOS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash on hand */}
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

        {/* Cuentas por Cobrar (Cartera) */}
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

        {/* Gastos del Mes */}
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

        {/* Utilidad Operativa Neta */}
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase text-gray-800 tracking-wider">Balances por Bolsillo & Cuentas</h2>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{accounts.length} cuentas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Suma real disponible: $ {metrics.cashOnHand.toLocaleString('es-CO')}</span>
            <button
              onClick={() => { setAccountToEdit(null); setShowAccountModal(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-black text-xs shadow-xs transition-colors"
            >
              <Plus size={14} /> Nuevo Bolsillo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => {
            const isCash = acc.type === 'cash';
            const isNequi = acc.name.toLowerCase().includes('nequi');
            const isDaviplata = acc.name.toLowerCase().includes('daviplata');

            let cardBg = 'bg-white';
            let badgeBg = 'bg-gray-100 text-gray-700';

            if (isCash) {
              cardBg = 'bg-emerald-50/50 border-emerald-200/80';
              badgeBg = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
            } else if (isNequi) {
              cardBg = 'bg-purple-50/50 border-purple-200/80';
              badgeBg = 'bg-purple-100 text-purple-800 border border-purple-300';
            } else if (isDaviplata) {
              cardBg = 'bg-rose-50/50 border-rose-200/80';
              badgeBg = 'bg-rose-100 text-rose-800 border border-rose-300';
            }

            return (
              <div key={acc.id} className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeBg}`}>
                    {acc.type === 'cash' ? 'Efectivo' : acc.type === 'bank' ? 'Banco / Datáfono' : 'Billetera Digital'}
                  </span>
                  
                  {/* Controles de Cuenta (Editar / Eliminar) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setAccountToEdit(acc); setShowAccountModal(true); }}
                      title="Editar cuenta"
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Deseas eliminar el bolsillo "${acc.name}"?`)) {
                            deleteAccount(acc.id);
                          }
                        }}
                        title="Eliminar bolsillo"
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-800">{acc.name}</h3>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    $ {Number(acc.balance || 0).toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

      {/* ─── TAB 1: CUENTAS POR COBRAR (CARTERA / FIADOS) ───────────────────── */}
      {activeTab === 'receivables' && (
        <div className="space-y-4">
          {/* Sub-filtro: Cartera Activa vs Pruebas Descartadas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReceivableView('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  receivableView === 'active'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Cartera Activa ({activeReceivables.length})
              </button>
              <button
                type="button"
                onClick={() => setReceivableView('discarded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  receivableView === 'discarded'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Pruebas Descartadas ({discardedReceivables.length})
              </button>
            </div>

            <span className="text-[11px] text-gray-500">
              {receivableView === 'active' 
                ? 'Deudas activas que suman a tu cartera real.' 
                : 'Pedidos de prueba excluidos de la cartera y de los totales.'}
            </span>
          </div>

          {/* Semáforo de Antigüedad (Aging - Solo para Cartera Activa) */}
          {receivableView === 'active' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-black text-emerald-800 uppercase block">🟢 Al Día (0 a 7 días)</span>
                <span className="text-lg font-black text-emerald-900">$ {metrics.agingBreakdown.current.toLocaleString('es-CO')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase block">🟡 Advertencia (8 a 14 días)</span>
                <span className="text-lg font-black text-amber-900">$ {metrics.agingBreakdown.warning.toLocaleString('es-CO')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-black text-rose-800 uppercase block">🔴 En Riesgo (+15 días)</span>
                <span className="text-lg font-black text-rose-900">$ {metrics.agingBreakdown.danger.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}

          {/* Tabla de Cartera */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Teléfono / WhatsApp</th>
                    <th className="px-5 py-3.5">Antigüedad</th>
                    <th className="px-5 py-3.5">Total Deuda</th>
                    <th className="px-5 py-3.5">Saldo Pendiente</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentReceivablesList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-gray-400 text-xs">
                        {receivableView === 'active' 
                          ? 'No hay cartera activa pendiente 🎉' 
                          : 'No tienes pedidos de prueba descartados.'}
                      </td>
                    </tr>
                  ) : (
                    currentReceivablesList.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-gray-900 text-xs block">{rec.customerName}</span>
                          {rec.notes && <span className="text-[10px] text-gray-400 truncate block">{rec.notes}</span>}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                          {rec.customerPhone || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            rec.agingCategory === 'danger'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : rec.agingCategory === 'warning'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {rec.ageDays} días
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          $ {Number(rec.totalAmount).toLocaleString('es-CO')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-black text-xs text-rose-600">
                            $ {Number(rec.balanceDue).toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {receivableView === 'active' ? (
                              <>
                                <button
                                  onClick={() => setSelectedReceivable(rec)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                                >
                                  Cobrar
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Descartar el pedido de "${rec.customerName}" como prueba?\n\nDejará de sumar a las cuentas por cobrar y no afectará tus métricas de caja.`)) {
                                      discardReceivable(rec.id);
                                    }
                                  }}
                                  title="Descartar pedido de prueba"
                                  className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => restoreReceivable(rec.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200 transition-colors"
                              >
                                <RefreshCw size={13} /> Restaurar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: GASTOS & EGRESOS OPERATIVOS ─────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider">Historial de Salidas de Caja</h3>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              <Plus size={14} /> Registrar Gasto
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Categoría</th>
                    <th className="px-5 py-3.5">Descripción</th>
                    <th className="px-5 py-3.5">Cuenta Origen</th>
                    <th className="px-5 py-3.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-gray-400 text-xs">
                        No hay gastos registrados este mes. Haz clic en "Registrar Gasto" para asentar compras menores o pagos.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-600">
                          {new Date(exp.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-800">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-gray-900 text-xs block">{exp.description}</span>
                          {exp.beneficiary && <span className="text-[10px] text-gray-400">Beneficiario: {exp.beneficiary}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-700">
                          {exp.accountName}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-xs text-rose-600">
                          - $ {Number(exp.amount).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ESTADO DE RESULTADOS (P&L DINÁMICO) ─────────────────────── */}
      {activeTab === 'pnl' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-6 max-w-3xl mx-auto">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600">Estado Financiero Dinámico</span>
            <h3 className="text-xl font-black text-gray-900">Estado de Resultados (Pérdidas y Ganancias)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Calculado en tiempo real con ventas entregadas y gastos asentados.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
              <span className="text-xs font-bold text-gray-700">(+) Ventas Brutas Totales (Mes)</span>
              <span className="text-sm font-black text-gray-900">$ {metrics.grossSalesMonth.toLocaleString('es-CO')}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-900">(=) Ingresos Reales Cobrados (Caja & Bancos)</span>
              <span className="text-sm font-black text-emerald-700">$ {metrics.collectedSalesMonth.toLocaleString('es-CO')}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100">
              <span className="text-xs font-bold text-rose-900">(-) Gastos Operativos Totales (Mes)</span>
              <span className="text-sm font-black text-rose-600">- $ {metrics.totalExpensesMonth.toLocaleString('es-CO')}</span>
            </div>

            <div className="p-4 bg-gray-950 text-white rounded-3xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">Flujo Operativo Neto (EBITDA Estimado)</span>
                <span className="text-xs text-gray-400">Dinero neto generado por la operación</span>
              </div>
              <span className={`text-xl font-black ${metrics.netProfitMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                $ {metrics.netProfitMonth.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: LIBRO MAYOR (AUDITORÍA) ─────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider">Trazabilidad de Movimientos (Libro Diario Inmutable)</h3>
            <span className="text-xs text-gray-500 font-mono">{ledger.length} eventos registrados</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Cuenta</th>
                    <th className="px-5 py-3.5">Categoría</th>
                    <th className="px-5 py-3.5">Concepto</th>
                    <th className="px-5 py-3.5 text-right">Monto</th>
                    <th className="px-5 py-3.5 text-right">Saldo Tras Evento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-gray-400 text-xs font-sans">
                        El libro mayor está vacío. Registra tu balance de apertura o un gasto para ver el registro aquí.
                      </td>
                    </tr>
                  ) : (
                    ledger.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 text-gray-500 text-[11px]">
                          {new Date(entry.timestamp).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 font-sans font-bold text-gray-800">
                          {entry.accountName}
                        </td>
                        <td className="px-5 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            {entry.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-sans text-gray-700 text-xs truncate max-w-xs">
                          {entry.concept}
                        </td>
                        <td className={`px-5 py-3 text-right font-black ${entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {entry.type === 'credit' ? '+' : '-'} $ {Number(entry.amount).toLocaleString('es-CO')}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-900 font-bold">
                          $ {Number(entry.balanceAfter).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
