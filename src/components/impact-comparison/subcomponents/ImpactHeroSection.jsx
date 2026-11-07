import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Layers, Bot, Camera } from 'lucide-react';

export default function ImpactHeroSection({ activeView, setActiveView }) {
  return (
    <section className="relative overflow-hidden pt-6 pb-8 sm:pt-12 sm:pb-14 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Ambient Glows */}
      <div
        className={`absolute top-10 left-1/4 w-96 h-96 blur-[130px] rounded-full pointer-events-none transition-all duration-700 ${
          activeView === 'boku' ? 'bg-amber-500/20' : 'bg-[#2D6A4F]/25'
        }`}
      />
      <div
        className={`absolute top-20 right-1/4 w-96 h-96 blur-[140px] rounded-full pointer-events-none transition-all duration-700 ${
          activeView === 'boku' ? 'bg-amber-600/15' : 'bg-[#D4A853]/20'
        }`}
      />

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

        {/* View Switcher */}
        <div className="pt-3 sm:pt-6 flex justify-center w-full max-w-xl mx-auto px-1">
          <div className="w-full sm:w-auto p-1 rounded-xl sm:rounded-full bg-white/5 border border-white/15 grid grid-cols-3 sm:flex sm:items-center sm:justify-center gap-1 sm:gap-1.5 shadow-2xl backdrop-blur-lg">
            <button
              type="button"
              onClick={() => setActiveView('split')}
              className={`w-full sm:w-auto px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
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
              type="button"
              onClick={() => setActiveView('boku')}
              className={`w-full sm:w-auto px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
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
              type="button"
              onClick={() => setActiveView('alto-andino')}
              className={`w-full sm:w-auto px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
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
                type="button"
                onClick={() => setActiveView('alto-andino')}
                className="shrink-0 w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs sm:text-[11px] font-black uppercase tracking-wider transition text-center cursor-pointer"
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
  );
}
