import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calculator, Banknote, Coins, ArrowRight, RotateCcw } from 'lucide-react';
import { formatCOP } from '@/utils/money';

export const COLOMBIAN_BILLS = [
  { value: 100000, label: '$100.000', color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900', badge: 'bg-emerald-600' },
  { value: 50000,  label: '$50.000',  color: 'border-purple-200 bg-purple-50/60 text-purple-900', badge: 'bg-purple-600' },
  { value: 20000,  label: '$20.000',  color: 'border-amber-200 bg-amber-50/60 text-amber-900', badge: 'bg-amber-600' },
  { value: 10000,  label: '$10.000',  color: 'border-rose-200 bg-rose-50/60 text-rose-900', badge: 'bg-rose-600' },
  { value: 5000,   label: '$5.000',   color: 'border-sky-200 bg-sky-50/60 text-sky-900', badge: 'bg-sky-600' },
  { value: 2000,   label: '$2.000',   color: 'border-teal-200 bg-teal-50/60 text-teal-900', badge: 'bg-teal-600' },
];

export const COLOMBIAN_COINS = [
  { value: 1000, label: '$1.000', color: 'border-amber-200 bg-amber-50/40 text-amber-950' },
  { value: 500,  label: '$500',   color: 'border-stone-200 bg-stone-50 text-stone-900' },
  { value: 200,  label: '$200',   color: 'border-stone-200 bg-stone-50 text-stone-900' },
  { value: 100,  label: '$100',   color: 'border-stone-200 bg-stone-50 text-stone-900' },
  { value: 50,   label: '$50',    color: 'border-stone-200 bg-stone-50 text-stone-900' },
];

export default function CashCountModal({
  isOpen,
  onClose,
  onApply,
  accountName = 'Gaveta Física (Efectivo)',
  currentBalance = 0,
}) {
  const [counts, setCounts] = useState({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });

  const handleQtyChange = (val, qtyStr) => {
    const qty = Math.max(0, parseInt(qtyStr) || 0);
    setCounts(prev => ({ ...prev, [val]: qty }));
  };

  const handleStep = (val, delta) => {
    setCounts(prev => ({ ...prev, [val]: Math.max(0, (prev[val] || 0) + delta) }));
  };

  const resetAll = () => {
    setCounts({
      100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0,
      1000: 0, 500: 0, 200: 0, 100: 0, 50: 0,
    });
  };

  const { billsTotal, coinsTotal, grandTotal, totalPieces } = useMemo(() => {
    let bTot = 0;
    let cTot = 0;
    let pieces = 0;

    COLOMBIAN_BILLS.forEach(({ value }) => {
      const q = counts[value] || 0;
      bTot += value * q;
      pieces += q;
    });

    COLOMBIAN_COINS.forEach(({ value }) => {
      const q = counts[value] || 0;
      cTot += value * q;
      pieces += q;
    });

    return {
      billsTotal: bTot,
      coinsTotal: cTot,
      grandTotal: bTot + cTot,
      totalPieces: pieces,
    };
  }, [counts]);

  if (!isOpen) return null;

  const difference = grandTotal - currentBalance;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-gray-900 to-black text-white relative flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Calculator size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
                  Arqueo Rápido • Colombia (COP)
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  Contador de Billetes & Monedas
                </h3>
                <p className="text-xs text-gray-400">{accountName}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Top Counter Summary Banner */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                  Total Contado en Gaveta
                </span>
                <div className="text-3xl font-black text-emerald-950 tracking-tight">
                  {formatCOP(grandTotal)}
                </div>
                <div className="flex items-center gap-3 text-xs text-emerald-800 font-bold mt-0.5">
                  <span>💵 Billetes: {formatCOP(billsTotal)}</span>
                  <span>•</span>
                  <span>🪙 Monedas: {formatCOP(coinsTotal)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentBalance > 0 && (
                  <div className="text-right border-l border-emerald-200 pl-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">En Sistema</span>
                    <span className="text-xs font-black text-gray-800">{formatCOP(currentBalance)}</span>
                    <span className={`block text-[10px] font-black ${difference >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {difference === 0 ? '✓ Cuadrado exacto' : difference > 0 ? `+${formatCOP(difference)} sobrante` : `${formatCOP(difference)} faltante`}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={resetAll}
                  title="Reiniciar contador a 0"
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* SECCIÓN 1: BILLETES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Banknote size={15} className="text-emerald-600" />
                  Billetes de Colombia
                </h4>
                <span className="text-[11px] font-bold text-gray-400">
                  Subtotal: <strong className="text-gray-900">{formatCOP(billsTotal)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {COLOMBIAN_BILLS.map(({ value, label, color }) => {
                  const q = counts[value] || 0;
                  const sub = value * q;
                  return (
                    <div
                      key={value}
                      className={`p-2.5 rounded-2xl border shadow-2xs transition-all ${color} flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{label}</span>
                        <span className="text-[10px] font-bold opacity-75">
                          {q > 0 ? formatCOP(sub) : '$0'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-2">
                        <button
                          type="button"
                          onClick={() => handleStep(value, -1)}
                          disabled={q <= 0}
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-gray-800 font-black text-sm flex items-center justify-center border border-black/10 disabled:opacity-30 cursor-pointer shadow-2xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={q === 0 ? '' : q}
                          onChange={(e) => handleQtyChange(value, e.target.value)}
                          placeholder="0"
                          className="w-full text-center py-1 font-black text-sm bg-white rounded-lg border border-black/10 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleStep(value, 1)}
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-gray-800 font-black text-sm flex items-center justify-center border border-black/10 cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: MONEDAS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Coins size={15} className="text-amber-600" />
                  Monedas de Colombia
                </h4>
                <span className="text-[11px] font-bold text-gray-400">
                  Subtotal: <strong className="text-gray-900">{formatCOP(coinsTotal)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {COLOMBIAN_COINS.map(({ value, label, color }) => {
                  const q = counts[value] || 0;
                  const sub = value * q;
                  return (
                    <div
                      key={value}
                      className={`p-2 rounded-xl border shadow-2xs ${color} flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{label}</span>
                        <span className="text-[9px] font-bold opacity-75">
                          {q > 0 ? formatCOP(sub) : '$0'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => handleStep(value, -1)}
                          disabled={q <= 0}
                          className="w-6 h-6 rounded bg-white text-gray-800 font-black text-xs flex items-center justify-center border border-gray-200 disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={q === 0 ? '' : q}
                          onChange={(e) => handleQtyChange(value, e.target.value)}
                          placeholder="0"
                          className="w-full text-center py-0.5 font-bold text-xs bg-white rounded border border-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleStep(value, 1)}
                          className="w-6 h-6 rounded bg-white text-gray-800 font-black text-xs flex items-center justify-center border border-gray-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Piezas contadas</span>
              <span className="text-xs font-black text-gray-800">{totalPieces} en total</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onApply) onApply(grandTotal, counts);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
              >
                <span>Usar este Monto ({formatCOP(grandTotal)})</span>
                <Check size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
