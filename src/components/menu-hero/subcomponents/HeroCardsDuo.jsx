import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import MealPlanVIPBanner from '../../MealPlanVIPBanner';

export default function HeroCardsDuo({
  onOpenCart,
  onInstallPWA,
  isPWAInstalled,
  instantProduct,
  storeStatusInfo,
  primaryColor,
  accentColor,
  greeting,
  onOpenGuide
}) {
  return (
    <div className="w-full my-4">
      <div className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* CARD 1: Club BOKU (Pase de Almuerzos) */}
        <div className="min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-start flex-1 flex flex-col">
          <MealPlanVIPBanner
            onOpenCart={onOpenCart}
            onInstallPWA={onInstallPWA}
            isPWAInstalled={isPWAInstalled}
          />
        </div>

        {/* CARD 2: Guía de Antojo (Aluna) con gradiente personalizado de la marca */}
        {instantProduct && storeStatusInfo?.isOpen !== false && (
          <div className="min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-start flex-1 flex flex-col">
            <div
              data-clarity-unmask="true"
              className="relative z-20 w-full h-full rounded-[1.25rem] p-4 sm:p-4.5 border shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col justify-between transition-all duration-300 overflow-hidden group"
              style={{
                background: `linear-gradient(140deg, #FFFFFF 0%, #FAFAF9 35%, ${primaryColor}14 70%, ${accentColor}22 100%)`,
                borderColor: `${primaryColor}35`
              }}
            >
              {/* Glow ambiental con los tonos vivos de la marca */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-65 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${primaryColor} 0%, ${accentColor} 100%)` }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${primaryColor || '#8a0a0a'} 0%, ${accentColor || '#cba258'} 100%)` }}
                  >
                    <Sparkles size={11} className="animate-pulse" />
                    <span>Guía de Antojo</span>
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${primaryColor}10`,
                      borderColor: `${primaryColor}25`,
                      color: primaryColor || '#8a0a0a'
                    }}
                  >
                    Match en 2 clics
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-snug mt-2.5">
                  {greeting || '¿Qué se te antoja hoy?'}
                </h3>
                <p className="text-xs text-stone-600 font-medium leading-relaxed mt-1 line-clamp-2">
                  Haz un match rápido con algo de la carta según tu apetito o momento del día.
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-stone-200/60">
                <span className="text-[11px] font-bold text-stone-500 truncate flex items-center gap-1">
                  <span>✨</span>
                  <span>Asistente inteligente Aluna</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="px-4 py-2 rounded-xl text-white font-black text-xs transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 hover:brightness-105"
                  style={{ background: `linear-gradient(135deg, ${primaryColor || '#8a0a0a'} 0%, ${accentColor || '#cba258'} 100%)` }}
                >
                  <span>Abrir guía</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
