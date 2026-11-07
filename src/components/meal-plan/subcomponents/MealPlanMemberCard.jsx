import React from 'react';
import { formatCOP } from '../../../utils/money';
import {
  Sparkles,
  MapPin,
  Clock,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

export default function MealPlanMemberCard({
  activePlan,
  usage,
  loadingUsage,
  totalStamps,
  filledStamps,
  wantsSoupToday,
  wantsDrinkToday,
  onOpenAddressModal,
  onOpenMemberDrawer,
  onToggleSoup,
  onToggleDrink,
  onOpenPlanDIYBowl
}) {
  if (!activePlan) return null;

  return (
    <div
      data-clarity-unmask="true"
      className="relative z-20 w-full h-full rounded-[1.25rem] bg-gradient-to-br from-[#FFFFFF] via-[#FDFCF9] to-[#F5F8F5] border border-[#cba258]/55 p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(47,65,49,0.05)] hover:shadow-[0_8px_30px_rgba(47,65,49,0.08)] flex flex-col justify-between transition-all duration-300"
    >
      <div>
        {/* FILA 1: Identidad del Suscriptor + Contador de Almuerzos */}
        <div className="relative z-10 flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#cba258]/15 border border-[#cba258]/40 text-amber-950 text-[10px] font-black tracking-wide">
                <Sparkles className="w-2.5 h-2.5 text-[#cba258]" />
                Club BOKU VIP • #{activePlan.code}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {activePlan.includes_delivery
                  ? '🛵 Domicilio en tu plan'
                  : `🛵 Envío aparte ${formatCOP(activePlan.delivery_fee || 5000)}`}
              </span>
            </div>

            <h2 className="text-[15px] sm:text-base font-black text-stone-900 mt-1 leading-tight">
              Hola, {activePlan.customer_name}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-stone-600 font-medium">
              <button
                type="button"
                onClick={onOpenAddressModal}
                className="inline-flex items-center gap-1 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-[#2f4131] shrink-0" />
                <span className="underline decoration-stone-300 underline-offset-2">
                  {activePlan.default_address || 'Asignar dirección'}
                </span>
              </button>
              {activePlan.default_time && (
                <span className="inline-flex items-center gap-1 text-stone-500 font-semibold">
                  <Clock className="w-3 h-3 text-[#2f4131] shrink-0" />
                  {activePlan.default_time}
                </span>
              )}
            </div>
          </div>

          {/* Contador Visual de Almuerzos Disponibles */}
          <button
            type="button"
            onClick={onOpenMemberDrawer}
            title="Ver detalles e historial de mi plan"
            className="shrink-0 rounded-xl bg-[#1D2B20] hover:bg-[#283a2c] px-3 py-1.5 text-center transition-all cursor-pointer shadow-xs"
          >
            <span className="block text-base font-black text-[#f3d493] leading-none">
              {loadingUsage ? '...' : `${usage.remainingCredits} / ${usage.totalCredits}`}
            </span>
            <span className="block text-[8px] font-black uppercase tracking-widest text-white/70 mt-1">
              Disponibles
            </span>
          </button>
        </div>

        {/* FILA DE SELLOS VISUALES */}
        <div className="relative z-10 mt-2.5 flex items-center gap-1">
          {Array.from({ length: totalStamps }).map((_, idx) => {
            const isAvailable = idx < filledStamps;
            return (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  isAvailable
                    ? 'bg-gradient-to-r from-[#e3be78] to-[#cba258] shadow-[0_0_6px_rgba(203,162,88,0.4)]'
                    : 'bg-stone-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* FILA 2: Selector Rápido Sopa & Bebida + Botón Principal */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Switch 1-Toque Con Sopa vs Sin Sopa */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-stone-100 border border-stone-200/80">
            <button
              type="button"
              onClick={() => onToggleSoup(true)}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                wantsSoupToday
                  ? 'bg-[#2f4131] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🥣 Sopa/Fruta
            </button>
            <button
              type="button"
              onClick={() => onToggleSoup(false)}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                !wantsSoupToday
                  ? 'bg-[#2f4131] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🥗 Sin Sopa
            </button>
          </div>

          {/* Switch 1-Toque Con Bebida vs Sin Bebida */}
          <button
            type="button"
            onClick={() => onToggleDrink(!wantsDrinkToday)}
            className={`px-2 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all cursor-pointer ${
              wantsDrinkToday
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-stone-100 border-stone-200/80 text-stone-500 hover:text-stone-800'
            }`}
            title="Incluir o quitar Jugo del Día en tu almuerzo"
          >
            {wantsDrinkToday ? '🥤 Con Jugo' : '🚫 Sin Bebida'}
          </button>
        </div>

        {/* Acciones derechas: Opciones + Armar Plato */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenMemberDrawer}
            title="Opciones de mi plan, mapa e historial"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenPlanDIYBowl}
            disabled={usage.remainingCredits <= 0}
            className="px-3.5 py-2 rounded-xl bg-[#1D2B20] hover:bg-[#283a2c] disabled:opacity-50 text-[#f3d493] font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>
              {usage.remainingCredits > 0 ? 'Armar plato' : 'Renovar Plan'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
