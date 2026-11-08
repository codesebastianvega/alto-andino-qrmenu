import React from "react";
import { formatCOP } from "@/utils/money";

export default function QuickViewModifierOption({
  item,
  group,
  groupSel = [],
  isMissing,
  handleSelection,
  handleIncrement,
  handleDecrement
}) {
  const itemPrice = item.selling_price || item.price || 0;
  const isItemOut = item.is_out || item.stock_status === 'out';
  const optPortions = item.available_portions !== null && item.available_portions !== undefined ? Number(item.available_portions) : null;
  const isLastOpt = !isItemOut && optPortions === 1;
  const itemQty = groupSel.filter((id) => id === item.id).length;
  const isSelected = itemQty > 0;

  const baseClasses = "flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 w-full text-left select-none";
  
  const stateClasses = isItemOut
    ? "border-neutral-200 bg-neutral-100/70 opacity-60 cursor-not-allowed text-neutral-400"
    : isSelected
    ? "border-brand-primary bg-brand-primary/5 shadow-sm ring-1 ring-brand-primary cursor-pointer"
    : isMissing
    ? "border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer"
    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer";

  return (
    <div
      role="button"
      tabIndex={isItemOut ? -1 : 0}
      aria-disabled={isItemOut}
      onClick={() => handleSelection(group.name, item.id)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isItemOut) {
          e.preventDefault();
          handleSelection(group.name, item.id);
        }
      }}
      className={`${baseClasses} ${stateClasses}`}
    >
      <div className="flex items-center gap-3">
        {item.image_url ? (
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border shadow-sm shrink-0 transition-all overflow-hidden ${isSelected ? 'border-brand-primary scale-105 ring-1 ring-brand-primary/50' : 'border-neutral-100'}`}>
            <img 
              src={item.image_url} 
              alt={item.name} 
              className={`w-full h-full object-cover rounded-xl ${isItemOut ? 'grayscale' : ''}`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {isSelected && (
              <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-brand-primary rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                {group.allow_quantity ? `x${itemQty}` : '✓'}
              </div>
            )}
          </div>
        ) : item.emoji ? (
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border shadow-sm shrink-0 transition-all ${isSelected ? 'border-brand-primary scale-105 ring-1 ring-brand-primary/50' : 'border-neutral-100'}`}>
            <span className={`text-2xl leading-none filter drop-shadow-sm ${isItemOut ? 'grayscale opacity-60' : ''}`}>{item.emoji}</span>
            {isSelected && (
              <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-brand-primary rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                {group.allow_quantity ? `x${itemQty}` : '✓'}
              </div>
            )}
          </div>
        ) : group.allow_quantity && isSelected ? (
          <div className="min-w-[24px] h-6 px-1.5 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-[11px] shadow-sm shrink-0">
            x{itemQty}
          </div>
        ) : group.max === 1 ? (
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-brand-primary' : isItemOut ? 'border-neutral-200 bg-neutral-200' : 'border-neutral-300'}`}>
            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-brand-primary" />}
          </div>
        ) : (
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${isSelected ? 'border-brand-primary bg-brand-primary' : isItemOut ? 'border-neutral-200 bg-neutral-200' : 'border-neutral-300'}`}>
            {isSelected && (
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[13px] font-medium ${isItemOut ? 'line-through text-neutral-400' : isSelected ? 'text-brand-primary font-bold' : 'text-neutral-700'}`}>
              {item.name}
            </span>
            {isItemOut && (
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shadow-2xs">
                Agotado
              </span>
            )}
            {isLastOpt && (
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 animate-pulse">
                Última porción
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Controls and Price */}
      {isItemOut ? (
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-200/50 px-2 py-0.5 rounded">
          Agotado
        </span>
      ) : group.allow_quantity && itemQty > 0 ? (
        <div className="flex items-center gap-2.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          {itemPrice > 0 && (
            <div className="flex flex-col items-end leading-tight mr-1">
              {itemQty > 1 && (
                <span className="text-[10px] text-neutral-400 font-medium">
                  {itemQty} × {formatCOP(itemPrice)}
                </span>
              )}
              <span className="text-[13px] font-bold text-brand-primary">
                +{formatCOP(itemPrice * itemQty)}
              </span>
            </div>
          )}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 shadow-2xs">
            <button
              type="button"
              onClick={(e) => handleDecrement(group.name, item.id, e)}
              aria-label="Disminuir cantidad"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-700 hover:bg-neutral-50 active:scale-95 shadow-2xs font-bold text-sm transition-all"
            >
              -
            </button>
            <span className="w-6 text-center text-xs font-black text-neutral-900">
              {itemQty}
            </span>
            <button
              type="button"
              onClick={(e) => handleIncrement(group.name, item.id, e)}
              disabled={groupSel.length >= group.max}
              aria-label="Aumentar cantidad"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 active:scale-95 disabled:opacity-40 disabled:hover:bg-brand-primary shadow-2xs font-bold text-sm transition-all"
            >
              +
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {group.included_count !== undefined && group.included_count !== null ? (
            <div className="flex flex-col items-end shrink-0 leading-tight">
              {isSelected && groupSel.indexOf(item.id) < group.included_count ? (
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Incluida
                </span>
              ) : isSelected && groupSel.indexOf(item.id) >= group.included_count ? (
                <span className="text-[12px] font-black text-brand-primary">
                  +{formatCOP(item.extra_price || itemPrice)}
                </span>
              ) : groupSel.length >= group.included_count ? (
                <span className="text-[12px] font-bold text-neutral-600">
                  +{formatCOP(item.extra_price || itemPrice)}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Incluida
                </span>
              )}
            </div>
          ) : itemPrice > 0 ? (
            <div className="flex flex-col items-end shrink-0 leading-tight">
              {Number(item.extra_price) > itemPrice && (
                <span className="text-[11px] font-medium text-neutral-400 line-through">
                  {formatCOP(item.extra_price)}
                </span>
              )}
              <span
                className={`text-[13px] font-bold ${
                  isSelected
                    ? "text-brand-primary"
                    : Number(item.extra_price) > itemPrice
                    ? "text-emerald-600"
                    : "text-neutral-500"
                }`}
              >
                +{formatCOP(itemPrice)}
              </span>
            </div>
          ) : null}
          {group.allow_quantity && (
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 text-sm font-black border border-neutral-200/60 shadow-2xs">
              +
            </div>
          )}
        </div>
      )}
    </div>
  );
}
