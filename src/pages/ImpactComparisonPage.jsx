import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Camera,
  Bot,
  Zap,
  ChevronRight,
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
  // Mode: 'split' | 'alto-andino' | 'boku'
  const [activeView, setActiveView] = useState('split');
  
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Aluna <span className="text-xs uppercase tracking-widest text-[#D4A853] font-sans px-2.5 py-0.5 rounded-full border border-[#D4A853]/30 bg-[#D4A853]/10 font-bold">Impact Lab</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/alto-andino?demo=1#menu"
              className="text-xs uppercase tracking-wider font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#D4A853]" />
              Ver Demo Real
            </Link>
            <Link 
              to="/"
              className="text-xs uppercase tracking-wider font-bold bg-[#D4A853] text-black px-4 py-2 rounded-full hover:brightness-110 transition shadow-lg shadow-[#D4A853]/20"
            >
              Volver a Aluna
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient Glows */}
        <div className={`absolute top-10 left-1/4 w-96 h-96 blur-[130px] rounded-full pointer-events-none transition-all duration-700 ${
          activeView === 'boku' ? 'bg-amber-500/20' : 'bg-[#2D6A4F]/25'
        }`} />
        <div className={`absolute top-20 right-1/4 w-96 h-96 blur-[140px] rounded-full pointer-events-none transition-all duration-700 ${
          activeView === 'boku' ? 'bg-amber-600/15' : 'bg-[#D4A853]/20'
        }`} />

        <div className="text-center max-w-3xl mx-auto space-y-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeView + '-badge'}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border ${
                activeView === 'boku'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : activeView === 'alto-andino'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-[#D4A853]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 
              {activeView === 'boku' && 'Diagnóstico: Modelo Menú con IA (BOKU)'}
              {activeView === 'alto-andino' && 'Solución de Alto Rendimiento: Fotos Reales + Aluna'}
              {activeView === 'split' && 'Caso de Estudio & Simulador Comercial'}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h1 
              key={activeView + '-title'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight" 
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {activeView === 'boku' && (
                <>
                  La Fricción Oculta de <br />
                  <span className="text-amber-400 italic">No Tener Fotos Reales</span>
                </>
              )}
              {activeView === 'alto-andino' && (
                <>
                  El Ecosistema que Provoca <br />
                  <span className="text-emerald-400 italic">Antojo y Cero Comisiones</span>
                </>
              )}
              {activeView === 'split' && (
                <>
                  El Impacto Real de la <br />
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
              className="text-base sm:text-lg text-gray-300 font-light leading-relaxed max-w-2xl mx-auto"
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

          {/* View Switcher Pills */}
          <div className="pt-6 flex justify-center">
            <div className="p-1.5 rounded-full bg-white/5 border border-white/15 flex flex-wrap items-center justify-center gap-1.5 shadow-2xl backdrop-blur-lg">
              <button
                onClick={() => setActiveView('split')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'split' 
                    ? 'bg-[#D4A853] text-black shadow-lg shadow-[#D4A853]/30 scale-105 font-black' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Comparación Cara a Cara
              </button>
              <button
                onClick={() => setActiveView('boku')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'boku' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 scale-105 font-black ring-2 ring-amber-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> Solo Modelo IA (BOKU)
              </button>
              <button
                onClick={() => setActiveView('alto-andino')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'alto-andino' 
                    ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/40 scale-105 font-black ring-2 ring-emerald-300' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Solo Modelo Real (Alto Andino)
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
                className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left max-w-2xl mx-auto flex items-center justify-between gap-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Vista Activa: Diagnóstico Menú IA / Sin Fotos Reales (BOKU)
                    </p>
                    <p className="text-[11px] text-gray-300">
                      Viendo métricas de restaurante con carta artificial. El comensal duda de la porción y el 48% abandona sin pedir bebidas ni postres.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('alto-andino')}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black uppercase tracking-wider transition"
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
                className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left max-w-2xl mx-auto flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      Vista Activa: Modelo Fotografía Real + Aluna (Alto Andino)
                    </p>
                    <p className="text-[11px] text-gray-300">
                      Viendo métricas de alto rendimiento: +145% en conversión, $36.200 por mesa y reseñas 5 estrellas automáticas en Google Maps.
                    </p>
                  </div>
                </div>
                <Link
                  to="/alto-andino?demo=1#menu"
                  className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1"
                >
                  Probar Demo →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Main KPI Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {KPIS.map((kpi) => {
            if (activeView === 'boku') {
              return (
                <div 
                  key={kpi.id} 
                  className="rounded-3xl bg-[#181510] border border-amber-500/40 p-6 relative overflow-hidden shadow-lg shadow-amber-500/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">{kpi.title}</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                      {kpi.boku.badge}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-4xl font-black text-amber-400 tracking-tight">{kpi.boku.value}</p>
                    <p className="text-[11px] font-medium text-amber-300/70 flex items-center gap-1.5 mt-1">
                      <Bot className="w-3.5 h-3.5 text-amber-400" /> {kpi.boku.label}
                    </p>
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
                  className="rounded-3xl bg-[#0E1A14] border border-emerald-500/40 p-6 relative overflow-hidden shadow-lg shadow-emerald-500/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">{kpi.title}</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                      {kpi.alto.badge}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-4xl font-black text-emerald-400 tracking-tight">{kpi.alto.value}</p>
                    <p className="text-[11px] font-medium text-emerald-300/70 flex items-center gap-1.5 mt-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" /> {kpi.alto.label}
                    </p>
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
                className="rounded-3xl bg-[#121216] border border-white/10 p-6 relative overflow-hidden group hover:border-[#D4A853]/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{kpi.title}</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                    {kpi.alto.badge}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-4 mb-3">
                  <div>
                    <p className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">{kpi.alto.value}</p>
                    <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                      <Camera className="w-3 h-3 text-emerald-400" /> {kpi.alto.label}
                    </p>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-2xl font-black text-gray-500 line-through">{kpi.boku.value}</p>
                    <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                      <Bot className="w-3 h-3 text-gray-500" /> {kpi.boku.label}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  {kpi.splitDesc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Visual Product Comparison Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className={`rounded-3xl p-6 sm:p-10 relative overflow-hidden transition-all duration-300 border ${
          activeView === 'boku'
            ? 'bg-[#15120E] border-amber-500/30 shadow-2xl'
            : activeView === 'alto-andino'
            ? 'bg-[#0B1510] border-emerald-500/30 shadow-2xl'
            : 'bg-[#121216] border-white/10'
        }`}>
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
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
                className="space-y-8"
              >
                {/* Boku Cards Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-amber-500/30 bg-black/40 p-5 relative">
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-white/10 relative">
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

                  <div className="rounded-2xl border border-amber-500/30 bg-black/40 p-5 relative">
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-white/10 relative">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4" /> La Trampa de la Expectativa
                    </div>
                    <p className="text-[11px] text-gray-300">
                      La IA añade ingredientes o proporciones imposibles de replicar con exactitud en cada servicio, aumentando el riesgo de reclamos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4" /> Ticket Bajo ($21.500)
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Al no ver limonadas, cócteles ni postres reales, el comensal se abstiene de pedir adiciones y consume solo el plato básico.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4" /> Cero Antojo Emocional
                    </div>
                    <p className="text-[11px] text-gray-300">
                      La comida entra por los ojos: el vapor real, la salsa derretida y el brillo auténtico son insustituibles para provocar hambre.
                    </p>
                  </div>
                </div>

                {/* Bridge CTA */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-black to-emerald-500/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    className="px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-400/20"
                  >
                    Ver Modelo Alto Andino <ArrowRight className="w-3.5 h-3.5" />
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
                className="space-y-8"
              >
                {/* Alto Andino Real Food Showcase Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4 relative shadow-lg shadow-emerald-500/5">
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-white/10 relative">
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

                  <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4 relative shadow-lg shadow-emerald-500/5">
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-white/10 relative">
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

                  <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4 relative shadow-lg shadow-emerald-500/5">
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-white/10 relative">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Reseñas 5★ en Google Maps
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Al recibir exactamente lo prometido, los comensales toman fotos reales y dejan calificaciones perfectas en tu ficha de negocio.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Ticket de $36.200 por Mesa
                    </div>
                    <p className="text-[11px] text-gray-300">
                      1 de cada 2 mesas suma entradas, bebidas de autor o postres atraídas por las fotos en alta definición.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4" /> 0% Comisiones a Terceros
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Tus clientes escanean el QR en mesa o piden por tu enlace directo: todo el dinero ingresa completo a tu caja registradora.
                    </p>
                  </div>
                </div>

                {/* Live Demo CTA */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-black to-[#D4A853]/20 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
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
                    className="px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-400/20"
                  >
                    Abrir Carta Alto Andino <ExternalLink className="w-3.5 h-3.5" />
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
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                {/* Lado Boku (IA) */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Menú IA / Prototipo (BOKU)</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      Ideal para prototipar
                    </span>
                  </div>

                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 border border-white/10 relative bg-black/40">
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

                {/* Lado Alto Andino (Real) */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 relative shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Producción Real (Alto Andino)</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Máxima Venta
                    </span>
                  </div>

                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 border border-white/10 relative bg-black/40">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 🔥 THE TRANSPARENT ROI CALCULATOR SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#131418] via-[#0F1012] to-[#16181D] border border-[#D4A853]/40 p-6 sm:p-12 relative overflow-hidden shadow-2xl">
          
          {/* Header & Toggle */}
          <div className="max-w-3xl mx-auto text-center mb-10 space-y-3">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
              activeView === 'boku'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : activeView === 'alto-andino'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-[#D4A853]/15 text-[#D4A853]'
            }`}>
              <Calculator className="w-3.5 h-3.5" /> 
              {activeView === 'boku' && 'Diagnóstico Financiero: Brecha de Pérdida'}
              {activeView === 'alto-andino' && 'Proyección Financiera: Ganancia Proyectada Aluna'}
              {activeView === 'split' && 'Simulador Financiero en Vivo'}
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
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
            <div className="pt-3 flex justify-center">
              <div className="p-1 rounded-full bg-white/5 border border-white/10 flex items-center">
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    timeframe === 'month'
                      ? 'bg-[#D4A853] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Ver Impacto Mensual (30 Días)
                </button>
                <button
                  onClick={() => setTimeframe('day')}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    timeframe === 'day'
                      ? 'bg-[#D4A853] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Ver Impacto Diario
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Sliders Input (Left, 5 cols) */}
            <div className="lg:col-span-5 space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
              
              <div className="space-y-6">
                {/* Slider 1: Pedidos diarios */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-300">1. Pedidos / Mesas atendidas al día:</span>
                    <span className="text-base font-black text-white tabular-nums px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/10">
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
                    className="w-full accent-[#D4A853] bg-white/10 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>10 (Café/Pequeño)</span>
                    <span>40 (Promedio)</span>
                    <span>150 (Alto flujo)</span>
                  </div>
                </div>

                {/* Slider 2: Ticket promedio actual */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-300">2. Consumo actual por mesa (Solo plato principal):</span>
                    <span className="text-base font-black text-[#D4A853] tabular-nums px-2.5 py-0.5 rounded-lg bg-[#D4A853]/10 border border-[#D4A853]/30">
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
                    className="w-full accent-[#D4A853] bg-white/10 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>$12.000</span>
                    <span>$30.000</span>
                    <span>$60.000</span>
                  </div>
                </div>

                {/* Explicación Visual del Ticket: Plato + Bebida/Postre */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#D4A853]/10 to-transparent border border-[#D4A853]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#D4A853] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> ¿Por qué sube a {formatCOP(math.ticketOptimized)} por mesa?
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Tus precios NO suben</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[10px] text-gray-400 block">Tu plato base</span>
                      <span className="font-bold text-white">{formatCOP(ticketBase)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block">+ Antojo foto</span>
                      <span className="font-bold text-emerald-400">+{formatCOP(math.ticketDiff)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/30">
                      <span className="text-[10px] text-[#D4A853] block">= Total mesa</span>
                      <span className="font-black text-[#D4A853]">{formatCOP(math.ticketOptimized)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 font-light leading-snug pt-1">
                    El plato sigue costando lo mismo. La diferencia es que al ver la <strong>foto real</strong>, el comensal añade la <strong>limonada, el café especial o el postre</strong> en lugar de pedir solo el almuerzo.
                  </p>
                </div>
              </div>

              {/* Justificación de Palancas */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs space-y-2.5">
                <p className="text-white font-bold flex items-center gap-1.5 text-xs text-[#D4A853]">
                  <Sparkles className="w-3.5 h-3.5" /> Las 2 Palancas del Incremento:
                </p>
                <div className="space-y-1.5 text-[11px] text-gray-300">
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">• Palanca Venta Cruzada (+25%):</span>
                    <span>1 de cada 2 clientes añade bebida o adición provocada por foto (+{formatCOP(math.ticketDiff)}/mesa).</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">• Palanca Rotación (+15%):</span>
                    <span>Pedir por QR ahorra 20 min de espera, atendiendo <strong>{math.ordersOptimized} pedidos/día</strong> (+{math.ordersDiff} mesas más).</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Results Breakdown & Big Numbers (Right, 7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              
              {/* Grand Total Hero Box */}
              <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-black/60 p-6 sm:p-7 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <TrendingUp className="w-40 h-40 text-emerald-400" />
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Facturación Adicional Estimada ({timeframe === 'month' ? 'Al Mes' : 'Por Día'})
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                    Ganancia Extra Neta
                  </span>
                </div>

                <p className="text-4xl sm:text-6xl font-black text-white tracking-tight tabular-nums my-1">
                  +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                </p>

                <p className="text-xs text-emerald-300 font-medium">
                  {timeframe === 'month' ? (
                    <>Equivale a <strong>+{formatCOP(math.extraDaily)}</strong> extras en la caja todos los días.</>
                  ) : (
                    <>Multiplicado por 30 días genera <strong>+{formatCOP(math.extraMonthly)}</strong> de facturación extra al mes.</>
                  )}
                </p>
              </div>

              {/* ⏱️ CARD DE RETORNO DE INVERSIÓN (PAYBACK EN DÍAS) */}
              {(() => {
                const setupCost = 450000; // Plan Despegue
                const paybackDays = Math.max(1, Math.ceil(setupCost / Math.max(1, math.extraDaily)));
                const remainingProfitableDays = Math.max(0, 30 - paybackDays);
                return (
                  <div className="rounded-2xl bg-gradient-to-r from-[#D4A853]/15 via-black/60 to-black/60 border border-[#D4A853]/40 p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#D4A853]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4A853]">
                          Tiempo de Retorno de la Inversión (Payback)
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#D4A853]/20 text-[#D4A853] text-[10px] font-black uppercase border border-[#D4A853]/30">
                        Inversión Cero Riesgo
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 my-1">
                      <p className="text-2xl sm:text-3xl font-black text-white">
                        ¡Recuperas tu inversión en solo <span className="text-[#D4A853] underline decoration-[#D4A853]/40 underline-offset-4">{paybackDays} {paybackDays === 1 ? 'día' : 'días'}</span>!
                      </p>
                    </div>

                    <p className="text-xs text-gray-300 font-light leading-relaxed mt-1">
                      El costo de la sesión de fotos y montaje del menú ({formatCOP(setupCost)} COP) se paga solo con la ganancia extra de tus primeros <strong>{paybackDays} {paybackDays === 1 ? 'día' : 'días'}</strong> de operación (+{formatCOP(math.extraDaily)}/día). Los restantes <strong>{remainingProfitableDays} días del mes</strong> son pura utilidad neta en tu bolsillo.
                    </p>
                  </div>
                );
              })()}

              {/* Step-by-Step Transparent Breakdown Table */}
              <div className="rounded-2xl bg-black/50 border border-white/10 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10 pb-2">
                  Desglose Paso a Paso ({timeframe === 'month' ? 'Consolidado 30 días' : 'Operación Diaria'}):
                </p>

                <div className="grid grid-cols-3 gap-3 text-xs text-gray-300 py-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">1. Venta Actual</span>
                    <p className="text-base font-bold text-gray-300 tabular-nums">
                      {timeframe === 'month' ? formatCOP(math.monthlyBase) : formatCOP(math.dailyBase)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {dailyOrders} pedidos × {formatCOP(ticketBase)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D4A853] block">2. Con Aluna + Fotos</span>
                    <p className="text-base font-bold text-white tabular-nums">
                      {timeframe === 'month' ? formatCOP(math.monthlyOptimized) : formatCOP(math.dailyOptimized)}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {math.ordersOptimized} pedidos × {formatCOP(math.ticketOptimized)}
                    </p>
                  </div>

                  <div className="border-l border-white/10 pl-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">3. Dinero Extra</span>
                    <p className="text-base font-black text-emerald-400 tabular-nums">
                      +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Diferencia directa a favor
                    </p>
                  </div>
                </div>

                {/* Formula Text Box */}
                <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[11px] text-gray-300 bg-white/5 p-2.5 rounded-lg">
                  <span className="text-gray-400">Fórmula: </span>
                  {timeframe === 'month' ? (
                    <span>({math.ordersOptimized} pedidos × {formatCOP(math.ticketOptimized)} × 30d) - ({dailyOrders} pedidos × {formatCOP(ticketBase)} × 30d) = <strong>+{formatCOP(math.extraMonthly)} COP</strong></span>
                  ) : (
                    <span>({math.ordersOptimized} pedidos × {formatCOP(math.ticketOptimized)}) - ({dailyOrders} pedidos × {formatCOP(ticketBase)}) = <strong>+{formatCOP(math.extraDaily)} COP</strong></span>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 💼 THE COMMERCIAL PACKAGES PROPOSAL (Para cerrar la venta en la mesa) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4A853] block mb-2">Propuesta Comercial Llave en Mano</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Elige cómo transformar tu restaurante
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 font-light">
            Nosotros nos encargamos de las fotos, la ficha de Google y de subir cada plato a la plataforma. Tú solo recibes los pedidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Plan 1: Despegue Digital */}
          <div className="rounded-3xl bg-[#121216] border border-white/15 p-8 relative flex flex-col justify-between hover:border-[#D4A853]/50 transition-all duration-300 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Plan de Entrada</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase">
                  Recomendado para empezar
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Despegue Digital Llave en Mano
              </h3>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Todo lo necesario para pasar de la carta en papel o PDF a una experiencia gastronómica digital con fotos profesionales.
              </p>

              <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">$450.000</span>
                  <span className="text-xs text-gray-400 font-medium">COP (Setup & Fotos único)</span>
                </div>
                <p className="text-[11px] text-[#D4A853] font-medium">+ $60.000 COP/mes (Plataforma Aluna & Soporte)</p>
              </div>

              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sesión Fotográfica Profesional:</strong> Hasta 20 platos y bebidas estrella con iluminación de estudio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Optimización de Ficha de Google Maps:</strong> Categorías, horario, enlace directo y portada gastronómica.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Montaje Completo del Menú:</strong> Nosotros subimos platos, ingredientes, precios y alérgenos en Aluna.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Diseño de Códigos QR:</strong> Plantillas listas para imprimir en mesas y barra.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Acceso Administrador:</strong> Modifica precios y oculta platos agotados desde tu propio celular.</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a 
                href="https://wa.me/?text=Hola%20quiero%20conocer%20el%20Plan%20Despegue%20Digital%20de%20Aluna"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider transition border border-white/20"
              >
                Elegir Plan Despegue
              </a>
            </div>
          </div>

          {/* Plan 2: Ecosistema & Redes */}
          <div className="rounded-3xl bg-gradient-to-b from-[#181610] via-[#121216] to-[#121216] border border-[#D4A853] p-8 relative flex flex-col justify-between shadow-[0_0_50px_rgba(212,168,83,0.15)] group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4A853]">Alianza Integral</span>
                <span className="px-3 py-1 rounded-full bg-[#D4A853] text-black text-[10px] font-black uppercase">
                  Más Vendido
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Ecosistema Digital & Contenido
              </h3>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Para restaurantes que quieren que un equipo se encargue de atraer comensales por redes y cerrar la venta en la mesa.
              </p>

              <div className="my-6 p-4 rounded-2xl bg-[#D4A853]/10 border border-[#D4A853]/30 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#D4A853]">$850.000</span>
                  <span className="text-xs text-gray-300 font-medium">COP / mes</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">Incluye plataforma Aluna, fotos y redes sociales</p>
              </div>

              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Todo lo del Plan Despegue Digital</strong> (Fotos, Ficha de Google, Menú montado y QRs).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>4 Videos Reels / TikTok al mes:</strong> Producción en video de platos, preparación y ambiente del local.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>8 Publicaciones e Historias mensuales</strong> con diseño y fotografía gastronómica.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Actualizaciones Continuas de Carta:</strong> Añade platos de temporada o cambia precios sin preocuparte.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span><strong>Estrategia de Reseñas 5 Estrellas</strong> para posicionarte #1 en Google Maps en tu zona.</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a 
                href="https://wa.me/?text=Hola%20quiero%20conocer%20el%20Plan%20Ecosistema%20y%20Redes%20de%20Aluna"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center bg-[#D4A853] hover:brightness-110 text-black font-bold py-3.5 rounded-full text-xs uppercase tracking-wider transition shadow-lg shadow-[#D4A853]/20"
              >
                Elegir Ecosistema & Redes
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Comparison Matrix Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Tabla Comparativa de Canales Gastronómicos
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-light">
              Por qué entregar una solución "llave en mano" con fotos reales supera a cualquier alternativa del mercado.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-gray-400">
                <tr>
                  <th className="p-4">Característica</th>
                  <th className="p-4 text-gray-400">Carta Física / PDF WhatsApp</th>
                  <th className={`p-4 transition-all ${
                    activeView === 'boku' 
                      ? 'bg-amber-500/20 text-amber-300 font-black border-t-2 border-amber-500 shadow-inner' 
                      : 'text-amber-300/80'
                  }`}>
                    Menú IA / Prototipo (BOKU)
                  </th>
                  <th className={`p-4 transition-all ${
                    activeView === 'alto-andino'
                      ? 'bg-emerald-500/25 text-emerald-300 font-black border-t-2 border-emerald-400 shadow-inner'
                      : 'text-emerald-400 bg-emerald-500/10 font-black'
                  }`}>
                    Aluna + Fotos Reales (Alto Andino)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 font-bold text-white">Fotografía de cada plato</td>
                  <td className="p-4 text-red-400">❌ Ninguna o de stock genérico</td>
                  <td className={`p-4 ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200 font-bold' : 'text-amber-300'}`}>⚠️ Artificial / Puede diferir</td>
                  <td className={`p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-black' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>✅ 100% Real, plato por plato</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Tiempo de Carga en Móvil</td>
                  <td className="p-4 text-red-400">Lento (PDF de 20MB)</td>
                  <td className={`p-4 ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-emerald-400'}`}>Rápido (&lt; 1.5s)</td>
                  <td className={`p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>Instantáneo (Caché local PWA)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Editar Precios / Platos Agotados</td>
                  <td className="p-4 text-red-400">Reimprimir o rehacer PDF</td>
                  <td className={`p-4 ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-emerald-400'}`}>Panel en tiempo real</td>
                  <td className={`p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>Panel Admin desde tu celular</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Comisión por Venta</td>
                  <td className="p-4 text-gray-400">0% pero sin automatización</td>
                  <td className={`p-4 ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-emerald-400'}`}>0%</td>
                  <td className={`p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>0% (Venta 100% directa)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Conexión con Google Maps</td>
                  <td className="p-4 text-red-400">❌ Desconectado</td>
                  <td className={`p-4 ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-gray-400'}`}>Enlace básico</td>
                  <td className={`p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>✅ Integración directa para reseñas 5★</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Montaje y Configuración</td>
                  <td className="p-4 text-red-400">Tedioso por cuenta del dueño</td>
                  <td className={`p-4 ${activeView === 'boku' ? 'bg-amber-500/10 text-amber-200' : 'text-amber-300'}`}>Requiere diseño de prompts</td>
                  <td className={`p-4 ${activeView === 'alto-andino' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-emerald-500/5 text-emerald-400 font-bold'}`}>✨ Llave en mano (Te lo dejamos listo)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Floating CTA for pitch */}
      <footer className="border-t border-white/10 bg-[#0F0F12] py-8 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <p className="text-sm text-gray-400">
            ¿Listo para ver cómo se siente en un teléfono real?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/alto-andino?demo=1#menu"
              className="bg-[#D4A853] text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-110 transition shadow-xl shadow-[#D4A853]/20 flex items-center gap-2"
            >
              Abrir Demo Alto Andino <ExternalLink className="w-4 h-4" />
            </Link>
            <Link 
              to="/"
              className="bg-white/10 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition"
            >
              Ir a la Portada de Aluna
            </Link>
          </div>
          <p className="text-[11px] text-gray-600 pt-4">
            Aluna POS Gastronómico • Diseñado para ventas directas sin intermediarios.
          </p>
        </div>
      </footer>
    </div>
  );
}
