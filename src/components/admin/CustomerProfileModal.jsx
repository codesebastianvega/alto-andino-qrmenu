import React from 'react';
import { 
  X, Phone, ShoppingBag, Calendar, DollarSign, 
  TrendingUp, Star, MessageSquare, ExternalLink,
  ChevronRight, Clock, MapPin, Hash, Users, Zap, Ghost, MinusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SEGMENTS = {
  frecuente: { label: 'Frecuente', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Star },
  recurrente: { label: 'Recurrente', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: TrendingUp },
  nuevo: { label: 'Nuevo', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Zap },
  dormido: { label: 'Dormido', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Clock },
  perdido: { label: 'Perdido', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Ghost },
  prospecto: { label: 'Prospecto', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Users },
  ocasional: { label: 'Ocasional', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: MinusCircle },
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl ${className}`}>
    {children}
  </div>
);

export default function CustomerProfileModal({ customer, isOpen, onClose }) {
  if (!customer) return null;

  const seg = SEGMENTS[customer.segment] || SEGMENTS.ocasional;
  
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val);

  const formatDate = (date) => new Date(date).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sendWhatsApp = (type) => {
    const phone = customer.phone.replace(/\D/g, '');
    let message = "";
    
    if (type === 'feedback') {
      message = `Hola ${customer.name || ''}! 👋 Te escribimos de parte de Aluna. ¿Qué tal estuvo tu experiencia con nosotros hoy? ¡Nos encantaría saber tu opinión!`;
    } else if (type === 'recovery') {
      message = `Hola ${customer.name || ''}! 🤗 Te extrañamos en Aluna. Queremos invitarte a que vuelvas pronto, ¡puedes reclamar un postre de cortesía en tu próxima visita!`;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col rounded-3xl md:rounded-r-none"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full ${seg.bg} flex items-center justify-center border-2 ${seg.border}`}>
                  <span className={`text-3xl font-black ${seg.color}`}>
                    {customer.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">
                    {customer.name || 'Sin nombre'}
                  </h2>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${seg.bg} ${seg.color} border ${seg.border}`}>
                      <seg.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{seg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">{customer.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              
              {/* Marketing Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => sendWhatsApp('feedback')}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group text-left"
                >
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-black text-[11px] uppercase tracking-widest">Enviar Feedback</p>
                    <p className="text-white/60 text-xs mt-0.5">Consultar satisfacción de hoy</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-500/40 ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => sendWhatsApp('recovery')}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group text-left"
                >
                  <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-blue-400 font-black text-[11px] uppercase tracking-widest">Recuperar Cliente</p>
                    <p className="text-white/60 text-xs mt-0.5">Enviar cupón de cortesía</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-500/40 ml-auto group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-5">
                  <DollarSign className="w-5 h-5 text-blue-400 mb-3" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total LTV</p>
                  <p className="text-xl font-black text-white mt-1">{formatCurrency(customer.ltv)}</p>
                </GlassCard>
                <GlassCard className="p-5">
                  <TrendingUp className="w-5 h-5 text-purple-400 mb-3" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ticket Prom.</p>
                  <p className="text-xl font-black text-white mt-1">{formatCurrency(customer.avgTicket)}</p>
                </GlassCard>
                <GlassCard className="p-5">
                  <Star className="w-5 h-5 text-yellow-400 mb-3" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pts Fidelidad</p>
                  <p className="text-xl font-black text-white mt-1">{Math.floor(customer.ltv / 10000)}</p>
                </GlassCard>
                <GlassCard className="p-5">
                  <ShoppingBag className="w-5 h-5 text-pink-400 mb-3" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Visitas</p>
                  <p className="text-xl font-black text-white mt-1">{customer.ordersCount}</p>
                </GlassCard>
              </div>

              {/* Preferences */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl bg-white/5">
                    <Star className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Preferencia de Consumo</h3>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <ShoppingBag className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Top Producto</p>
                      <p className="text-lg font-black text-white">{customer.favoriteProduct || 'No disponible'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Frecuencia</p>
                    <p className="text-lg font-black text-emerald-400">{(customer.ordersCount / Math.max(1, customer.daysSinceLastVisit / 30)).toFixed(1)} <span className="text-[10px] text-gray-500 tracking-normal">v/mes</span></p>
                  </div>
                </div>
              </GlassCard>

              {/* Order History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white/5">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Historial de Pedidos</h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {customer.orderHistory?.length || 0} registros
                  </span>
                </div>

                <div className="space-y-3">
                  {customer.orderHistory?.map((order, idx) => (
                    <div 
                      key={order.id || idx}
                      className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <Hash className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm tracking-tight">Orden #{order.id?.slice(-4) || '---'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              <span className="text-[11px] text-gray-500 font-medium">{formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black text-sm">{formatCurrency(order.total_amount)}</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order Items Preview */}
                      <div className="flex flex-wrap gap-2">
                        {order.order_items?.map((item, i) => (
                          <span key={i} className="text-[11px] text-gray-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                            {item.quantity}x {item.products?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {(!customer.orderHistory || customer.orderHistory.length === 0) && (
                    <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sin historial de pedidos</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Sticky Actions */}
            <div className="p-8 border-t border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-end gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-white/5 text-white text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all"
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
