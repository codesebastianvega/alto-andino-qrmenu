import React from 'react';
import { Icon } from '@iconify-icon/react';
import { translateGroup } from '@/utils/formatters';

export default function OrderDetailItemsColumn({ selectedOrder, setAdditionOrder }) {
  if (!selectedOrder) return null;

  return (
    <div className="space-y-4">
      {/* Alertas de Estado (Delivered / Cancelled) */}
      {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
        <div className="flex flex-col gap-2">
          {selectedOrder.status === 'delivered' && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
              <Icon icon="heroicons:check-circle" className="text-lg text-emerald-600 shrink-0" />
              <span>
                Pedido Finalizado a las{' '}
                {new Date(selectedOrder.delivered_at || selectedOrder.updated_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          {selectedOrder.status === 'cancelled' && (
            <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl font-bold text-xs bg-red-50 text-red-800 border border-red-200 shadow-sm">
              <div className="flex items-center gap-2 font-black uppercase text-xs text-red-700">
                <Icon icon="heroicons:x-circle" className="text-lg text-red-600 shrink-0" />
                Pedido Cancelado
              </div>
              {selectedOrder.cancellation_reason && (
                <p className="text-xs font-medium text-red-600/90 pl-6">
                  Motivo: {selectedOrder.cancellation_reason}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tarjeta: Lista de Productos */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Icon icon="heroicons:shopping-cart" className="text-base text-slate-400" />
            Detalle del Consumo ({selectedOrder.order_items?.length || 0}{' '}
            {selectedOrder.order_items?.length === 1 ? 'ítem' : 'ítems'})
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            Total items:{' '}
            {selectedOrder.order_items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {selectedOrder.order_items?.map((item) => (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5 group">
              <span className="font-black text-sm md:text-base text-[#2f4131] bg-slate-100 px-2.5 py-1 rounded-xl shrink-0 h-fit border border-slate-200">
                {item.quantity}x
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">
                    {item.products?.name}
                  </span>
                  {item.is_paid && (
                    <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Icon icon="heroicons:check-circle-16-solid" />
                      PAGADO
                    </span>
                  )}
                </div>

                {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {Object.entries(item.modifiers).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold"
                      >
                        {translateGroup(k)}: {Array.isArray(v) ? v.join(', ') : v}
                      </span>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg italic font-medium border border-amber-200 flex items-center gap-1.5">
                    <Icon icon="heroicons:chat-bubble-bottom-center-text" className="text-amber-500 shrink-0" />
                    <span>"{item.notes}"</span>
                  </div>
                )}
              </div>

              <span className="font-black text-sm text-gray-900 shrink-0 whitespace-nowrap pt-1">
                ${(item.quantity * item.unit_price).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Botón de Adición Rápida en el Modal */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setAdditionOrder?.(selectedOrder)}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Icon icon="solar:cart-plus-bold" className="text-base text-amber-700" />
            <span>+ Agregar Producto / Adición a esta Comanda</span>
          </button>
        </div>

        {/* Desglose de Totales */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Subtotal consumo</span>
            <span>
              $
              {selectedOrder.order_items
                ?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
                .toLocaleString()}
            </span>
          </div>

          {selectedOrder.service_fee > 0 && (
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
              <span className="flex items-center gap-1">
                <Icon icon="heroicons:heart" />
                Servicio Voluntario
              </span>
              <span>${selectedOrder.service_fee.toLocaleString()}</span>
            </div>
          )}

          {selectedOrder.discount_amount > 0 && (
            <div className="flex justify-between items-center text-xs font-bold text-red-600">
              <span className="flex items-center gap-1">
                <Icon icon="heroicons:tag" />
                Descuento ({selectedOrder.discount_reason})
              </span>
              <span>-${selectedOrder.discount_amount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900">TOTAL A PAGAR</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedOrder.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}
              >
                {selectedOrder.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
              </span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-[#2f4131] tracking-tight">
              ${selectedOrder.total_amount?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
