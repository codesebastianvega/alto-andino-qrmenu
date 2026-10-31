import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import soundService from '../../utils/soundService';
import { parsePaymentMethod, getGoogleMapsUrl } from '../../utils/formatters';

export function NewOrderAlertModal({
  isOpen,
  order,
  onClose,
  onAcceptAndSendToKitchen,
  onReviewDetail,
  onCancelOrder,
  queueCount = 1,
  currentIndex = 0,
  onNextOrder,
  onPrevOrder,
  restaurantSettings
}) {
  const [isSilenced, setIsSilenced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Sincronizar estado cuando cambia la orden
  useEffect(() => {
    if (isOpen && order) {
      setIsSilenced(!soundService.isLoopActive());
      setShowRejectInput(false);
      setRejectReason('');
    }
  }, [isOpen, order?.id]);

  // Manejador de teclado para respuesta rápida en barra/caja
  useEffect(() => {
    if (!isOpen || !order) return;

    const handleKeyDown = (e) => {
      // Si está escribiendo en el input de rechazo, ignorar atajos
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSilence();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSilence();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleSilence = () => {
    soundService.stopNewOrderLoop();
    setIsSilenced(true);
  };

  const handleAccept = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      soundService.stopNewOrderLoop();
      setIsSilenced(true);
      if (onAcceptAndSendToKitchen) {
        await onAcceptAndSendToKitchen(order.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = () => {
    soundService.stopNewOrderLoop();
    setIsSilenced(true);
    if (onReviewDetail) {
      onReviewDetail(order);
    }
    if (onClose) onClose();
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      soundService.stopNewOrderLoop();
      setIsSilenced(true);
      if (onCancelOrder) {
        await onCancelOrder(order.id, rejectReason.trim());
      }
      setShowRejectInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formateadores
  const orderNumber = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#PEDIDO';
  const orderType = (order.order_type || 'dine_in').toLowerCase();
  const isDelivery = orderType === 'delivery';
  const isTakeaway = orderType === 'takeaway' || orderType === 'pickup';
  const isDineIn = !isDelivery && !isTakeaway;

  // Teléfono formateado para WhatsApp
  const rawPhone = String(order.customer_phone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.startsWith('57') ? rawPhone : (rawPhone ? `57${rawPhone}` : '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${order.customer_name || ''}, te escribimos de Boku Bento confirmando la recepción de tu pedido ${orderNumber}.`)}` : null;

  const items = order.order_items || [];
  const totalAmount = Number(order.total_amount || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Contenedor Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-red-500 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Barra superior de Alarma Pulsante */}
        <div className="bg-red-600 px-4 py-2.5 text-white flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-300"></span>
            </span>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
              <Icon icon="heroicons:bell-alert" className="text-lg animate-bounce" />
              ¡NUEVO PEDIDO ENTRANTE!
            </span>
            {queueCount > 1 && (
              <span className="bg-red-800 text-yellow-300 text-[11px] font-black px-2 py-0.5 rounded-full ml-1">
                {currentIndex + 1} de {queueCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Silenciar Alarma */}
            <button
              onClick={handleSilence}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                isSilenced 
                  ? 'bg-red-800/60 text-red-200 hover:bg-red-800' 
                  : 'bg-yellow-400 text-slate-900 hover:bg-yellow-300 shadow-md animate-pulse'
              }`}
              title="Silenciar sonido de la alarma (Tecla S o Esc)"
            >
              <Icon icon={isSilenced ? "heroicons:speaker-x-mark" : "heroicons:speaker-wave"} className="text-base" />
              <span>{isSilenced ? 'Alarma en pausa' : 'Silenciar Alarma (S)'}</span>
            </button>

            {/* Navegación entre pedidos si hay más de 1 */}
            {queueCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onPrevOrder}
                  disabled={currentIndex === 0}
                  className="p-1 rounded bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white"
                  title="Pedido anterior"
                >
                  <Icon icon="heroicons:chevron-left" className="text-base" />
                </button>
                <button
                  onClick={onNextOrder}
                  disabled={currentIndex >= queueCount - 1}
                  className="p-1 rounded bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white"
                  title="Siguiente pedido"
                >
                  <Icon icon="heroicons:chevron-right" className="text-base" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Encabezado del Pedido: Tipo de servicio + Código */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {orderNumber}
                </span>

                {/* Badge Tipo de Servicio */}
                {isDelivery && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 border border-emerald-300">
                    <Icon icon="heroicons:truck" className="text-base" />
                    DOMICILIO
                  </span>
                )}
                {isDineIn && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 border border-purple-300">
                    <Icon icon="heroicons:user-group" className="text-base" />
                    MESA {order.restaurant_tables?.table_number || order.table_number || 'S/N'}
                  </span>
                )}
                {isTakeaway && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 border border-amber-300">
                    <Icon icon="heroicons:shopping-bag" className="text-base" />
                    PARA LLEVAR / RECOGER
                  </span>
                )}

                {order.payment_status === 'paid' ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1">
                    <Icon icon="heroicons:check-circle" /> Pagado
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1">
                    <Icon icon="heroicons:clock" /> Pago Contraentrega
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Recibido: <strong className="text-slate-800">{new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                {order.locations?.name && ` · Sede: ${order.locations.name}`}
              </p>
            </div>

            {/* Total Destacado y Medio de Pago */}
            <div className="text-right sm:text-right flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total a Cobrar</span>
              <span className="text-2xl sm:text-3xl font-black text-[#2f4131] tracking-tight">
                ${totalAmount.toLocaleString()}
              </span>
              
              {/* Badge de Medio de Pago */}
              {(() => {
                const pm = parsePaymentMethod(order.payment_method, order.payment_status);
                return (
                  <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black shadow-2xs ${pm.bg} ${pm.text} ${pm.border}`}>
                    <Icon icon={pm.icon} className="text-sm shrink-0" />
                    <span>{pm.label}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Información del Cliente y Entrega */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800">
              <Icon icon="heroicons:user" className="text-slate-400 text-sm shrink-0" />
              <span className="font-bold truncate">{order.customer_name || 'Cliente sin nombre'}</span>
              {order.customer_phone && (
                <span className="text-slate-500 font-medium">({order.customer_phone})</span>
              )}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-colors"
                  title="Abrir chat de WhatsApp"
                >
                  <Icon icon="logos:whatsapp-icon" className="text-xs" />
                </a>
              )}
            </div>

            {isDelivery && (
              <div className="flex items-center justify-between gap-2 text-slate-800 bg-rose-50/70 p-2 rounded-xl border border-rose-100 sm:col-span-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon icon="heroicons:map-pin" className="text-rose-500 text-base shrink-0" />
                  <span className="font-bold text-slate-800 truncate" title={order.delivery_address || order.address}>
                    {order.delivery_address || order.address || 'Sin dirección registrada'}
                  </span>
                  {order.delivery_notes && (
                    <span className="hidden sm:inline text-slate-500 text-[11px] italic truncate">
                      ({order.delivery_notes})
                    </span>
                  )}
                </div>
                {(order.delivery_address || order.address) && (
                  <a
                    href={getGoogleMapsUrl(order.delivery_address || order.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-xs shrink-0 transition-all shadow-2xs cursor-pointer"
                    title="Abrir en Google Maps"
                  >
                    <Icon icon="solar:map-point-bold" className="text-sm text-rose-600" />
                    <span>Maps</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lista de Ítems / Platos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 max-h-[360px]">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Icon icon="heroicons:document-text" className="text-sm" />
            Contenido de la Comanda ({items.length} {items.length === 1 ? 'ítem' : 'ítems'})
          </h3>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const productName = item.products?.name || item.name || 'Producto';
              const qty = item.quantity || 1;
              const unitPrice = Number(item.unit_price || 0);

              // Parsear modificadores si existen
              let modifiersList = [];
              if (item.modifiers) {
                if (Array.isArray(item.modifiers)) {
                  modifiersList = item.modifiers.map(m => typeof m === 'string' ? m : (m.name || m.label || ''));
                } else if (typeof item.modifiers === 'object') {
                  modifiersList = Object.entries(item.modifiers).map(([k, v]) => {
                    const text = Array.isArray(v) ? v.join(', ') : (typeof v === 'object' && v ? (v.name || JSON.stringify(v)) : v);
                    return `${k}: ${text}`;
                  });
                }
              }

              return (
                <div 
                  key={item.id || idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {qty}x
                      </span>
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {productName}
                      </span>
                    </div>

                    {/* Modificadores */}
                    {modifiersList.length > 0 && (
                      <p className="text-[11px] text-slate-600 font-medium pl-8">
                        {modifiersList.join(' · ')}
                      </p>
                    )}

                    {/* Notas Especiales de Cocina */}
                    {item.notes && (
                      <div className="ml-8 mt-1 p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-start gap-1.5">
                        <Icon icon="heroicons:exclamation-triangle" className="text-amber-600 text-xs shrink-0 mt-0.5" />
                        <span><strong>Nota:</strong> {item.notes}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-black text-slate-800 shrink-0">
                    ${(qty * unitPrice).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Notas generales de la orden */}
          {order.notes && (
            <div className="p-3 bg-yellow-50/80 rounded-2xl border border-yellow-200 text-yellow-950 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-0.5">
                <Icon icon="heroicons:chat-bubble-bottom-center-text" className="text-yellow-700" />
                Instrucciones del Cliente:
              </p>
              <p className="font-medium text-yellow-900 pl-5">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Input condicional para rechazar */}
        {showRejectInput && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-rose-900 block">
              Motivo de rechazo o cancelación del pedido:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Fuera de cobertura, plato agotado, cocina cerrada..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Confirmar Rechazo
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Footer con Botones de Acción */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Botones secundarios */}
          <div className="flex items-center gap-2">
            {!showRejectInput && (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all"
              >
                Rechazar
              </button>
            )}

            <button
              type="button"
              onClick={handleReview}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Icon icon="heroicons:eye" className="text-sm text-slate-500" />
              <span>Revisar Detalle</span>
            </button>
          </div>

          {/* Botón Principal Gigante */}
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Icon icon="heroicons:fire" className="text-xl" />
            <span>{isSubmitting ? 'Enviando...' : 'Aceptar & Enviar a Cocina (Enter)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
