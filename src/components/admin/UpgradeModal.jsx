import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  ArrowRight, 
  Clock, 
  Users, 
  Star, 
  ShoppingBag, 
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
  ChevronRight,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

/* ── Global Animated Styles ────────────────────────────────────────── */
const STYLES = `
@keyframes aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.aurora-green {
  background: linear-gradient(135deg,#061a10 0%,#0a2818 20%,#071020 40%,#0d1a2a 60%,#0a2010 80%,#061a10 100%);
  background-size: 400% 400%;
  animation: aurora 8s ease infinite;
  position:relative; overflow:hidden;
}
.aurora-gold {
  background: linear-gradient(135deg,#1a1000 0%,#2a1a00 20%,#1a1020 40%,#201000 60%,#2a1800 80%,#1a1000 100%);
  background-size: 400% 400%;
  animation: aurora 9s ease infinite;
  position:relative; overflow:hidden;
}
`;

const WHATSAPP_SUPPORT = '573222285900';
const openWhatsApp = (msg) => {
  window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
};

/* ── Add-ons Catalog Data ─────────────────────────────────────────── */
const ADDONS_CATALOG = [
  {
    id: 'heatmaps_analytics',
    name: 'Inteligencia Pro & Mapas de Calor',
    tag: 'Popular',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Flame,
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'Mapas de calor de toques y scroll, grabaciones en video de navegación de comensales, detección de carritos abandonados y atribución de ventas por volantes de calle y redes.',
    copMonthly: 49000,
    usdMonthly: 15,
    includedIn: ['premium']
  },
  {
    id: 'ai_waiter',
    name: 'Aluna AI Waiter (Mesero con IA)',
    tag: 'Inteligencia Artificial',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: Bot,
    iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    description: 'Asistente virtual 24/7 en WhatsApp y menú web. Responde preguntas de ingredientes, alérgenos y maridaje, y realiza venta sugestiva automática para subir el ticket promedio.',
    copMonthly: 59000,
    usdMonthly: 19,
    includedIn: []
  },
  {
    id: 'kds_kitchen',
    name: 'Pantalla KDS Cocina Cloud',
    tag: 'Operación',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: UtensilsCrossed,
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Pantalla de producción para cocineros con semáforos de tiempo, alertas sonoras, despacho por estaciones y cero comandas de papel perdidas.',
    copMonthly: 45000,
    usdMonthly: 12,
    includedIn: ['profesional', 'premium']
  },
  {
    id: 'bds_bar',
    name: 'Pantalla BDS Barra & Coctelería',
    tag: 'Operación',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Wine,
    iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    description: 'Estación digital para bartenders: gestión de coctelería, bebidas, cafés y rondas de tragos agrupadas en tiempo real sin saturar la cocina.',
    copMonthly: 45000,
    usdMonthly: 12,
    includedIn: ['profesional', 'premium']
  },
  {
    id: 'thermal_auto_print',
    name: 'Auto-Print Cloud (Comandera Térmica)',
    tag: 'Hardware',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Printer,
    iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    description: 'Impresión desatendida automática a impresoras térmicas Epson/ESC/POS vía WiFi o Bluetooth tan pronto entra un pedido de QR o WhatsApp.',
    copMonthly: 35000,
    usdMonthly: 10,
    includedIn: ['premium']
  },
  {
    id: 'custom_domain',
    name: 'Dominio Propio & Marca Blanca',
    tag: 'Branding',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: Globe,
    iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    description: 'Tu carta y web en tu propio dominio (ej: menu.tumarca.com) sin sellos ni menciones de Aluna, con certificado SSL de alta velocidad.',
    copMonthly: 39000,
    usdMonthly: 10,
    includedIn: ['premium']
  },
  {
    id: 'extra_location',
    name: 'Sede Adicional / Franquicias',
    tag: 'Crecimiento',
    tagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    icon: Store,
    iconColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    description: 'Administra una segunda o tercera sucursal con mesas, pedidos, inventario y reportes independientes desde un solo panel maestro.',
    copMonthly: 60000,
    usdMonthly: 18,
    includedIn: []
  }
];

