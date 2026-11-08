import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function DIYLiveSummaryTray({
  liveSelectedChips = [],
  totalSelectedCount = 0,
  showLiveTray,
  setShowLiveTray,
  handleDecrement
}) {
  if (liveSelectedChips.length === 0) return null;

  return (
    <div className="bg-[#f0f4f1] border-b border-[#2f4131]/10 px-4 md:px-8 py-2.5 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#2f4131] flex items-center gap-1">
          <Icon icon="lucide:check-circle" className="text-xs text-emerald-600" />
          Tu Bowl en vivo ({totalSelectedCount})
        </span>
        <button
          type="button"
          onClick={() => setShowLiveTray?.((v) => !v)}
          className="text-[10px] text-neutral-500 hover:text-neutral-800 font-bold cursor-pointer"
        >
          {showLiveTray ? 'Ocultar' : 'Ver'}
        </button>
      </div>

      {showLiveTray && (
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
          {liveSelectedChips.map((chip) => (
            <span
              key={`${chip.groupName}-${chip.id}`}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-white border border-[#2f4131]/15 text-neutral-800 text-[11px] font-bold shadow-xs whitespace-nowrap animate-in fade-in zoom-in-95 duration-200"
            >
              <span>{chip.emoji}</span>
              <span className="max-w-[120px] truncate">{chip.name}</span>
              {chip.count > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#2f4131] text-white text-[10px] font-black">
                  x{chip.count}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDecrement?.(chip.groupName, chip.id)}
                className="w-4 h-4 rounded-full hover:bg-neutral-100 grid place-items-center text-neutral-400 hover:text-red-500 ml-0.5 transition-colors cursor-pointer"
                aria-label="Quitar una porción"
              >
                <Icon icon="heroicons:x-mark" className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
