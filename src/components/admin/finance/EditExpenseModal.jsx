import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, DollarSign, Wallet, Trash2, Calendar, 
  Tag, User, FileText, AlertTriangle 
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../../hooks/useFinance';

export default function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  accounts = [],
  onSave,
  onDelete
}) {
  const [category, setCategory] = useState(() => expense?.category || 'supplies');
  const [amount, setAmount] = useState(() => (expense?.amount != null ? String(expense.amount) : ''));
  const [description, setDescription] = useState(() => expense?.description || '');
  const [accountId, setAccountId] = useState(() => expense?.accountId || accounts[0]?.id || '');
  const [beneficiary, setBeneficiary] = useState(() => expense?.beneficiary || '');
  const [date, setDate] = useState(() => {
    if (expense?.date) {
      try {
        const d = new Date(expense.date);
        return d.toISOString().slice(0, 16);
      } catch (e) {
        return new Date().toISOString().slice(0, 16);
      }
    }
    return new Date().toISOString().slice(0, 16);
  });

  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(String(amount).replace(/\D/g, ''));
    if (cleanAmount <= 0) return;
    if (!description.trim()) return;

    setSaving(true);
    try {
      await onSave({
        expenseId: expense.id,
        category,
        amount: cleanAmount,
        description: description.trim(),
        accountId,
        beneficiary: beneficiary.trim(),
        date: new Date(date).toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error updating expense:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      if (onDelete) {
        await onDelete(expense.id);
      }
      onClose();
    } catch (err) {
      console.error('Error deleting expense:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentAccount = accounts.find(a => a.id === accountId) || accounts.find(a => a.name === expense.accountName);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-rose-950 via-rose-900 to-gray-900 text-white relative flex-shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                <DollarSign size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-rose-400">Control de Caja & Gastos</span>
                <h3 className="text-lg font-black text-white">Editar Salida de Caja</h3>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Cambia la cuenta de pago, monto o detalles contables
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Cuenta de Pago (Bolsillo) */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Wallet size={13} className="text-rose-600" />
                Cuenta / Bolsillo de Pago *
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white transition-all"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo actual: ${Number(acc.balance || 0).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
              {currentAccount && (
                <p className="text-[11px] text-gray-500 mt-1 pl-1">
                  Si cambias la cuenta, el monto se devolverá a la cuenta anterior y se descontará de la nueva automáticamente.
                </p>
              )}
            </div>

            {/* Monto del Gasto */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <DollarSign size={13} className="text-rose-600" />
                Monto del Gasto (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="text"
                  required
                  value={amount ? Number(amount).toLocaleString('es-CO') : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAmount(raw);
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-base font-black focus:outline-hidden focus:border-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-rose-600" />
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white transition-all"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id || cat.label}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Beneficiario / Proveedor */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-rose-600" />
                Beneficiario / Proveedor
              </label>
              <input
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="Ej. Tiendas D1, Fruver Don Pedro, Juan Mecánico"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            {/* Descripción / Concepto */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-rose-600" />
                Descripción / Concepto *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={2}
                placeholder="Detalle de lo comprado o pagado"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Fecha del gasto */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-rose-600" />
                Fecha y Hora
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            {/* Confirm Delete Banner */}
            {showConfirmDelete && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">
                    ¿Seguro que deseas eliminar este gasto? El saldo de <strong>${Number(expense.amount || 0).toLocaleString('es-CO')}</strong> se reintegrará a la cuenta de origen.
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Sí, Eliminar Gasto
                  </button>
                </div>
              </div>
            )}

            {/* Actions footer */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar Gasto
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-200 transition-all disabled:opacity-50"
                >
                  <Check size={14} />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
