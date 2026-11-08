import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '@/utils/money';

export default function DIYStickyFooter({
  finalPrice,
  currentStep,
  totalSteps,
  nextStepGroup,
  isCurrentStepValid,
  isScheduleRestricted,
  scheduleNotice,
  handlePrev,
  handleNext
}) {
  const isLastStep = currentStep === totalSteps - 1;
  const canProceed = isCurrentStepValid && !(isLastStep && isScheduleRestricted);

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] p-3.5 md:p-4 z-30">
      <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
        {/* Total running price display */}
        <div className="shrink-0 pl-1">
          <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-black">Total Bowl</p>
          <p className="text-xl md:text-2xl font-black text-[#cba258] leading-tight">
            {formatCOP(finalPrice)}
          </p>
        </div>

        {/* Actions buttons */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Back Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Paso anterior"
          >
            <Icon icon="heroicons:chevron-left-20-solid" className="text-xl font-bold" />
          </button>

          {/* Next / Add Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 sm:max-w-xs flex items-center justify-center gap-2 h-11 md:h-12 px-5 rounded-xl text-white font-extrabold text-sm md:text-base transition-all shadow-md active:scale-97 cursor-pointer ${
              canProceed
                ? isLastStep
                  ? 'bg-[#cba258] hover:bg-[#b88c42] shadow-[#cba258]/30 hover:shadow-lg'
                  : 'bg-[#2f4131] hover:bg-[#202c21] shadow-[#2f4131]/30 hover:shadow-lg'
                : 'bg-neutral-200 shadow-none cursor-not-allowed text-neutral-400'
            }`}
          >
            {isLastStep ? (
              isScheduleRestricted ? (
                <span className="truncate">🕒 {scheduleNotice}</span>
              ) : (
                <>
                  <span>Agregar al Pedido</span>
                  <Icon icon="heroicons:shopping-bag-20-solid" className="text-lg" />
                </>
              )
            ) : (
              <>
                <span className="truncate">
                  {nextStepGroup
                    ? `Siguiente: ${nextStepGroup.name.replace(/-/g, ' ').replace(/^[^\w]+/, '')}`
                    : 'Siguiente Paso'}
                </span>
                <Icon icon="heroicons:arrow-right-20-solid" className="text-lg shrink-0" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
