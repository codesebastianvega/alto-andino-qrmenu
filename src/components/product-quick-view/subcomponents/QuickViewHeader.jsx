import React from "react";

export default function QuickViewHeader({
  title,
  subtitle,
  product,
  productAllergens = [],
  isScheduleRestricted,
  scheduleNotice,
  stagger
}) {
  return (
    <>
      {/* Title & Subtitle */}
      <div className="flex flex-wrap items-center gap-2" style={stagger(1)}>
        <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-tight tracking-tight">
          {title}
        </h2>
        {product?.is_bento_del_dia && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
            🔥 {product.daily_special_label || "Plato del Día"}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-3 text-sm md:text-base text-neutral-500 leading-relaxed" style={stagger(2)}>
          {subtitle}
        </p>
      )}

      {/* Alérgenos */}
      {productAllergens.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" style={stagger(2)}>
          {productAllergens.map((alg) => (
            <span
              key={alg.id}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm"
              title={alg.name}
            >
              <span className="text-sm">{alg.emoji}</span>
              <span>{alg.name}</span>
            </span>
          ))}
        </div>
      )}

      {/* Schedule restriction notice */}
      {isScheduleRestricted && (
        <div
          className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-3 text-amber-900 shadow-2xs"
          style={stagger(2)}
        >
          <span className="text-xl shrink-0 mt-0.5">🕒</span>
          <div className="text-xs leading-relaxed">
            <p className="font-extrabold text-[13px] text-amber-950">Fuera de horario de servicio</p>
            <p className="text-amber-800 font-medium mt-0.5">
              {scheduleNotice}. Puedes consultar los detalles e ingredientes de este plato, pero no está habilitado para pedidos en este momento.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
