import React from "react";
import { Icon } from "@iconify/react";

export default function CartPricingBreakdown({
  total,
  discountAmount,
  effectivePromo,
  packagingFeeTotal,
  fulfillmentType,
  deliveryFee,
  isFreeDeliveryPromoActive,
  isMealPlanDeliveryCovered,
  freeDeliveryPromo,
  isTipEnabled,
  includeTip,
  setIncludeTip,
  tipPercentage,
  serviceFeeAmount,
  finalTotal,
  formatCOP,
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-neutral-500 font-medium">Subtotal</span>
        <span className="text-sm font-semibold text-neutral-700">{formatCOP(total)}</span>
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between items-center mb-1 animate-in fade-in slide-in-from-right-2 text-emerald-700">
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:ticket-sale-bold" className="text-base text-emerald-600" />
            <span className="text-sm font-bold">
              {effectivePromo?.is_meal_plan
                ? `1 Crédito Tiquetera (#${effectivePromo.code})`
                : `Descuento (${effectivePromo?.code || effectivePromo?.name})`}
            </span>
          </div>
          <span className="text-sm font-black text-emerald-700">
            -{formatCOP(discountAmount)}
          </span>
        </div>
      )}

      {packagingFeeTotal > 0 && (fulfillmentType === "takeaway" || fulfillmentType === "delivery") && (
        <div className="flex justify-between items-center mb-1 animate-in fade-in slide-in-from-right-2">
          <span className="text-sm text-neutral-500 font-medium">Empaque</span>
          <span className="text-sm font-semibold text-neutral-700">{formatCOP(packagingFeeTotal)}</span>
        </div>
      )}

      {fulfillmentType === "delivery" && (
        <div className="flex justify-between items-center mb-1 animate-in fade-in slide-in-from-right-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-neutral-500 font-medium">Costo de Domicilio</span>
            {deliveryFee === 0 && isFreeDeliveryPromoActive && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                {isMealPlanDeliveryCovered ? "Plan Todo Incluido" : freeDeliveryPromo?.name ? "Promo" : "Cupón"}
              </span>
            )}
          </div>
          <span className={`text-sm font-semibold ${deliveryFee > 0 ? "text-emerald-700" : isFreeDeliveryPromoActive ? "text-emerald-600 font-black" : "text-neutral-600"}`}>
            {deliveryFee > 0 ? formatCOP(deliveryFee) : isMealPlanDeliveryCovered ? "Incluido en tu Plan 🛵" : isFreeDeliveryPromoActive ? "¡GRATIS! 🎉" : "$ 0"}
          </span>
        </div>
      )}

      {isTipEnabled && (
        <div className="flex justify-between items-center mb-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={includeTip}
                onChange={(e) => setIncludeTip(e.target.checked)}
                className="w-4 h-4 text-[#2f4131] bg-gray-100 border-gray-300 rounded focus:ring-[#2f4131] cursor-pointer"
              />
            </div>
            <span className="text-sm text-neutral-500 font-medium group-hover:text-neutral-700 transition-colors">
              Incluir servicio voluntario ({tipPercentage}%)
            </span>
          </label>
          <span className="text-sm font-semibold text-neutral-700">
            {includeTip ? formatCOP(serviceFeeAmount) : "-"}
          </span>
        </div>
      )}

      {!isTipEnabled && (
        <div className="flex justify-between items-center text-sm text-neutral-400 mb-1">
          <span>Sin costo de servicio</span>
          <span>-</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 mb-4 pt-2 border-t border-neutral-100">
        <span className="text-base sm:text-lg font-bold text-neutral-900">Total</span>
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#2f4131]">
          {formatCOP(finalTotal)}
        </span>
      </div>
    </>
  );
}
