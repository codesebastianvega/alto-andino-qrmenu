import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Wallet, Plus, Banknote, Smartphone, CreditCard } from 'lucide-react';

export default function AccountModal({ isOpen, onClose, onSave, accountToEdit = null }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('digital_wallet'); // 'cash' | 'digital_wallet' | 'bank' | 'other'
  const [initialBalance, setInitialBalance] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setType(accountToEdit.type || 'digital_wallet');
      setInitialBalance(String(accountToEdit.balance || ''));
    } else {
      setName('');
      setType('digital_wallet');
      setInitialBalance('');
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const cleanBalance = Number(initialBalance.replace(/\D/g, '') || 0);
      await onSave({
        id: accountToEdit?.id,
        name: name.trim(),
        type,
        initialBalance: cleanBalance
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
          <div className="p-5 bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Wallet size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
                  {accountToEdit ? 'Editar Cuenta' : 'Nuevo Bolsillo'}
                </span>
                <h3 className="text-lg font-black text-white">
                  {accountToEdit ? 'Modificar Bolsillo' : 'Crear Cuenta o Bolsillo'}
                </h3>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Nombre de la Cuenta o Bolsillo</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej: Nequi Personal, Caja Fuerte, Daviplata, Bold..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">Tipo de Cuenta</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('cash')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    type === 'cash'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="block text-[11px] font-black">Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('digital_wallet')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    type === 'digital_wallet'
                      ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-500/20'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                  <span className="block text-[11px] font-black">Billetera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('bank')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    type === 'bank'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <span className="block text-[11px] font-black">Banco / Datáfono</span>
                </button>
              </div>
            </div>

            {/* Saldo Inicial */}
            {!accountToEdit && (
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">Saldo Inicial ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={initialBalance ? Number(initialBalance.replace(/\D/g, '')).toLocaleString('es-CO') : ''}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-black text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Si ya tienes dinero en este bolsillo, ingresa el monto para sumarlo a tu patrimonio.</p>
              </div>
            )}

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
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : <>{accountToEdit ? 'Actualizar' : 'Crear Bolsillo'} <Check size={14} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
