import React from 'react';
import { Icon } from '@iconify-icon/react';

export const DeliveredHistoryModal = ({
  isOpen,
  onClose,
  orders,
  onSelectOrderDetail
}) => {
  if (!isOpen) return null;

  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Historial de Entregados</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                {deliveredOrders.length} Pedidos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 shadow-sm text-gray-400 hover:text-gray-600"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>
        
        <div className="overflow-y-auto px-2 scrollbar-hide">
          <div className="divide-y divide-gray-50">
            {deliveredOrders.length > 0 ? (
              deliveredOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => onSelectOrderDetail(order)}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/90 transition-all group cursor-pointer border-b border-gray-100/70 last:border-b-0"
                  title="Haz clic para ver el detalle del pedido"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Icon icon="heroicons:truck" className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-gray-900 text-sm truncate">
                          {order.customer_name || 'Sin nombre'}
                        </p>
                        <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/50 shrink-0">
                          #{order.id.slice(0, 4).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-gray-500">
                        <span className="font-extrabold text-gray-900">${Number(order.total_amount).toLocaleString()}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium text-gray-700">
                          {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'producto' : 'productos'}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="capitalize">{order.fulfillment_type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded shadow-2xs border border-gray-100">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-[#2f4131] text-gray-400 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                      <Icon icon="heroicons:chevron-right" className="text-sm font-bold" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Icon icon="heroicons:archive-box" className="text-4xl text-gray-200" />
                </div>
                <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-300">Archivo vacío</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 mt-auto text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fin del historial</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveredHistoryModal;
