import React from "react";
import { Icon } from "@iconify/react";
import AAImage from "@/components/ui/AAImage";
import { formatCOP } from "@/utils/money";
import { getProductImage } from "@/utils/images";
import { getItemUnit } from "@/context/CartContext";
import { renderOptionsPills } from "../helpers/cartHelpers";

export default function CartItemList({
  items = [],
  isPOSMode,
  productsMap,
  allDBProducts = [],
  removeItem,
  handleDecrement,
  increment,
  openNoteIndex,
  setOpenNoteIndex,
  setItemNote,
  onClose,
  note,
  setNote,
  upsellProducts = [],
  handleAddUpsell,
  showFulfillmentSelector,
  fulfillmentType,
  currentLocation,
}) {
  return (
    <div
      className={`flex-1 min-h-0 overflow-y-auto bg-neutral-50/50 sm:bg-white relative flex flex-col custom-scrollbar ${
        showFulfillmentSelector ? "hidden md:flex" : "flex"
      }`}
    >
      {/* Fulfillment Type Selector / Delivery Radius info */}
      {!isPOSMode && items.length > 0 && fulfillmentType === "delivery" && currentLocation?.delivery_radius_km && (
        <div className="px-4 pt-4 sm:px-6">
          <div className="mb-4 bg-[#cba258]/10 border border-[#cba258]/20 rounded-xl p-3 flex items-start gap-3">
            <div className="bg-[#cba258] p-1.5 rounded-lg flex-shrink-0">
              <Icon icon="heroicons:information-circle" className="text-white text-lg" />
            </div>
            <div>
              <p className="text-[13px] text-[#8a6d3b] font-bold leading-snug">
                Cobertura de Domicilios
              </p>
              <p className="text-xs text-[#8a6d3b]/80 font-medium mt-0.5">
                Estamos entregando en un radio de{" "}
                <span className="font-bold text-[#8a6d3b]">{currentLocation.delivery_radius_km}km</span> desde esta sede.
              </p>
            </div>
          </div>
        </div>
      )}

      {items.length ? (
        <div className="flex flex-col">
          {items.map((it, idx) => {
            const unit = getItemUnit(it);
            const qty = Number(it.qty || 1);
            const lineTotal = unit * qty;
            const dbProduct = allDBProducts.find((p) => p.id === (it.productId || it.id));
            const targetProduct = productsMap?.get(String(it.productId || it.id)) || dbProduct;
            const isItemRestricted = !isPOSMode && targetProduct?.is_schedule_available === false;
            const itemForImage = { ...it, image_url: it.image_url || it.image || dbProduct?.image_url };
            const imageSrc = getProductImage(itemForImage);

            return (
              <div
                key={idx}
                className={`group relative border-b border-neutral-100/80 p-4 sm:px-6 sm:py-4 transition-colors ${
                  isItemRestricted ? "bg-amber-50/50 hover:bg-amber-50/70" : "bg-white hover:bg-white/90"
                }`}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  {imageSrc ? (
                    <AAImage
                      src={imageSrc}
                      alt=""
                      aria-hidden="true"
                      className={`h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl object-cover shadow-sm bg-neutral-100 border border-neutral-200/50 ${
                        isItemRestricted ? "opacity-75 saturate-50" : ""
                      }`}
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center">
                      <Icon icon="heroicons:photo" className="w-6 h-6 text-neutral-300" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 pr-2">
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
                          {it.name}
                        </h3>
                        {it.variant && <p className="text-sm text-neutral-500 mt-0.5">{it.variant}</p>}
                        {isItemRestricted && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-md">
                            <Icon icon="heroicons:clock" className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Fuera de horario{" "}
                              {targetProduct?.schedule_label ? `(${targetProduct.schedule_label})` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="whitespace-nowrap font-extrabold text-[#2f4131] sm:text-lg">
                          {formatCOP(lineTotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem?.(it)}
                          className="mt-2 text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Modifiers / Options */}
                    <div className="mt-2">{renderOptionsPills(it.options)}</div>

                    {/* Stepper & Note Button */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                        <button
                          type="button"
                          onClick={() => handleDecrement(it, idx)}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm sm:text-base font-bold text-neutral-900 tabular-nums">
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => increment?.(idx)}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none cursor-pointer"
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
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
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
      )}

      {/* Nota general */}
      {items.length > 0 && (
        <div className="p-4 sm:px-6 sm:py-4 pb-6 sm:pb-6 mt-auto border-t border-neutral-100 bg-white">
          <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200/60 focus-within:ring-[#2f4131]/30 focus-within:bg-white transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="heroicons:document-text" className="h-4 w-4 text-neutral-400" />
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Instrucciones Especiales
              </label>
            </div>
            <textarea
              value={note ?? ""}
              onChange={(e) => setNote?.(e.target.value)}
              placeholder="Ej: Tráiganlo cuando lleguemos todos, pago en efectivo..."
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none font-medium min-h-[50px] resize-none"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Upselling Banner Mobile (Inside scrollable left column) */}
      <div className="md:hidden mt-auto">
        {upsellProducts.length > 0 && !showFulfillmentSelector && (
          <div className="bg-amber-50/50 border-t border-amber-100/50 py-4 px-4 sm:px-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-[#cba258] flex items-center gap-1.5">
                <Icon icon="heroicons:sparkles" className="text-lg" />
                ¿Acompañas tu pedido con esto?
              </h4>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scrollbar">
              {upsellProducts.map((prod) => {
                const imgSrc = getProductImage(prod);
                const fallbackEmoji = prod.subcategory?.includes("Smoothie")
                  ? "🫐"
                  : prod.subcategory?.includes("Cafetería")
                  ? "☕"
                  : prod.subcategory?.includes("Autor")
                  ? "🧊"
                  : prod.categorySlug === "boku-snacks"
                  ? "🥟"
                  : prod.categorySlug === "boku-postres" ||
                    prod.subcategory?.includes("Postres") ||
                    prod.subcategory?.includes("Trufas")
                  ? "🍫"
                  : prod.categorySlug === "bebidas"
                  ? "🥤"
                  : "✨";

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl p-2.5 shadow-sm border border-amber-100/60 flex flex-col items-center flex-shrink-0 w-36 snap-start"
                  >
                    <div className="w-full h-20 rounded-xl overflow-hidden mb-2 bg-neutral-100 border border-neutral-200/40 flex items-center justify-center shrink-0 relative">
                      {imgSrc ? (
                        <AAImage src={imgSrc} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50/70 flex flex-col items-center justify-center text-amber-700/70 p-1">
                          <span className="text-2xl mb-0.5">{fallbackEmoji}</span>
                          <span className="text-[9px] font-bold text-amber-800/60 uppercase tracking-wider text-center line-clamp-1">
                            {prod.subcategory || "BOKU"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full mb-2">
                      <p className="text-[12px] font-bold text-neutral-900 line-clamp-1 leading-snug" title={prod.name}>
                        {prod.name}
                      </p>
                      <p className="text-[11px] font-extrabold text-[#2f4131] mt-0.5">{formatCOP(prod.price)}</p>
                    </div>
                    <button
                      onClick={() => handleAddUpsell(prod)}
                      className="w-full h-7 rounded-xl bg-amber-100 text-[#cba258] flex items-center justify-center text-[11px] font-bold shrink-0 hover:bg-[#cba258] hover:text-white transition-all active:scale-95 gap-1 cursor-pointer"
                    >
                      <Icon icon="heroicons:plus" className="text-xs" /> Agregar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
