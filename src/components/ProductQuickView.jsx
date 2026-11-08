/* @refresh reset */
import React, { useEffect, useRef, useState } from "react";
import Portal from "./Portal";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMenuData } from "@/context/MenuDataContext";
import { trackAnalyticsEvent } from "@/utils/analytics";
import { getProductImage } from "@/utils/images";
import { useProductModifierGroups } from "./product-quick-view/hooks/useProductModifierGroups";
import { useProductQuickViewLogic } from "./product-quick-view/hooks/useProductQuickViewLogic";
import QuickViewMedia from "./product-quick-view/subcomponents/QuickViewMedia";
import QuickViewHeader from "./product-quick-view/subcomponents/QuickViewHeader";
import QuickViewModifierGroup from "./product-quick-view/subcomponents/QuickViewModifierGroup";
import QuickViewSpecialNotes from "./product-quick-view/subcomponents/QuickViewSpecialNotes";
import QuickViewFooter from "./product-quick-view/subcomponents/QuickViewFooter";

export default function ProductQuickView({ open: isOpen, product, onClose, onAdd }) {
  // ── All hooks MUST be called unconditionally, in the same order, every render ──
  useLockBodyScroll(isOpen);

  const menuData = useMenuData();
  const modalRef = useRef(null);
  const lastFocused = useRef(null);
  const scrollContainerRef = useRef(null);

  // Selections per group: required → string id, optional → array of ids
  const [selections, setSelections] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Reset selections and notes when product changes
  const productId = product?.id ?? null;
  useEffect(() => {
    setSelections({});
    setSpecialInstructions("");
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [productId, isOpen]);

  // Track product view in analytics
  useEffect(() => {
    if (isOpen && product?.id) {
      try {
        trackAnalyticsEvent('product_view', {
          brandId: product.brand_id,
          productId: product.id,
          productName: product.name,
        });
      } catch {}
    }
  }, [isOpen, product?.id, product?.brand_id, product?.name]);

  // Keyboard / focus trap
  useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = document.activeElement;
    const el = modalRef.current;
    el?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const focusables = el?.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Derived values — safe with optional chaining when product is null
  const title = product?.title || product?.name || "";
  const subtitle = product?.subtitle || product?.description || product?.desc || "";
  const image = product ? getProductImage(product) : null;

  const productAllergens = (product?.tags || [])
    .map((tagName) => (menuData?.allergens || []).find((a) => a.name === tagName))
    .filter(Boolean);

  // Modifier groups resolution hook
  const { groups } = useProductModifierGroups({
    isOpen,
    product,
    menuData,
    selections,
    setSelections,
    scrollContainerRef
  });

  // Financial and selection logic hook
  const {
    extraPrice,
    basePrice,
    finalPrice,
    isOutOfStock,
    isScheduleRestricted,
    scheduleNotice,
    missingRequired,
    canAdd,
    handleIncrement,
    handleDecrement,
    handleSelection,
    handleAdd
  } = useProductQuickViewLogic({
    product,
    groups,
    selections,
    setSelections,
    specialInstructions,
    image,
    onAdd,
    onClose
  });

  const stagger = (i) => ({
    animation: "fadeUp 0.35s ease-out forwards",
    animationDelay: `${i * 60}ms`,
    opacity: 0,
  });

  // Early exit if modal is closed or no product is provided
  if (!isOpen || !product) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => onClose?.()}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className="pointer-events-auto relative z-[110] w-full max-w-md md:max-w-4xl focus-visible:outline-none"
        >
          {/* Mobile bottom-sheet style, Desktop center-card style */}
          <div className="relative bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90dvh] md:h-[80vh] rounded-t-3xl sm:rounded-3xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Cerrar"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md z-20 transition-all border border-white/20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Left Column: Image (Desktop) / Top Image (Mobile) */}
            <QuickViewMedia
              image={image}
              title={title}
              isOutOfStock={isOutOfStock}
              staggerStyle={stagger(0)}
            />

            {/* Right Column: Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full md:w-7/12 lg:w-1/2 bg-white relative">
              <div ref={scrollContainerRef} className="flex-1 p-6 md:p-8 overflow-y-auto">
                <QuickViewHeader
                  title={title}
                  subtitle={subtitle}
                  product={product}
                  productAllergens={productAllergens}
                  isScheduleRestricted={isScheduleRestricted}
                  scheduleNotice={scheduleNotice}
                  stagger={stagger}
                />

                {/* Modifier groups */}
                <div className="mt-5 space-y-6">
                  {groups.map((group, gi) => (
                    <QuickViewModifierGroup
                      key={group.name}
                      group={group}
                      gi={gi}
                      selections={selections}
                      missingRequired={missingRequired}
                      stagger={stagger}
                      handleSelection={handleSelection}
                      handleIncrement={handleIncrement}
                      handleDecrement={handleDecrement}
                    />
                  ))}

                  {/* Instrucciones especiales para cocina */}
                  <QuickViewSpecialNotes
                    specialInstructions={specialInstructions}
                    setSpecialInstructions={setSpecialInstructions}
                  />
                </div>
              </div>

              {/* Fixed Footer for Price and Button */}
              <QuickViewFooter
                product={product}
                basePrice={basePrice}
                extraPrice={extraPrice}
                finalPrice={finalPrice}
                canAdd={canAdd}
                isOutOfStock={isOutOfStock}
                isScheduleRestricted={isScheduleRestricted}
                scheduleNotice={scheduleNotice}
                missingRequired={missingRequired}
                handleAdd={handleAdd}
                staggerStyle={stagger(4 + groups.length)}
              />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
