import React from "react";
import { formatCOP } from "@/utils/money";

export default function QuickViewFooter({
  product,
  basePrice,
  extraPrice,
  finalPrice,
  canAdd,
  isOutOfStock,
  isScheduleRestricted,
  scheduleNotice,
  missingRequired = [],
  handleAdd,
  staggerStyle
}) {
  const id = product?.id;

  return (
    <div
      className="flex-shrink-0 bg-white border-t border-neutral-100 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] p-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:px-8 z-10"
      style={staggerStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Total a pagar</p>
          <div className="flex items-baseline gap-2">
            {product?.original_price && product.original_price > product.price && (
              <span className="text-base md:text-lg font-bold text-neutral-400 line-through">
                {formatCOP(product.original_price + extraPrice)}
              </span>
            )}
            <p className="text-3xl font-extrabold text-brand-primary leading-none tracking-tight">
              {formatCOP(finalPrice)}
            </p>
          </div>
        </div>
        {extraPrice > 0 && (
          <div className="text-right">
            <p className="text-xs font-semibold text-neutral-400">Base: {formatCOP(basePrice)}</p>
            <p className="text-sm font-bold text-[#cba258]">+{formatCOP(extraPrice)} extras</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!id || !Number.isFinite(basePrice) || basePrice <= 0 || isOutOfStock || isScheduleRestricted}
        className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group cursor-pointer transition-all ${
          missingRequired.length > 0
            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
            : 'bg-brand-primary text-white hover:brightness-105'
        } disabled:opacity-50 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed`}
      >
        <span className="relative z-10">
          {isOutOfStock
            ? "Agotado"
            : isScheduleRestricted
            ? `🕒 ${scheduleNotice}`
            : missingRequired.length > 0
            ? `⚠️ Falta ${missingRequired.length === 1 ? '1 opción obligatoria' : `${missingRequired.length} opciones obligatorias`}`
            : "Agregar al pedido"}
        </span>
        {canAdd && (
          <div className="absolute inset-0 h-full w-full block bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        )}
      </button>
    </div>
  );
}
