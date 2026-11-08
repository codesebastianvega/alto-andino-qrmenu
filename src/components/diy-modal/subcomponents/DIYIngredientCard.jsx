import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '@/utils/money';
import { getDefaultExtraPrice } from '../utils/diyCategoryTheme';

export default function DIYIngredientCard({
  item,
  group,
  groupSel = [],
  theme,
  isLimitReached,
  handleCardClick,
  handleIncrement,
  handleDecrement
}) {
  const itemQty = groupSel.filter((id) => id === item.id).length;
  const isSelected = itemQty > 0;
  const itemPrice = item.selling_price || item.price || 0;
  let itemExtraPrice =
    item.extra_price !== undefined && item.extra_price !== null
      ? Number(item.extra_price)
      : itemPrice;

  if (itemPrice === 0 && itemExtraPrice === 0 && (group.allow_quantity || group.max > 1)) {
    itemExtraPrice = getDefaultExtraPrice(group.name, itemPrice);
  }
  const isMulti = group.allow_quantity || group.max > 1;

  return (
    <div
      onClick={() => handleCardClick?.(group, item)}
      className={`group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden border-2 text-left transition-all duration-200 select-none cursor-pointer ${
        isSelected
          ? 'border-[#2f4131] bg-[#2f4131]/[0.02] shadow-md ring-2 ring-[#2f4131]/15 scale-[1.01]'
          : 'border-neutral-200/70 shadow-xs hover:border-[#2f4131]/40 hover:shadow-md active:scale-[0.98]'
      }`}
    >
      {/* Quantity Badge on Top Right */}
      {itemQty > 0 ? (
        <div className="absolute top-2.5 right-2.5 z-10 min-w-6 h-6 px-1.5 rounded-full bg-[#2f4131] text-white flex items-center justify-center font-black text-xs shadow-md">
          x{itemQty}
        </div>
      ) : (
        <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center text-transparent group-hover:border-neutral-400 group-hover:text-neutral-600 transition-colors">
          <Icon icon="heroicons:plus-20-solid" className="text-sm font-black" />
        </div>
      )}

      {/* Thumbnail / Visual Area */}
      <div
        className={`h-20 sm:h-24 w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${
          isSelected ? 'from-[#2f4131]/15 to-transparent' : theme.bg
        }`}
      >
        {item.image_url ? (
          <>
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-block';
              }}
            />
            <span className="hidden text-3xl sm:text-4xl filter drop-shadow-sm">
              {item.emoji || theme.icon}
            </span>
          </>
        ) : (
          <span className="text-3xl sm:text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-200">
            {item.emoji || theme.icon}
          </span>
        )}
      </div>

      {/* Content Details */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <span
            className={`font-black text-xs sm:text-sm leading-snug line-clamp-2 ${
              isSelected ? 'text-[#2f4131]' : 'text-neutral-800'
            }`}
          >
            {item.name}
          </span>

          {/* Price Tag Pill */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {itemPrice > 0 ? (
              <span className="inline-block text-[11px] font-black text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                +{formatCOP(itemPrice)}
              </span>
            ) : (
              <span className="inline-block text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                ✓ Incluido
              </span>
            )}

            {itemPrice === 0 && itemExtraPrice > 0 && (
              <span className="text-[9px] font-bold text-neutral-400">
                (Extra +{formatCOP(itemExtraPrice)})
              </span>
            )}
          </div>
        </div>

        {/* Stepper Controls for Multi-Quantity */}
        {isMulti && itemQty > 0 && (
          <div
            className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/90 rounded-xl p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleDecrement?.(group.name, item.id)}
              className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-200 text-neutral-800 grid place-items-center font-bold text-sm shadow-xs active:scale-90 transition-all border border-neutral-200 cursor-pointer"
              aria-label="Quitar una porción"
            >
              <Icon icon="heroicons:minus-20-solid" />
            </button>

            <span className="font-black text-xs text-[#2f4131] px-1">
              {itemQty} {itemQty === 1 ? 'porción' : 'porciones'}
            </span>

            <button
              type="button"
              onClick={() => handleIncrement?.(group.name, item.id)}
              disabled={isLimitReached}
              className="w-7 h-7 rounded-lg bg-[#2f4131] hover:bg-[#202c21] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white grid place-items-center font-bold text-sm shadow-xs active:scale-90 transition-all cursor-pointer"
              aria-label="Agregar otra porción"
            >
              <Icon icon="heroicons:plus-20-solid" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
