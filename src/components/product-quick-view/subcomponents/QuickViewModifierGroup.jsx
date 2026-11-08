import React from "react";
import QuickViewModifierOption from "./QuickViewModifierOption";

export default function QuickViewModifierGroup({
  group,
  gi,
  selections,
  missingRequired = [],
  stagger,
  handleSelection,
  handleIncrement,
  handleDecrement
}) {
  const groupSel = selections[group.name];
  const label = group.name.replace(/-/g, " ");
  const isMissing = missingRequired.includes(group.name);

  return (
    <div
      id={`modifier-group-${gi}`}
      style={stagger(3 + gi)}
      className={`bg-white transition-all duration-200 ${
        isMissing ? 'p-3 rounded-2xl bg-amber-50/50 border border-amber-200/90 shadow-2xs' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
        <div>
          <p className="text-base font-bold text-neutral-900 capitalize">{label}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {group.allow_quantity ? (
              <>
                {group.min > 0
                  ? `Elige mín. ${group.min} - máx. ${group.max} porciones`
                  : `Límite: hasta ${group.max} porciones`}
                {groupSel && groupSel.length > 0 && (
                  <span className="ml-1.5 font-bold text-brand-primary">
                    ({groupSel.length}/{group.max} elegidas)
                  </span>
                )}
              </>
            ) : group.min > 0 && group.min === group.max ? (
              `Elige ${group.min} opción`
            ) : group.min > 0 ? (
              `Mín. ${group.min} - Máx. ${group.max}`
            ) : group.max === 999 ? (
              "Elige extras (opcional)"
            ) : (
              `Límite: ${group.max} extras`
            )}
          </p>
        </div>
        {group.min > 0 ? (
          (groupSel || []).length >= group.min ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              <span>✓</span> Listo
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
              <span>*</span> Obligatorio {group.min === 1 ? '(Elige 1)' : `(Elige ${group.min})`}
            </span>
          )
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-50 px-2 py-1 rounded border border-neutral-100">
            Opcional
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {group.items.map((item) => (
          <QuickViewModifierOption
            key={item.id}
            item={item}
            group={group}
            groupSel={groupSel || []}
            isMissing={isMissing}
            handleSelection={handleSelection}
            handleIncrement={handleIncrement}
            handleDecrement={handleDecrement}
          />
        ))}
      </div>
    </div>
  );
}
