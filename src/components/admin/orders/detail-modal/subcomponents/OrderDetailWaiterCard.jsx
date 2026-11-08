import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function OrderDetailWaiterCard({ selectedOrder, waiters = [], assignWaiter }) {
  if (!selectedOrder) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <Icon icon="solar:user-hand-up-bold" className="text-emerald-600 text-sm" />
        Mesero Asignado
      </p>
      <select
        value={selectedOrder.waiter_id || ''}
        onChange={(e) => assignWaiter?.(selectedOrder.id, e.target.value)}
        className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-gray-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
      >
        <option value="">No asignado</option>
        {waiters.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
