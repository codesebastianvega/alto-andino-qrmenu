import React from 'react';
import { Icon } from '@iconify-icon/react';
import { getCategoryTheme } from '../utils/diyCategoryTheme';

export default function DIYStepperPills({
  steps = [],
  currentStep,
  setCurrentStep,
  selections = {}
}) {
  return (
    <div className="bg-white border-b border-neutral-200/70 px-4 md:px-8 py-3 shadow-xs relative z-10">
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
        {steps.map((stepArr, idx) => {
          const isDone = stepArr.every((g) => (selections[g.name] || []).length >= g.min);
          const isActive = currentStep === idx;
          const mainGroup = stepArr[0];
          const theme = getCategoryTheme(mainGroup?.name);

          return (
            <button
              key={mainGroup?.name || idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all ${
                isActive
                  ? 'border-[#2f4131] bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20 scale-102'
                  : isDone
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
              }`}
            >
              <span className="text-xs">{theme.icon}</span>
              <span className="capitalize">
                {mainGroup?.name?.replace(/-/g, ' ').replace(/^[^\w]+/, '')}
              </span>
              {isDone && !isActive && (
                <Icon icon="heroicons:check-circle-20-solid" className="text-emerald-600 text-sm ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
