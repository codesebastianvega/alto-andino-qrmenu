import React from 'react';
import { 
  X, Phone, ShoppingBag, Calendar, DollarSign, 
  TrendingUp, Star, MessageSquare, ExternalLink,
  ChevronRight, Clock, MapPin, Hash, Users, Zap, Ghost, MinusCircle,
  AlertTriangle, Tag, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SEGMENT_CONFIG = {
  friccion: { 
    label: 'Cancelados / Fricción', 
    color: 'text-rose-700', 
    bg: 'bg-rose-50', 
    border: 'border-rose-200', 
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: AlertTriangle 
  },
  vip: { 
    label: 'VIP', 
    color: 'text-amber-800', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200', 
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: Star 
  },
  frecuente: { 
    label: 'Frecuente', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: TrendingUp 
  },
  nuevo: { 
    label: 'Nuevo', 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Zap 
  },
  dormido: { 
    label: 'Inactivo (+21d)', 
    color: 'text-orange-700', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Clock 
  },
  perdido: { 
    label: 'Perdido (+45d)', 
    color: 'text-gray-700', 
    bg: 'bg-gray-100', 
    border: 'border-gray-300', 
    badgeBg: 'bg-gray-200 text-gray-800 border-gray-300',
    icon: Ghost 
  },
  prospecto: { 
    label: 'Prospecto', 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-200', 
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Users 
  },
  ocasional: { 
    label: 'Ocasional', 
    color: 'text-gray-700', 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: MinusCircle 
  },
};

export default function CustomerProfileModal({ customer, isOpen, onClose, brandName = 'Boku Bento', onNavigateToPromotions }) {
  if (!customer) return null;

  const seg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.ocasional;
  const isFriction = customer.segment === 'friccion' || customer.hasCancelled;
  
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val || 0);

  const formatDate = (date) => new Date(date).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sendWhatsApp = (type) => {
    const phone = (customer.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Este cliente no tiene número de teléfono registrado.');
      return;
    }
    const firstName = customer.name?.split(' ')[0] || 'Hola';
    let message = "";

    if (type === 'recovery' || isFriction) {
      const dish = customer.favoriteProduct && customer.favoriteProduct !== 'Sin preferencia'
        ? ` tu ${customer.favoriteProduct}` 
        : ' tu pedido';
      const reasonDetail = customer.lastCancellationReason 
        ? ` por el inconveniente con tu pedido ("${customer.lastCancellationReason}")` 
        : ' por la cancelación de tu pedido';

      message = `Hola ${firstName}! 👋 Te saludamos del equipo de ${brandName}.

Queremos pedirte una sincera disculpa${reasonDetail}. Para nosotros tu experiencia es lo más importante y lamentamos mucho no haberte podido atender como mereces.

Para compensarte y que no te quedes con las ganas de disfrutar${dish}, te dejamos un descuento especial del 15% en tu próximo pedido usando el código DISCULPABOKU desde nuestro menú:
https://aluna-qrmenu.vercel.app/boku-bento/?src=recuperacion

¡Esperamos tener la oportunidad de atenderte pronto! 🍱✨`;
    } else if (type === 'feedback') {
      message = `Hola ${firstName}! 👋 Te escribimos de parte de ${brandName}. ¿Qué tal estuvo tu experiencia con nosotros hoy? ¡Nos encantaría saber tu opinión para seguir mejorando! 🍱`;
    } else if (type === 'vip') {
      message = `Hola ${firstName}! ⭐ Como uno de nuestros clientes más especiales en ${brandName}, queríamos dejarte un saludo y un beneficio exclusivo para tu próximo pedido: https://aluna-qrmenu.vercel.app/boku-bento/?src=vip 🍱✨`;
    }

    const url = `https://wa.me/57${phone.slice(-10)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Sheet Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-xl h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl ${seg.bg} flex items-center justify-center border ${seg.border} shadow-2xs`}>
                    <span className={`text-xl font-black ${seg.color}`}>
                      {customer.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  {customer.isWhale && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full p-1 border-2 border-white shadow-xs">
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  )}
                  {isFriction && (
                    <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 border-2 border-white shadow-xs">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      {customer.name}
                    </h2>
                    {customer.isWhale && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                        Whale
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${seg.badgeBg}`}>
                      <seg.icon className="w-3 h-3" />
                      <span>{seg.label}</span>
                    </div>

                    {customer.phone ? (
                      <a 
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-gray-200 text-xs font-mono font-medium transition-colors"
                      >
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{customer.phone}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                        Sin WhatsApp registrado
                      </span>
                    )}
                  </div>

                  {/* Dirección de entrega */}
                  {customer.address && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-medium">{customer.address}</span>
                      {customer.deliveryNotes && (
                        <span className="text-gray-400">({customer.deliveryNotes})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
              
              {/* Alerta de Pedido Cancelado (Fricción) con botón de recuperación */}
              {isFriction && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-rose-900">
                        Atención Prioritaria: Este cliente tuvo una cancelación
                      </p>
                      {customer.lastCancellationReason ? (
                        <p className="text-xs text-rose-800 font-semibold mt-0.5">
                          Motivo registrado: <span className="italic">"{customer.lastCancellationReason}"</span>
                        </p>
                      ) : (
                        <p className="text-xs text-rose-700 mt-0.5">
                          El pedido no pudo completarse. Contactar al cliente evita que ordene en la competencia.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <button 
                      onClick={() => sendWhatsApp('recovery')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Enviar Disculpa & Cupón por WhatsApp
                    </button>
                    {onNavigateToPromotions && (
                      <button 
                        onClick={onNavigateToPromotions}
                        className="px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Crear Cupón
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Botones Rápidos de Contacto si no tiene fricción */}
              {!isFriction && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => sendWhatsApp('feedback')}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left shadow-xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Consultar Feedback</p>
                      <p className="text-[11px] text-gray-500">¿Qué tal estuvo su comida?</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => sendWhatsApp('vip')}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left shadow-xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Saludo VIP</p>
                      <p className="text-[11px] text-gray-500">Enviar agradecimiento</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Métricas Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ventas Totales (LTV)</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{formatCurrency(customer.ltv)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entregados</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">{customer.ordersCount}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cancelados</p>
                  <p className={`text-lg font-black mt-1 ${customer.cancelledCount > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                    {customer.cancelledCount}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket Prom.</p>
                  <p className="text-lg font-black text-purple-600 mt-1">{formatCurrency(customer.avgTicket)}</p>
                </div>
              </div>

              {/* Preferencia de Plato / Gustos */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plato de Preferencia / Interés</p>
                      <p className="text-sm font-black text-gray-900 mt-0.5">
                        {customer.favoriteProduct && customer.favoriteProduct !== 'Sin preferencia'
                          ? customer.favoriteProduct
                          : 'Aún sin historial de platos'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    {customer.daysSinceLastVisit === 0 ? 'Visto hoy' : `Hace ${customer.daysSinceLastVisit}d`}
                  </span>
                </div>
              </div>

              {/* Historial Detallado de Pedidos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Historial de Pedidos ({customer.orderHistory?.length || 0})
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {customer.orderHistory?.map((order, idx) => {
                    const isOrdCancelled = order.status === 'cancelled';
                    const isOrdDelivered = order.status === 'delivered';

                    return (
                      <div 
                        key={order.id || idx}
                        className={`p-4 rounded-2xl bg-white border transition-all ${
                          isOrdCancelled ? 'border-rose-200 bg-rose-50/20' : 'border-gray-200/80 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-gray-900">
                                #{order.id?.slice(-4).toUpperCase() || '---'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isOrdDelivered 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : isOrdCancelled 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isOrdDelivered ? 'Entregado' : isOrdCancelled ? 'Cancelado' : order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatDate(order.created_at)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">{formatCurrency(order.total_amount)}</p>
                            {order.fulfillment_type && (
                              <span className="text-[10px] text-gray-500 font-medium uppercase">
                                {order.fulfillment_type === 'delivery' ? '🛵 Domicilio' : '🥡 Para Llevar'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Motivo de cancelación si aplica */}
                        {isOrdCancelled && order.cancellation_reason && (
                          <div className="p-2.5 rounded-xl bg-rose-100/70 text-rose-800 text-xs font-medium mb-2.5 border border-rose-200">
                            <span className="font-bold">Motivo de cancelación:</span> "{order.cancellation_reason}"
                          </div>
                        )}

                        {/* Items del pedido */}
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                          {order.order_items?.map((item, i) => (
                            <span key={i} className="text-xs text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/80 font-medium">
                              {item.quantity}x {item.products?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {(!customer.orderHistory || customer.orderHistory.length === 0) && (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sin pedidos registrados</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
