import React from "react";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";
import { getProductImage } from "@/utils/images";
import { formatCOP } from "@/utils/money";
import { getItemUnit } from "@/context/CartContext";
import { MILK_OPTIONS } from "@/config/milkOptions";
import { translateGroup } from "@/utils/formatters";

const getMilkLabel = (milkId) => {
  return MILK_OPTIONS.find((m) => m.id === milkId)?.label || milkId;
};

const renderOptionsPills = (opts) => {
  if (!opts) return null;
  const parts = [];
  if (Array.isArray(opts)) {
    parts.push(...opts);
  } else if (typeof opts === "object") {
    for (const [k, v] of Object.entries(opts)) {
      if (Array.isArray(v)) {
        if (v.length > 0) {
          parts.push(`${translateGroup(k)}: ${v.join(", ")}`);
        }
      } else if (v) {
        parts.push(`${translateGroup(k)}: ${v}`);
      }
    }
  }

  if (!parts.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {parts.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] lg:text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200/80 shadow-sm"
        >
          {p}
        </span>
      ))}
    </div>
  );
};

export default function CartDrawerItemList({
  items = [],
  removeItem,
  increment,
  handleDecrement,
  openNoteIndex,
  setOpenNoteIndex,
  setItemNote,
  onClose
}) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="rounded-full bg-neutral-50 p-6 mb-5 ring-1 ring-neutral-200/50">
          <Icon icon="heroicons:shopping-bag" className="h-12 w-12 text-neutral-300" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Tu carrito está vacío</h3>
        <p className="text-neutral-500 max-w-[260px] leading-relaxed">
          ¿Aún no decides? Explora nuestro menú y encuentra algo delicioso.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-full bg-[#2f4131] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#2f4131]/20 hover:bg-[#202c21] hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          Ver el menú
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((it, idx) => {
        const unit = getItemUnit(it);
        const qty = Number(it.qty || 1);
        const lineTotal = unit * qty;
        return (
          <div
            key={idx}
            className="group relative border-b border-neutral-100/80 bg-white p-4 md:px-6 md:py-4 transition-colors hover:bg-neutral-50/50"
          >
            <div className="flex items-start gap-4 md:gap-5">
              <AAImage
                src={getProductImage(it)}
                alt=""
                aria-hidden="true"
                className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0 rounded-2xl object-cover shadow-sm bg-neutral-100 border border-neutral-200/50"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-base md:text-lg font-bold text-neutral-900 leading-tight">
                      {it.name}
                    </h3>
                    {it.variant && (
                      <p className="text-sm text-neutral-500 mt-0.5">{it.variant}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="whitespace-nowrap font-extrabold text-[#2f4131] md:text-lg">
                      {formatCOP(lineTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem?.(it)}
                      className="mt-2 text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Opciones extras (Modifiers) */}
                <div className="mt-2">{renderOptionsPills(it.options)}</div>

                {/* Leche */}
                {it.milk && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-[#2f4131]/5 px-2 py-1 text-xs font-medium text-[#2f4131] border border-[#2f4131]/10">
                      🥛 Leche: {getMilkLabel(it.milk)}
                    </span>
                  </div>
                )}

                {/* Controles de cantidad y Notas */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => handleDecrement(it, idx)}
                      className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none cursor-pointer"
                      aria-label="Restar"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-sm md:text-base font-bold text-neutral-900 tabular-nums">
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => increment?.(idx)}
                      className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none cursor-pointer"
                      aria-label="Sumar"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenNoteIndex(openNoteIndex === idx ? null : idx)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      it.note || openNoteIndex === idx
                        ? "text-[#cba258] bg-[#cba258]/10"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <Icon icon="heroicons:pencil" className="h-3.5 w-3.5" />
                    {it.note ? "Editar nota" : "Añadir nota"}
                  </button>
                </div>

                {/* Nota Toggleable */}
                {(openNoteIndex === idx || it.note) && (
                  <div className="mt-3 overflow-hidden rounded-xl bg-amber-50/80 p-2.5 ring-1 ring-amber-200/50">
                    <input
                      type="text"
                      value={it.note || ""}
                      onChange={(e) => setItemNote(idx, e.target.value)}
                      placeholder="Ejem: sin cebolla, sin pitillo..."
                      className="w-full bg-transparent p-1 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none font-medium"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
