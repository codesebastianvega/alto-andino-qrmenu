import React from 'react';
import { Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';

export function FinanceReceivablesTab({
  receivableView,
  setReceivableView,
  activeReceivables = [],
  discardedReceivables = [],
  agingBreakdown = { current: 0, warning: 0, danger: 0 },
  onSelectReceivable,
  onDiscardReceivable,
  onRestoreReceivable,
  onEditReceivable,
}) {
  const currentReceivablesList = receivableView === 'active' ? activeReceivables : discardedReceivables;

  return (
    <div className="space-y-4">
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

      {receivableView === 'active' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-black text-emerald-800 uppercase block">🟢 Al Día (0 a 7 días)</span>
            <span className="text-lg font-black text-emerald-900">$ {agingBreakdown.current.toLocaleString('es-CO')}</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-black text-amber-800 uppercase block">🟡 Advertencia (8 a 14 días)</span>
            <span className="text-lg font-black text-amber-900">$ {agingBreakdown.warning.toLocaleString('es-CO')}</span>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] font-black text-rose-800 uppercase block">🔴 En Riesgo (+15 días)</span>
            <span className="text-lg font-black text-rose-900">$ {agingBreakdown.danger.toLocaleString('es-CO')}</span>
          </div>
        </div>
      )}

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
                              onClick={() => onSelectReceivable(rec)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                            >
                              Cobrar
                            </button>
                            {onEditReceivable && (
                              <button
                                onClick={() => onEditReceivable(rec)}
                                title="Editar cliente, teléfono, dirección o monto"
                                className="p-1.5 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Descartar el pedido de "${rec.customerName}" como prueba?\n\nDejará de sumar a las cuentas por cobrar y no afectará tus métricas de caja.`)) {
                                  onDiscardReceivable(rec.id);
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
                            onClick={() => onRestoreReceivable(rec.id)}
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
  );
}

export function FinanceExpensesTab({ expenses = [], onOpenExpenseModal, onEditExpense, periodLabel = 'este período' }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider">Historial de Salidas de Caja</h3>
        <button
          onClick={onOpenExpenseModal}
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
                <th className="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-gray-400 text-xs">
                    No hay gastos registrados en este período (${periodLabel}). Haz clic en "Registrar Gasto" para asentar compras menores o pagos.
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
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onEditExpense && onEditExpense(exp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
                        title="Editar gasto, monto o cuenta"
                      >
                        <Pencil size={13} className="text-gray-500" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FinanceProfitLossTab({ metrics, periodLabel = 'Este Mes' }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-6 max-w-3xl mx-auto">
      <div>
        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600">Estado Financiero Dinámico</span>
        <h3 className="text-xl font-black text-gray-900">Estado de Resultados (Pérdidas y Ganancias)</h3>
        <p className="text-xs text-gray-500 mt-0.5">Calculado en tiempo real con ventas entregadas y gastos asentados.</p>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
          <span className="text-xs font-bold text-gray-700">(+) Ventas Brutas Totales (${periodLabel})</span>
          <span className="text-sm font-black text-gray-900">$ {metrics.grossSalesMonth.toLocaleString('es-CO')}</span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <span className="text-xs font-bold text-emerald-900">(=) Ingresos Reales Cobrados (Caja & Bancos)</span>
          <span className="text-sm font-black text-emerald-700">$ {metrics.collectedSalesMonth.toLocaleString('es-CO')}</span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100">
          <span className="text-xs font-bold text-rose-900">(-) Gastos Operativos Totales (${periodLabel})</span>
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
  );
}

export function FinanceLedgerTab({ ledger = [] }) {
  return (
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
  );
}
