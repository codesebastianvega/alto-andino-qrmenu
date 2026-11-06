import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, DollarSign, Tag, User, FileText, ArrowDownRight } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../../hooks/useFinance';

export default function RecordExpenseModal({ isOpen, onClose, accounts = [], onSave }) {
  const [category, setCategory] = useState('supplies');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [beneficiary, setBeneficiary] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(amount.replace(/\D/g, '') || 0);
    if (cleanAmount <= 0) return;
    if (!description.trim()) return;

    setSaving(true);
    try {
      await onSave({
        category,
        amount: cleanAmount,
        description,
        accountId: accountId || accounts[0]?.id,
        beneficiary
      });
      onClose();
      // Reset
      setAmount('');
      setDescription('');
      setBeneficiary('');
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
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-rose-950 via-rose-900 to-gray-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ArrowDownRight size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-rose-400">Salida de Dinero</span>
                <h3 className="text-lg font-black text-white">Registrar Gasto Operativo</h3>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Monto */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Monto del Gasto ($)</label>
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
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-black text-lg text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Categoría del Gasto</label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      category === cat.id
                        ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-500/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuenta de donde sale */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">¿De qué cuenta sale el dinero?</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: ${Number(acc.balance || 0).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">Descripción / Concepto</label>
              <input
                type="text"
                required
                placeholder="Ej: Compra de 5 bolsas de hielo y limones"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Beneficiario / Proveedor (Opcional) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Beneficiario / Proveedor (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Distribuidora Don Pedro"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800"
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
                disabled={saving || !amount || !description}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : <>Guardar Gasto <Check size={14} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
