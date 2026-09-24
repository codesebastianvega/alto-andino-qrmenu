import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';

const PRESET_AMOUNTS = [50000, 100000, 150000, 200000, 300000];

export default function OpenShiftModal({
  isOpen,
  onClose,
  onOpenShift,
  staffList = [],
  currentLocationName = 'Esta Sede'
}) {
  const [cashierName, setCashierName] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [initialCash, setInitialCash] = useState(150000);
  const [openingNotes, setOpeningNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStaffChange = (e) => {
    const val = e.target.value;
    setSelectedStaffId(val);
    if (val === 'custom') {
      setCashierName('');
    } else {
      const found = staffList.find(s => s.id === val);
      if (found) {
        setCashierName(found.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCashier = cashierName.trim() || 'Cajero de Turno';
    setIsSubmitting(true);
    try {
      await onOpenShift({
        initialCash: Number(initialCash || 0),
        openedBy: finalCashier,
        staffId: selectedStaffId && selectedStaffId !== 'custom' ? selectedStaffId : null,
        openingNotes: openingNotes.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Decorativo */}
        <div className="bg-gradient-to-r from-[#2f4131] to-[#3d563f] p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl backdrop-blur-md border border-white/15 shrink-0">
              <Icon icon="solar:cash-out-bold-duotone" className="text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Preconfiguración Diaria
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight">
                Apertura de Caja & Turno
              </h3>
              <p className="text-xs text-emerald-100/80 font-medium">
                {currentLocationName} — Control operativo POS
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Info Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
            <Icon icon="solar:info-circle-bold" className="text-lg text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Registra la <strong>base en efectivo</strong> con la que arranca la gaveta hoy. Así el sistema auditará exactamente cuánto dinero debe haber al final de la jornada y no quedará nada al aire.
            </p>
          </div>

          {/* Responsable / Cajero */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Responsable de Caja / Cajero(a) *
            </label>
            {staffList.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedStaffId}
                  onChange={handleStaffChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2f4131] outline-none text-sm font-semibold text-gray-800 transition-colors"
                >
                  <option value="">Selecciona del personal de turno...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role || 'Staff'})</option>
                  ))}
                  <option value="custom">Otro (Escribir nombre manual)</option>
                </select>

                {(!selectedStaffId || selectedStaffId === 'custom') && (
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo del cajero o administrador"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#2f4131] outline-none text-sm font-semibold text-gray-800 transition-colors"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                required
                placeholder="Nombre del cajero o administrador"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#2f4131] outline-none text-sm font-semibold text-gray-800 transition-colors"
              />
            )}
          </div>

          {/* Base Inicial en Efectivo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Base Inicial en Efectivo (Sencillo) *
              </label>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {formatCOP(initialCash)}
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={initialCash}
                onChange={(e) => setInitialCash(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2f4131] outline-none text-base font-black text-gray-900 transition-colors"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Común:</span>
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialCash(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    initialCash === amt
                      ? 'bg-[#2f4131] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {formatCOP(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Notas de Apertura */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Observaciones de Apertura (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: $50.000 en monedas y $100.000 en billetes de $10.000"
              value={openingNotes}
              onChange={(e) => setOpeningNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#2f4131] outline-none text-xs font-medium text-gray-800 transition-colors"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Omitir por ahora
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-2xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#2f4131]/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon icon="solar:play-circle-bold" width="18" />
              )}
              Iniciar Turno de Caja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
