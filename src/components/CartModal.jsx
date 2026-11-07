import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import Portal from "./Portal";
import { formatCOP } from "@/utils/money";
import { useCartCheckout } from "./cart/hooks/useCartCheckout";
import CartItemList from "./cart/subcomponents/CartItemList";
import CartCheckoutFooter from "./cart/subcomponents/CartCheckoutFooter";
import CartDesktopSidebar from "./cart/subcomponents/CartDesktopSidebar";
import CartSuccessView from "./cart/subcomponents/CartSuccessView";
import ClearCartConfirmModal from "./cart/subcomponents/ClearCartConfirmModal";

export default function CartModal({ open, onClose }) {
  const checkout = useCartCheckout({ open, onClose });

  const {
    items,
    total,
    note,
    setNote,
    increment,
    handleDecrement,
    removeItem,
    setItemNote,
    openNoteIndex,
    setOpenNoteIndex,
    brandSlug,
    menuBrand,
    settings,
    currentLocation,
    fulfillmentModes,
    fulfillmentType,
    setFulfillmentType,
    isDarkKitchen,
    deliveryAddress,
    setDeliveryAddress,
    setDeliveryLocationInfo,
    deliveryNotes,
    setDeliveryNotes,
    scheduledTime,
    setScheduledTime,
    isLeadRequired,
    isLeadValid,
    showFulfillmentSelector,
    setShowFulfillmentSelector,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    includeTip,
    setIncludeTip,
    isTipEnabled,
    tipPercentage,
    serviceFeeAmount,
    packagingFeeTotal,
    deliveryFee,
    isFreeDeliveryPromoActive,
    isMealPlanDeliveryCovered,
    freeDeliveryPromo,
    finalTotal,
    storeStatusInfo,
    isWithinOrderLimit,
    hasRestrictedItems,
    restrictedCartItems,
    productsMap,
    allDBProducts,
    initialMesa,
    appliedCoupon,
    couponInput,
    setCouponInput,
    isApplyingCoupon,
    isCouponAccordionOpen,
    setIsCouponAccordionOpen,
    availableCouponPromos,
    effectivePromo,
    automaticDiscountPromo,
    discountAmount,
    activeMemberPlanSession,
    skipPlanCreditForOrder,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleRestoreMealPlanCredit,
    availablePaymentTypes,
    customerPaymentType,
    setCustomerPaymentType,
    cashTenderedType,
    setCashTenderedType,
    customCashAmount,
    setCustomCashAmount,
    effectiveCashAmount,
    cashChange,
    transferMethods,
    paymentMethod,
    setPaymentMethod,
    activeMethods,
    isPOSMode,
    isPaid,
    setIsPaid,
    upsellProducts,
    handleAddUpsell,
    handleConfirmOrder,
    isSubmitting,
    showSuccess,
    setShowSuccess,
    lastOrderId,
    confirmedOrderSnapshot,
    resetStates,
    clearCart,
    confirmingClear,
    setConfirmingClear,
    handleClearRequest,
    clearCartNow,
    confirmBtnRef,
  } = checkout;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (confirmingClear) setConfirmingClear(false);
        else onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirmingClear, setConfirmingClear]);

  if (!open) return null;

  const checkoutFooterProps = {
    items,
    appliedCoupon,
    discountAmount,
    formatCOP,
    handleRemoveCoupon,
    skipPlanCreditForOrder,
    activeMemberPlanSession,
    handleRestoreMealPlanCredit,
    automaticDiscountPromo,
    isCouponAccordionOpen,
    setIsCouponAccordionOpen,
    availableCouponPromos,
    handleApplyCoupon,
    couponInput,
    setCouponInput,
    isApplyingCoupon,
    total,
    effectivePromo,
    packagingFeeTotal,
    fulfillmentType,
    deliveryFee,
    isFreeDeliveryPromoActive,
    isMealPlanDeliveryCovered,
    freeDeliveryPromo,
    isTipEnabled,
    includeTip,
    setIncludeTip,
    tipPercentage,
    serviceFeeAmount,
    finalTotal,
    isPOSMode,
    storeStatusInfo,
    hasRestrictedItems,
    restrictedCartItems,
    isWithinOrderLimit,
    showFulfillmentSelector,
    setShowFulfillmentSelector,
    initialMesa,
    isDarkKitchen,
    handleConfirmOrder,
    isSubmitting,
    isLeadValid,
    setFulfillmentType,
    scheduledTime,
    setScheduledTime,
    fulfillmentModes,
    isLeadRequired,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    setDeliveryLocationInfo,
    deliveryNotes,
    setDeliveryNotes,
    currentLocation,
    availablePaymentTypes,
    customerPaymentType,
    setCustomerPaymentType,
    cashTenderedType,
    setCashTenderedType,
    customCashAmount,
    setCustomCashAmount,
    effectiveCashAmount,
    cashChange,
    transferMethods,
    isPaid,
    setIsPaid,
    activeMethods,
    paymentMethod,
    setPaymentMethod,
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center sm:p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />

        {/* Modal Window */}
        <div
          className={`relative w-full h-full max-h-full ${
            items.length > 0
              ? "sm:h-[88vh] sm:max-h-[860px] sm:min-h-[480px]"
              : "sm:h-auto sm:max-h-[85vh]"
          } ${showSuccess ? "sm:min-h-[600px]" : ""} rounded-none sm:rounded-[32px] bg-white shadow-2xl flex flex-col sm:max-w-2xl md:max-w-4xl lg:max-w-5xl transition-all overflow-hidden`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 pb-3 pt-4 sm:px-6 sm:pt-6 sm:pb-4 border-b border-neutral-100"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#2f4131]/10 p-2 rounded-full hidden sm:flex items-center justify-center">
                <Icon icon="heroicons:shopping-cart" className="text-[24px] text-[#2f4131]" />
              </div>
              {showFulfillmentSelector && (
                <button
                  type="button"
                  onClick={() => setShowFulfillmentSelector(false)}
                  className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  <Icon icon="heroicons:arrow-left" className="text-base" />
                  <span>Volver</span>
                </button>
              )}
              <div>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900">
                  {showFulfillmentSelector ? "Entrega y Pago" : "Tu Pedido"}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium sm:mt-0.5">
                  {showFulfillmentSelector
                    ? "Completa tus datos de despacho"
                    : `${items.length} ${items.length === 1 ? "artículo" : "artículos"}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRequest}
                  className="rounded-full p-2.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors hidden sm:flex cursor-pointer"
                  aria-label="Vaciar carrito"
                  title="Vaciar carrito"
                >
                  <Icon icon="heroicons:trash" className="text-[20px]" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <Icon icon="heroicons:x-mark" className="text-[20px] sm:text-[24px]" />
              </button>
            </div>
          </div>

          {/* Body Container */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row relative">
            {/* Left Column (Items & Mobile Upsell) */}
            <CartItemList
              items={items}
              isPOSMode={isPOSMode}
              productsMap={productsMap}
              allDBProducts={allDBProducts}
              removeItem={removeItem}
              handleDecrement={handleDecrement}
              increment={increment}
              openNoteIndex={openNoteIndex}
              setOpenNoteIndex={setOpenNoteIndex}
              setItemNote={setItemNote}
              onClose={onClose}
              note={note}
              setNote={setNote}
              upsellProducts={upsellProducts}
              handleAddUpsell={handleAddUpsell}
              showFulfillmentSelector={showFulfillmentSelector}
              fulfillmentType={fulfillmentType}
              currentLocation={currentLocation}
            />

            {/* Right Column (Desktop Upselling + Footer) */}
            <CartDesktopSidebar
              items={items}
              upsellProducts={upsellProducts}
              showFulfillmentSelector={showFulfillmentSelector}
              handleAddUpsell={handleAddUpsell}
              checkoutProps={checkoutFooterProps}
            />

            {/* Mobile Checkout Form (Full height view when in checkout step) */}
            {showFulfillmentSelector && (
              <div className="md:hidden flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white">
                <CartCheckoutFooter idSuffix="mobile" {...checkoutFooterProps} />
              </div>
            )}
          </div>

          {/* Mobile Footer (Only when in items review step) */}
          {!showFulfillmentSelector && items.length > 0 && (
            <div className="md:hidden flex-shrink-0 bg-white border-t border-neutral-100 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
              <CartCheckoutFooter idSuffix="mobile" {...checkoutFooterProps} />
            </div>
          )}

          {/* Full-drawer Success View */}
          <CartSuccessView
            showSuccess={showSuccess}
            isPOSMode={isPOSMode}
            lastOrderId={lastOrderId}
            fulfillmentType={fulfillmentType}
            confirmedOrderSnapshot={confirmedOrderSnapshot}
            brandSlug={brandSlug}
            currentLocation={currentLocation}
            settings={settings}
            menuBrand={menuBrand}
            customerPaymentType={customerPaymentType}
            isPaid={isPaid}
            transferMethods={transferMethods}
            cashChange={cashChange}
            clearCart={clearCart}
            resetStates={resetStates}
            setShowSuccess={setShowSuccess}
            onClose={onClose}
          />
        </div>
      </div>

      {/* Confirmation Dialog to empty cart */}
      <ClearCartConfirmModal
        open={confirmingClear}
        onClose={() => setConfirmingClear(false)}
        onConfirm={clearCartNow}
        confirmBtnRef={confirmBtnRef}
      />
    </Portal>
  );
}
