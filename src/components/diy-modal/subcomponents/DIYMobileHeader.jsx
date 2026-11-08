import React from 'react';
import AAImage from '@/components/ui/AAImage';
import { formatCOP } from '@/utils/money';

export default function DIYMobileHeader({
  title,
  image,
  currentStep,
  totalSteps,
  finalPrice,
  currentProgressPercent,
  isScheduleRestricted,
  scheduleNotice
}) {
  return (
    <div className="md:hidden bg-white border-b border-neutral-100 p-4 pt-3.5 pr-16 shadow-sm relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 overflow-hidden shrink-0 border border-neutral-200 shadow-sm">
          <AAImage src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2f4131] bg-[#2f4131]/10 px-2 py-0.5 rounded-full">
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-neutral-900 truncate leading-tight mt-0.5">
            {title}
          </h3>
          <p className="text-xs font-black text-[#cba258]">
            {formatCOP(finalPrice)}
          </p>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-neutral-100 h-1 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-[#2f4131] h-full transition-all duration-300 rounded-full"
          style={{ width: `${currentProgressPercent}%` }}
        />
      </div>

      {isScheduleRestricted && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs shadow-2xs">
          <span className="text-base shrink-0 mt-0.5">🕒</span>
          <div className="leading-tight">
            <strong className="font-extrabold text-amber-950">Fuera de horario de servicio: </strong>
            <span className="font-medium text-amber-900/90">
              {scheduleNotice}. Puedes personalizar tu combinación, pero no está habilitado para pedidos en este momento.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
