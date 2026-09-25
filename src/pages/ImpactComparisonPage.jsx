import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Camera,
  Bot,
  Zap,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Flame,
  BarChart3,
  Award,
  Smartphone,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Check
} from 'lucide-react';

const KPIS = [
  {
    id: 'conversion',
    title: 'Conversión (Visitas a Pedido)',
    alto: {
      value: '34.8%',
      badge: '+145% Más Pedidos',
      label: 'Foto Real (Alto Andino)',
      desc: 'El comensal confía de inmediato al ver el plato exactamente como le llegará a la mesa. La duda de "¿será que si viene así?" desaparece.'
    },
    boku: {
      value: '14.2%',
      badge: 'Baja Confianza',
      label: 'Foto IA / Genérica (Boku)',
      desc: 'Con fotos sintéticas o cartas sin foto, el comensal duda de la porción real y pide solo lo básico que ya conoce con recelo.'
    },
    splitDesc: 'El comensal confía de inmediato cuando ve el plato exactamente como le llegará a la mesa. La duda de "¿será que si viene así?" desaparece.'
  },
  {
    id: 'ticket',
    title: 'Ticket Promedio por Mesa',
    alto: {
      value: '$36.200',
      badge: '+$14.700 COP / Mesa',
      label: 'Con Adiciones & Bebidas',
      desc: 'Las fotos reales de alta definición estimulan el apetito visual. 1 de cada 2 mesas agrega bebidas artesanales, entradas o postres que antes ni sabían que existían.'
    },
    boku: {
      value: '$21.500',
      badge: 'Consumo Mínimo',
      label: 'Plato Único Básico',
      desc: 'Sin fotos tentadoras de bebidas o postres, el 85% de las mesas pide únicamente el plato fuerte básico sin ninguna adición.'
    },
    splitDesc: 'Las fotos reales de alta definición estimulan el apetito visual. 1 de cada 2 mesas agrega bebidas artesanales, entradas o postres que antes ni sabían que existían.'
  },
  {
    id: 'crossSell',
    title: 'Venta de Bebidas & Postres',
    alto: {
      value: '54%',
      badge: 'Triplica el Antojo',
      label: '1 de cada 2 pide bebida/postre',
      desc: 'Una foto iluminada del pastel de tres leches o del café de origen cierra la venta cruzada antes de terminar el almuerzo.'
    },
    boku: {
      value: '18%',
      badge: 'Venta Casi Nula',
      label: 'Solo 1 de cada 5 pide',
      desc: 'Nadie lee un postre en una lista de texto plano en PDF. Pasan totalmente desapercibidos para el 82% de los comensales.'
    },
    splitDesc: 'Nadie lee un postre en una lista de texto en PDF. Pero una foto iluminada del pastel de tres leches o del café de origen cierra la venta antes de terminar el almuerzo.'
  },
  {
    id: 'bounce',
    title: 'Tasa de Abandono (Rebote)',
    alto: {
      value: '16.2%',
      badge: '-66% Menos Fugas',
      label: 'Navegación fluida Aluna',
      desc: 'Aluna carga en menos de 0.8 segundos con caché instantáneo en el celular. El cliente se queda y explora el menú completo.'
    },
    boku: {
      value: '48.5%',
      badge: '48.5% Abandono',
      label: 'Abandono con PDF lento',
      desc: 'Cargar un PDF de 25MB por WhatsApp gasta los datos del cliente, se traba y casi la mitad lo cierra sin llegar a ordenar.'
    },
    splitDesc: 'Cargar un PDF de 25MB por WhatsApp gasta los datos del cliente y se cierra. Aluna carga en menos de 0.8 segundos con caché instantáneo en el celular.'
  },
  {
    id: 'turnover',
    title: 'Tiempo de Espera y Rotación',
    alto: {
      value: '42 min',
      badge: '-23 Minutos por Mesa',
      label: 'Atención ágil digital',
      desc: 'El cliente escanea al sentarse, pide de inmediato y el mesero solo lleva los platos. Atiendes hasta un 35% más mesas en horas pico.'
    },
    boku: {
      value: '65 min',
      badge: 'Esperas Prolongadas',
      label: 'Esperando carta física',
      desc: 'El mesero debe ir 3 veces a la mesa a llevar cartas, responder dudas y tomar nota, colapsando el servicio en horas pico.'
    },
    splitDesc: 'El cliente escanea al sentarse, pide de inmediato y el mesero solo lleva el pedido. Atiendes hasta un 35% más mesas en horas pico de almuerzo.'
  },
  {
    id: 'commission',
    title: 'Comisión por Pedido Directo',
    alto: {
      value: '0%',
      badge: '100% Ganancia para ti',
      label: 'Canal Directo Aluna',
      desc: 'Con Aluna el dinero entra íntegro a tu cuenta bancaria sin regalar comisiones del 25% a plataformas intermediarias.'
    },
    boku: {
      value: '22% - 25%',
      badge: 'Pérdida en Comisiones',
      label: 'Comisión a Apps / Intermediarios',
      desc: 'Por cada $10.000.000 COP vendidos por apps tradicionales, el restaurante le regala hasta $2.500.000 COP a la plataforma.'
    },
    splitDesc: 'Por cada $10.000.000 COP vendidos por apps tradicionales, el restaurante le regala $2.500.000 COP a la plataforma intermediaria. Con Aluna el dinero entra íntegro a tu cuenta.'
  }
];

