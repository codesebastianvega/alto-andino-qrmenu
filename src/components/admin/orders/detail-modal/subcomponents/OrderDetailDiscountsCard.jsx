import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function OrderDetailDiscountsCard({
  selectedOrder,
  onApplyDiscount,
  updatingStatus
}) {
  if (!selectedOrder) return null;
  if (selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') return null;

  return (
    <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white space-y-3">
      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
        <Icon icon="heroicons:sparkles" />
        Cortesía / Descuento Rápido
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[10, 20, 50, 100].map((pct) => (
          <button
            key={pct}
            onClick={() => onApplyDiscount?.(pct)}
            disabled={updatingStatus === selectedOrder.id}
            className="py-2.5 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
          >
            {pct}%
          </button>
        ))}
      </div>
    </div>
  );
}
