import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function MealPlanVisitorCard({ onOpenPlans, onOpenLogin }) {
  return (
    <div
      data-clarity-unmask="true"
      className="relative z-20 w-full h-full rounded-[1.25rem] bg-white/95 backdrop-blur-md border border-stone-200/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-stone-300 flex flex-col justify-between transition-all duration-300"
    >
      <div>
        {/* Fila superior: Badge Apple-style + Pill de Ahorro */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-black uppercase tracking-wider">
            <span>🥗</span>
            <span>Club BOKU</span>
          </span>
          <span className="text-[10px] font-bold text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded-full border border-amber-200/60">
            Desde $15.000 / día
          </span>
        </div>

        {/* Título y Subtítulo */}
        <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-snug mt-2.5">
          Club BOKU (Pase de Almuerzos)
        </h3>
        <p className="text-xs text-stone-500 font-medium leading-relaxed mt-1 line-clamp-2">
          Tu almuerzo fit listo cada día en tu puerta a precio especial.
        </p>
      </div>

      {/* Fila inferior de botones de acción */}
      <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-stone-100">
        <button
          type="button"
          onClick={onOpenPlans}
          className="px-3.5 py-2 rounded-xl bg-stone-100/90 hover:bg-stone-200/80 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
        >
          Ver Planes
        </button>
        <button
          type="button"
          onClick={onOpenLogin}
          className="px-3.5 py-2 rounded-xl bg-[#1D2B20] hover:bg-[#283a2c] text-[#f3d493] font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>Soy Miembro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
