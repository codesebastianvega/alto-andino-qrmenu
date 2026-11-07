import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserCheck, DollarSign, Phone, MapPin, FileText } from 'lucide-react';

export default function EditReceivableModal({ isOpen, onClose, receivable, onSave }) {
  const [customerName, setCustomerName] = useState(() => receivable?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(() => receivable?.customerPhone || '');
  const [address, setAddress] = useState(() => receivable?.address || '');
  const [totalAmount, setTotalAmount] = useState(() => receivable?.totalAmount != null ? String(receivable.totalAmount) : '');
  const [notes, setNotes] = useState(() => receivable?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !receivable) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(totalAmount.replace(/\D/g, ''));
    if (!customerName.trim()) return;

    setSaving(true);
    try {
      await onSave({
        orderId: receivable.orderId || receivable.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        totalAmount: cleanAmount > 0 ? cleanAmount : Number(receivable.totalAmount || 0),
        notes: notes.trim()
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
          <div className="p-5 bg-gradient-to-r from-blue-950 via-indigo-900 to-gray-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <UserCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-blue-400">Administración de Cartera</span>
                <h3 className="text-lg font-black text-white">Editar Datos del Fiado</h3>
                <p className="text-xs text-blue-200 mt-0.5">{receivable.customerName}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Ej. Manuela Vega"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="3219111671"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Dirección de Entrega
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 3a # 17-43"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Monto Total de la Deuda ($) *
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={totalAmount ? Number(totalAmount).toLocaleString('es-CO') : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setTotalAmount(digits);
                  }}
                  required
                  placeholder="30.000"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-base font-black focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Ajusta el valor si hubo una corrección de deuda.</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Notas / Referencias Adicionales
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Casa segundo piso, timbre blanco..."
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !customerName.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
              >
                {saving ? 'Guardando...' : <><Check size={16} /> Guardar Cambios</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