export default function ImpactComparisonPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Mode: 'split' | 'alto-andino' | 'boku'
  const [activeView, setActiveView] = useState('split');
  
  // Mobile KPI Slider State & Ref
  const kpiScrollRef = useRef(null);
  const [activeKpiIndex, setActiveKpiIndex] = useState(0);

  const handleKpiScroll = () => {
    if (!kpiScrollRef.current) return;
    const { scrollLeft, offsetWidth } = kpiScrollRef.current;
    if (offsetWidth > 0) {
      const cardWidth = offsetWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveKpiIndex(Math.min(Math.max(index, 0), KPIS.length - 1));
    }
  };

  const scrollToKpi = (index) => {
    if (!kpiScrollRef.current) return;
    const cardWidth = kpiScrollRef.current.offsetWidth * 0.86;
    kpiScrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    setActiveKpiIndex(index);
  };

  // Mobile Table Comparison View Toggle: 'pdf' | 'boku'
  const [mobileTableTab, setMobileTableTab] = useState('pdf');

  // Interactive ROI Calculator State
  const [dailyOrders, setDailyOrders] = useState(40);
  const [ticketBase, setTicketBase] = useState(22000);
  const [timeframe, setTimeframe] = useState('month'); // 'month' | 'day'

  // Calculations for ROI - Linear, Transparent & Verifiable
  const math = useMemo(() => {
    const days = 30;

    // Situación actual
    const dailyBase = dailyOrders * ticketBase;
    const monthlyBase = dailyBase * days;

    // Palanca 1: Subida de ticket por fotos reales de bebidas/postres (+25%)
    const ticketBoostPct = 0.25;
    const ticketOptimized = Math.round(ticketBase * (1 + ticketBoostPct));
    const ticketDiff = ticketOptimized - ticketBase;

    // Palanca 2: Subida de pedidos por rotación ágil y canal directo (+15%)
    const ordersBoostPct = 0.15;
    const ordersOptimized = Math.round(dailyOrders * (1 + ordersBoostPct));
    const ordersDiff = ordersOptimized - dailyOrders;

    // Situación optimizada con Aluna + Fotos reales
    const dailyOptimized = ordersOptimized * ticketOptimized;
    const monthlyOptimized = dailyOptimized * days;

    // Ganancia adicional neta
    const extraDaily = dailyOptimized - dailyBase;
    const extraMonthly = monthlyOptimized - monthlyBase;

    return {
      dailyBase,
      monthlyBase,
      ticketOptimized,
      ticketDiff,
      ordersOptimized,
      ordersDiff,
      dailyOptimized,
      monthlyOptimized,
      extraDaily,
      extraMonthly
    };
  }, [dailyOrders, ticketBase]);

  const formatCOP = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-[#D4A853] selection:text-black">
      {/* Top Brand Bar */}
      <header className="border-b border-white/10 bg-[#0F0F12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button 
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-200 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 shrink-0"
              title="Volver a la página anterior"
              aria-label="Ir atrás"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A853] shrink-0" />
              <span className="text-[11px] sm:text-xs">Atrás</span>
            </button>

            <div className="h-4 w-px bg-white/10" />

            <Link to="/" className="text-base sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Aluna <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-[#D4A853] font-sans px-2.5 py-0.5 rounded-full border border-[#D4A853]/30 bg-[#D4A853]/10 font-bold">Impact Lab</span>
              <span className="sm:hidden text-[9px] uppercase tracking-wider text-[#D4A853] font-sans px-1.5 py-0.5 rounded border border-[#D4A853]/30 bg-[#D4A853]/10 font-bold">Lab</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link 
              to="/alto-andino?demo=1#menu"
              className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-white/90 hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1 whitespace-nowrap"
            >
              <Smartphone className="w-3 h-3 text-[#D4A853] shrink-0" />
              <span><span className="hidden sm:inline">Ver </span>Demo<span className="hidden sm:inline"> Real</span></span>
            </Link>
            <Link 
              to="/"
              className="text-[11px] sm:text-xs uppercase tracking-wider font-bold bg-[#D4A853] text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:brightness-110 transition shadow-lg shadow-[#D4A853]/20 whitespace-nowrap"
            >
              <span>Inicio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-8 sm:pt-12 sm:pb-14 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient Glows */}
        <div className={`absolute top-10 left-1/4 w-96 h-96 blur-[130px] rounded-full pointer-events-none transition-all duration-700 ${
          activeView === 'boku' ? 'bg-amber-500/20' : 'bg-[#2D6A4F]/25'
        }`} />
        <div className={`absolute top-20 right-1/4 w-96 h-96 blur-[140px] rounded-full pointer-events-none transition-all duration-700 ${
          activeView === 'boku' ? 'bg-amber-600/15' : 'bg-[#D4A853]/20'
        }`} />

        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeView + '-badge'}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest border ${
                activeView === 'boku'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : activeView === 'alto-andino'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-[#D4A853]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> 
              <span>
                {activeView === 'boku' && 'Diagnóstico: Modelo Menú con IA (BOKU)'}
                {activeView === 'alto-andino' && 'Solución de Alto Rendimiento: Fotos Reales + Aluna'}
                {activeView === 'split' && 'Caso de Estudio & Simulador Comercial'}
              </span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h1 
              key={activeView + '-title'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight" 
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {activeView === 'boku' && (
                <>
                  La Fricción Oculta de <br className="hidden sm:inline" />
                  <span className="text-amber-400 italic">No Tener Fotos Reales</span>
                </>
              )}
              {activeView === 'alto-andino' && (
                <>
                  El Ecosistema que Provoca <br className="hidden sm:inline" />
                  <span className="text-emerald-400 italic">Antojo y Cero Comisiones</span>
                </>
              )}
              {activeView === 'split' && (
                <>
                  El Impacto Real de la <br className="hidden sm:inline" />
                  <span className="text-[#D4A853] italic">Fotografía Profesional</span> en Ventas
                </>
              )}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p 
              key={activeView + '-subtitle'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs sm:text-base lg:text-lg text-gray-300 font-light leading-relaxed max-w-2xl mx-auto px-1"
            >
              {activeView === 'boku' && (
                <>
                  Las cartas con fotos sintéticas, imágenes de stock o solo texto generan desconfianza en el comensal: reducen el ticket promedio a solo <strong className="text-amber-300 font-bold">$21.500 COP</strong> y el 48% abandona la carta sin ordenar adiciones.
                </>
              )}
              {activeView === 'alto-andino' && (
                <>
                  Fotografía gastronómica real de cada plato, carga instantánea en 0.8s, integración directa con reseñas de Google Maps y venta 100% directa: el ticket se eleva a <strong className="text-emerald-300 font-bold">$36.200 COP por mesa</strong>.
                </>
              )}
              {activeView === 'split' && (
                <>
                  Comparamos el rendimiento de un menú tradicional o generado con IA (<span className="text-white font-medium">BOKU</span>) frente a un ecosistema con fotografía gastronómica real y optimización de Google Maps (<span className="text-emerald-400 font-medium">Alto Andino</span>).
                </>
              )}
            </motion.p>
          </AnimatePresence>

          {/* View Switcher (Sleek Compact Segmented Control Mobile / Floating Pill Desktop) */}
          <div className="pt-3 sm:pt-6 flex justify-center w-full max-w-xl mx-auto px-1">
            <div className="w-full sm:w-auto p-1 rounded-xl sm:rounded-full bg-white/5 border border-white/15 grid grid-cols-3 sm:flex sm:items-center sm:justify-center gap-1 sm:gap-1.5 shadow-2xl backdrop-blur-lg">
              <button
                onClick={() => setActiveView('split')}
                className={`w-full sm:w-auto px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeView === 'split' 
                    ? 'bg-[#D4A853] text-black shadow-lg shadow-[#D4A853]/30 sm:scale-105 font-black' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden font-extrabold truncate">Cara a Cara</span>
                <span className="hidden sm:inline">Comparación Cara a Cara</span>
              </button>
              <button
                onClick={() => setActiveView('boku')}
                className={`w-full sm:w-auto px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeView === 'boku' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 sm:scale-105 font-black ring-1 sm:ring-2 ring-amber-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bot className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden font-extrabold truncate">Solo IA</span>
                <span className="hidden sm:inline">Solo Modelo IA (BOKU)</span>
              </button>
              <button
                onClick={() => setActiveView('alto-andino')}
                className={`w-full sm:w-auto px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                  activeView === 'alto-andino' 
                    ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/40 sm:scale-105 font-black ring-1 sm:ring-2 ring-emerald-300' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden font-extrabold truncate">Fotos Reales</span>
                <span className="hidden sm:inline">Solo Modelo Real (Alto Andino)</span>
              </button>
            </div>
          </div>

          {/* Active View Context Banner */}
          <AnimatePresence mode="wait">
            {activeView === 'boku' && (
              <motion.div 
                key="boku-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xl"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Vista Activa: Diagnóstico Menú IA / Sin Fotos Reales (BOKU)
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Viendo métricas de restaurante con carta artificial. El comensal duda de la porción y el 48% abandona sin pedir bebidas ni postres.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('alto-andino')}
                  className="shrink-0 w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs sm:text-[11px] font-black uppercase tracking-wider transition text-center"
                >
                  Ver Solución Real →
                </button>
              </motion.div>
            )}

            {activeView === 'alto-andino' && (
              <motion.div 
                key="alto-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <Camera className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      Vista Activa: Modelo Fotografía Real + Aluna (Alto Andino)
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Viendo métricas de alto rendimiento: +145% en conversión, $36.200 por mesa y reseñas 5 estrellas automáticas en Google Maps.
                    </p>
                  </div>
                </div>
                <Link
                  to="/alto-andino?demo=1#menu"
                  className="shrink-0 w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs sm:text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 text-center"
                >
                  Probar Demo →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Main KPI Cards Section */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        
        {/* Mobile Swipe Hint */}
        <div className="flex md:hidden items-center justify-between pb-2 px-1 text-[10px] text-gray-400 font-medium">
          <span>← Desliza las métricas ({activeKpiIndex + 1}/{KPIS.length}) →</span>
          <span className="text-[#D4A853] font-bold">Métricas Clave</span>
        </div>

        {/* Mobile Slider / Desktop Grid Container */}
        <div 
          ref={kpiScrollRef}
          onScroll={handleKpiScroll}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory no-scrollbar pb-3 md:pb-0 -mx-3.5 px-3.5 md:mx-0 md:px-0"
        >
          {KPIS.map((kpi) => {
            if (activeView === 'boku') {
              return (
                <div 
                  key={kpi.id} 
                  className="w-[86vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink rounded-2xl sm:rounded-3xl bg-[#181510] border border-amber-500/40 p-4 sm:p-6 relative overflow-hidden shadow-lg shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">{kpi.title}</span>
                      <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                        {kpi.boku.badge}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">{kpi.boku.value}</p>
                      <p className="text-[11px] font-medium text-amber-300/70 flex items-center gap-1.5 mt-1">
                        <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {kpi.boku.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    {kpi.boku.desc}
                  </p>
                </div>
              );
            }

            if (activeView === 'alto-andino') {
              return (
                <div 
                  key={kpi.id} 
                  className="w-[86vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink rounded-2xl sm:rounded-3xl bg-[#0E1A14] border border-emerald-500/40 p-4 sm:p-6 relative overflow-hidden shadow-lg shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">{kpi.title}</span>
                      <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-black whitespace-nowrap">
                        {kpi.alto.badge}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">{kpi.alto.value}</p>
                      <p className="text-[11px] font-medium text-emerald-300/70 flex items-center gap-1.5 mt-1">
                        <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {kpi.alto.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-light">
                    {kpi.alto.desc}
                  </p>
                </div>
              );
            }

            // Split Duel Mode
            return (
              <div 
                key={kpi.id} 
                className="w-[86vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/10 p-4 sm:p-6 relative overflow-hidden group hover:border-[#D4A853]/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{kpi.title}</span>
                    <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-xs font-black whitespace-nowrap">
                      {kpi.alto.badge}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 items-baseline mb-3 pb-3 border-b border-white/5">
                    <div className="pr-1 sm:pr-2">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 tracking-tight">{kpi.alto.value}</p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-emerald-300/80 flex items-center gap-1 mt-0.5 leading-snug">
                        <Camera className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{kpi.alto.label}</span>
                      </p>
                    </div>
                    <div className="border-l border-white/10 pl-2.5 sm:pl-4">
                      <p className="text-xl sm:text-2xl font-black text-gray-500 line-through tracking-tight">{kpi.boku.value}</p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5 leading-snug">
                        <Bot className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="truncate">{kpi.boku.label}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  {kpi.splitDesc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile Pagination Dots & Arrow Controls */}
        <div className="flex md:hidden items-center justify-between pt-3 px-1">
          <button
            onClick={() => scrollToKpi(Math.max(0, activeKpiIndex - 1))}
            disabled={activeKpiIndex === 0}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition"
            aria-label="Anterior KPI"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {KPIS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToKpi(i)}
                className={`transition-all duration-300 rounded-full ${
                  activeKpiIndex === i 
                    ? 'w-6 h-1.5 bg-[#D4A853]' 
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ir a tarjeta ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => scrollToKpi(Math.min(KPIS.length - 1, activeKpiIndex + 1))}
            disabled={activeKpiIndex === KPIS.length - 1}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition"
            aria-label="Siguiente KPI"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Visual Product Comparison Section */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 relative overflow-hidden transition-all duration-300 border ${
          activeView === 'boku'
            ? 'bg-[#15120E] border-amber-500/30 shadow-2xl'
            : activeView === 'alto-andino'
            ? 'bg-[#0B1510] border-emerald-500/30 shadow-2xl'
            : 'bg-[#121216] border-white/10'
        }`}>
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
              activeView === 'boku' ? 'text-amber-400' : activeView === 'alto-andino' ? 'text-emerald-400' : 'text-[#D4A853]'
            }`}>
              {activeView === 'boku' 
                ? 'Diagnóstico Visual en Detalle'
                : activeView === 'alto-andino'
                ? 'Showcase Gastronómico de Alta Venta'
                : 'Contraste Visual en Pantalla'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {activeView === 'boku'
                ? 'El Límite de las Imágenes IA y Cartas Planas'
                : activeView === 'alto-andino'
                ? 'Por qué la Fotografía Real Cierra la Venta'
                : '¿Por qué la mente compra lo que ve?'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 font-light">
              {activeView === 'boku'
                ? 'La inteligencia artificial genera conceptos llamativos, pero en gastronomía el cliente exige ver exactamente la comida que va a pagar.'
                : activeView === 'alto-andino'
                ? 'La fotografía gastronómica profesional activa las papilas gustativas, garantiza la confianza y genera reseñas 5 estrellas en Google Maps.'
                : 'La IA sirve para diseñar la carta en papel, pero la foto gastronómica profesional es la que activa las papilas gustativas del cliente.'}
            </p>
          </div>

          {/* Section Body */}
          <AnimatePresence mode="wait">
            {activeView === 'boku' && (
              <motion.div
                key="boku-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Boku Cards Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="rounded-xl sm:rounded-2xl border border-amber-500/30 bg-black/40 p-3.5 sm:p-5 relative">
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img 
                        src="/img/boku/boku_salmon_fresh.png" 
                        alt="Boku IA Salmon" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/poke1.png"; }}
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-amber-500/30">
                        Concepto IA • BOKU [僕] Salmón Teriyaki
                      </div>
                    </div>
                    <p className="text-xs font-bold text-amber-300">Apariencia Sintética vs Realidad</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      La textura de la salsa y el glaseado están computarizados. Si la porción real servida difiere, el cliente siente frustración inmediata.
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl border border-amber-500/30 bg-black/40 p-3.5 sm:p-5 relative">
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img 
                        src="/img/boku/boku_gold_chicken.png" 
                        alt="Boku IA Chicken" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/poke1.png"; }}
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-amber-500/30">
                        Concepto IA • BOKU [僕] Crispy Chicken
                      </div>
                    </div>
                    <p className="text-xs font-bold text-amber-300">Desconexión con Google Maps</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Los clientes no etiquetan fotos de IA en redes ni las usan para reseñar el local en Google Maps, limitando el posicionamiento orgánico.
                    </p>
                  </div>
                </div>

                {/* Friction Points Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4 shrink-0" /> <span>La Trampa de la Expectativa</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      La IA añade ingredientes o proporciones imposibles de replicar con exactitud en cada servicio, aumentando el riesgo de reclamos.
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4 shrink-0" /> <span>Ticket Bajo ($21.500)</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Al no ver limonadas, cócteles ni postres reales, el comensal se abstiene de pedir adiciones y consume solo el plato básico.
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4 shrink-0" /> <span>Cero Antojo Emocional</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      La comida entra por los ojos: el vapor real, la salsa derretida y el brillo auténtico son insustituibles para provocar hambre.
                    </p>
                  </div>
                </div>

                {/* Bridge CTA */}
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/20 via-black to-emerald-500/20 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      ¿Cómo superar el techo de ventas del Modelo BOKU?
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Mira el resultado cuando fotografiamos los platos reales y los conectamos con Google Maps y Aluna QR.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('alto-andino')}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-400/20"
                  >
                    <span>Ver Modelo Alto Andino</span> <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeView === 'alto-andino' && (
              <motion.div
                key="alto-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Alto Andino Real Food Showcase Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-black/40 p-3.5 sm:p-4 relative shadow-lg shadow-emerald-500/5">
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img 
                        src="/img/products/sandwich-serrano.jpg" 
                        alt="Sándwich Serrano" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                        Foto Real • Sándwich Serrano
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-300">Apetito Visual Inmediato</p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      La textura crocante del pan artesanal y el jamón serrano provocan antojo antes de que el comensal decida.
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-black/40 p-3.5 sm:p-4 relative shadow-lg shadow-emerald-500/5">
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img 
                        src="/img/products/bowl-poke-hawaiano.jpg" 
                        alt="Poke Bowl" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                        Foto Real • Poke Bowl Hawaiano
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-300">Certeza de Frescura</p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      Los colores reales del salmón, aguacate y ajonjolí transmiten frescura inmediata. Cero dudas al ordenar.
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-black/40 p-3.5 sm:p-4 relative shadow-lg shadow-emerald-500/5">
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img 
                        src="/img/products/post-tres.jpg" 
                        alt="Postre Tres Leches" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                        Foto Real • Postre Tres Leches
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-300">Venta Cruzada (+54%)</p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      Los postres no se venden por texto, se venden por la foto de la crema y la canela. Triplica las ventas de cierre.
                    </p>
                  </div>
                </div>

                {/* Success Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>Reseñas 5★ en Google Maps</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Al recibir exactamente lo prometido, los comensales toman fotos reales y dejan calificaciones perfectas en tu ficha de negocio.
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>Ticket de $36.200 por Mesa</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      1 de cada 2 mesas suma entradas, bebidas de autor o postres atraídas por las fotos en alta definición.
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>0% Comisiones a Terceros</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Tus clientes escanean el QR en mesa o piden por tu enlace directo: todo el dinero ingresa completo a tu caja registradora.
                    </p>
                  </div>
                </div>

                {/* Live Demo CTA */}
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/20 via-black to-[#D4A853]/20 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 shadow-xl">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      Comprueba la velocidad y el diseño en un menú real
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Navega el menú de Alto Andino exactamente como lo vería un cliente sentado en tu restaurante.
                    </p>
                  </div>
                  <Link
                    to="/alto-andino?demo=1#menu"
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-400/20"
                  >
                    <span>Abrir Carta Alto Andino</span> <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}

            {activeView === 'split' && (
              <motion.div
                key="split-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-stretch"
              >
                {/* Lado Boku (IA) */}
                <div className="rounded-xl sm:rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 sm:p-5 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Menú IA / Prototipo (BOKU)</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
                        Prototipar
                      </span>
                    </div>

                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3.5 border border-white/10 relative bg-black/40">
                      <img 
                        src="/img/boku/boku_salmon_fresh.png" 
                        alt="Boku IA Sample" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/poke1.png"; }}
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-amber-500/30">
                        Concepto IA • BOKU [僕]
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>Excelente para validar conceptos de platos antes de cocinarlos.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>Riesgo de queja: <em>"En la imagen se veía diferente a lo que sirvieron"</em>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>Menor emoción táctil y brillo natural de salsa o cocción real.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Lado Alto Andino (Real) */}
                <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 sm:p-5 relative shadow-[0_0_40px_rgba(16,185,129,0.1)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Producción Real (Alto Andino)</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                        Máxima Venta
                      </span>
                    </div>

                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3.5 border border-white/10 relative bg-black/40">
                      <img 
                        src="/img/products/sandwich-serrano.jpg" 
                        alt="Alto Andino Real Sample" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                        Fotografía Gastronómica Real • Alto Andino
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Textura de pan crujiente, queso fundido y frescura auténtica.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Reseñas 5 estrellas en Google Maps: el cliente recibe exactamente lo prometido.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Sube el ticket promedio un <strong>+25% a +35%</strong> en pedidos con adición.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 🔥 THE TRANSPARENT ROI CALCULATOR SECTION */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#131418] via-[#0F1012] to-[#16181D] border border-[#D4A853]/40 p-4 sm:p-8 lg:p-12 relative overflow-hidden shadow-2xl">
          
          {/* Header & Toggle */}
          <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-10 space-y-2.5 sm:space-y-3">
            <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
              activeView === 'boku'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : activeView === 'alto-andino'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-[#D4A853]/15 text-[#D4A853]'
            }`}>
              <Calculator className="w-3.5 h-3.5 shrink-0" /> 
              <span>
                {activeView === 'boku' && 'Diagnóstico Financiero: Brecha de Pérdida'}
                {activeView === 'alto-andino' && 'Proyección Financiera: Ganancia Proyectada Aluna'}
                {activeView === 'split' && 'Simulador Financiero en Vivo'}
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {activeView === 'boku' && '¿Cuánto dinero estás dejando sobre la mesa hoy?'}
              {activeView === 'alto-andino' && '¿Cuánto dinero extra entra con Aluna + Fotos Reales?'}
              {activeView === 'split' && '¿Cuánto dinero extra entra a tu caja registradora?'}
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-400 font-light">
              {activeView === 'boku'
                ? 'Calcula la brecha mensual que se fuga por comisiones de apps intermediarias y por no provocar el antojo de bebidas y postres.'
                : activeView === 'alto-andino'
                ? 'Mueve los deslizadores con los datos de tu restaurante. Matemática 100% lineal y verificable en tu extracto bancario.'
                : 'Mueve los deslizadores con los datos reales de tu restaurante. Sin fórmulas ocultas: matemática lineal y comprobable.'}
            </p>

            {/* Timeframe Switcher (Día vs Mes) */}
            <div className="pt-2 sm:pt-3 flex justify-center">
              <div className="p-1 rounded-full bg-white/5 border border-white/10 flex items-center">
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3.5 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                    timeframe === 'month'
                      ? 'bg-[#D4A853] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="hidden sm:inline">Ver Impacto </span>Mensual (30 Días)
                </button>
                <button
                  onClick={() => setTimeframe('day')}
                  className={`px-3.5 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                    timeframe === 'day'
                      ? 'bg-[#D4A853] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="hidden sm:inline">Ver Impacto </span>Diario
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch">
            
            {/* Sliders Input (Left, 5 cols) */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6 bg-transparent sm:bg-white/5 p-0 sm:p-6 rounded-xl sm:rounded-2xl border-0 sm:border sm:border-white/10 flex flex-col justify-between">
              
              <div className="space-y-3.5 sm:space-y-6">
                {/* Slider 1: Pedidos diarios */}
                <div className="space-y-2 p-3 sm:p-0 rounded-xl bg-white/[0.03] sm:bg-transparent border border-white/5 sm:border-0">
                  <div className="flex justify-between items-center text-xs font-semibold gap-2">
                    <span className="text-gray-300">1. Pedidos / Mesas al día:</span>
                    <span className="text-sm sm:text-base font-black text-white tabular-nums px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/10 shrink-0">
                      {dailyOrders} pedidos/día
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="150" 
                    step="5"
                    value={dailyOrders} 
                    onChange={(e) => setDailyOrders(Number(e.target.value))}
                    className="w-full accent-[#D4A853] bg-white/10 h-2.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>10 (Café/Pequeño)</span>
                    <span>40 (Promedio)</span>
                    <span>150 (Alto flujo)</span>
                  </div>
                </div>

                {/* Slider 2: Ticket promedio actual */}
                <div className="space-y-2 p-3 sm:p-0 rounded-xl bg-white/[0.03] sm:bg-transparent border border-white/5 sm:border-0">
                  <div className="flex justify-between items-center text-xs font-semibold gap-2">
                    <span className="text-gray-300">2. Consumo por mesa (Plato base):</span>
                    <span className="text-sm sm:text-base font-black text-[#D4A853] tabular-nums px-2.5 py-0.5 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/30 shrink-0">
                      {formatCOP(ticketBase)}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="12000" 
                    max="60000" 
                    step="1000"
                    value={ticketBase} 
                    onChange={(e) => setTicketBase(Number(e.target.value))}
                    className="w-full accent-[#D4A853] bg-white/10 h-2.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>$12.000</span>
                    <span>$30.000</span>
                    <span>$60.000</span>
                  </div>
                </div>

                {/* Explicación Visual del Ticket: Plato + Bebida/Postre (Flujo Dinámico Plano) */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#D4A853]/10 via-[#D4A853]/5 to-transparent border border-[#D4A853]/20 space-y-2.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-[#D4A853] flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" /> ¿Por qué sube a {formatCOP(math.ticketOptimized)} por mesa?
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 shrink-0">Precios fijos</span>
                  </div>
                  
                  {/* Flujo horizontal conectado sin cajas apretadas */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-center">
                    <div className="flex-1">
                      <span className="text-[9px] text-gray-400 block truncate font-medium">Plato Base</span>
                      <span className="font-bold text-white text-xs sm:text-sm tabular-nums">{formatCOP(ticketBase)}</span>
                    </div>
                    <span className="text-gray-500 font-bold text-xs shrink-0">+</span>
                    <div className="flex-1">
                      <span className="text-[9px] text-emerald-400 block truncate font-medium">Antojo Foto</span>
                      <span className="font-bold text-emerald-400 text-xs sm:text-sm tabular-nums">+{formatCOP(math.ticketDiff)}</span>
                    </div>
                    <span className="text-gray-500 font-bold text-xs shrink-0">=</span>
                    <div className="flex-1 bg-[#D4A853]/15 py-1 px-1.5 rounded-lg border border-[#D4A853]/30">
                      <span className="text-[9px] text-[#D4A853] block truncate font-black">Total Mesa</span>
                      <span className="font-black text-[#D4A853] text-xs sm:text-sm tabular-nums">{formatCOP(math.ticketOptimized)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-gray-300 font-light leading-snug">
                    El plato sigue costando lo mismo. La diferencia es que al ver la <strong>foto real</strong>, el comensal añade la <strong>limonada, el café especial o el postre</strong> en lugar de pedir solo el almuerzo.
                  </p>
                </div>
              </div>

              {/* Justificación de Palancas */}
              <div className="p-3 sm:p-4 rounded-xl bg-black/40 sm:bg-black/60 border border-white/10 text-xs space-y-2 mt-2 sm:mt-0">
                <p className="text-white font-bold flex items-center gap-1.5 text-xs text-[#D4A853]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" /> Las 2 Palancas del Incremento:
                </p>
                <div className="space-y-1.5 text-[11px] text-gray-300">
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">• Venta Cruzada (+25%):</span>
                    <span>1 de cada 2 clientes añade bebida o adición provocada por foto (+{formatCOP(math.ticketDiff)}/mesa).</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">• Rotación (+15%):</span>
                    <span>Pedir por QR ahorra 20 min de espera, atendiendo <strong>{math.ordersOptimized} pedidos/día</strong> (+{math.ordersDiff} mesas más).</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Results Breakdown & Big Numbers (Right, 7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5 sm:space-y-4">
              
              {/* Grand Total Hero Box */}
              <div className="rounded-xl sm:rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-black/60 p-4 sm:p-6 lg:p-7 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <TrendingUp className="w-32 h-32 sm:w-40 sm:h-40 text-emerald-400" />
                </div>
                
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Facturación Adicional ({timeframe === 'month' ? 'Al Mes' : 'Por Día'})
                  </span>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold uppercase whitespace-nowrap">
                    Ganancia Extra Neta
                  </span>
                </div>

                <p className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight tabular-nums my-1">
                  +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                </p>

                <p className="text-[11px] sm:text-xs text-emerald-300 font-medium">
                  {timeframe === 'month' ? (
                    <>Equivale a <strong>+{formatCOP(math.extraDaily)}</strong> extras en la caja todos los días.</>
                  ) : (
                    <>Multiplicado por 30 días genera <strong>+{formatCOP(math.extraMonthly)}</strong> de facturación extra al mes.</>
                  )}
                </p>
              </div>

              {/* ⏱️ CARD DE RETORNO DE INVERSIÓN (PAYBACK EN DÍAS) */}
              {(() => {
                const setupCost = 150000; // Plan Despegue Llave en Mano ($150k)
                const paybackDays = Math.max(1, Math.ceil(setupCost / Math.max(1, math.extraDaily)));
                const remainingProfitableDays = Math.max(0, 30 - paybackDays);
                const paybackPercent = Math.min(100, Math.max(8, Math.round((paybackDays / 30) * 100)));
                return (
                  <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#D4A853]/15 via-black/60 to-black/60 border border-[#D4A853]/40 p-4 sm:p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#D4A853] shrink-0" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D4A853]">
                          Tiempo de Retorno de Inversión (Payback)
                        </span>
                      </div>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#D4A853]/20 text-[#D4A853] text-[9px] sm:text-[10px] font-black uppercase border border-[#D4A853]/30 whitespace-nowrap">
                        Cero Riesgo
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 sm:gap-3 my-1">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                        ¡Recuperas la inversión en <span className="text-[#D4A853] underline decoration-[#D4A853]/40 underline-offset-4">{paybackDays} {paybackDays === 1 ? 'día' : 'días'}</span>!
                      </p>
                    </div>

                    {/* Progress Bar of Payback */}
                    <div className="my-2.5 space-y-1">
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-[#D4A853] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${paybackPercent}%` }}
                        />
                        <div 
                          className="bg-emerald-500 h-full flex-1 opacity-70"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                        <span className="text-[#D4A853] font-bold">Día 1 a {paybackDays}: Pagas el montaje ($150k)</span>
                        <span className="text-emerald-400 font-bold">{remainingProfitableDays} días: 100% ganancia libre</span>
                      </div>
                    </div>

                    <p className="text-[11px] sm:text-xs text-gray-300 font-light leading-relaxed mt-1">
                      El montaje y fotos del <strong>Plan Despegue ({formatCOP(setupCost)} COP)</strong> se paga solo con la ganancia extra de tus primeros <strong>{paybackDays} {paybackDays === 1 ? 'día' : 'días'}</strong> (+{formatCOP(math.extraDaily)}/día). Los restantes <strong>{remainingProfitableDays} días</strong> del mes son utilidad neta directa en tu bolsillo.
                    </p>
                  </div>
                );
              })()}

              {/* Step-by-Step Transparent Breakdown Table */}
              <div className="rounded-xl sm:rounded-2xl bg-black/50 border border-white/10 p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10 pb-2">
                  Desglose Paso a Paso ({timeframe === 'month' ? 'Consolidado 30 días' : 'Operación Diaria'}):
                </p>

                {/* Mobile View (< sm): Executive Statement Rows (Full Width, ZERO overlap!) */}
                <div className="sm:hidden space-y-2 py-1">
                  {/* Row 1: Venta Actual */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">1. Venta Actual</span>
                      <span className="text-[10px] text-gray-500 font-mono block">
                        {dailyOrders} pedidos × {formatCOP(ticketBase)}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-gray-300 tabular-nums block">
                        {timeframe === 'month' ? formatCOP(math.monthlyBase) : formatCOP(math.dailyBase)}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase">{timeframe === 'month' ? 'COP / Mes' : 'COP / Día'}</span>
                    </div>
                  </div>

                  {/* Row 2: Con Aluna + Fotos */}
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-[#D4A853]/20 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#D4A853] block">2. Con Aluna + Fotos</span>
                      <span className="text-[10px] text-emerald-400/90 font-mono block">
                        {math.ordersOptimized} pedidos × {formatCOP(math.ticketOptimized)}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-white tabular-nums block">
                        {timeframe === 'month' ? formatCOP(math.monthlyOptimized) : formatCOP(math.dailyOptimized)}
                      </span>
                      <span className="text-[9px] text-[#D4A853] uppercase">{timeframe === 'month' ? 'COP / Mes' : 'COP / Día'}</span>
                    </div>
                  </div>

                  {/* Row 3: Dinero Extra en Caja (Destacado) */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                    <div>
                      <span className="text-[10px] uppercase font-black text-emerald-400 block flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> 3. Dinero Extra en Caja
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">Diferencia directa a favor</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-400 tabular-nums block">
                        +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                      </span>
                      <span className="text-[9px] text-emerald-400 uppercase font-bold">{timeframe === 'month' ? 'COP / Mes' : 'COP / Día'}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop View (>= sm): Classic 3-column layout */}
                <div className="hidden sm:grid sm:grid-cols-3 gap-3 text-xs text-gray-300 py-1 divide-x divide-white/10">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">1. Venta Actual</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {dailyOrders} ped. × {formatCOP(ticketBase)}
                    </p>
                    <p className="text-base font-bold text-gray-300 tabular-nums mt-1">
                      {timeframe === 'month' ? formatCOP(math.monthlyBase) : formatCOP(math.dailyBase)}
                    </p>
                  </div>

                  <div className="pl-3">
                    <span className="text-[10px] uppercase font-bold text-[#D4A853] block">2. Con Aluna + Fotos</span>
                    <p className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                      {math.ordersOptimized} ped. × {formatCOP(math.ticketOptimized)}
                    </p>
                    <p className="text-base font-bold text-white tabular-nums mt-1">
                      {timeframe === 'month' ? formatCOP(math.monthlyOptimized) : formatCOP(math.dailyOptimized)}
                    </p>
                  </div>

                  <div className="pl-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">3. Dinero Extra</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Diferencia directa a favor</p>
                    <p className="text-lg font-black text-emerald-400 tabular-nums mt-1">
                      +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                    </p>
                  </div>
                </div>

                {/* Formula Text Box with Compact Badges */}
                <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[10px] sm:text-[11px] text-gray-300 bg-white/5 p-2 sm:p-2.5 rounded-lg break-words">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="text-gray-400 font-sans text-[10px] uppercase font-bold">Fórmula:</span>
                    {timeframe === 'month' ? (
                      <>
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-emerald-300">({math.ordersOptimized} ped × {formatCOP(math.ticketOptimized)} × 30d)</span>
                        <span className="text-gray-500 font-bold">-</span>
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-gray-400">({dailyOrders} ped × {formatCOP(ticketBase)} × 30d)</span>
                        <span className="text-gray-500 font-bold">=</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black">+{formatCOP(math.extraMonthly)} COP</span>
                      </>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-emerald-300">({math.ordersOptimized} ped × {formatCOP(math.ticketOptimized)})</span>
                        <span className="text-gray-500 font-bold">-</span>
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-gray-400">({dailyOrders} ped × {formatCOP(ticketBase)})</span>
                        <span className="text-gray-500 font-bold">=</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black">+{formatCOP(math.extraDaily)} COP</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 💼 THE COMMERCIAL PACKAGES PROPOSAL (Alianza Estratégica Uxio Creativo × Aluna POS) */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alianza Estratégica: Uxio Creativo × Aluna POS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Elige cómo transformar tu restaurante
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-2.5 font-light leading-relaxed max-w-2xl mx-auto">
            <strong>Uxio Creativo</strong> produce los videos Reels y fotos gastronómicas que despiertan antojo en redes. <strong>Aluna</strong> pone la plataforma tecnológica para cerrar los pedidos en la mesa y a domicilio con cero comisiones.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 max-w-7xl mx-auto items-stretch">
          
          {/* Plan 1: Despegue Llave en Mano ($150k + $35k/mes) */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/15 p-5 sm:p-7 relative flex flex-col justify-between hover:border-white/30 transition-all duration-300 group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Entrada Ágil</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase">
                  El Más Accesible
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Despegue Llave en Mano
              </h3>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed font-light">
                Todo lo necesario para salir del papel o PDF y tener tu menú con fotos reales operando esta misma semana sin fricción.
              </p>

              <div className="my-4 sm:my-5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">$150.000</span>
                  <span className="text-xs text-gray-400 font-medium">COP (Setup & Fotos único)</span>
                </div>
                <p className="text-[11px] text-[#D4A853] font-medium">+ $35.000 COP/mes (desde el mes 2)</p>
                <div className="pt-1">
                  <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🎁 Mes 1 de Aluna 100% Gratis
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-gray-300 font-light">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sesión Fotográfica Flash:</strong> Hasta 10 platos y bebidas estrella con iluminación y retoque profesional.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Montaje Completo del Menú:</strong> Nosotros subimos platos, ingredientes, precios y alérgenos en Aluna.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Optimización de Ficha de Google Maps:</strong> Portada gastronómica, enlace directo al menú y horario.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Diseño de Códigos QR:</strong> Plantillas elegantes listas para imprimir en mesas y barra.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Plataforma Aluna Incluida:</strong> Pedidos en mesa, WhatsApp directo y panel administrador móvil.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 sm:pt-7">
              <a 
                href="https://wa.me/?text=Hola%20quiero%20el%20Plan%20Despegue%20Llave%20en%20Mano%20($150k)"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-full text-xs uppercase tracking-wider transition border border-white/20"
              >
                Elegir Plan Despegue ($150k)
              </a>
            </div>
          </div>

          {/* Plan 2: Crecimiento & Contenido ($790k/mes) */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1C1810] via-[#121216] to-[#121216] border-2 border-[#D4A853] p-5 sm:p-7 relative flex flex-col justify-between shadow-[0_0_50px_rgba(212,168,83,0.18)] group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A853]">Alianza Creativa</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4A853] text-black text-[9px] font-black uppercase">
                  Más Vendido
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Crecimiento & Contenido
              </h3>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed font-light">
                Para restaurantes que quieren que un creador de contenido les traiga clientes desde redes y cierre la venta en la mesa.
              </p>

              <div className="my-4 sm:my-5 p-3.5 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#D4A853]">$790.000</span>
                  <span className="text-xs text-gray-300 font-medium">COP / mes</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">Todo incluido • Cero cobro de montaje</p>
                <div className="pt-1">
                  <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30">
                    ✨ Contenido Uxio + Plataforma Aluna Pro
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-gray-300 font-light">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Todo lo del Plan Despegue</strong> (Fotos iniciales, Google Maps, Menú montado y QRs).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>2 Videos Reels / TikTok al mes:</strong> Producción en video en tu local con foco en textura, preparación y antojo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Fotografía de Novedades mensual:</strong> Sesión para platos nuevos, adiciones o combos especiales.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Actualizaciones Continuas de Carta:</strong> Añade platos de temporada o cambia precios sin preocuparte.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Aluna Pro Incluida ($0 extra):</strong> Pantalla KDS cocina, domicilios propios y reseñas 5★.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 sm:pt-7">
              <a 
                href="https://wa.me/?text=Hola%20quiero%20conocer%20el%20Plan%20Crecimiento%20y%20Contenido%20($790k)"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center bg-[#D4A853] hover:brightness-110 text-black font-bold py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg shadow-[#D4A853]/20"
              >
                Elegir Crecimiento & Contenido
              </a>
            </div>
          </div>

          {/* Plan 3: Dominio Gastronómico VIP ($1.490.000/mes) */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/20 p-5 sm:p-7 relative flex flex-col justify-between hover:border-[#D4A853]/40 transition-all duration-300 group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Partner VIP</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase">
                  Cupos Limitados
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Dominio Gastronómico VIP
              </h3>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed font-light">
                Para marcas consolidadas o gastrobares que quieren liderar su zona con presencia audiovisual continua de alto impacto.
              </p>

              <div className="my-4 sm:my-5 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">$1.490.000</span>
                  <span className="text-xs text-gray-300 font-medium">COP / mes</span>
                </div>
                <p className="text-[11px] text-purple-300 font-medium">Servicio integral llave en mano</p>
                <div className="pt-1">
                  <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40">
                    👑 1 Video Semanal + Dirección Visual
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-gray-300 font-light">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>4 Videos Reels / TikTok al mes:</strong> 1 video profesional cada semana estructurado para viralidad local (1 sola jornada de rodaje mensual).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Fotografía Gastronómica Continua:</strong> Cobertura de toda tu carta, coctelería y platos de temporada.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Estrategia Activa Google Maps #1:</strong> Campaña para liderar búsquedas locales con reseñas 5★.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Aluna Premium Multisede:</strong> Pedidos ilimitados, panel para meseros y analítica avanzada.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Soporte VIP Directo por WhatsApp:</strong> Atención prioritaria para cambios urgentes de carta en minutos.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 sm:pt-7">
              <a 
                href="https://wa.me/?text=Hola%20quiero%20el%20Plan%20Dominio%20Gastron%C3%B3mico%20VIP%20($1.49M)"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-full text-xs uppercase tracking-wider transition border border-white/20"
              >
                Elegir Dominio VIP
              </a>
            </div>
          </div>

        </div>

        {/* Banner para clientes que solo buscan software */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">¿Solo buscas el Software?</span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono">Modo Autoservicio</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-light">
              Si ya tienes tus propias fotografías profesionales y creador de contenido, contrata solo la plataforma <strong>Aluna SaaS desde $35.000 COP / mes</strong>.
            </p>
          </div>
          <a
            href="https://wa.me/?text=Hola%20quiero%20contratar%20unicamente%20la%20plataforma%20Aluna%20SaaS"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider transition border border-white/15"
          >
            Ver Planes Solo Software
          </a>
        </div>
      </section>

      {/* Comparison Matrix Table */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Tabla Comparativa de Canales Gastronómicos
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-light">
              Por qué entregar una solución "llave en mano" con fotos reales supera a cualquier alternativa del mercado.
            </p>
          </div>

          {/* Mobile Comparison Switcher */}
          <div className="p-3 sm:hidden border-b border-white/10 bg-white/[0.02]">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 text-center tracking-wider">
              Comparar Aluna Fotos Reales contra:
            </p>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
              <button
                type="button"
                onClick={() => setMobileTableTab('pdf')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  mobileTableTab === 'pdf'
                    ? 'bg-white/20 text-white shadow-sm border border-white/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>📄 vs Carta PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTableTab('boku')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  mobileTableTab === 'boku'
                    ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>🤖 vs Menú IA</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full sm:min-w-[640px] text-left text-xs text-gray-300">
              <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-gray-400">
                <tr>
                  <th className="p-3 sm:p-4 w-[36%] sm:w-auto">Característica</th>
                  <th className={`p-3 sm:p-4 text-gray-400 w-[32%] sm:w-auto ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    Carta Física / PDF
                  </th>
                  <th className={`p-3 sm:p-4 transition-all w-[32%] sm:w-auto ${
                    mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'
                  } ${
                    activeView === 'boku' 
                      ? 'bg-amber-500/20 text-amber-300 font-black border-t-2 border-amber-500 shadow-inner' 
                      : 'text-amber-300/80'
                  }`}>
                    Menú IA (BOKU)
                  </th>
                  <th className={`p-3 sm:p-4 transition-all w-[32%] sm:w-auto ${
                    activeView === 'alto-andino'
                      ? 'bg-emerald-500/25 text-emerald-300 font-black border-t-2 border-emerald-400 shadow-inner'
                      : 'text-emerald-400 bg-emerald-500/10 font-black'
                  }`}>
                    Aluna + Fotos Reales
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-white">Fotografía de cada plato</td>
                  <td className={`p-3 sm:p-4 text-red-400 ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    <span className="sm:hidden">❌ Ninguna o stock</span>
                    <span className="hidden sm:inline">❌ Ninguna o de stock genérico</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'} ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200 font-bold' : 'text-amber-300'}`}>
                    <span className="sm:hidden">⚠️ Artificial (IA)</span>
                    <span className="hidden sm:inline">⚠️ Artificial / Puede diferir</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-black' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>
                    <span className="sm:hidden">✅ 100% Real</span>
                    <span className="hidden sm:inline">✅ 100% Real, plato por plato</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-white">Tiempo de Carga en Móvil</td>
                  <td className={`p-3 sm:p-4 text-red-400 ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    <span className="sm:hidden">Lento (PDF 20MB)</span>
                    <span className="hidden sm:inline">Lento (PDF de 20MB)</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'} ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-emerald-400'}`}>
                    Rápido (&lt; 1.5s)
                  </td>
                  <td className={`p-3 sm:p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>
                    <span className="sm:hidden">⚡ Instantáneo</span>
                    <span className="hidden sm:inline">Instantáneo (Caché local PWA)</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-white">Editar Precios / Platos Agotados</td>
                  <td className={`p-3 sm:p-4 text-red-400 ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    <span className="sm:hidden">Reimprimir / rehacer</span>
                    <span className="hidden sm:inline">Reimprimir o rehacer PDF</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'} ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-emerald-400'}`}>
                    Panel en tiempo real
                  </td>
                  <td className={`p-3 sm:p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>
                    <span className="sm:hidden">Panel desde celular</span>
                    <span className="hidden sm:inline">Panel Admin desde tu celular</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-white">Comisión por Venta</td>
                  <td className={`p-3 sm:p-4 text-gray-400 ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    <span className="sm:hidden">0% manual</span>
                    <span className="hidden sm:inline">0% pero sin automatización</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'} ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-emerald-400'}`}>
                    0%
                  </td>
                  <td className={`p-3 sm:p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>
                    <span className="sm:hidden">0% directa</span>
                    <span className="hidden sm:inline">0% (Venta 100% directa)</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-white">Conexión con Google Maps</td>
                  <td className={`p-3 sm:p-4 text-red-400 ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    ❌ Desconectado
                  </td>
                  <td className={`p-3 sm:p-4 ${mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'} ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-gray-400'}`}>
                    Enlace básico
                  </td>
                  <td className={`p-3 sm:p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>
                    <span className="sm:hidden">✅ Reseñas 5★</span>
                    <span className="hidden sm:inline">✅ Integración directa para reseñas 5★</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-white">Montaje y Configuración</td>
                  <td className={`p-3 sm:p-4 text-red-400 ${mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'}`}>
                    <span className="sm:hidden">Tedioso (Dueño)</span>
                    <span className="hidden sm:inline">Tedioso por cuenta del dueño</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'} ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-amber-300'}`}>
                    <span className="sm:hidden">Requiere prompts</span>
                    <span className="hidden sm:inline">Requiere diseño de prompts</span>
                  </td>
                  <td className={`p-3 sm:p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>
                    <span className="sm:hidden">✨ Llave en mano</span>
                    <span className="hidden sm:inline">✨ Llave en mano (Te lo dejamos listo)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Floating CTA for pitch */}
      <footer className="border-t border-white/10 bg-[#0F0F12] py-8 text-center px-3.5 sm:px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs sm:text-sm text-gray-400">
            ¿Listo para ver cómo se siente en un teléfono real?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto">
            <button 
              type="button"
              onClick={handleGoBack}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-5 sm:px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition border border-white/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4A853]" />
              <span>Regresar Atrás</span>
            </button>
            <Link 
              to="/alto-andino?demo=1#menu"
              className="w-full sm:w-auto bg-[#D4A853] text-black px-6 sm:px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-110 transition shadow-xl shadow-[#D4A853]/20 flex items-center justify-center gap-2"
            >
              <span>Abrir Demo Alto Andino</span> <ExternalLink className="w-4 h-4" />
            </Link>
            <Link 
              to="/"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-6 sm:px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center justify-center border border-white/5"
            >
              Ir al Inicio
            </Link>
          </div>
          <p className="text-[10px] sm:text-[11px] text-gray-500 pt-2 sm:pt-4">
            Aluna POS Gastronómico • Diseñado para ventas directas sin intermediarios.
          </p>
        </div>
      </footer>
    </div>
  );
}