/* ── Fallback Plans with Positive Value Highlights ────────────────── */
const DEFAULT_PLANS = [
  {
    id: 'emprendedor',
    name: 'Emprendedor',
    slug: 'emprendedor',
    description: 'Para negocios que inician y quieren digitalizar su carta rápido.',
    copMonthly: 29900,
    usdMonthly: 9,
    maxOrders: 80,
    maxProducts: 20,
    maxCategories: 5,
    maxAdmins: 1,
    maxLocations: 1,
    highlights: [
      'Menú QR Digital de alta velocidad',
      'Panel de Pedidos Kanban en Vivo',
      'Código QR con logo personalizado',
      'Soporte técnico estándar'
    ]
  },
  {
    id: 'esencial',
    name: 'Esencial',
    slug: 'esencial',
    description: 'Operación ágil con meseros y recepción de pedidos por WhatsApp.',
    copMonthly: 59900,
    usdMonthly: 18,
    maxOrders: 250,
    maxProducts: 50,
    maxCategories: 15,
    maxAdmins: 3,
    maxLocations: 1,
    highlights: [
      'Todo lo de Emprendedor',
      'Toma de pedidos móvil para Meseros',
      'Recepción de pedidos por WhatsApp',
      'Landing page web del restaurante',
      'Gestión de mesas y QRs individuales'
    ]
  },
  {
    id: 'profesional',
    name: 'Profesional',
    slug: 'profesional',
    badge: 'Más Popular',
    description: 'El estándar de oro para restaurantes con salón, cocina y barra activa.',
    copMonthly: 149900,
    usdMonthly: 45,
    highlight: true,
    maxOrders: 800,
    maxProducts: 200,
    maxCategories: 30,
    maxAdmins: 10,
    maxLocations: 2,
    highlights: [
      'Todo lo de Esencial',
      '🍳 Pantalla KDS Cocina Cloud incluida',
      '🍸 Pantalla BDS Barra & Bebidas incluida',
      'Control de Recetas, Costos e Inventario',
      'Analíticas avanzadas y rotación de mesas'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    badge: 'Máxima Potencia',
    description: 'Para restaurantes de alto volumen, marcas consolidadas y cadenas.',
    copMonthly: 249900,
    usdMonthly: 75,
    maxOrders: 2000,
    maxProducts: 500,
    maxCategories: 60,
    maxAdmins: 25,
    maxLocations: 5,
    highlights: [
      'Todo lo de Profesional',
      '🔥 Inteligencia Pro & Mapas de Calor incluida',
      '🖨️ Auto-Print Cloud para comandas incluido',
      '🌐 Dominio Propio & Marca Blanca incluido',
      'CRM de comensales y fidelización',
      'Soporte prioritario VIP 24/7'
    ]
  }
];

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlanSlug, 
  startTrial, 
  isTrialActive, 
  trialAlreadyUsed 
}) {
  const navigate = useNavigate();
  const { activeBrand, activePlan } = useAuth();

  // Estados interactivos
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'addons' | 'enterprise'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [currency, setCurrency] = useState('COP'); // 'COP' | 'USD'
  const [selectedAddons, setSelectedAddons] = useState(new Set());
  const [selectedPlanForCart, setSelectedPlanForCart] = useState(currentPlanSlug || 'profesional');

  const [trialLoading, setTrialLoading] = useState(false);
  const [trialDone, setTrialDone] = useState(false);
  const [trialError, setTrialError] = useState('');

  // Identificar el plan activo real
  const effectiveCurrentPlanSlug = useMemo(() => {
    return (currentPlanSlug || activePlan?.slug || activeBrand?.plans?.slug || 'emprendedor').toLowerCase();
  }, [currentPlanSlug, activePlan, activeBrand]);

  // Formateador de moneda
  const formatPrice = (copVal, usdVal, cycle = billingCycle) => {
    const isAnnual = cycle === 'annual';
    if (currency === 'USD') {
      const base = usdVal;
      const finalMonthly = isAnnual ? Math.round(base * 0.8) : base;
      return `$${finalMonthly}`;
    } else {
      const base = copVal;
      const finalMonthly = isAnnual ? Math.round(base * 0.8) : base;
      return `$${finalMonthly.toLocaleString('es-CO')}`;
    }
  };

  // Toggle Add-on
  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  };

  // Calcular precio total seleccionado en el carrito de Add-ons
  const cartSummary = useMemo(() => {
    const isAnnual = billingCycle === 'annual';
    const discount = isAnnual ? 0.8 : 1.0;

    const chosenPlan = DEFAULT_PLANS.find(p => p.slug === selectedPlanForCart) || DEFAULT_PLANS[2];
    const planBasePrice = currency === 'USD' 
      ? Math.round(chosenPlan.usdMonthly * discount)
      : Math.round(chosenPlan.copMonthly * discount);

    let addonsTotalPrice = 0;
    const selectedAddonsList = [];

    ADDONS_CATALOG.forEach(addon => {
      if (selectedAddons.has(addon.id)) {
        selectedAddonsList.push(addon);
        const addonPrice = currency === 'USD'
          ? Math.round(addon.usdMonthly * discount)
          : Math.round(addon.copMonthly * discount);
        addonsTotalPrice += addonPrice;
      }
    });

    const total = planBasePrice + addonsTotalPrice;

    return {
      chosenPlan,
      planBasePrice,
      selectedAddonsList,
      addonsTotalPrice,
      total,
      currencySymbol: currency === 'USD' ? '$' : '$'
    };
  }, [selectedPlanForCart, selectedAddons, billingCycle, currency]);

  // Handler para contratar o actualizar
  const handleSelectPlan = (planId) => {
    navigate(`?plan=${planId}#checkout`);
    onClose?.();
  };

  // Handler para solicitar Add-ons vía WhatsApp
  const handleRequestAddonsWhatsApp = () => {
    const brandName = activeBrand?.name || 'Mi Restaurante';
    const addonsNames = cartSummary.selectedAddonsList.map(a => `• ${a.name}`).join('\n');
    const cycleText = billingCycle === 'annual' ? 'Anual (con 20% descuento)' : 'Mensual';
    const formattedTotal = currency === 'USD' ? `$${cartSummary.total} USD` : `$${cartSummary.total.toLocaleString('es-CO')} COP`;

    const message = `¡Hola Aluna! 👋 Mi restaurante es *${brandName}*.\n\nQuiero activar los siguientes módulos Add-on:\n${addonsNames}\n\nFacturación: *${cycleText}*\nTotal estimado: *${formattedTotal} / mes*\n\n¿Podrían indicarme los pasos para habilitarlos en mi cuenta?`;

    openWhatsApp(message);
  };

  const handleTrial = async () => {
    if (!startTrial) return;
    setTrialError('');
    setTrialLoading(true);
    const { error } = await startTrial();
    setTrialLoading(false);
    if (!error) { 
      setTrialDone(true); 
      setTimeout(() => onClose?.(), 1800); 
    } else {
      setTrialError(error.message || 'Error al iniciar la prueba.');
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex overflow-hidden"
            style={{ background: '#090D0C' }}
          >
            {/* ══ PANEL LATERAL IZQUIERDO: ESTADO & VALOR DE MARCA ══════════════════════ */}
            <div className="hidden lg:flex flex-col w-[320px] shrink-0 border-r border-white/[0.08] bg-[#0C1210] overflow-y-auto z-10">
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Brand Header */}
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <span className="text-black font-black text-sm">A</span>
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm tracking-tight block">Aluna Store</span>
                      <span className="text-emerald-400 text-[10px] font-medium tracking-wide">Planes & Add-ons Gastronómicos</span>
                    </div>
                  </div>

                  {/* Tarjeta de Estado del Restaurante */}
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Restaurante</span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Activo
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white truncate">
                        {activeBrand?.name || 'Boku Bento'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Plan actual:{' '}
                        <span className="text-emerald-300 font-bold capitalize">
                          {effectiveCurrentPlanSlug}
                        </span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
                      <span>Soporte prioritario:</span>
                      <span className="text-white font-bold">Habilitado</span>
                    </div>
                  </div>

                  {/* Beneficios & Garantías de Confianza */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1">
                      Garantías Aluna
                    </span>

                    <div className="space-y-2.5 text-xs text-gray-300">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-[11px]">Sin permanencia ni cláusulas</p>
                          <p className="text-[10px] text-gray-400">Cancela o pausa tu suscripción cuando quieras con 1 solo clic.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-[11px]">Activación Inmediata</p>
                          <p className="text-[10px] text-gray-400">Los módulos y funciones se desbloquean al instante en tu panel.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <Star className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-[11px]">Cero comisiones por venta</p>
                          <p className="text-[10px] text-gray-400">Toda la plata de tus pedidos y domicilios va directa a tu cuenta.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón WhatsApp de Asesoría Humana */}
                <div className="pt-6 border-t border-white/[0.08] space-y-2">
                  <button
                    type="button"
                    onClick={() => openWhatsApp('¡Hola equipo de Aluna! 👋 Tengo una consulta sobre los planes y módulos para mi restaurante.')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hablar con Soporte Humano</span>
                  </button>
                  <p className="text-center text-[10px] text-gray-500">
                    Respuesta promedio en menos de 5 minutos
                  </p>
                </div>
              </div>
            </div>

            {/* ══ CONTENIDO PRINCIPAL: TABS, PLANES Y ADDONS ════════════════════════════ */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#090D0C]">
              
              {/* Top Navigation Bar */}
              <div className="px-6 lg:px-8 py-3.5 border-b border-white/[0.08] bg-[#0E1513] flex flex-wrap items-center justify-between gap-4 shrink-0">
                
                {/* Selector de Pestañas Principales */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('plans')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'plans'
                        ? 'bg-emerald-500 text-black shadow-xs font-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Planes Todo-en-Uno</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('addons')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'addons'
                        ? 'bg-emerald-500 text-black shadow-xs font-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tienda de Add-ons</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${activeTab === 'addons' ? 'bg-black/20 text-black' : 'bg-amber-400/20 text-amber-300'}`}>
                      7 módulos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('enterprise')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'enterprise'
                        ? 'bg-amber-400 text-black shadow-xs font-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Enterprise</span>
                  </button>
                </div>

                {/* Controles de Moneda y Ciclo de Facturación */}
                <div className="flex items-center gap-3">
                  
                  {/* Selector de Moneda (COP vs USD) */}
                  <div className="flex items-center p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs">
                    <button
                      type="button"
                      onClick={() => setCurrency('COP')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        currency === 'COP' ? 'bg-white/15 text-white font-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🇨🇴 COP ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        currency === 'USD' ? 'bg-white/15 text-white font-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🇺🇸 USD ($)
                    </button>
                  </div>

                  {/* Switch Facturación Mensual vs Anual */}
                  <div className="flex items-center p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        billingCycle === 'monthly' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                        billingCycle === 'annual' ? 'bg-emerald-500/20 text-emerald-300 font-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>Anual</span>
                      <span className="text-[9px] bg-emerald-400 text-black px-1.5 py-0.2 rounded-full font-black">
                        -20%
                      </span>
                    </button>
                  </div>

                  {/* Botón de Cierre */}
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Main Area */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                
                {/* ════ TAB 1: PLANES TODO-EN-UNO ════ */}
                {activeTab === 'plans' && (
                  <div className="space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-1.5">
                      <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                        Planes diseñados para cada etapa
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Todo incluido, sin letras pequeñas ni comisiones ocultas por comensal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {DEFAULT_PLANS.map((plan) => {
                        const isCurrent = effectiveCurrentPlanSlug === plan.slug;
                        const isPop = plan.highlight;

                        return (
                          <div
                            key={plan.id}
                            className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                              isPop 
                                ? 'bg-gradient-to-b from-[#132219] to-[#0d1612] border-emerald-500/40 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                                : isCurrent
                                  ? 'bg-white/[0.04] border-white/20'
                                  : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
                            }`}
                          >
                            {plan.badge && (
                              <span className="absolute -top-2.5 left-4 text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-black px-2.5 py-0.5 rounded-full shadow-md">
                                {plan.badge}
                              </span>
                            )}

                            {isCurrent && !plan.badge && (
                              <span className="absolute -top-2.5 left-4 text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                                Tu plan actual
                              </span>
                            )}

                            <div>
                              <div className="mb-3">
                                <h3 className="text-base font-black text-white">{plan.name}</h3>
                                <p className="text-[11px] text-gray-400 mt-1 min-h-[32px] leading-relaxed">
                                  {plan.description}
                                </p>
                              </div>

                              {/* Precio */}
                              <div className="py-3 border-y border-white/[0.06] mb-4">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-black text-white tracking-tight">
                                    {formatPrice(plan.copMonthly, plan.usdMonthly)}
                                  </span>
                                  <span className="text-xs text-gray-400">/ mes</span>
                                </div>
                                {billingCycle === 'annual' && (
                                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                    Facturado anualmente (Ahorras 2 meses)
                                  </p>
                                )}
                              </div>

                              {/* Límites en Pills Visuales */}
                              <div className="flex flex-wrap gap-1.5 mb-4 text-[10px] font-bold text-gray-300">
                                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                                  📦 {plan.maxOrders} pedidos/mes
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                                  🍽️ {plan.maxProducts} platos
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                                  📍 {plan.maxLocations} {plan.maxLocations === 1 ? 'sede' : 'sedes'}
                                </span>
                              </div>

                              {/* Beneficios Clave (Solo Positivos, Sin Line-through) */}
                              <div className="space-y-2 mb-6">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">
                                  Incluye:
                                </span>
                                {plan.highlights.map((feat, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-gray-200">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="leading-snug text-[11px]">{feat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Botón de Selección */}
                            <button
                              type="button"
                              onClick={() => handleSelectPlan(plan.id)}
                              disabled={isCurrent}
                              className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-white/10 text-gray-400 cursor-default'
                                  : isPop
                                    ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-md shadow-emerald-500/20 active:scale-[0.98]'
                                    : 'bg-white/[0.08] hover:bg-white/[0.15] text-white active:scale-[0.98]'
                              }`}
                            >
                              <span>{isCurrent ? 'Plan Actual' : 'Elegir este Plan'}</span>
                              {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════ TAB 2: TIENDA DE ADD-ONS (MÓDULOS A LA CARTA) ════ */}
                {activeTab === 'addons' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                          <Layers className="w-5 h-5 text-emerald-400" />
                          <span>Módulos Add-on a la Carta</span>
                        </h2>
                        <p className="text-gray-400 text-xs">
                          Suma superpoderes a tu plan actual sin tener que migrar de categoría. Selecciona los que quieras activar:
                        </p>
                      </div>

                      <div className="text-xs text-gray-400">
                        Seleccionados: <span className="font-black text-emerald-400">{selectedAddons.size} de {ADDONS_CATALOG.length}</span>
                      </div>
                    </div>

                    {/* Grid de Addons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {ADDONS_CATALOG.map((addon) => {
                        const isSelected = selectedAddons.has(addon.id);
                        const isIncludedInCurrent = addon.includedIn.includes(effectiveCurrentPlanSlug);
                        const Icon = addon.icon;

                        return (
                          <div
                            key={addon.id}
                            onClick={() => {
                              if (!isIncludedInCurrent) toggleAddon(addon.id);
                            }}
                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                              isIncludedInCurrent
                                ? 'bg-emerald-950/20 border-emerald-500/30 opacity-90 cursor-default'
                                : isSelected
                                  ? 'bg-[#122319] border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                                  : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className={`p-2.5 rounded-xl border ${addon.iconColor}`}>
                                    <Icon className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-black text-white">{addon.name}</h4>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mt-1 ${addon.tagColor}`}>
                                      {addon.tag}
                                    </span>
                                  </div>
                                </div>

                                {/* Checkbox / Estado */}
                                <div>
                                  {isIncludedInCurrent ? (
                                    <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                      Ya Incluido
                                    </span>
                                  ) : (
                                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                      isSelected 
                                        ? 'bg-emerald-400 border-emerald-400 text-black' 
                                        : 'border-white/20 bg-white/5'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-gray-400 leading-relaxed min-h-[48px]">
                                {addon.description}
                              </p>
                            </div>

                            <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between">
                              <div className="flex items-baseline gap-1">
                                <span className="text-base font-black text-white">
                                  {formatPrice(addon.copMonthly, addon.usdMonthly)}
                                </span>
                                <span className="text-[10px] text-gray-400">/ mes</span>
                              </div>

                              <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-300' : 'text-gray-400'}`}>
                                {isIncludedInCurrent ? 'En tu plan' : isSelected ? 'Seleccionado ✓' : 'Añadir +'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* BARRA CALCULADORA EN VIVO (STICKY / FLOTANTE) */}
                    {selectedAddons.size > 0 && (
                      <div className="rounded-2xl bg-gradient-to-r from-[#12281b] to-[#0e1a14] border border-emerald-500/40 p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                              Resumen de Selección
                            </span>
                            <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.2 rounded-full font-black">
                              {selectedAddons.size} Add-on(s)
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">
                            Total mensual estimado:{' '}
                            <span className="text-lg font-black text-white">
                              {currency === 'USD' ? `$${cartSummary.addonsTotalPrice} USD` : `$${cartSummary.addonsTotalPrice.toLocaleString('es-CO')} COP`}
                            </span>
                            <span className="text-gray-400 text-[11px]"> / mes</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleRequestAddonsWhatsApp}
                          className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all shrink-0"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Activar Add-ons Seleccionados vía WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ TAB 3: ENTERPRISE A MEDIDA ════ */}
                {activeTab === 'enterprise' && (
                  <div className="space-y-6">
                    <div className="aurora-gold rounded-3xl border border-amber-500/30 p-8 relative overflow-hidden">
                      <div className="max-w-2xl space-y-4">
                        <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider inline-block">
                          Cadenas & Franquicias
                        </span>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                          Aluna Enterprise a Medida
                        </h2>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Soluciones dedicadas para grupos gastronómicos con múltiples marcas, sedes centralizadas y altos volúmenes de transacciones.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                          {[
                            'Infraestructura en la nube dedicada con 99.9% SLA',
                            'Integraciones directas con ERPs y sistemas POS existentes',
                            'Panel corporativo multi-marca y multi-sucursal',
                            'Gerente de cuenta técnico y soporte humano prioritario 24/7',
                            'Capacitación y onboarding presencial para todo el personal',
                            'Facturación electrónica local e internacional'
                          ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-white">
                              <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-6">
                          <button
                            type="button"
                            onClick={() => openWhatsApp('¡Hola equipo Aluna! 👋 Mi empresa está interesada en una propuesta personalizada para el plan Enterprise.')}
                            className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                          >
                            <span>Agendar Llamada con Ventas Enterprise</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
