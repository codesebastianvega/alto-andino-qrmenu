import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function OrderDetailCustomerCard({ selectedOrder, fulfillmentInfo, shareToWhatsApp }) {
  if (!selectedOrder) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información General</p>
        <span
          className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
            selectedOrder.fulfillment_type === 'dine_in'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          {selectedOrder.fulfillment_type === 'dine_in'
            ? `🪑 MESA ${selectedOrder.restaurant_tables?.table_number || '?'}`
            : fulfillmentInfo.text}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200 mt-0.5">
          <Icon icon="heroicons:user" className="text-lg" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Cliente</p>
          <p className="font-bold text-gray-900 text-sm leading-snug break-words">
            {selectedOrder.customer_name || 'Sin nombre'}
          </p>
        </div>
      </div>

      {selectedOrder.customer_phone && (
        <div className="pt-2 border-t border-slate-50 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                <Icon icon="heroicons:phone" className="text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Celular</p>
                <p className="font-bold text-gray-900 text-sm leading-none">{selectedOrder.customer_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`https://wa.me/${
                  selectedOrder.customer_phone.replace(/\D/g, '').startsWith('57')
                    ? selectedOrder.customer_phone.replace(/\D/g, '')
                    : `57${selectedOrder.customer_phone.replace(/\D/g, '')}`
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
                title="Chat por WhatsApp"
              >
                <Icon icon="logos:whatsapp-icon" className="text-base" />
              </a>
              <a
                href={`tel:${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
                title="Llamar directamente"
              >
                <Icon icon="heroicons:phone" className="text-base" />
              </a>
            </div>
          </div>

          {/* Botón Rápido de Notificación al Cliente por WhatsApp */}
          <button
            type="button"
            onClick={() => shareToWhatsApp?.(selectedOrder, 'status')}
            className="w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 border border-emerald-300/80 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            title="Notificar actualización de estado al cliente por WhatsApp"
          >
            <Icon icon="logos:whatsapp-icon" className="text-sm" />
            <span>📲 Avisar Estado Actual por WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
}
