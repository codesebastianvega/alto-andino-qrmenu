import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  ArrowRight, 
  ShoppingBag, 
  ShoppingCart,
  Trash2,
  Users, 
  Star, 
  Package, 
  FolderOpen, 
  MapPin, 
  MessageCircle, 
  AlertCircle,
  Sparkles,
  Flame,
  Bot,
  UtensilsCrossed,
  Wine,
  Printer,
  Globe,
  Store,
  ShieldCheck,
  Layers,
  CreditCard,
  Building2,
  Tag,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WHATSAPP_SUPPORT = '573222285900';
const openWhatsApp = (msg) => {
  window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
};

/* ── CATÁLOGO E-COMMERCE DE ALUNA ─────────────────────────────────── */

const CATEGORIES = [
  { id: 'all', label: '🛍️ Todo el Catálogo' },
  { id: 'plans', label: '💳 Planes de Suscripción' },
  { id: 'marketing', label: '🔥 Inteligencia & Marketing' },
  { id: 'kitchen', label: '🍳 Operación & Cocina' },
  { id: 'enterprise', label: '🏢 Franquicias & Enterprise' },
];

const STORE_PRODUCTS = [
  // ── PLANES BASE ──
  {
    id: 'plan_emprendedor',
    type: 'plan',
    category: 'plans',
    name: 'Plan Emprendedor',
    badge: 'Inicio Rápido',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: ShoppingBag,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    copMonthly: 29900,
    usdMonthly: 9,
    description: 'Digitaliza tu menú con código QR y recibe comandas en tu pantalla.',
    bullets: [
      'Menú QR Digital ultra rápido',
      'Panel Kanban de comandas en vivo',
      'Código QR con tu logo',
      'Hasta 80 pedidos / mes'
    ],
    slug: 'emprendedor'
  },
  {
    id: 'plan_esencial',
    type: 'plan',
    category: 'plans',
    name: 'Plan Esencial',
    badge: 'Salón & Meseros',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    copMonthly: 59900,
    usdMonthly: 18,
    description: 'Toma de pedidos móvil para meseros y pedidos directos a WhatsApp.',
    bullets: [
      'Todo lo de Emprendedor',
      'Toma de pedidos móvil para meseros',
      'Recepción de pedidos por WhatsApp',
      'Landing web propia y mesas con QR',
      'Hasta 250 pedidos / mes'
    ],
    slug: 'esencial'
  },
  {
    id: 'plan_profesional',
    type: 'plan',
    category: 'plans',
    name: 'Plan Profesional',
    badge: '🔥 Más Popular',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
    isFeatured: true,
    icon: Sparkles,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    copMonthly: 149900,
    usdMonthly: 45,
    description: 'El paquete completo para restaurantes con salón, cocina y barra activa.',
    bullets: [
      'Todo lo de Esencial',
      '🍳 Pantalla KDS Cocina Cloud incluida',
      '🍸 Pantalla BDS Barra & Tragos incluida',
      'Control de recetas, costos e inventario',
      'Hasta 800 pedidos / mes y 10 admins'
    ],
    slug: 'profesional'
  },
  {
    id: 'plan_premium',
    type: 'plan',
    category: 'plans',
    name: 'Plan Premium',
    badge: '👑 Máxima Potencia',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Star,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    copMonthly: 249900,
    usdMonthly: 75,
    description: 'Para marcas consolidadas: pedidos ilimitados, mapas de calor y marca blanca.',
    bullets: [
      'Todo lo de Profesional',
      '🔥 Inteligencia Pro & Heatmaps incluida',
      '🖨️ Auto-Print para comandas incluido',
      '🌐 Dominio Propio & Marca Blanca incluida',
      'Pedidos ilimitados y soporte VIP 24/7'
    ],
    slug: 'premium'
  },

  // ── ADD-ONS MARKETING & CRECIMIENTO ──
  {
    id: 'addon_heatmaps',
    type: 'addon',
    category: 'marketing',
    name: 'Inteligencia Pro & Mapas de Calor',
    badge: 'Nuevo',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Flame,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    copMonthly: 49000,
    usdMonthly: 15,
    description: 'Mapas de calor, grabaciones en video de comensales, carritos abandonados y medición de volantes callejeros.',
    bullets: [
      'Mapas de calor de clics y scroll en la carta',
      'Video de cómo navegan tus clientes',
      'Atribución de ventas por volantes y redes',
      'Alertas de carritos abandonados'
    ],
    includedIn: ['premium']
  },
  {
    id: 'addon_ai_waiter',
    type: 'addon',
    category: 'marketing',
    name: 'Aluna AI Waiter (Mesero con IA)',
    badge: 'Inteligencia Artificial',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    icon: Bot,
    iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
    copMonthly: 59000,
    usdMonthly: 19,
    description: 'Asistente virtual 24/7 en WhatsApp y menú web. Resuelve dudas y recomienda maridajes para subir el ticket.',
    bullets: [
      'Respuestas automáticas inteligentes 24/7',
      'Sugerencias de maridaje y venta sugestiva',
      'Entrenado con tu carta e ingredientes',
      'Aumenta el ticket promedio hasta un 22%'
    ],
    includedIn: []
  },
  {
    id: 'addon_custom_domain',
    type: 'addon',
    category: 'marketing',
    name: 'Dominio Propio & Marca Blanca',
    badge: 'Branding',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: Globe,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    copMonthly: 39000,
    usdMonthly: 10,
    description: 'Tu menú en tu propio dominio web (menu.tumarca.com) sin sellos ni menciones de Aluna.',
    bullets: [
      'Dominio propio personalizado',
      'Cero logos o enlaces de Aluna',
      'Certificado SSL de máxima seguridad',
      'SEO y posicionamiento directo en Google'
    ],
    includedIn: ['premium']
  },

  // ── ADD-ONS COCINA & OPERACIÓN ──
  {
    id: 'addon_kds_kitchen',
    type: 'addon',
    category: 'kitchen',
    name: 'Pantalla KDS Cocina Cloud',
    badge: 'Operación',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: UtensilsCrossed,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    copMonthly: 45000,
    usdMonthly: 12,
    description: 'Comandero digital en tiempo real para cocineros. Semáforos de tiempo y alertas sonoras.',
    bullets: [
      'Despacho digital sin papeles perdidos',
      'Semáforos de retraso (Verde / Amarillo / Rojo)',
      'Timbres sonoros ante pedidos nuevos',
      'Agrupación por partidas de cocina'
    ],
    includedIn: ['profesional', 'premium']
  },
  {
    id: 'addon_bds_bar',
    type: 'addon',
    category: 'kitchen',
    name: 'Pantalla BDS Barra & Coctelería',
    badge: 'Operación',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: Wine,
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    copMonthly: 45000,
    usdMonthly: 12,
    description: 'Estación exclusiva para bartenders: rondas de tragos, cafés y cocteles agrupados.',
    bullets: [
      'Control de bebidas separado de la cocina',
      'Agrupación inteligente de rondas',
      'Tiempos de despacho acelerados en salón',
      'Integración directa con los meseros'
    ],
    includedIn: ['profesional', 'premium']
  },
  {
    id: 'addon_thermal_print',
    type: 'addon',
    category: 'kitchen',
    name: 'Auto-Print Cloud (Comandera Térmica)',
    badge: 'Hardware',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: Printer,
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    copMonthly: 35000,
    usdMonthly: 10,
    description: 'Impresión automática a impresoras térmicas Epson/ESC/POS tan pronto entra un pedido.',
    bullets: [
      'Impresión directa vía WiFi o Bluetooth',
      'Cero clics manuales del cajero',
      'Tickets formateados y legibles para chef',
      'Compatible con impresoras de 58mm y 80mm'
    ],
    includedIn: ['premium']
  },

  // ── ESCALA & ENTERPRISE ──
  {
    id: 'addon_extra_location',
    type: 'addon',
    category: 'enterprise',
    name: 'Sede Adicional / Franquicias',
    badge: 'Crecimiento',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: Store,
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    copMonthly: 60000,
    usdMonthly: 18,
    description: 'Abre y gestiona una segunda o tercera sede con inventario y mesas independientes.',
    bullets: [
      'Control multi-sucursal centralizado',
      'Cartas y precios diferenciados por sede',
      'Meseros y cajas asignadas por local',
      'Reportes de rentabilidad comparativos'
    ],
    includedIn: []
  },
  {
    id: 'enterprise_custom',
    type: 'enterprise',
    category: 'enterprise',
    name: 'Aluna Enterprise a Medida',
    badge: 'Corporativo',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
    icon: Building2,
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    copMonthly: 0,
    usdMonthly: 0,
    isCustomPricing: true,
    description: 'Para cadenas y grandes grupos gastronómicos. SLAs dedicados e integración con ERPs.',
    bullets: [
      'Infraestructura dedicada en la nube (99.9% SLA)',
      'Integraciones con POS locales (ICG, Oracle, etc.)',
      'Gerente de cuenta técnico asignado',
      'Capacitación presencial para el equipo'
    ],
    includedIn: []
  }
];

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlanSlug 
}) {
  const navigate = useNavigate();
  const { activeBrand, activePlan } = useAuth();

  // Estados del Mini E-commerce
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currency, setCurrency] = useState('COP'); // 'COP' | 'USD'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [cartItems, setCartItems] = useState(new Set()); // IDs de productos agregados al carrito
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);

  // Plan activo del restaurante (ej: 'premium' en Boku Bento)
  const effectiveCurrentPlanSlug = useMemo(() => {
    return (currentPlanSlug || activePlan?.slug || activeBrand?.plans?.slug || 'emprendedor').toLowerCase();
  }, [currentPlanSlug, activePlan, activeBrand]);

  // Formateador de precios de la tienda
  const getDisplayPrice = (copVal, usdVal, isAnnual = billingCycle === 'annual') => {
    const discount = isAnnual ? 0.8 : 1.0;
    if (currency === 'USD') {
      const finalVal = Math.round(usdVal * discount);
      return `$${finalVal}`;
    } else {
      const finalVal = Math.round(copVal * discount);
      return `$${finalVal.toLocaleString('es-CO')}`;
    }
  };

  // Toggle item en el carrito
  const handleToggleCart = (productId) => {
    setCartItems(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Remover item del carrito
  const handleRemoveFromCart = (productId) => {
    setCartItems(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  // Productos filtrados según la categoría
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return STORE_PRODUCTS;
    return STORE_PRODUCTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  // Resumen del Carrito
  const cartSummary = useMemo(() => {
    const isAnnual = billingCycle === 'annual';
    const discount = isAnnual ? 0.8 : 1.0;

    const items = STORE_PRODUCTS.filter(p => cartItems.has(p.id));
    
    let totalMonthly = 0;
    items.forEach(item => {
      if (!item.isCustomPricing) {
        const itemPrice = currency === 'USD' 
          ? Math.round(item.usdMonthly * discount)
          : Math.round(item.copMonthly * discount);
        totalMonthly += itemPrice;
      }
    });

    return {
      items,
      count: items.length,
      totalMonthly,
      formattedTotal: currency === 'USD' ? `$${totalMonthly} USD` : `$${totalMonthly.toLocaleString('es-CO')} COP`
    };
  }, [cartItems, billingCycle, currency]);

  // Checkout por WhatsApp con mensaje estructurado de tienda
  const handleCheckoutWhatsApp = () => {
    const brandName = activeBrand?.name || 'Mi Restaurante';
    const cycleText = billingCycle === 'annual' ? 'Anual (-20% de descuento aplicado)' : 'Mensual';
    
    if (cartSummary.count === 0) {
      openWhatsApp(`¡Hola Aluna! 👋 Mi restaurante es *${brandName}*. Quisiera conocer más sobre las opciones de planes y módulos disponibles.`);
      return;
    }

    const itemsList = cartSummary.items.map(it => {
      const priceStr = it.isCustomPricing 
        ? 'A cotizar' 
        : (currency === 'USD' ? `$${it.usdMonthly} USD/mes` : `$${it.copMonthly.toLocaleString('es-CO')} COP/mes`);
      return `• *${it.name}* (${priceStr})`;
    }).join('\n');

    const message = `¡Hola Aluna Store! 🛍️✨\n\nMi restaurante es *${brandName}* y deseo solicitar los siguientes módulos desde la tienda:\n\n${itemsList}\n\n📋 *Modalidad:* Facturación ${cycleText}\n💰 *Total Estimado:* ${cartSummary.formattedTotal} / mes\n\n¿Podrían indicarme los pasos para la activación y métodos de pago disponibles (Transferencia, Nequi, Wompi o Tarjeta)?`;

    openWhatsApp(message);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 lg:p-6"
        >
          {/* ══ VENTANA PRINCIPAL TIPO E-COMMERCE (FONDO CLARO) ══════════════════════ */}
          <motion.div
            initial={{ scale: 0.96, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-7xl h-[92vh] max-h-[920px] bg-[#F8FAFC] rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden font-sans text-gray-900"
          >
            
            {/* ── 1. HEADER DEL E-COMMERCE (BLANCO NÍTIDO) ─────────────────── */}
            <header className="bg-white px-5 sm:px-7 py-3.5 border-b border-gray-200/80 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
              
              {/* Logo & Marca de la Tienda */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black text-gray-900 tracking-tight">
                      Aluna Marketplace
                    </h1>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      Tienda Oficial
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Planes y módulos para potenciar a <span className="font-bold text-gray-800">{activeBrand?.name || 'tu restaurante'}</span>
                  </p>
                </div>
              </div>

              {/* Controles de Tienda (Moneda, Facturación, Carrito y Salir) */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                
                {/* Selector Moneda (COP / USD) */}
                <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrency('COP')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      currency === 'COP' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    🇨🇴 COP
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      currency === 'USD' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    🇺🇸 USD
                  </button>
                </div>

                {/* Switch Mensual / Anual */}
                <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                      billingCycle === 'annual' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>Anual</span>
                    <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1.5 py-0.2 rounded-full font-black">
                      -20%
                    </span>
                  </button>
                </div>

                {/* Botón Carrito en Móvil */}
                <button
                  type="button"
                  onClick={() => setIsCartOpenMobile(!isCartOpenMobile)}
                  className="lg:hidden relative p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartSummary.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                      {cartSummary.count}
                    </span>
                  )}
                </button>

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* ── 2. BARRA DE CATEGORÍAS TIPO TIENDA ──────────────────────── */}
            <div className="bg-white/80 backdrop-blur-xs px-5 sm:px-7 py-2.5 border-b border-gray-200/80 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-gray-900 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              <div className="ml-auto text-[11px] text-gray-400 hidden xl:flex items-center gap-1.5 shrink-0 pl-4">
                <span>Tu plan actual:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black border border-emerald-200 capitalize">
                  {effectiveCurrentPlanSlug}
                </span>
              </div>
            </div>

            {/* ── 3. CUERPO: CATÁLOGO DE PRODUCTOS + CARRITO LATERAL ───────── */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Catálogo de Productos (Grid con Scroll) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
                
                {/* Banner de Bienvenida al Marketplace */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      Sin intermediarios ni cláusulas
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      Arma tu sistema gastronómico como quieras
                    </h2>
                    <p className="text-xs text-emerald-100/80 leading-relaxed">
                      Elige un plan todo-en-uno o agrega únicamente los módulos que tu cocina y salón necesitan hoy. Puedes activarlos o cancelarlos mes a mes sin penalizaciones.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openWhatsApp('¡Hola! Quiero asesoría para elegir el mejor plan y módulos para mi restaurante.')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Asesoría por WhatsApp</span>
                  </button>
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                  {filteredProducts.map(product => {
                    const isPlan = product.type === 'plan';
                    const isEnterprise = product.type === 'enterprise';
                    const isCurrentPlan = isPlan && product.slug === effectiveCurrentPlanSlug;
                    const isAlreadyIncluded = !isPlan && product.includedIn?.includes(effectiveCurrentPlanSlug);
                    const isInCart = cartItems.has(product.id);
                    const Icon = product.icon;

                    return (
                      <div
                        key={product.id}
                        className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                          product.isFeatured 
                            ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                            : isInCart
                              ? 'bg-emerald-50/40 border-emerald-400 shadow-sm'
                              : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          {/* Top Row: Icon + Badges */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className={`p-2.5 rounded-xl border ${product.iconBg}`}>
                              <Icon className="w-5 h-5" />
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5 justify-end">
                              {product.badge && (
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${product.badgeColor}`}>
                                  {product.badge}
                                </span>
                              )}
                              {isCurrentPlan && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  Tu Plan Actual
                                </span>
                              )}
                              {isAlreadyIncluded && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Incluido en tu Plan
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Título & Descripción */}
                          <h3 className="text-base font-black text-gray-900 mb-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[36px]">
                            {product.description}
                          </p>

                          {/* Precio */}
                          <div className="py-2.5 border-y border-gray-100 mb-4">
                            {isEnterprise ? (
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-gray-900">A medida</span>
                                <span className="text-[11px] text-gray-400">según sedes</span>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900 tracking-tight">
                                  {getDisplayPrice(product.copMonthly, product.usdMonthly)}
                                </span>
                                <span className="text-xs text-gray-500 font-bold">/ mes</span>
                              </div>
                            )}

                            {billingCycle === 'annual' && !isEnterprise && (
                              <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                Facturado anual (20% de descuento)
                              </p>
                            )}
                          </div>

                          {/* Lista de Bullets Positivos */}
                          <div className="space-y-1.5 mb-5">
                            {product.bullets.map((bullet, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight font-medium">{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Botón de Acción tipo Ecommerce */}
                        <div>
                          {isCurrentPlan ? (
                            <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-black text-center border border-gray-200">
                              ✓ Plan Activo en tu Restaurante
                            </div>
                          ) : isAlreadyIncluded ? (
                            <div className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
                              Ya disfrutas este módulo
                            </div>
                          ) : isEnterprise ? (
                            <button
                              type="button"
                              onClick={() => openWhatsApp('¡Hola! Me gustaría cotizar Aluna Enterprise a medida para mi grupo de restaurantes.')}
                              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>Cotizar con Ventas</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : isPlan ? (
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`?plan=${product.slug}#checkout`);
                                onClose?.();
                              }}
                              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span>Cambiar a este Plan</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleCart(product.id)}
                              className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                isInCart
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {isInCart ? (
                                <>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>En el Carrito (Quitar)</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                  <span>+ Añadir al Carrito</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 4. COLUMNA DERECHA: EL CARRITO DE COMPRAS (SIDEBAR) ──────── */}
              <aside className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white border-l border-gray-200/80 p-5 flex flex-col justify-between shadow-2xl transition-transform lg:static lg:translate-x-0 ${
                isCartOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
              }`}>
                
                {/* Header del Carrito */}
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900">Tu Carrito Aluna</h3>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {cartSummary.count === 0 ? 'Sin módulos añadidos' : `${cartSummary.count} artículo(s) seleccionado(s)`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCartOpenMobile(false)}
                      className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Lista de Items en Carrito */}
                  <div className="py-4 space-y-2.5 max-h-[46vh] overflow-y-auto">
                    {cartSummary.count === 0 ? (
                      <div className="text-center py-10 px-4 space-y-2">
                        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-xs font-bold text-gray-700">Tu carrito está vacío</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Haz clic en <strong>"+ Añadir al Carrito"</strong> en cualquier módulo o add-on para calcular tu inversión.
                        </p>
                      </div>
                    ) : (
                      cartSummary.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-700">
                              {getDisplayPrice(item.copMonthly, item.usdMonthly)} <span className="text-[9px] text-gray-400 font-normal">/ mes</span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                            title="Quitar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Resumen de Pago & Botón de Checkout */}
                <div className="pt-4 border-t border-gray-100 space-y-3.5">
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Ciclo de facturación:</span>
                      <span className="font-bold text-gray-800 capitalize">
                        {billingCycle === 'annual' ? 'Anual (-20% OFF)' : 'Mensual'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Moneda:</span>
                      <span className="font-bold text-gray-800">{currency}</span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-gray-100 text-sm">
                      <span className="font-black text-gray-900">Total Mensual:</span>
                      <span className="text-base font-black text-emerald-700">
                        {cartSummary.formattedTotal}
                      </span>
                    </div>
                  </div>

                  {/* Botón Principal de Checkout */}
                  <button
                    type="button"
                    onClick={handleCheckoutWhatsApp}
                    disabled={cartSummary.count === 0}
                    className="w-full py-3 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirmar y Activar Selección</span>
                  </button>

                  {/* Garantías al pie */}
                  <div className="pt-2 text-center space-y-1">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Sin permanencia · Cancela cuando quieras</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Activación instantánea en menos de 5 minutos
                    </p>
                  </div>
                </div>

              </aside>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
