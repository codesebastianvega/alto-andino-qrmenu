import React from "react";
import { Icon } from "@iconify/react";
import CartCouponSection from "./CartCouponSection";
import CartPricingBreakdown from "./CartPricingBreakdown";
import CartFulfillmentSection from "./CartFulfillmentSection";
import CartPaymentSection from "./CartPaymentSection";

export default function CartCheckoutFooter({
  idSuffix = "",
  items = [],
  // Coupon
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
  availableCouponPromos = [],
  handleApplyCoupon,
  couponInput,
  setCouponInput,
  isApplyingCoupon,
  // Pricing
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
  // Flow & State
  isPOSMode,
  storeStatusInfo,
  hasRestrictedItems,
  restrictedCartItems = [],
  isWithinOrderLimit,
  showFulfillmentSelector,
  setShowFulfillmentSelector,
  initialMesa,
  isDarkKitchen,
  handleConfirmOrder,
  isSubmitting,
  isLeadValid,
  // Fulfillment
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
  // Payment
  availablePaymentTypes = [],
  customerPaymentType,
  setCustomerPaymentType,
  cashTenderedType,
  setCashTenderedType,
  customCashAmount,
  setCustomCashAmount,
  effectiveCashAmount,
  cashChange,
  transferMethods = [],
  isPaid,
  setIsPaid,
  activeMethods = [],
  paymentMethod,
  setPaymentMethod,
}) {
  if (items.length === 0) return null;

  return (
    <div className="w-full bg-white border-t border-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-all">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-100/60 border-dashed">
        <CartCouponSection
          appliedCoupon={appliedCoupon}
          discountAmount={discountAmount}
          formatCOP={formatCOP}
          handleRemoveCoupon={handleRemoveCoupon}
          skipPlanCreditForOrder={skipPlanCreditForOrder}
          activeMemberPlanSession={activeMemberPlanSession}
          handleRestoreMealPlanCredit={handleRestoreMealPlanCredit}
          automaticDiscountPromo={automaticDiscountPromo}
          isCouponAccordionOpen={isCouponAccordionOpen}
          setIsCouponAccordionOpen={setIsCouponAccordionOpen}
          availableCouponPromos={availableCouponPromos}
          handleApplyCoupon={handleApplyCoupon}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          isApplyingCoupon={isApplyingCoupon}
        />

        <CartPricingBreakdown
          total={total}
          discountAmount={discountAmount}
          effectivePromo={effectivePromo}
          packagingFeeTotal={packagingFeeTotal}
          fulfillmentType={fulfillmentType}
          deliveryFee={deliveryFee}
          isFreeDeliveryPromoActive={isFreeDeliveryPromoActive}
          isMealPlanDeliveryCovered={isMealPlanDeliveryCovered}
          freeDeliveryPromo={freeDeliveryPromo}
          isTipEnabled={isTipEnabled}
          includeTip={includeTip}
          setIncludeTip={setIncludeTip}
          tipPercentage={tipPercentage}
          serviceFeeAmount={serviceFeeAmount}
          finalTotal={finalTotal}
          formatCOP={formatCOP}
        />
      </div>

      <div
        className={`px-4 pt-3 sm:px-6 sm:pt-4 ${idSuffix === "desktop" ? "pb-8 sm:pb-6" : "pb-6"}`}
        style={
          idSuffix === "mobile"
            ? { paddingBottom: "max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))" }
            : undefined
        }
      >
        <div className="flex flex-col gap-2.5">
          {!isPOSMode && storeStatusInfo && !storeStatusInfo.isOpen ? (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <Icon icon="solar:clock-circle-bold" className="text-amber-600 text-2xl flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  {storeStatusInfo.isScheduleClosed
                    ? "🌙 Fuera de Horario de Atención"
                    : "🔒 Cocina en Pausa Temporal"}
                </p>
                <p className="text-xs font-medium text-amber-800 mt-1 leading-snug">
                  {storeStatusInfo.message ||
                    "En este momento no estamos recibiendo pedidos. Tus platos quedan guardados en el carrito para cuando abramos."}
                </p>
              </div>
            </div>
          ) : hasRestrictedItems ? (
            <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <Icon icon="heroicons:clock" className="text-amber-600 text-2xl flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900 leading-snug">
                  Hay productos fuera de horario en tu pedido: {restrictedCartItems.map((i) => i.name).join(", ")}.
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Por favor retíralos del carrito para poder continuar.
                </p>
              </div>
            </div>
          ) : !isWithinOrderLimit && !isPOSMode ? (
            <div className="bg-neutral-900 rounded-2xl p-5 flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-2 shadow-xl shadow-neutral-900/10">
              <div className="text-neutral-400 mt-0.5 flex-shrink-0">
                <Icon icon="heroicons:information-circle" className="text-2xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-100 leading-snug">
                  El restaurante ha alcanzado su límite de pedidos por este mes. Por favor, intenta de nuevo más tarde.
                </p>
              </div>
            </div>
          ) : !showFulfillmentSelector && !initialMesa && !isPOSMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFulfillmentSelector(true);
              }}
              disabled={!items.length || (!isPOSMode && storeStatusInfo && !storeStatusInfo.isOpen)}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg bg-[#2f4131] active:bg-[#202c21] text-white shadow-[#2f4131]/20 sm:hover:-translate-y-0.5 sm:hover:bg-[#202c21] transition-all active:scale-[0.98] cursor-pointer touch-manipulation select-none relative z-10 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
            >
              <Icon
                icon={
                  fulfillmentType === "takeaway"
                    ? "heroicons:shopping-bag"
                    : isDarkKitchen
                    ? "heroicons:truck"
                    : "heroicons:sparkles"
                }
                className="text-xl pointer-events-none"
              />
              <span className="pointer-events-none">
                {!isPOSMode && storeStatusInfo && !storeStatusInfo.isOpen
                  ? "Restaurante Cerrado"
                  : fulfillmentType === "takeaway"
                  ? "🛍️ Datos para Recoger en Tienda"
                  : isDarkKitchen
                  ? "🛵 Datos de Entrega a Domicilio"
                  : "Confirmar Pedido"}
              </span>
            </button>
          ) : !showFulfillmentSelector && (initialMesa || isPOSMode) && !isDarkKitchen ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConfirmOrder(e);
              }}
              disabled={isSubmitting || !items.length || !isLeadValid}
              className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer touch-manipulation select-none relative z-10 ${
                !isLeadValid || isSubmitting
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                  : "bg-[#2f4131] active:bg-[#202c21] text-white shadow-[#2f4131]/20 sm:hover:-translate-y-0.5 sm:hover:bg-[#202c21]"
              }`}
            >
              {isSubmitting ? (
                <Icon icon="line-md:loading-loop" className="text-xl pointer-events-none" />
              ) : (
                <>
                  <Icon icon="heroicons:sparkles" className="text-xl pointer-events-none" />
                  <span className="pointer-events-none">Confirmar Pedido</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
              <CartFulfillmentSection
                isDarkKitchen={isDarkKitchen}
                fulfillmentType={fulfillmentType}
                setFulfillmentType={setFulfillmentType}
                scheduledTime={scheduledTime}
                setScheduledTime={setScheduledTime}
                fulfillmentModes={fulfillmentModes}
                isLeadRequired={isLeadRequired}
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
                setDeliveryLocationInfo={setDeliveryLocationInfo}
                deliveryNotes={deliveryNotes}
                setDeliveryNotes={setDeliveryNotes}
                currentLocation={currentLocation}
                total={total}
                freeDeliveryPromo={freeDeliveryPromo}
              />

              <CartPaymentSection
                isPOSMode={isPOSMode}
                isLeadRequired={isLeadRequired}
                availablePaymentTypes={availablePaymentTypes}
                customerPaymentType={customerPaymentType}
                setCustomerPaymentType={setCustomerPaymentType}
                cashTenderedType={cashTenderedType}
                setCashTenderedType={setCashTenderedType}
                customCashAmount={customCashAmount}
                setCustomCashAmount={setCustomCashAmount}
                effectiveCashAmount={effectiveCashAmount}
                finalTotal={finalTotal}
                cashChange={cashChange}
                transferMethods={transferMethods}
                idSuffix={idSuffix}
                isPaid={isPaid}
                setIsPaid={setIsPaid}
                activeMethods={activeMethods}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                formatCOP={formatCOP}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFulfillmentSelector(false)}
                  className="w-12 h-14 flex items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Icon icon="heroicons:arrow-left" className="text-xl" />
                </button>
                {hasRestrictedItems ? (
                  <div className="flex-1 bg-amber-500/10 border border-amber-300 rounded-2xl p-3 flex items-center gap-2.5">
                    <Icon icon="heroicons:clock" className="text-amber-600 text-lg flex-shrink-0" />
                    <span className="text-[11px] font-bold text-amber-900 leading-tight">
                      Hay productos fuera de horario en tu orden. Retíralos para poder confirmar.
                    </span>
                  </div>
                ) : !isWithinOrderLimit && !isPOSMode ? (
                  <div className="flex-1 bg-neutral-900 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-lg shadow-neutral-900/5">
                    <Icon icon="heroicons:information-circle" className="text-neutral-400 text-xl flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-neutral-100 leading-tight">
                      El restaurante ha alcanzado su límite de pedidos por este mes. Por favor, intenta de nuevo más tarde.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConfirmOrder(e);
                    }}
                    disabled={isSubmitting || !isLeadValid}
                    className={`flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer touch-manipulation select-none relative z-10 ${
                      !isLeadValid || isSubmitting
                        ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                        : "bg-[#2f4131] active:bg-[#202c21] text-white shadow-[#2f4131]/20 sm:hover:-translate-y-0.5 sm:hover:bg-[#202c21]"
                    }`}
                  >
                    {isSubmitting ? (
                      <Icon icon="line-md:loading-loop" className="text-xl pointer-events-none" />
                    ) : (
                      <>
                        <Icon icon="heroicons:sparkles" className="text-xl pointer-events-none" />
                        <span className="pointer-events-none">Confirmar Pedido</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
