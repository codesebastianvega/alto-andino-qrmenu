import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, HandCoins, AlertCircle, Calendar } from 'lucide-react';

export default function SettleReceivableModal({ isOpen, onClose, receivable, accounts = [], onSave }) {
  const [amount, setAmount] = useState(() => receivable ? String(receivable.balanceDue) : '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [settleMode, setSettleMode] = useState('real'); // 'real' | 'historical'
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !receivable) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(amount.replace(/\D/g, '') || receivable.balanceDue);
    if (cleanAmount <= 0) return;

    setSaving(true);
    try {
      await onSave({
        receivableId: receivable.id,
        amountToPay: cleanAmount,
        accountId: accountId || accounts[0]?.id,
        notes,
        isHistorical: settleMode === 'historical'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-gray-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HandCoins size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">Recaudo de Cartera</span>
                <h3 className="text-lg font-black text-white">Cobrar Fiado</h3>
                <p className="text-xs text-emerald-200 mt-0.5">{receivable.customerName}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Info Deuda */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Saldo Pendiente</span>
                <span className="text-xl font-black text-rose-600">$ {Number(receivable.balanceDue).toLocaleString('es-CO')}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Antigüedad</span>
                <span className="text-xs font-black text-gray-700">{receivable.ageDays || 0} días</span>
              </div>
            </div>

            {/* Modo de Regularización */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Tipo de Liquidación</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleMode('real')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                    settleMode === 'real'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-black">☀️ Cobro Real</span>
                  <span className="text-[10px] text-gray-500 font-normal">Suma el dinero al bolsillo elegido</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettleMode('historical')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                    settleMode === 'historical'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-black">📜 Ajuste Histórico</span>
                  <span className="text-[10px] text-gray-500 font-normal">Saldar cartera sin alterar saldo hoy</span>
                </button>
              </div>
            </div>

            {/* Monto a cobrar */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Monto a Cobrar ($)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount ? Number(amount.replace(/\D/g, '')).toLocaleString('es-CO') : ''}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-black text-base text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Cuenta Destino (Solo si cobro real) */}
            {settleMode === 'real' && (
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">¿A qué cuenta entró el dinero?</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: ${Number(acc.balance || 0).toLocaleString('es-CO')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Notas (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Pago realizado por transferencia Nequi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Procesando...' : <>Confirmar Recaudo <Check size={14} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
