import React from 'react';
import { CATEGORIES } from '../upgradeStoreData';

export default function UpgradeCategoryBar({
  selectedCategory,
  setSelectedCategory,
  effectiveCurrentPlanSlug
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xs px-5 sm:px-7 py-2.5 border-b border-gray-200/80 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          type="button"
          onClick={() => setSelectedCategory(cat.id)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === cat.id
              ? 'bg-gray-900 text-white shadow-2xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
          }`}
        >
          {cat.label}
        </button>
      ))}

      <div className="ml-auto text-[11px] text-gray-400 hidden xl:flex items-center gap-1.5 shrink-0 pl-4">
        <span>Tu plan actual:</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black border border-emerald-200 capitalize">
          {effectiveCurrentPlanSlug}
        </span>
      </div>
    </div>
  );
}
