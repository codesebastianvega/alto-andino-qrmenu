import React from 'react';
import { Icon } from '@iconify-icon/react';
import { parsePaymentMethod } from '@/utils/formatters';

export default function OrderDetailFinancialCard({
  selectedOrder,
  onAssignFiado,
  onDirectPayment
}) {
  if (!selectedOrder) return null;

  const pm = parsePaymentMethod(selectedOrder.payment_method, selectedOrder.payment_status);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Financiero</p>
        <span
          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
            selectedOrder.payment_status === 'paid'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          {selectedOrder.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
        </span>
      </div>

      {/* Chip Destacado de Medio de Pago y Detalle de Cambio */}
      <div className={`p-3 rounded-xl border ${pm.bg} ${pm.border} space-y-1.5`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Método de Pago</span>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${pm.bg} ${pm.text} border ${pm.border} flex items-center gap-1`}
          >
            <Icon icon={pm.icon} />
            {pm.shortLabel}
          </span>
        </div>
        <p className="text-xs font-bold text-gray-900 break-words">
          {selectedOrder.payment_method || 'Por acordar con el cliente'}
        </p>
        {pm.detail && pm.type === 'cash' && (
          <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-black text-emerald-900">
            {pm.tendered && <span>💵 Recibe: {pm.tendered}</span>}
            {pm.change && (
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                Dar vuelto: {pm.change}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botones de Gestión de Fiado / Cobro Rápido */}
      {selectedOrder.payment_status !== 'paid' && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Asignar o Registrar Pago
            </span>
          </div>

          {/* Botón: Asignar como Fiado */}
          {selectedOrder.payment_method !== 'fiado' &&
          !String(selectedOrder.delivery_notes || '').toLowerCase().includes('fiado') ? (
            <button
              type="button"
              onClick={onAssignFiado}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              title="Marcar este pedido como fiado / cuenta por cobrar"
            >
              <Icon icon="solar:hand-stars-bold" className="text-base text-purple-600" />
              <span>🤝 Asignar como Fiado (Cuenta por Cobrar)</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-purple-100/70 border border-purple-200 text-purple-950 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Icon icon="solar:hand-stars-bold" className="text-purple-700 text-sm" />
                Asignado como Fiado
              </span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                Por Cobrar
              </span>
            </div>
          )}

          {/* Botones rápidos de pago directo (Efectivo / Nequi) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDirectPayment('efectivo')}
              className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Icon icon="solar:wallet-money-bold" className="text-sm text-emerald-600" />
              <span>💵 Pagó Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => onDirectPayment('nequi')}
              className="py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Icon icon="solar:smartphone-bold" className="text-sm text-pink-600" />
              <span>📲 Pagó Nequi</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-500">Monto Total</span>
        <span className="font-black text-slate-900">${selectedOrder.total_amount?.toLocaleString()}</span>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-500">Pagado</span>
        <span className="font-black text-emerald-600">${(selectedOrder.paid_amount || 0).toLocaleString()}</span>
      </div>

      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs font-black text-slate-900">PENDIENTE</span>
        <span
          className={`text-base font-black ${
            selectedOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-orange-600'
          }`}
        >
          ${Math.max(0, (selectedOrder.total_amount || 0) - (selectedOrder.paid_amount || 0)).toLocaleString()}
        </span>
      </div>

      {selectedOrder.payment_status === 'paid' && (
        <div className="flex items-center gap-1.5 justify-center py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-[10px] font-black uppercase">
          <Icon icon="heroicons:check-circle" className="text-sm" />
          Completamente Pagado
        </div>
      )}

      {/* Historial de Pagos si hay pagos registrados */}
      {selectedOrder.order_payments?.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Icon icon="heroicons:clipboard-document-check" className="text-xs" />
            Abonos Realizados
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
            {selectedOrder.order_payments
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((pay) => (
                <div
                  key={pay.id}
                  className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs"
                >
                  <div>
                    <span className="text-[10px] font-black text-slate-800 uppercase block">
                      {pay.payment_method_name || 'Desconocido'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400">
                      {new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-emerald-600 block">
                      ${pay.amount.toLocaleString()}
                    </span>
                    {pay.change_amount > 0 && (
                      <span className="text-[8px] font-bold text-slate-400 block">
                        Cambio: ${pay.change_amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
