import React from 'react';
import DIYIngredientCard from './DIYIngredientCard';
import { getCategoryTheme } from '../utils/diyCategoryTheme';

export default function DIYIngredientGrid({
  currentStepGroups = [],
  selections = {},
  scrollContainerRef,
  handleCardClick,
  handleIncrement,
  handleDecrement
}) {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32 md:pb-36"
    >
      {currentStepGroups.map((group, groupIdx) => {
        const selCount = (selections[group.name] || []).length;
        const isLimitReached = selCount >= group.max;
        const theme = getCategoryTheme(group.name);

        return (
          <div
            key={`${group.name}-${groupIdx}`}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* Step Title & Requirement Pill */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">{theme.icon}</span>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 capitalize">
                    {group.name.replace(/-/g, ' ')}
                  </h3>
                  {group.is_submodifier && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Extra
                    </span>
                  )}
                </div>

                {/* Dynamic Selection Counter Badge */}
                <div className="shrink-0">
                  {group.min > 0 && group.min === group.max ? (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        selCount === group.min
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {selCount === group.min ? '✓ Seleccionado' : `Elige ${group.min} (Obligatorio)`}
                    </span>
                  ) : group.max === 999 ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-neutral-100 text-neutral-600">
                      Opcional ({selCount} elegidos)
                    </span>
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        isLimitReached
                          ? 'bg-amber-100 text-amber-900 font-extrabold'
                          : selCount >= group.min
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {isLimitReached
                        ? `Límite alcanzado (${selCount}/${group.max})`
                        : `Llevas ${selCount} de ${group.max}`}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                {group.min > 0 && group.min === group.max
                  ? 'Selecciona 1 opción para continuar.'
                  : group.min > 0
                  ? `Selecciona al menos ${group.min} y máximo ${group.max} ${
                      group.max === 1 ? 'opción' : 'porciones'
                    }.`
                  : `Elige hasta ${group.max} ${
                      group.max === 1 ? 'opción' : 'porciones'
                    } a tu gusto (opcional).`}
                {group.included_quantity > 0 && group.max > group.included_quantity && (
                  <span className="ml-1 text-[#b88c42] font-semibold">
                    ({group.included_quantity}{' '}
                    {group.included_quantity === 1 ? 'porción incluida' : 'porciones incluidas'}, adicionales con
                    costo extra).
                  </span>
                )}
              </p>
            </div>

            {/* Ingredient Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {group.items.map((item) => (
                <DIYIngredientCard
                  key={item.id}
                  item={item}
                  group={group}
                  groupSel={selections[group.name] || []}
                  theme={theme}
                  isLimitReached={isLimitReached}
                  handleCardClick={handleCardClick}
                  handleIncrement={handleIncrement}
                  handleDecrement={handleDecrement}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
