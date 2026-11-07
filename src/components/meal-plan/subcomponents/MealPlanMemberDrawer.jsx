import React from 'react';
import Portal from '../../Portal';
import { formatCOP } from '../../../utils/money';
import {
  LogOut,
  X,
  Ticket,
  History,
  MapPin,
  Navigation,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Smartphone
} from 'lucide-react';

export default function MealPlanMemberDrawer({
  open,
  onClose,
  activePlan,
  usage,
  loadingUsage,
  showHistory,
  setShowHistory,
  wantsSoupToday,
  onToggleSoup,
  wantsDrinkToday,
  onToggleDrink,
  onOpenAddressModal,
  onOpenPlanDIYBowl,
  activeDailyBento,
  onOpenDailyBento,
  isPWAInstalled,
  onInstallClick,
  onLogout
}) {
  if (!open || !activePlan) return null;

  return (
    <Portal>
      <div
        data-clarity-unmask="true"
        className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 pb-8 sm:pb-6 shadow-2xl border-t sm:border border-stone-200 space-y-3.5 max-h-[90dvh] overflow-y-auto"
        >
          <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto -mt-1 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#2f4131]/10 text-[#2f4131] text-[10px] font-extrabold uppercase tracking-wide">
                  Pase Activo
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono text-[10px] font-bold">
                  #{activePlan.code}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] mt-1">
                Hola, {activePlan.customer_name}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onLogout}
                title="Cambiar de cuenta"
                className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-[#2f4131]" />
                Almuerzos Disponibles
              </span>
              <span className="text-sm font-black text-[#2f4131]">
                {loadingUsage ? '...' : `${usage.remainingCredits} de ${usage.totalCredits}`}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden">
              <div
                className="h-full bg-[#2f4131] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, (usage.remainingCredits / Math.max(1, usage.totalCredits)) * 100)
                  )}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
              <span>
                {activePlan.includes_delivery
                  ? '🛵 Domicilio incluido en tu plan'
                  : `🛵 Envío aparte (${formatCOP(activePlan.delivery_fee || 5000)})`}
              </span>
              <button
                type="button"
                onClick={() => setShowHistory(prev => !prev)}
                className="inline-flex items-center gap-1 font-bold text-stone-700 hover:text-[#2f4131] cursor-pointer"
              >
                <History className="w-3 h-3" />
                <span>Historial ({usage.usedCredits} usados)</span>
              </button>
            </div>

            {showHistory && (
              <div className="pt-2 border-t border-stone-200/70 space-y-1 max-h-28 overflow-y-auto text-[11px]">
                {usage.ordersHistory.length === 0 ? (
                  <p className="text-stone-400">Aún no has redimido créditos de este plan.</p>
                ) : (
                  usage.ordersHistory.map((ord, idx) => (
                    <div key={ord.id} className="flex items-center justify-between py-0.5 text-stone-600">
                      <span>
                        #{usage.ordersHistory.length - idx} •{' '}
                        {new Date(ord.created_at).toLocaleDateString('es-CO', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="font-bold text-[#2f4131]">✓ 1 Crédito</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              1. ¿Cómo quieres tu almuerzo hoy?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleSoup(true)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  wantsSoupToday
                    ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-black text-stone-900 block">🥣 Con Sopa / Fruta</span>
                <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                  Sopita del día (16 oz) o Fruta fresca
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSoup(false)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  !wantsSoupToday
                    ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-black text-stone-900 block">🥗 Sin Sopa (Solo Bowl)</span>
                <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                  1 Base + Proteína + 5 Toppings
                </span>
              </button>
            </div>

            {/* Selector de Bebida del Almuerzo */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleDrink(true)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  wantsDrinkToday
                    ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-black text-stone-900 block">🥤 Con Bebida</span>
                <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                  Jugo del Día (5 oz) o upgrade a Té Hatsu
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleDrink(false)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  !wantsDrinkToday
                    ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-black text-stone-900 block">🚫 Sin Bebida</span>
                <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                  No incluir bebida con mi almuerzo
                </span>
              </button>
            </div>

            <p className="text-[10px] text-stone-500 bg-stone-50 border border-stone-200/70 rounded-xl px-2.5 py-1.5 leading-snug">
              💡 <strong>Regla de Tiquetera:</strong> 1 crédito cubre 1 almuerzo personal por día. Si agregas adiciones extra, otra bebida o un 2° plato para alguien más, se suman a precio normal.
            </p>
          </div>

          <div className="p-3 rounded-2xl border border-stone-200/90 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Punto de entrega programado
              </p>
              <p className="text-xs font-extrabold text-stone-800 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#2f4131] shrink-0" />
                <span>{activePlan.default_address || 'Asignar dirección'}</span>
                {activePlan.default_time && (
                  <span className="text-stone-500 font-semibold">• {activePlan.default_time}</span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAddressModal}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-[#2f4131]" />
              <span>{activePlan.default_coords?.lat ? 'Editar Mapa' : 'Fijar Pin'}</span>
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onOpenPlanDIYBowl}
              disabled={usage.remainingCredits <= 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#2f4131] hover:bg-[#233124] disabled:bg-stone-200 disabled:text-stone-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-[#cba258] shrink-0" />
              <span>
                {usage.remainingCredits > 0
                  ? wantsSoupToday
                    ? 'Armar mi Bowl + Sopa de Hoy (1 Crédito)'
                    : 'Armar mi Bowl de Hoy (1 Crédito)'
                  : 'Sin créditos disponibles — Renovar Plan'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {activeDailyBento && usage.remainingCredits > 0 && (
              <button
                type="button"
                onClick={onOpenDailyBento}
                className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#cba258] shrink-0" />
                <span>O pedir hoy: {activeDailyBento.name} (1 Crédito)</span>
              </button>
            )}

            {!isPWAInstalled && (
              <button
                type="button"
                onClick={onInstallClick}
                className="w-full py-2 text-stone-500 hover:text-stone-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar acceso directo en mi pantalla de inicio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
