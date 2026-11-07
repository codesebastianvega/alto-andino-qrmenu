import React from 'react';
import { Icon } from '@iconify-icon/react';
import { resolveOrderItemName, translateGroup } from '../../../utils/formatters';

export const OrderHistoryDetailModal = ({
  historyDetailOrder,
  onClose,
  onOpenFullOrder,
  sendCancellationApologyWhatsApp
}) => {
  if (!historyDetailOrder) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Volver al historial"
            >
              <Icon icon="heroicons:arrow-left" className="text-base" />
              <span>Volver</span>
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-gray-900 tracking-tight">
                  Pedido #{historyDetailOrder.id.slice(0, 4).toUpperCase()}
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  historyDetailOrder.status === 'delivered' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {historyDetailOrder.status === 'delivered' ? '✓ Entregado' : '✕ Cancelado'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                {new Date(historyDetailOrder.created_at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(historyDetailOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 scrollbar-thin">
          
          {/* Cliente & Entrega */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Datos de Entrega</span>
              <span className="text-xs font-bold text-gray-600 capitalize bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                {historyDetailOrder.fulfillment_type?.replace('_', ' ') || 'Delivery'}
              </span>
            </div>
            <p className="font-black text-gray-900 text-sm">{historyDetailOrder.customer_name || 'Sin nombre'}</p>
            {historyDetailOrder.delivery_address && (
              <p className="text-xs text-gray-600 flex items-start gap-1.5 font-medium">
                <span className="text-emerald-700 font-bold shrink-0">📍</span>
                <span>{historyDetailOrder.delivery_address}</span>
              </p>
            )}
            {historyDetailOrder.customer_phone && (
              <p className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                <span className="text-emerald-700 font-bold">📞</span>
                <span>{historyDetailOrder.customer_phone}</span>
              </p>
            )}
            {historyDetailOrder.status === 'cancelled' && historyDetailOrder.cancellation_reason && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center justify-between gap-2 flex-wrap">
                <span>Motivo de cancelación: {historyDetailOrder.cancellation_reason}</span>
                {historyDetailOrder.customer_phone && sendCancellationApologyWhatsApp && (
                  <button
                    type="button"
                    onClick={() => sendCancellationApologyWhatsApp(historyDetailOrder, historyDetailOrder.cancellation_reason)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Icon icon="logos:whatsapp-icon" className="text-xs" />
                    <span>Enviar Disculpas + Cupón 15% OFF</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desglose de Productos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Productos Ordenados ({historyDetailOrder.order_items?.length || 0})
              </h4>
              <span className="text-xs font-bold text-gray-400">
                Total ítems: {historyDetailOrder.order_items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0}
              </span>
            </div>

            <div className="divide-y divide-gray-100 space-y-3">
              {historyDetailOrder.order_items && historyDetailOrder.order_items.length > 0 ? (
                historyDetailOrder.order_items.map((item, idx) => (
                  <div key={item.id || idx} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg text-xs shrink-0 border border-emerald-200">
                          {item.quantity}x
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 text-sm leading-snug">
                            {resolveOrderItemName(item)}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900 text-sm shrink-0">
                        ${(Number(item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>

                    {/* Modificadores */}
                    {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-8">
                        {Object.entries(item.modifiers)
                          .filter(([k]) => !k.startsWith('_'))
                          .map(([k, v]) => {
                          const displayVal = Array.isArray(v) 
                            ? v.join(', ') 
                            : (typeof v === 'object' && v ? (v.name || JSON.stringify(v)) : String(v));
                          return (
                            <span key={k} className="text-[11px] bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg font-medium border border-gray-200">
                              <strong className="text-gray-900 font-bold">{translateGroup(k)}:</strong> {displayVal}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Notas */}
                    {item.notes && (
                      <div className="ml-8 text-xs text-amber-900 bg-amber-50/90 border border-amber-200/70 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                        <span>📝</span>
                        <span>"{item.notes}"</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center">Sin detalle de productos</p>
              )}
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
              <span>Subtotal consumo:</span>
              <span>
                ${historyDetailOrder.order_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString() || Number(historyDetailOrder.total_amount).toLocaleString()}
              </span>
            </div>
            {Number(historyDetailOrder.delivery_fee) > 0 && (
              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>Costo de envío:</span>
                <span>+${Number(historyDetailOrder.delivery_fee).toLocaleString()}</span>
              </div>
            )}
            {historyDetailOrder.payment_method && (
              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>Método de pago:</span>
                <span className="font-bold text-gray-800">{historyDetailOrder.payment_method}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Total Facturado</span>
              <span className="text-xl font-black text-emerald-800 tracking-tight">
                ${Number(historyDetailOrder.total_amount).toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenFullOrder(historyDetailOrder)}
            className="px-4 py-2 text-xs font-bold text-[#2f4131] hover:bg-[#2f4131]/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Icon icon="heroicons:printer" className="text-base" />
            <span>Abrir Comanda Completa</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderHistoryDetailModal;
