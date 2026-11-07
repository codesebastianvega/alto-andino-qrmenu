import { Icon } from '@iconify-icon/react';
import { getGoogleMapsUrl } from '../../../utils/formatters';

export default function DeliveriesMonitorTab({
  loadingOrders,
  deliveryOrders,
  activeDeliveryOrders,
  cancelledDeliveryOrders,
  showCancelledDeliveries,
  setShowCancelledDeliveries,
  drivers,
  selectedDriverForDispatch,
  setSelectedDriverForDispatch,
  onDispatchOrder,
  onMarkOrderDelivered,
  onCancelDeliveryOrder,
  onSendCustomerApologyWhatsApp
}) {
  const displayedDeliveries = showCancelledDeliveries ? deliveryOrders : activeDeliveryOrders;

  return (
    <div className="space-y-4">
      {cancelledDeliveryOrders.length > 0 && (
        <div className="flex items-center justify-between bg-rose-50/70 border border-rose-200/80 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <Icon icon="solar:info-circle-bold" className="text-base text-rose-600" />
            <span>
              Hay {cancelledDeliveryOrders.length} {cancelledDeliveryOrders.length === 1 ? 'domicilio cancelado' : 'domicilios cancelados'} hoy (oculto de los pendientes por despachar).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCancelledDeliveries(prev => !prev)}
            className="text-xs font-black text-rose-700 hover:text-rose-900 underline cursor-pointer"
          >
            {showCancelledDeliveries ? 'Ocultar cancelados' : `Ver cancelados (${cancelledDeliveryOrders.length})`}
          </button>
        </div>
      )}

      {loadingOrders ? (
        <div className="py-16 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
          <Icon icon="solar:refresh-bold" className="animate-spin text-lg" />
          <span>Cargando entregas del día...</span>
        </div>
      ) : displayedDeliveries.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2">
          <Icon icon="solar:box-minimalistic-bold" className="text-4xl text-gray-300 mx-auto" />
          <h3 className="text-sm font-black text-gray-800">No hay pedidos de domicilio activos por despachar</h3>
          <p className="text-xs text-gray-400">Cuando un cliente ordene a domicilio, aparecerá aquí en tiempo real para ser despachado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedDeliveries.map(order => {
            const shortNum = `#${order.id.slice(0, 4).toUpperCase()}`;
            const isCancelled = order.status === 'cancelled';
            const isDelivered = order.status === 'delivered';
            const isOnTheWay = order.status === 'on_table' || order.status === 'on_the_way';
            const selectedDriverId = selectedDriverForDispatch[order.id] || (drivers[0]?.id || '');
            const targetDriver = drivers.find(d => d.id === selectedDriverId);

            return (
              <div
                key={order.id}
                className={`rounded-3xl border p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCancelled
                    ? 'bg-rose-50/40 border-rose-200/80 opacity-85'
                    : 'bg-white border-gray-200/90'
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-black text-base ${isCancelled ? 'line-through text-rose-700' : 'text-gray-900'}`}>{shortNum}</span>
                    <span className="text-xs text-gray-400 font-semibold">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {isCancelled ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase border border-rose-200">
                        ❌ Cancelado
                      </span>
                    ) : isDelivered ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        ✅ Entregado
                      </span>
                    ) : isOnTheWay ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase animate-pulse">
                        🛵 En Camino
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        ⏳ Por despachar ({order.status === 'preparing' ? 'En Cocina' : order.status === 'ready' ? 'Listo' : 'Nuevo'})
                      </span>
                    )}

                    <span className="text-xs font-black text-gray-800 ml-auto sm:ml-0">
                      ${Number(order.total_amount || 0).toLocaleString()}
                    </span>
                  </div>

                  {isCancelled && (
                    <div className="text-xs font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                      <Icon icon="solar:danger-triangle-bold" className="text-sm shrink-0" />
                      <span>Motivo de cancelación: "{order.cancellation_reason || 'Sin motivo especificado'}"</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-700 font-bold flex items-center gap-2">
                    <Icon icon="heroicons:user" className="text-gray-400" />
                    <span>{order.customer_name || 'Cliente sin nombre'}</span>
                    {order.customer_phone && (
                      <span className="text-gray-400 font-normal">({order.customer_phone})</span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 flex items-start gap-1.5">
                    <Icon icon="heroicons:map-pin" className="text-rose-500 text-sm shrink-0 mt-0.5" />
                    <span className="font-semibold break-words">
                      {order.delivery_address || 'Sin dirección'}
                    </span>
                    {order.delivery_address && (
                      <a
                        href={getGoogleMapsUrl(order.delivery_address)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black text-blue-600 hover:underline shrink-0 ml-1"
                      >
                        [Maps]
                      </a>
                    )}
                  </div>

                  {order.delivery_notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                      📝 {order.delivery_notes}
                    </p>
                  )}
                </div>

                {/* Acciones de Despacho / Estado */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 flex-wrap">
                  {isCancelled ? (
                    order.customer_phone && (
                      <button
                        type="button"
                        onClick={() => onSendCustomerApologyWhatsApp(order)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Icon icon="logos:whatsapp-icon" className="text-sm" />
                        <span>Enviar Disculpas + Cupón 15% OFF</span>
                      </button>
                    )
                  ) : (
                    <>
                      {/* Enlace para abrir la vista del domiciliario */}
                      <a
                        href={`/domi/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                        title="Ver app del repartidor para este pedido"
                      >
                        <Icon icon="solar:eye-bold" className="text-sm" />
                        <span>Ver App Repartidor</span>
                      </a>

                      {/* Selector de Domiciliario y Botón de Despacho */}
                      {drivers.length > 0 && !isDelivered && (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedDriverId}
                            onChange={(e) => setSelectedDriverForDispatch(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:outline-none"
                          >
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} {d.is_active ? '(Activo)' : ''}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => onDispatchOrder(order, targetDriver)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            title="Despachar pedido por WhatsApp al repartidor"
                          >
                            <Icon icon="logos:whatsapp-icon" className="text-sm" />
                            <span>Despachar</span>
                          </button>
                        </div>
                      )}

                      {!isDelivered && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onMarkOrderDelivered(order)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-all cursor-pointer"
                            title="Marcar este domicilio como Entregado"
                          >
                            ✅ Entregado
                          </button>
                          <button
                            type="button"
                            onClick={() => onCancelDeliveryOrder(order)}
                            className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer"
                            title="Cancelar este domicilio"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
