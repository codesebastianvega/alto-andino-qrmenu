import React, { useState, useMemo } from 'react';
import { 
  X, Phone, ShoppingBag, Calendar, DollarSign, 
  TrendingUp, Star, MessageSquare, ExternalLink,
  ChevronRight, Clock, MapPin, Hash, Users, Zap, Ghost, MinusCircle,
  AlertTriangle, Tag, CheckCircle2, Trash2, Check, CreditCard, Wallet, Banknote, HandCoins, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useAuth } from '../../context/AuthContext';

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

export default function CustomerProfileModal({ 
  customer, 
  isOpen, 
  onClose, 
  brandName = 'Boku Bento', 
  onNavigateToPromotions,
  onSettleOrder,
  onUpdateStage,
  onArchiveCustomer
}) {
  if (!customer) return null;

  const { paymentMethods: brandMethods } = usePaymentMethods();
  const { activeBrand } = useAuth();

  const availablePaymentMethods = useMemo(() => {
    const mapStyle = (name = '', type = '') => {
      const lower = (name + ' ' + type).toLowerCase();
      let icon = Wallet;
      let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      if (lower.includes('nequi') || lower.includes('bre-b') || lower.includes('breb')) {
        icon = Smartphone;
        color = 'text-purple-700 bg-purple-50 border-purple-200';
      } else if (lower.includes('daviplata')) {
        icon = Smartphone;
        color = 'text-rose-700 bg-rose-50 border-rose-200';
      } else if (lower.includes('tarjeta') || lower.includes('card') || lower.includes('datafono') || lower.includes('bold')) {
        icon = CreditCard;
        color = 'text-blue-700 bg-blue-50 border-blue-200';
      } else if (lower.includes('bancolombia')) {
        icon = CreditCard;
        color = 'text-amber-800 bg-amber-50 border-amber-200';
      }
      return { icon, color };
    };

    const financeAccounts = activeBrand?.config?.financials?.accounts || [];
    if (financeAccounts.length > 0) {
      return financeAccounts.map(acc => {
        const { icon, color } = mapStyle(acc.name, acc.type);
        return {
          id: acc.name,
          label: acc.name,
          icon,
          color
        };
      });
    }

    if (brandMethods && brandMethods.length > 0) {
      return brandMethods
        .filter(m => m.is_active !== false)
        .map(m => {
          const { icon, color } = mapStyle(m.name, m.type);
          return {
            id: m.name || m.type || 'efectivo',
            label: m.name,
            icon,
            color
          };
        });
    }
    // Canales reales por defecto para Boku Bento (SIN Bancolombia)
    return [
      { id: 'efectivo', label: 'Efectivo (Gaveta física)', icon: Wallet, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      { id: 'nequi', label: 'Nequi / Bre-B', icon: Smartphone, color: 'text-purple-700 bg-purple-50 border-purple-200' }
    ];
  }, [brandMethods, activeBrand]);

  const [settlingOrder, setSettlingOrder] = useState(null); // specific order object or 'all'
  const [settleCustomAmount, setSettleCustomAmount] = useState('');
  const [settleMode, setSettleMode] = useState('historical'); // 'historical' | 'today'
  const [selectedPayMethod, setSelectedPayMethod] = useState('efectivo');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);

  const currentSegment = customer.segment || 'ocasional';
  const seg = SEGMENT_CONFIG[currentSegment] || SEGMENT_CONFIG.ocasional;
  const isFriction = currentSegment === 'friccion';
  const totalOwed = Number(customer.totalOwed || 0);
  
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

  const sendFiadoReminder = (specificOrder = null) => {
    const phone = (customer.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Este cliente no tiene número de teléfono registrado.');
      return;
    }
    const firstName = customer.name?.split(' ')[0] || 'Hola';
    const amountStr = formatCurrency(specificOrder ? specificOrder.total_amount : totalOwed);
    const orderInfo = specificOrder 
      ? ` de tu pedido #${specificOrder.id?.slice(-4).toUpperCase()}` 
      : (customer.pendingOrders?.length > 1 ? ` de ${customer.pendingOrders.length} pedidos pendientes` : '');

    const digitalChannels = availablePaymentMethods
      .filter(m => !m.label.toLowerCase().includes('efectivo'))
      .map(m => `• ${m.label}`)
      .join('\n');

    const paymentText = digitalChannels 
      ? `\n\nPuedes cancelar tu saldo en efectivo o transferirnos por:\n${digitalChannels}`
      : '\n\nPuedes cancelar tu saldo en efectivo o transferencia Nequi.';

    const message = `Hola ${firstName}! 👋 Te saludamos con mucho cariño del equipo de ${brandName}.

Te recordamos cordialmente tu saldo pendiente de ${amountStr}${orderInfo}.${paymentText}

¡Muchísimas gracias por tu confianza y apoyo de siempre! 🍱🤝`;

    const url = `https://wa.me/57${phone.slice(-10)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSettleConfirm = async () => {
    if (!onSettleOrder) return;
    setIsSubmittingSettle(true);
    try {
      if (settlingOrder === 'all') {
        const ordersToSettle = customer.pendingOrders || [];
        for (const ord of ordersToSettle) {
          await onSettleOrder(ord.id, selectedPayMethod, { isHistorical: settleMode === 'historical' });
        }
      } else if (settlingOrder?.id) {
        const customAmt = settleCustomAmount !== '' ? Number(settleCustomAmount) : undefined;
        await onSettleOrder(settlingOrder.id, selectedPayMethod, { 
          isHistorical: settleMode === 'historical',
          customAmount: customAmt
        });
      }
      setSettlingOrder(null);
    } catch (err) {
      console.error('Error al registrar pago:', err);
    } finally {
      setIsSubmittingSettle(false);
    }
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
                    <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full p-1 border-2 border-white shadow-xs" title="Cliente Whale / Alto Valor">
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  )}
                  {isFriction && (
                    <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 border-2 border-white shadow-xs" title="Fricción / Cancelación">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    {/* Selector interactivo de etapa de ciclo de vida */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStageSelector(!showStageSelector)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${seg.badgeBg} hover:opacity-90 transition-all cursor-pointer shadow-2xs`}
                        title="Clic para cambiar etapa del cliente"
                      >
                        <seg.icon className="w-3 h-3" />
                        <span>{seg.label}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${showStageSelector ? 'rotate-90' : ''}`} />
                      </button>

                      {showStageSelector && (
                        <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 z-50 space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">Cambiar Etapa:</p>
                          {Object.entries(SEGMENT_CONFIG).map(([key, cfg]) => {
                            const IconComponent = cfg.icon;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  if (onUpdateStage) onUpdateStage(customer.key, key);
                                  customer.segment = key;
                                  setShowStageSelector(false);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                                  key === currentSegment ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <IconComponent className="w-3.5 h-3.5" />
                                  <span>{cfg.label}</span>
                                </span>
                                {key === currentSegment && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
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

                    {/* Botón de archivar cliente de prueba */}
                    {onArchiveCustomer && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Deseas archivar a ${customer.name}? No aparecerá en el directorio activo del CRM.`)) {
                            onArchiveCustomer(customer.key);
                            onClose();
                          }
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Archivar este cliente de prueba"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dirección de entrega limpia */}
                  {customer.address && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold text-gray-800">{customer.address}</span>
                      {customer.deliveryNotes && (
                        <span className="text-gray-500">({customer.deliveryNotes})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
              
              {/* ── CARD DE CARTERA / CUENTAS POR COBRAR (FIADOS) ── */}
              {totalOwed > 0 && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-white to-amber-500/5 border-2 border-amber-300 space-y-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                        <HandCoins className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
                          Cuentas por Cobrar (Fiado Activo)
                        </span>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-black text-amber-950">
                            {formatCurrency(totalOwed)}
                          </p>
                          <span className="text-xs font-bold text-amber-800">
                            ({customer.pendingOrders?.length || 1} {customer.pendingOrders?.length === 1 ? 'pedido' : 'pedidos'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-amber-900/90 font-medium">
                    Alimentos entregados pendientes de pago. Registrar el cobro sumará la plata al bolsillo exacto (gaveta o banco) y liberará su saldo de cartera.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSettlingOrder('all')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Registrar Pago ({formatCurrency(totalOwed)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sendFiadoReminder(null)}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Recordar por WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alerta de Pedido Cancelado (Fricción) */}
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

              {/* Botones Rápidos de Contacto */}
              {!isFriction && totalOwed === 0 && (
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

              {/* Preferencia de Plato */}
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
                    const isUnpaid = !isOrdCancelled && (
                      order.payment_status === 'pending' || 
                      order.payment_method === 'fiado' ||
                      String(order.delivery_notes || '').toLowerCase().includes('fiado')
                    );

                    return (
                      <div 
                        key={order.id || idx}
                        className={`p-4 rounded-2xl bg-white border transition-all ${
                          isUnpaid
                            ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                            : isOrdCancelled 
                            ? 'border-rose-200 bg-rose-50/20' 
                            : 'border-gray-200/80 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2.5 gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
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

                              {isUnpaid ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                                  🤝 Fiado / Por Cobrar
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                                  ✓ Pagado ({order.payment_method || 'Confirmado'})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatDate(order.created_at)}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-gray-900">{formatCurrency(order.total_amount)}</p>
                            {order.fulfillment_type && (
                              <span className="text-[10px] text-gray-500 font-medium uppercase">
                                {order.fulfillment_type === 'delivery' ? '🛵 Domicilio' : '🛍️ Para Llevar'}
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

                        {/* Acciones si está pendiente / fiado */}
                        {isUnpaid && (
                          <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-amber-800">
                              Pendiente: {formatCurrency(order.total_amount)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => sendFiadoReminder(order)}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all"
                              >
                                📱 Recordar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSettlingOrder(order);
                                  setSettleCustomAmount(String(Number(order.total_amount || 0) - Number(order.paid_amount || 0)));
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                              >
                                💰 Cobrar
                              </button>
                            </div>
                          </div>
                        )}
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

            {/* Modal de confirmación de pago / Selección de bolsillo */}
            {settlingOrder && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                        💰
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          Registrar Cobro / Ajustar
                        </h4>
                        <p className="text-xs font-bold text-emerald-700">
                          Total actual: {formatCurrency(settlingOrder === 'all' ? totalOwed : settlingOrder.total_amount)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettlingOrder(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selector de Modo: Regularización Histórica vs Cobro Hoy */}
                  {(() => {
                    const orderDate = settlingOrder?.created_at ? new Date(settlingOrder.created_at) : null;
                    const isPast = orderDate && orderDate.toDateString() !== new Date().toDateString();

                    return (
                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-950 uppercase tracking-wider text-[10px]">
                            {isPast ? `📅 Pedido de fecha anterior (${formatDate(orderDate)})` : '⚡ Pedido de Hoy'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSettleMode('historical')}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              settleMode === 'historical'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-black'
                                : 'bg-white text-gray-700 border-gray-200 font-bold hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-[11px] block">📜 Ajuste Histórico</span>
                            <span className="text-[9px] block opacity-90 font-medium">No altera caja hoy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettleMode('today')}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              settleMode === 'today'
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-black'
                                : 'bg-white text-gray-700 border-gray-200 font-bold hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-[11px] block">💵 Cobrado HOY</span>
                            <span className="text-[9px] block opacity-90 font-medium">Suma a gaveta de hoy</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Monto editable y cálculo automático de descuento */}
                  {settlingOrder !== 'all' && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                        ¿Cuánto paga el cliente? ($ COP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">$</span>
                        <input
                          type="number"
                          value={settleCustomAmount}
                          onChange={(e) => setSettleCustomAmount(e.target.value)}
                          placeholder="Monto a pagar"
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-base font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      {settleCustomAmount !== '' && Number(settleCustomAmount) < Number(settlingOrder?.total_amount || 0) && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-0.5">
                          <div className="flex items-center justify-between text-amber-900 font-bold">
                            <span>Descuento de Cortesía:</span>
                            <span className="text-rose-600 font-black">
                              -${(Number(settlingOrder.total_amount || 0) - Number(settleCustomAmount)).toLocaleString('es-CO')}
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800">
                            La diferencia se aplicará como descuento automático y el pedido quedará 100% saldado.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                      ¿A qué bolsillo {settleMode === 'historical' ? 'entró en su momento' : 'ingresa hoy'}?
                    </label>
                    <div className="space-y-1.5">
                      {availablePaymentMethods.map(m => {
                        const IconC = m.icon;
                        const isSel = selectedPayMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPayMethod(m.id)}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                              isSel ? 'border-gray-900 bg-gray-900 text-white shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <IconC className="w-4 h-4 shrink-0" />
                              <span>{m.label}</span>
                            </span>
                            {isSel && <Check className="w-4 h-4 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSettlingOrder(null)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50"
                      disabled={isSubmittingSettle}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSettleConfirm}
                      disabled={isSubmittingSettle}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      {isSubmittingSettle ? 'Guardando...' : 'Confirmar Cobro'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
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
