import React from "react";
import { useCartDrawer } from "./cart-drawer/hooks/useCartDrawer";
import CartDrawerHeader from "./cart-drawer/subcomponents/CartDrawerHeader";
import CartDrawerItemList from "./cart-drawer/subcomponents/CartDrawerItemList";
import CartDrawerGeneralNote from "./cart-drawer/subcomponents/CartDrawerGeneralNote";
import CartDrawerReceiptFooter from "./cart-drawer/subcomponents/CartDrawerReceiptFooter";
import CartDrawerSuccessView from "./cart-drawer/subcomponents/CartDrawerSuccessView";
import CartDrawerClearModal from "./cart-drawer/subcomponents/CartDrawerClearModal";

export default function CartDrawer({ open, onClose }) {
  const {
    items,
    total,
    finalTotal,
    note,
    setNote,
    clearCart,
    increment,
    removeItem,
    setItemNote,

    isPOSMode,
    isWithinOrderLimit,
    currentBusinessHours,
    menuBrand,

    includeTip,
    setIncludeTip,
    isTipEnabled,
    tipPercentage,
    serviceFeeAmount,
    packagingFeeTotal,

    openNoteIndex,
    setOpenNoteIndex,

    fulfillmentModes,
    isDarkKitchen,
    fulfillmentType,
    setFulfillmentType,
    deliveryAddress,
    setDeliveryAddress,
    deliveryNotes,
    setDeliveryNotes,
    scheduledTime,
    setScheduledTime,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    showFulfillmentSelector,
    setShowFulfillmentSelector,

    isLeadRequired,
    isLeadValid,
    isSubmitting,
    showSuccess,
    setShowSuccess,
    lastOrderId,

    confirmingClear,
    setConfirmingClear,
    confirmBtnRef,

    handleDecrement,
    handleClearRequest,
    clearCartNow,
    handleConfirmOrder
  } = useCartDrawer({ open, onClose });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100]">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />

        {/* Sheet / Drawer */}
        <div
          className="absolute inset-x-0 bottom-0 z-[100] mx-auto w-full max-w-md max-h-[calc(100dvh-40px)] rounded-t-[28px] bg-white shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] ring-1 ring-black/5 flex flex-col md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:max-h-none md:max-w-[560px] lg:max-w-[600px] md:rounded-none md:rounded-l-[32px] md:shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.15)] transition-all"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <CartDrawerHeader
            itemCount={items.length}
            onClearRequest={handleClearRequest}
            onClose={onClose}
          />

          {/* Lista scrolleable + Nota general */}
          <div className="flex-1 overflow-y-auto bg-neutral-50/50 md:bg-white relative">
            <CartDrawerItemList
              items={items}
              removeItem={removeItem}
              increment={increment}
              handleDecrement={handleDecrement}
              openNoteIndex={openNoteIndex}
              setOpenNoteIndex={setOpenNoteIndex}
              setItemNote={setItemNote}
              onClose={onClose}
            />

            {items.length > 0 && (
              <CartDrawerGeneralNote note={note} setNote={setNote} />
            )}
          </div>

          {/* Footer fijo (Receipt Style) */}
          <CartDrawerReceiptFooter
            items={items}
            total={total}
            packagingFeeTotal={packagingFeeTotal}
            fulfillmentType={fulfillmentType}
            setFulfillmentType={setFulfillmentType}
            isTipEnabled={isTipEnabled}
            includeTip={includeTip}
            setIncludeTip={setIncludeTip}
            tipPercentage={tipPercentage}
            serviceFeeAmount={serviceFeeAmount}
            finalTotal={finalTotal}
            isWithinOrderLimit={isWithinOrderLimit}
            isPOSMode={isPOSMode}
            currentBusinessHours={currentBusinessHours}
            menuBrand={menuBrand}
            showFulfillmentSelector={showFulfillmentSelector}
            setShowFulfillmentSelector={setShowFulfillmentSelector}
            isDarkKitchen={isDarkKitchen}
            fulfillmentModes={fulfillmentModes}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
            isLeadRequired={isLeadRequired}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            deliveryNotes={deliveryNotes}
            setDeliveryNotes={setDeliveryNotes}
            onConfirmOrder={handleConfirmOrder}
            isSubmitting={isSubmitting}
            isLeadValid={isLeadValid}
            onClose={onClose}
          />

          {/* Full-drawer Success View */}
          <CartDrawerSuccessView
            show={showSuccess}
            lastOrderId={lastOrderId}
            fulfillmentType={fulfillmentType}
            onClose={onClose}
            setShowSuccess={setShowSuccess}
            clearCart={clearCart}
          />
        </div>
      </div>

      {/* Diálogo de Confirmación para Vaciar Carrito */}
      <CartDrawerClearModal
        open={confirmingClear}
        onClose={() => setConfirmingClear(false)}
        confirmBtnRef={confirmBtnRef}
        onConfirmClear={clearCartNow}
      />
    </>
  );
}
