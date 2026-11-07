import React from 'react';
import { Bot, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { KPIS } from '../data/impactComparisonData';

export default function ImpactKpisSection({
  activeView,
  kpiScrollRef,
  activeKpiIndex,
  handleKpiScroll,
  scrollToKpi
}) {
  return (
    <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      {/* Mobile Swipe Hint */}
      <div className="flex md:hidden items-center justify-between pb-2 px-1 text-[10px] text-gray-400 font-medium">
        <span>
          ← Desliza las métricas ({activeKpiIndex + 1}/{KPIS.length}) →
        </span>
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
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">
                      {kpi.title}
                    </span>
                    <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                      {kpi.boku.badge}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                      {kpi.boku.value}
                    </p>
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
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">
                      {kpi.title}
                    </span>
                    <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-black whitespace-nowrap">
                      {kpi.alto.badge}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                      {kpi.alto.value}
                    </p>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {kpi.title}
                  </span>
                  <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-xs font-black whitespace-nowrap">
                    {kpi.alto.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 items-baseline mb-3 pb-3 border-b border-white/5">
                  <div className="pr-1 sm:pr-2">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 tracking-tight">
                      {kpi.alto.value}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-medium text-emerald-300/80 flex items-center gap-1 mt-0.5 leading-snug">
                      <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{kpi.alto.label}</span>
                    </p>
                  </div>
                  <div className="border-l border-white/10 pl-2.5 sm:pl-4">
                    <p className="text-xl sm:text-2xl font-black text-gray-500 line-through tracking-tight">
                      {kpi.boku.value}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5 leading-snug">
                      <Bot className="w-3.5 h-3.5 text-gray-500 shrink-0" />
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
          type="button"
          onClick={() => scrollToKpi(Math.max(0, activeKpiIndex - 1))}
          disabled={activeKpiIndex === 0}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
          aria-label="Anterior KPI"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {KPIS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToKpi(i)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                activeKpiIndex === i
                  ? 'w-6 h-1.5 bg-[#D4A853]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Ir a tarjeta ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollToKpi(Math.min(KPIS.length - 1, activeKpiIndex + 1))}
          disabled={activeKpiIndex === KPIS.length - 1}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
          aria-label="Siguiente KPI"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
