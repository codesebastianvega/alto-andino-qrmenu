import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera,
  Bot,
  XCircle,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';
import {
  BOKU_GALLERY_ITEMS,
  BOKU_FRICTION_POINTS,
  ALTO_GALLERY_ITEMS,
  ALTO_SUCCESS_PILLARS
} from '../data/impactComparisonData';

export default function ImpactShowcaseSection({ activeView, setActiveView }) {
  return (
    <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
      <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/10 p-4 sm:p-8 lg:p-10 relative overflow-hidden">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">
            <Camera className="w-3.5 h-3.5 text-[#D4A853]" />
            <span>Evidencia Visual Directa</span>
          </div>
          <h2
            className="text-xl sm:text-3xl lg:text-4xl font-normal text-white tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {activeView === 'boku' && 'La Brecha del Menú con IA (BOKU)'}
            {activeView === 'alto-andino' && 'El Poder de la Fotografía Real (Alto Andino)'}
            {activeView === 'split' && 'Cara a Cara: Menú IA vs Fotografía Real'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 font-light leading-relaxed">
            {activeView === 'boku' &&
              'Imágenes sintéticas que no despiertan apetito emocional y generan falsas expectativas en el comensal.'}
            {activeView === 'alto-andino' &&
              'Platos reales iluminados profesionalmente que provocan hambre instantánea y multiplican la venta de bebidas y postres.'}
            {activeView === 'split' &&
              'Descubre por qué la fotografía real supera en cada métrica comercial al menú sintético o a la carta en PDF.'}
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
                {BOKU_GALLERY_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl sm:rounded-2xl border border-amber-500/30 bg-black/40 p-3.5 sm:p-5 relative"
                  >
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img
                        src={item.img}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = item.fallback || '/poke1.png';
                        }}
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-amber-500/30">
                        {item.tag}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-amber-300">{item.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Friction Points Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                {BOKU_FRICTION_POINTS.map((pt, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs"
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <XCircle className="w-4 h-4 shrink-0" /> <span>{pt.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-300">{pt.desc}</p>
                  </div>
                ))}
              </div>

              {/* Bridge CTA */}
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/20 via-black to-emerald-500/20 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Descubre la diferencia: Compara contra fotos reales
                  </p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Observa el menú de Alto Andino con fotografía gastronómica real y optimización de Google Maps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('alto-andino')}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider transition shrink-0 cursor-pointer"
                >
                  Ver Menú Alto Andino →
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
                {ALTO_GALLERY_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-black/40 p-3.5 sm:p-4 relative shadow-lg shadow-emerald-500/5"
                  >
                    <div className="aspect-video w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                      <img src={item.img} alt={item.alt} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                        {item.tag}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-300">{item.title}</p>
                    <p className="text-[11px] text-gray-300 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Success Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                {ALTO_SUCCESS_PILLARS.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-300">{p.desc}</p>
                  </div>
                ))}
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
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Menú IA / Prototipo (BOKU)
                      </span>
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
                      onError={(e) => {
                        e.currentTarget.src = '/poke1.png';
                      }}
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
                      <span>
                        Riesgo de queja: <em>"En la imagen se veía diferente a lo que sirvieron"</em>.
                      </span>
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
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Producción Real (Alto Andino)
                      </span>
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
                      Foto Real • Sándwich Serrano
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Fotos auténticas tomadas con iluminación profesional en tu local.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Los clientes etiquetan y reseñan en Google Maps (+4.8★ garantizado).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>El comensal confía de inmediato y añade bebidas o postres (+54%).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
