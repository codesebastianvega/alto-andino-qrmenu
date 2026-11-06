import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRightLeft, DollarSign } from 'lucide-react';

export default function TransferFundsModal({ isOpen, onClose, accounts = [], onSave }) {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(amount.replace(/\D/g, '') || 0);
    if (cleanAmount <= 0) return;
    if (fromAccountId === toAccountId) return;

    setSaving(true);
    try {
      await onSave({
        fromAccountId,
        toAccountId,
        amount: cleanAmount,
        notes
      });
      onClose();
      setAmount('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fromAcc = accounts.find(a => a.id === fromAccountId);

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
          <div className="p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-gray-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-blue-400">Movimiento Interno</span>
                <h3 className="text-lg font-black text-white">Transferir entre Cuentas</h3>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Monto */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Monto a Transferir ($)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  autoFocus
                  placeholder="0"
                  value={amount ? Number(amount.replace(/\D/g, '')).toLocaleString('es-CO') : ''}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-black text-lg text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Cuenta Origen */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Cuenta Origen (De donde sale)</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: ${Number(acc.balance || 0).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>

            {/* Cuenta Destino */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Cuenta Destino (A donde entra)</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {accounts.filter(a => a.id !== fromAccountId).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: ${Number(acc.balance || 0).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Notas / Motivo (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Consignación de efectivo del fin de semana"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800"
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
                disabled={saving || !amount || fromAccountId === toAccountId}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Transfiriendo...' : <>Confirmar Transferencia <Check size={14} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
