import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function OrderDetailHeader({ selectedOrder, fulfillmentInfo, onClose }) {
  if (!selectedOrder) return null;

  return (
    <div className="shrink-0 px-6 py-4 md:px-8 md:py-5 border-b border-gray-200 bg-white flex justify-between items-center z-10 shadow-sm">
      <div className="flex items-center gap-3.5">
        <div className="h-11 w-11 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 text-[#2f4131]">
          <Icon icon="heroicons:clipboard-document-list" className="text-2xl" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-none">
              PEDIDO #{selectedOrder.id.slice(0, 4).toUpperCase()}
            </h2>
            <span className={`text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-lg border ${fulfillmentInfo.color}`}>
              {fulfillmentInfo.text}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Icon icon="solar:clock-circle-bold" className="text-sm" />
            <span>
              Recibido a las{' '}
              {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {selectedOrder.scheduled_time && (
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                📅 Programado:{' '}
                {new Date(selectedOrder.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="h-9 w-9 md:h-10 md:w-10 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-all text-gray-400 border border-gray-200"
          title="Cerrar modal"
        >
          <Icon icon="heroicons:x-mark" className="text-xl" />
        </button>
      </div>
    </div>
  );
}
