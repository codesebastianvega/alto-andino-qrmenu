import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';
import { printThermalShiftReport } from '@/utils/thermalPrint';

const DENOMINATIONS = [
  { value: 100000, label: '$100.000' },
  { value: 50000,  label: '$50.000' },
  { value: 20000,  label: '$20.000' },
  { value: 10000,  label: '$10.000' },
  { value: 5000,   label: '$5.000' },
  { value: 2000,   label: '$2.000' },
];

export default function CloseShiftModal({
  isOpen,
  onClose,
  shift,
  metrics = {},
  onConfirmClose,
  business = {},
  restaurantSettings = {}
}) {
  const [mode, setMode] = useState('quick'); // 'quick' | 'calculator'
  const [quickCash, setQuickCash] = useState('');
  const [billCounts, setBillCounts] = useState({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    coins: 0
  });
  const [closingNotes, setClosingNotes] = useState('');
  const [closedByName, setClosedByName] = useState(shift?.opened_by || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const initialCash = Number(shift?.initial_cash || 0);
  const cashSales = Number(metrics.totalCashSales || 0);
  const cardSales = Number(metrics.totalCardSales || 0);
  const transferSales = Number(metrics.totalTransferSales || 0);
  const totalRevenue = Number(metrics.totalRevenue || 0);
  const expectedCash = initialCash + cashSales;

  // Actual cash computed based on active mode
  const actualCash = useMemo(() => {
    if (mode === 'quick') {
      return quickCash === '' ? 0 : Math.max(0, parseInt(quickCash) || 0);
    }
    const billsTotal = Object.entries(billCounts).reduce((acc, [denom, count]) => {
      if (denom === 'coins') return acc + (parseInt(count) || 0);
      return acc + (parseInt(denom) * (parseInt(count) || 0));
    }, 0);
    return billsTotal;
  }, [mode, quickCash, billCounts]);

  const difference = actualCash - expectedCash;

  if (!isOpen || !shift) return null;

  const handleBillChange = (denom, count) => {
    setBillCounts(prev => ({
      ...prev,
      [denom]: Math.max(0, parseInt(count) || 0)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const closedData = await onConfirmClose({
        shiftId: shift.id,
        actualCash,
        closedBy: closedByName.trim() || shift.opened_by || 'Cajero',
        closingNotes: closingNotes.trim(),
        cashBreakdown: mode === 'calculator' ? billCounts : { quick_total: actualCash },
        metricsData: metrics
      });

      // Imprimir Reporte Z Oficial
      try {
        printThermalShiftReport({
          shift: {
            ...shift,
            closed_at: new Date().toISOString(),
            closed_by: closedByName.trim() || shift.opened_by,
            actual_cash: actualCash,
            cash_difference: difference,
            expected_cash: expectedCash
          },
          metrics,
          type: 'Z',
          width: restaurantSettings?.thermal_paper_width || '80',
          businessName: business?.name || 'Aluna',
          business
        });
      } catch (printErr) {
        console.warn('Thermal print warning:', printErr);
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl backdrop-blur-md border border-white/15 shrink-0">
              <Icon icon="solar:safe-square-bold" className="text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Auditoría POS • Reporte Z
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight">
                Cierre de Turno & Arqueo de Caja
              </h3>
              <p className="text-xs text-gray-300 font-medium">
                Turno #{shift.shift_number || 1} • Abierto a las {new Date(shift.opened_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} por {shift.opened_by}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <Icon icon="solar:close-circle-bold" width="20" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Tarjetas de Resumen Financiero */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Base Inicial</span>
              <span className="text-sm font-black text-gray-900">{formatCOP(initialCash)}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">+ Efectivo Cobrado</span>
              <span className="text-sm font-black text-emerald-800">{formatCOP(cashSales)}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">= Esperado en Caja</span>
              <span className="text-sm font-black text-amber-900">{formatCOP(expectedCash)}</span>
            </div>
          </div>

          {/* Otros Medios de Pago */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">Otros ingresos no en efectivo:</span>
            <div className="flex items-center gap-3 font-bold text-gray-800">
              <span>💳 Tarjetas: {formatCOP(cardSales)}</span>
              <span>📱 Nequi/Transfer: {formatCOP(transferSales)}</span>
            </div>
          </div>

          {/* Conteo de Efectivo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Icon icon="solar:wallet-money-bold" className="text-emerald-700 text-base" />
                Dinero Real Contado en Gaveta
              </label>

              {/* Selector de Modo */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    mode === 'quick' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Monto Rápido
                </button>
                <button
                  type="button"
                  onClick={() => setMode('calculator')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    mode === 'calculator' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Contar Billetes
                </button>
              </div>
            </div>

            {mode === 'quick' ? (
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-gray-400 text-base">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="Total en efectivo que tienes en mano"
                  value={quickCash}
                  onChange={(e) => setQuickCash(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2f4131] outline-none text-xl font-black text-gray-900 transition-colors"
                />
              </div>
            ) : (
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DENOMINATIONS.map(({ value, label }) => (
                    <div key={value} className="bg-white p-2 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-700">{label}</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={billCounts[value] || ''}
                        onChange={(e) => handleBillChange(value, e.target.value)}
                        className="w-14 text-center p-1 font-bold text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#2f4131]"
                      />
                    </div>
                  ))}
                  <div className="bg-white p-2 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2 sm:col-span-3">
                    <span className="text-xs font-bold text-gray-700">Monedas en total ($ COP)</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={billCounts.coins || ''}
                      onChange={(e) => handleBillChange('coins', e.target.value)}
                      className="w-24 text-center p-1 font-bold text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#2f4131]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs font-bold text-gray-700">
                  <span>Total contado por denominación:</span>
                  <span className="text-sm font-black text-gray-900">{formatCOP(actualCash)}</span>
                </div>
              </div>
            )}

            {/* Banner de Resultado del Arqueo / Descuadre */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              difference === 0 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : difference > 0
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  difference === 0 ? 'bg-emerald-100 text-emerald-700' : difference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <Icon icon={difference === 0 ? 'solar:check-circle-bold' : difference > 0 ? 'solar:arrow-up-bold' : 'solar:danger-triangle-bold'} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {difference === 0 
                      ? 'Caja Cuadrada Perfecta' 
                      : difference > 0 
                      ? 'Sobrante de Dinero' 
                      : 'Faltante de Dinero'}
                  </h4>
                  <p className="text-[11px] opacity-80 font-medium">
                    {difference === 0 
                      ? 'El dinero en mano coincide exactamente con el sistema.' 
                      : difference > 0 
                      ? `Hay más dinero en gaveta que lo facturado en efectivo (+${formatCOP(difference)}).` 
                      : `Falta dinero en la gaveta comparado con lo facturado (-${formatCOP(Math.abs(difference))}).`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold block opacity-60">Diferencia</span>
                <span className={`text-base font-black ${
                  difference === 0 ? 'text-emerald-700' : difference > 0 ? 'text-blue-700' : 'text-rose-700'
                }`}>
                  {difference > 0 ? `+${formatCOP(difference)}` : formatCOP(difference)}
                </span>
              </div>
            </div>
          </div>

          {/* Responsable de Cierre y Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Responsable que entrega la caja *
              </label>
              <input
                type="text"
                required
                value={closedByName}
                onChange={(e) => setClosedByName(e.target.value)}
                placeholder="Nombre del cajero"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#2f4131] outline-none text-xs font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Observaciones del Arqueo
              </label>
              <input
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Justificación si hubo descuadre o novedades"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#2f4131] outline-none text-xs font-medium text-gray-800"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-2xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#2f4131]/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon icon="solar:printer-bold" width="18" />
              )}
              Confirmar Cierre & Imprimir Reporte Z
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
