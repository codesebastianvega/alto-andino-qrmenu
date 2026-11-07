import React from "react";
import { Icon } from "@iconify/react";
import AAImage from "@/components/ui/AAImage";
import { formatCOP } from "@/utils/money";
import { getProductImage } from "@/utils/images";
import CartCheckoutFooter from "./CartCheckoutFooter";

export default function CartDesktopSidebar({
  items = [],
  upsellProducts = [],
  showFulfillmentSelector,
  handleAddUpsell,
  checkoutProps,
}) {
  if (items.length === 0) return null;

  return (
    <div className="hidden md:flex w-full md:w-[390px] lg:w-[440px] flex-shrink-0 flex-col bg-neutral-50 md:border-l border-neutral-200 z-10 relative h-full min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
      {/* Upselling Banner (Scrollable) */}
      {upsellProducts.length > 0 && !showFulfillmentSelector && (
        <div className="bg-amber-50/40 py-5 px-4 sm:px-6 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-[#cba258] flex items-center gap-1.5 leading-tight">
              <Icon icon="heroicons:sparkles" className="text-lg" />
              ¿Acompañas tu pedido con esto?
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
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
                  className="bg-white rounded-2xl p-3 shadow-sm border border-amber-100/60 flex items-center gap-3 transition-colors hover:border-amber-200"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/40 shrink-0 flex items-center justify-center">
                    {imgSrc ? (
                      <AAImage src={imgSrc} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50/70 flex items-center justify-center text-xl">
                        {fallbackEmoji}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate" title={prod.name}>
                      {prod.name}
                    </p>
                    <p className="text-xs font-semibold text-[#2f4131]">{formatCOP(prod.price)}</p>
                  </div>
                  <button
                    onClick={() => handleAddUpsell(prod)}
                    className="w-8 h-8 rounded-full bg-amber-100 text-[#cba258] flex items-center justify-center shrink-0 hover:bg-[#cba258] hover:text-white transition-colors active:scale-95 cursor-pointer"
                  >
                    <Icon icon="heroicons:plus" className="text-lg" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer con formulario y checkout (Scrollable) */}
      <div className="flex-1 min-h-0">
        <CartCheckoutFooter idSuffix="desktop" {...checkoutProps} />
      </div>
    </div>
  );
}
