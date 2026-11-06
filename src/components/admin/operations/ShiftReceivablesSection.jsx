import React from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';
import { resolveOrderItemName } from '@/utils/formatters';

export default function ShiftReceivablesSection({
  fiadosList = [],
  fiadosByCustomer = [],
  totalFiados = 0,
  onPrintCustomerStatement,
  onSendWhatsAppStatement,
  onOpenSettleModal,
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shadow-xs">
            <Icon icon="solar:hand-money-bold" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span>Cuentas por Cobrar & Fiados</span>
              {fiadosList.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-black">
                  {fiadosByCustomer.length} {fiadosByCustomer.length === 1 ? 'cliente' : 'clientes'} ({fiadosList.length} {fiadosList.length === 1 ? 'pedido' : 'pedidos'})
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              Alimentos despachados con pago pendiente. Agrupados por cliente con historial, abonos y estado de cuenta.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Saldo Total Pendiente</span>
          <span className="text-lg md:text-xl font-black text-purple-900">{formatCOP(totalFiados)}</span>
        </div>
      </div>

      {fiadosByCustomer.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fiadosByCustomer.map(customer => (
            <div
              key={customer.id}
              className="p-5 rounded-3xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/20 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                      {customer.cleanName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900 truncate">
                          {customer.cleanName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                          Fiado
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5 flex-wrap">
                        {customer.phone && (
                          <span className="flex items-center gap-1 font-bold text-gray-700">
                            <Icon icon="solar:phone-bold" className="text-xs text-purple-600" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.address && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={customer.address}>
                            <Icon icon="solar:map-point-bold" className="text-xs text-gray-400" />
                            <span className="truncate">{customer.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Adeudado</span>
                    <span className="text-base md:text-lg font-black text-purple-950">
                      {formatCOP(customer.totalDebt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Desglose de Pedidos ({customer.orders.length}):
                  </p>
                  <div className="space-y-2">
                    {customer.orders.map(order => {
                      const shortId = order.id.slice(0, 4).toUpperCase();
                      const timeStr = new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                      const orderTotal = Number(order.total_amount || 0);
                      const paid = Number(order.paid_amount || 0);
                      const discount = Number(order.discount_amount || 0);
                      const orderBalance = Math.max(0, orderTotal - paid);
                      const items = order.order_items || [];

                      return (
                        <div
                          key={order.id}
                          className="p-3 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-purple-900">#{shortId}</span>
                              <span className="text-gray-400 font-bold">•</span>
                              <span className="text-gray-600 font-bold">{timeStr}</span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                {order.status === 'delivered' ? 'Entregado' : order.status}
                              </span>
                            </div>
                            <span className="font-black text-gray-900">
                              {formatCOP(orderBalance)}
                            </span>
                          </div>

                          {items.length > 0 && (
                            <div className="text-[11px] text-gray-600 pl-2 border-l-2 border-purple-200 space-y-0.5">
                              {items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span>{it.quantity}x {resolveOrderItemName(it)}</span>
                                  <span className="font-bold text-gray-700">{formatCOP(Number(it.unit_price || 0) * Number(it.quantity || 1))}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-gray-400 font-medium">
                            {paid > 0 ? (
                              <span className="text-emerald-700 font-bold">
                                Abonado: {formatCOP(paid)} (Saldo: {formatCOP(orderBalance)})
                              </span>
                            ) : (
                              <span>Sin abonos previos</span>
                            )}
                            {discount > 0 && (
                              <span className="text-blue-700 font-bold">
                                Descuento: -{formatCOP(discount)}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenSettleModal(order)}
                              className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer ml-auto"
                            >
                              Cobrar / Abonar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onPrintCustomerStatement(customer)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Imprime la factura y estado de cuenta térmico con todo el desglose"
                  >
                    <Icon icon="solar:printer-bold" className="text-sm text-gray-600" />
                    <span>Imprimir Factura</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSendWhatsAppStatement(customer)}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Envía el resumen detallado por WhatsApp para tranquilidad del cliente"
                  >
                    <Icon icon="solar:chat-round-dots-bold" className="text-sm text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {customer.orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenSettleModal(customer.orders[0])}
                    className="px-3.5 py-2 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Icon icon="solar:wallet-money-bold" className="text-sm text-emerald-300" />
                    <span>Registrar Pago</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-800 text-xs font-bold">
          <Icon icon="solar:check-circle-bold" className="text-xl text-emerald-600 shrink-0" />
          <span>Todo al día. No hay cuentas por cobrar ni fiados pendientes en este turno.</span>
        </div>
      )}
    </div>
  );
}
