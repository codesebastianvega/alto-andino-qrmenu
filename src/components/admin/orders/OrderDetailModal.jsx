import React from 'react';
import { Icon } from '@iconify-icon/react';
import { supabase } from '../../../config/supabase';
import { toast } from '../../Toast';
import { printThermalDocument } from '../../../utils/thermalPrint';
import { 
  parsePaymentMethod, 
  getGoogleMapsUrl, 
  getWazeUrl, 
  translateGroup, 
  resolveOrderItemName 
} from '../../../utils/formatters';
import { getFulfillmentLabel } from './OrderKanbanCard';

export const OrderDetailModal = ({
  selectedOrder,
  onClose,
  restaurantSettings,
  activeBrand,
  waiters,
  assignWaiter,
  updateOrderStatus,
  applyDiscount,
  cancelOrder,
  isCancelling,
  setIsCancelling,
  cancellationReason,
  setCancellationReason,
  updatingStatus,
  setIsPOSModalOpen,
  setIsMerging,
  setMergeSourceOrder,
  setAdditionOrder,
  setSelectedOrder,
  fetchOrders,
  shareToWhatsApp,
  selectedPaymentMethod
}) => {
  if (!selectedOrder) return null;

  const fulfillmentInfo = getFulfillmentLabel(selectedOrder.fulfillment_type);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-slate-50 w-full max-w-6xl h-[94vh] md:h-[88vh] max-h-[920px] rounded-t-[2rem] rounded-b-none md:rounded-b-[2rem] shadow-2xl overflow-hidden flex flex-col mt-auto md:mt-0 border border-slate-200/80 animate-in slide-in-from-bottom-4 md:zoom-in duration-300">
        
        {/* Header Modal (shrink-0) */}
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
                <span>Recibido a las {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {selectedOrder.scheduled_time && (
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                    📅 Programado: {new Date(selectedOrder.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* Scrollable Body: flex-1 min-h-0 overflow-y-auto */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-7 custom-scrollbar bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 items-start">
            
            {/* Columna Izquierda: Detalle de Platos, Notas y Totales */}
            <div className="space-y-4">
              {/* Alertas de Estado (Delivered / Cancelled) */}
              {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                <div className="flex flex-col gap-2">
                  {selectedOrder.status === 'delivered' && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                      <Icon icon="heroicons:check-circle" className="text-lg text-emerald-600 shrink-0" />
                      <span>Pedido Finalizado a las {new Date(selectedOrder.delivered_at || selectedOrder.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {selectedOrder.status === 'cancelled' && (
                    <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl font-bold text-xs bg-red-50 text-red-800 border border-red-200 shadow-sm">
                      <div className="flex items-center gap-2 font-black uppercase text-xs text-red-700">
                        <Icon icon="heroicons:x-circle" className="text-lg text-red-600 shrink-0" />
                        Pedido Cancelado
                      </div>
                      {selectedOrder.cancellation_reason && (
                        <p className="text-xs font-medium text-red-600/90 pl-6">Motivo: {selectedOrder.cancellation_reason}</p>
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
                    Detalle del Consumo ({selectedOrder.order_items?.length || 0} {selectedOrder.order_items?.length === 1 ? 'ítem' : 'ítems'})
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total items: {selectedOrder.order_items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedOrder.order_items?.map(item => (
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
                              <span key={k} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
                                {translateGroup(k)}: {Array.isArray(v) ? v.join(", ") : v}
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
                    onClick={() => setAdditionOrder(selectedOrder)}
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
                    <span>${selectedOrder.order_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}</span>
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
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedOrder.payment_status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
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

            {/* Columna Derecha: Sidebar Admin */}
            <div className="space-y-4">
              {/* Tarjeta: Información de Cliente & Ubicación */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información General</p>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                    selectedOrder.fulfillment_type === 'dine_in' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
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
                          href={`https://wa.me/${(selectedOrder.customer_phone.replace(/\D/g, '').startsWith('57') ? selectedOrder.customer_phone.replace(/\D/g, '') : `57${selectedOrder.customer_phone.replace(/\D/g, '')}`)}`}
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
                      onClick={() => shareToWhatsApp(selectedOrder, 'status')}
                      className="w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 border border-emerald-300/80 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      title="Notificar actualización de estado al cliente por WhatsApp"
                    >
                      <Icon icon="logos:whatsapp-icon" className="text-sm" />
                      <span>📲 Avisar Estado Actual por WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tarjeta: Dirección de Entrega & Mapas (Domicilio) */}
              {(selectedOrder.delivery_address || selectedOrder.fulfillment_type === 'delivery') && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Icon icon="heroicons:map-pin" className="text-rose-500 text-sm" />
                      Dirección de Entrega
                    </p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 uppercase">
                      Domicilio
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-gray-900 leading-snug break-words">
                      {selectedOrder.delivery_address || 'Sin dirección registrada'}
                    </p>
                    {selectedOrder.delivery_notes && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 mt-1">
                        📝 <strong>Nota de Entrega:</strong> {selectedOrder.delivery_notes}
                      </div>
                    )}
                  </div>

                  {selectedOrder.delivery_address && (
                    <>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={getGoogleMapsUrl(selectedOrder.delivery_address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Abrir ubicación en Google Maps"
                        >
                          <Icon icon="logos:google-maps" className="text-base" />
                          <span>Google Maps</span>
                        </a>
                        <a
                          href={getWazeUrl(selectedOrder.delivery_address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Navegar en Waze"
                        >
                          <Icon icon="solar:routing-2-bold" className="text-base text-cyan-600" />
                          <span>Waze</span>
                        </a>
                      </div>

                      {/* Contacto Directo: Llamada y Aviso de Llegada */}
                      {selectedOrder.customer_phone && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a
                            href={`tel:${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Llamada telefónica inmediata al cliente"
                          >
                            <Icon icon="heroicons:phone" className="text-base text-emerald-600" />
                            <span>Llamar Cliente</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              const cleanP = selectedOrder.customer_phone.replace(/\D/g, '');
                              const phone = cleanP.startsWith('57') ? cleanP : `57${cleanP}`;
                              const shortNum = `#${selectedOrder.id.slice(0, 4).toUpperCase()}`;
                              const brand = activeBrand?.name || 'Boku Bento';
                              const msg = `🛵 ¡Hola ${selectedOrder.customer_name || ''}! Ya nos encontramos afuera de tu dirección (*${selectedOrder.delivery_address || ''}*) con tu pedido ${shortNum} caliente y listo de ${brand}.\n\n¿Podrías salir a recibirlo, por favor? ¡Muchas gracias! 🙌`;
                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Avisar que ya llegó el domiciliario por WhatsApp"
                          >
                            <Icon icon="solar:bell-bing-bold" className="text-base text-amber-600" />
                            <span>🔔 ¡Ya Llegué!</span>
                          </button>
                        </div>
                      )}

                      {/* Asignar y Enviar al Domiciliario */}
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const driverUrl = `${window.location.origin}/domi/${selectedOrder.id}`;
                            const shortNum = `#${selectedOrder.id.slice(0, 4).toUpperCase()}`;
                            const brand = activeBrand?.name || 'Boku Bento';
                            const msg = `🛵 *DOMICILIO ASIGNADO - ${brand}*\n📦 *Pedido ${shortNum}*\n👤 *Cliente:* ${selectedOrder.customer_name || 'Sin nombre'}\n📞 *Teléfono:* ${selectedOrder.customer_phone || ''}\n📍 *Dirección:* ${selectedOrder.delivery_address || ''}\n${selectedOrder.delivery_notes ? `📝 *Nota:* ${selectedOrder.delivery_notes}\n` : ''}💰 *Cobro:* ${selectedOrder.payment_status === 'paid' ? 'YA PAGADO (No cobrar dinero)' : `$${Number(selectedOrder.total_amount || 0).toLocaleString()} (${selectedOrder.payment_method || 'Cobro contra entrega'})`}\n\n📲 *Abre la app de entrega aquí (Mapa y llamada rápida):*\n${driverUrl}`;
                            
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(driverUrl);
                            }
                            toast.success('¡Enlace de entrega copiado! Abriendo WhatsApp...');
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          title="Enviar comanda completa y enlace de entrega al domiciliario por WhatsApp"
                        >
                          <Icon icon="solar:scooter-bold-duotone" className="text-base text-emerald-400" />
                          <span>📲 Enviar a Domiciliario (App de Entrega)</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tarjeta: Mesero Asignado */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Icon icon="solar:user-hand-up-bold" className="text-emerald-600 text-sm" />
                  Mesero Asignado
                </p>
                <select 
                  value={selectedOrder.waiter_id || ''}
                  onChange={(e) => assignWaiter(selectedOrder.id, e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-gray-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">No asignado</option>
                  {waiters.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Tarjeta: Resumen Financiero y Pagos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Financiero</p>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selectedOrder.payment_status === 'paid' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {selectedOrder.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                  </span>
                </div>

                {/* Chip Destacado de Medio de Pago y Detalle de Cambio */}
                {(() => {
                  const pm = parsePaymentMethod(selectedOrder.payment_method, selectedOrder.payment_status);
                  return (
                    <div className={`p-3 rounded-xl border ${pm.bg} ${pm.border} space-y-1.5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Método de Pago</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${pm.bg} ${pm.text} border ${pm.border} flex items-center gap-1`}>
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
                          {pm.change && <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-2xs">Dar vuelto: {pm.change}</span>}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Botones de Gestión de Fiado / Cobro Rápido */}
                {selectedOrder.payment_status !== 'paid' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Asignar o Registrar Pago
                      </span>
                    </div>

                    {/* Botón: Asignar como Fiado */}
                    {selectedOrder.payment_method !== 'fiado' && !String(selectedOrder.delivery_notes || '').toLowerCase().includes('fiado') ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const debtor = window.prompt('Nombre del deudor / persona a quien se fía:', selectedOrder.customer_name || 'Cliente');
                          if (debtor === null) return;
                          const cleanName = debtor.trim() || selectedOrder.customer_name || 'Cliente';
                          const currentNotes = selectedOrder.delivery_notes || '';
                          const updatedNotes = currentNotes 
                            ? `${currentNotes} | [🤝 FIADO - Cuenta por cobrar: ${cleanName}]`
                            : `[🤝 FIADO - Cuenta por cobrar: ${cleanName}]`;
                          
                          const { error } = await supabase
                            .from('orders')
                            .update({
                              payment_method: 'fiado',
                              payment_status: 'pending',
                              customer_name: cleanName,
                              delivery_notes: updatedNotes,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', selectedOrder.id);
                          
                          if (error) {
                            toast.error('Error al asignar fiado: ' + error.message);
                          } else {
                            toast.success(`🤝 Pedido asignado como fiado a ${cleanName}`);
                            setSelectedOrder(prev => ({
                              ...prev,
                              payment_method: 'fiado',
                              payment_status: 'pending',
                              customer_name: cleanName,
                              delivery_notes: updatedNotes
                            }));
                            fetchOrders();
                          }
                        }}
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
                        onClick={async () => {
                          const total = Number(selectedOrder.total_amount || 0);
                          const { error } = await supabase
                            .from('orders')
                            .update({
                              payment_status: 'paid',
                              payment_method: 'efectivo',
                              paid_amount: total,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', selectedOrder.id);
                          
                          if (error) {
                            toast.error('Error al marcar pagado: ' + error.message);
                          } else {
                            toast.success('🎉 Pedido marcado como Pagado en Efectivo');
                            setSelectedOrder(prev => ({
                              ...prev,
                              payment_status: 'paid',
                              payment_method: 'efectivo',
                              paid_amount: total
                            }));
                            fetchOrders();
                          }
                        }}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Icon icon="solar:wallet-money-bold" className="text-sm text-emerald-600" />
                        <span>💵 Pagó Efectivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const total = Number(selectedOrder.total_amount || 0);
                          const { error } = await supabase
                            .from('orders')
                            .update({
                              payment_status: 'paid',
                              payment_method: 'nequi',
                              paid_amount: total,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', selectedOrder.id);
                          
                          if (error) {
                            toast.error('Error al marcar pagado: ' + error.message);
                          } else {
                            toast.success('🎉 Pedido marcado como Pagado por Nequi');
                            setSelectedOrder(prev => ({
                              ...prev,
                              payment_status: 'paid',
                              payment_method: 'nequi',
                              paid_amount: total
                            }));
                            fetchOrders();
                          }
                        }}
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
                  <span className={`text-base font-black ${selectedOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
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
                      {selectedOrder.order_payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(pay => (
                        <div key={pay.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                          <div>
                            <span className="text-[10px] font-black text-slate-800 uppercase block">{pay.payment_method_name || 'Desconocido'}</span>
                            <span className="text-[8px] font-bold text-slate-400">{new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-black text-emerald-600 block">${pay.amount.toLocaleString()}</span>
                            {pay.change_amount > 0 && (
                              <span className="text-[8px] font-bold text-slate-400 block">Cambio: ${pay.change_amount.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tarjeta: Descuentos VIP */}
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white space-y-3">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Icon icon="heroicons:sparkles" />
                    Cortesía / Descuento Rápido
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 50, 100].map(pct => (
                      <button
                        key={pct}
                        onClick={async () => {
                          await applyDiscount(selectedOrder.id, pct);
                          if (selectedOrder.status === 'waiting_payment') {
                            await updateOrderStatus(selectedOrder.id, "new", { 
                              payment_status: "paid", 
                              payment_method: selectedPaymentMethod 
                            });
                          }
                        }}
                        disabled={updatingStatus === selectedOrder.id}
                        className="py-2.5 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Fijo Estructural (shrink-0): NUNCA tapa contenido */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:px-8 md:py-4 z-20 flex flex-col gap-3 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
          {/* Fila 1: Botones Secundarios Compactos */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button 
                onClick={() => shareToWhatsApp(selectedOrder, 'summary')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200"
              >
                <Icon icon="logos:whatsapp-icon" className="text-sm" />
                <span>WhatsApp</span>
              </button>

              <button 
                onClick={() => { 
                  setIsMerging(true); 
                  setMergeSourceOrder(selectedOrder); 
                  setSelectedOrder(null); 
                  toast("Ahora selecciona el pedido destino", { icon: '🎯' });
                }}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200"
              >
                <Icon icon="heroicons:arrows-right-left" className="text-sm" />
                <span>Consolidar</span>
              </button>

              {restaurantSettings?.kitchen_print_enabled && (
                <button 
                  onClick={() => printThermalDocument({ order: selectedOrder, type: 'kitchen', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })} 
                  className="px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Icon icon="solar:printer-bold" className="text-sm" />
                  <span>Comanda</span>
                </button>
              )}

              {restaurantSettings?.receipt_print_enabled !== false && (
                <button 
                  onClick={() => printThermalDocument({ order: selectedOrder, type: 'receipt', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })} 
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Icon icon="solar:bill-check-bold" className="text-sm" />
                  <span>Recibo</span>
                </button>
              )}
            </div>

            {/* Cancelación */}
            <div>
              {!isCancelling ? (
                <button 
                  onClick={() => setIsCancelling(true)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-red-200"
                >
                  <Icon icon="heroicons:trash" className="text-sm" />
                  <span>Cancelar</span>
                </button>
              ) : (
                <div className="flex gap-1.5 items-center bg-red-50 p-1.5 rounded-xl border border-red-200 animate-in fade-in">
                  <input 
                    type="text" 
                    placeholder="Motivo de cancelación..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="bg-white border border-red-200 text-base sm:text-xs font-medium p-1.5 px-2.5 rounded-lg focus:ring-1 focus:ring-red-400 w-full sm:w-48"
                  />
                  <button onClick={() => cancelOrder(selectedOrder.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black">
                    Confirmar
                  </button>
                  <button onClick={() => setIsCancelling(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <Icon icon="heroicons:x-mark" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fila 2: Acciones Operativas Primarias (Grandes y Elegantes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Botón: Cobrar / POS Modal */}
            {selectedOrder.payment_status !== 'paid' && (
              <button 
                onClick={() => setIsPOSModalOpen(true)}
                disabled={updatingStatus === selectedOrder.id}
                className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 border ${
                  (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.status === 'new') || 
                  (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.status === 'ready')
                    ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'
                    : 'bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Icon icon="solar:round-transfer-horizontal-bold" className="text-xl" />
                <span>COBRAR / REGISTRAR PAGO</span>
              </button>
            )}

            {/* Botones de Estado */}
            {selectedOrder.status === 'new' && (
              <button 
                onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                disabled={
                  updatingStatus === selectedOrder.id || 
                  (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid')
                }
                className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid'
                    ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed grayscale'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'
                } ${selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''}`}
              >
                <Icon icon="solar:fire-bold" className="text-xl" />
                <span>
                  {restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid' 
                    ? 'PAGO REQUERIDO PARA COCINA' 
                    : 'ENVIAR A COCINA'}
                </span>
              </button>
            )}

            {selectedOrder.status === 'preparing' && (
              <button 
                onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                disabled={updatingStatus === selectedOrder.id}
                className={`py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm shadow-md shadow-amber-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                }`}
              >
                <Icon icon="solar:check-circle-bold" className="text-xl" />
                <span>LISTO PARA ENTREGA</span>
              </button>
            )}

            {selectedOrder.status === 'ready' && (
              <>
                {selectedOrder.fulfillment_type === 'dine_in' ? (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'on_table')}
                    disabled={updatingStatus === selectedOrder.id}
                    className={`py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                      selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <Icon icon="solar:shop-2-bold" className="text-xl" />
                    <span>SERVIR EN MESA</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'on_the_way')}
                    disabled={updatingStatus === selectedOrder.id}
                    className={`py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                      selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <Icon icon="solar:delivery-bold" className="text-xl" />
                    <span>{selectedOrder.fulfillment_type === 'delivery' ? 'ENVIAR DOMICILIO' : 'LISTO PARA RECOGER'}</span>
                  </button>
                )}
              </>
            )}

            {(selectedOrder.status === 'on_table' || selectedOrder.status === 'on_the_way') && (
              <button 
                onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                disabled={
                  updatingStatus === selectedOrder.id || 
                  (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid')
                }
                className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid'
                    ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed grayscale'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50'
                } ${selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''}`}
              >
                <Icon icon="solar:check-read-bold" className="text-xl" />
                <span>
                  {restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid'
                    ? 'PAGO REQUERIDO PARA FINALIZAR'
                    : selectedOrder.status === 'on_the_way' ? 'PEDIDO ENTREGADO' : 'FINALIZAR PEDIDO'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
