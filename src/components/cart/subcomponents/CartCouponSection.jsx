import React from "react";
import { Icon } from "@iconify/react";

export default function CartCouponSection({
  appliedCoupon,
  discountAmount,
  formatCOP,
  handleRemoveCoupon,
  skipPlanCreditForOrder,
  activeMemberPlanSession,
  handleRestoreMealPlanCredit,
  automaticDiscountPromo,
  isCouponAccordionOpen,
  setIsCouponAccordionOpen,
  availableCouponPromos = [],
  handleApplyCoupon,
  couponInput,
  setCouponInput,
  isApplyingCoupon,
}) {
  return (
    <div className="mb-3 pt-0.5">
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200/90 rounded-xl shadow-2xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Icon icon="solar:ticket-sale-bold" className="text-base" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-black text-xs text-emerald-950 uppercase tracking-wider">
                  {appliedCoupon.is_meal_plan ? `Tiquetera #${appliedCoupon.code}` : (appliedCoupon.code || appliedCoupon.name)}
                </span>
                <span className="text-[10px] font-black bg-emerald-200/80 text-emerald-800 px-1.5 py-0.2 rounded">
                  {appliedCoupon.is_meal_plan
                    ? "1 Crédito = 1 Almuerzo"
                    : appliedCoupon.type === "percentage_discount"
                    ? `-${appliedCoupon.value}%`
                    : appliedCoupon.type === "free_delivery"
                    ? "Envío Gratis"
                    : `-${formatCOP(appliedCoupon.value)}`}
                </span>
              </div>
              <p className="text-[10px] font-medium text-emerald-700 leading-tight mt-0.5">
                {appliedCoupon.is_meal_plan
                  ? discountAmount > 0
                    ? `Cubre 1 almuerzo base (-${formatCOP(discountAmount)})${appliedCoupon.includes_delivery ? " + domicilio del plan" : " • Domicilio aparte"}. Extras o 2° plato se cobran normal.`
                    : "Agrega tu Bowl del Plan o Bento del Día para redimir 1 crédito."
                  : appliedCoupon.type === "free_delivery"
                  ? "Domicilio 100% gratis"
                  : `Ahorras ${formatCOP(discountAmount)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            title={appliedCoupon.is_meal_plan ? "No usar crédito hoy (Pagar normal)" : "Quitar cupón"}
          >
            {appliedCoupon.is_meal_plan ? "No usar hoy" : "Quitar"}
          </button>
        </div>
      ) : skipPlanCreditForOrder && activeMemberPlanSession ? (
        <div className="flex items-center justify-between p-2.5 bg-stone-100 border border-stone-200 rounded-xl shadow-2xs">
          <div className="min-w-0">
            <span className="block text-xs font-extrabold text-stone-800">
              🎟️ Tiquetera #{activeMemberPlanSession.code} pausada en este pedido
            </span>
            <span className="block text-[10px] text-stone-500">
              Pagarás este pedido normal sin gastar créditos de tu plan.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestoreMealPlanCredit}
            className="px-2.5 py-1.5 rounded-lg bg-[#2f4131] text-white text-[11px] font-bold shrink-0 cursor-pointer"
          >
            Usar 1 Crédito
          </button>
        </div>
      ) : automaticDiscountPromo ? (
        <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200/80 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Icon icon="solar:sale-bold" className="text-blue-600 text-lg shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-blue-950">{automaticDiscountPromo.name}</span>
              <p className="text-[10px] text-blue-700">Promo automática aplicada ({formatCOP(discountAmount)} de descuento)</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {!isCouponAccordionOpen ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsCouponAccordionOpen(true)}
                className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-bold text-[#2f4131] hover:text-emerald-800 hover:bg-emerald-50/50 rounded-lg transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Icon icon="solar:ticket-sale-bold" className="text-sm text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>¿Tienes un cupón de descuento?</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5">
                  Ingresar <Icon icon="solar:alt-arrow-right-linear" className="text-xs" />
                </span>
              </button>
              {availableCouponPromos.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-2">
                  {availableCouponPromos.slice(0, 2).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyCoupon(p.code)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 text-[10px] font-bold text-emerald-800 transition-colors cursor-pointer"
                    >
                      <Icon icon="solar:ticket-sale-bold" className="text-xs text-emerald-600" />
                      <span>Usar <strong>{p.code}</strong></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <Icon icon="solar:ticket-sale-bold" className="text-emerald-600 text-xs" />
                  <span>Cupón de Descuento</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCouponAccordionOpen(false)}
                  className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Ej: BOKU15"
                    className="w-full h-9 pl-3 pr-2 text-xs font-mono font-bold tracking-wider bg-white rounded-lg border border-neutral-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-3 h-9 bg-[#2f4131] hover:bg-[#202c21] disabled:bg-neutral-200 text-white disabled:text-neutral-400 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  {isApplyingCoupon ? (
                    <Icon icon="line-md:loading-loop" className="text-sm" />
                  ) : (
                    "Aplicar"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
