import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePaymentPOSModal } from './payment-pos/hooks/usePaymentPOSModal';
import POSHeader from './payment-pos/subcomponents/POSHeader';
import POSItemsColumn from './payment-pos/subcomponents/POSItemsColumn';
import POSTendersColumn from './payment-pos/subcomponents/POSTendersColumn';
import POSKeypadColumn from './payment-pos/subcomponents/POSKeypadColumn';
import POSSuccessModal from './payment-pos/subcomponents/POSSuccessModal';

/**
 * PaymentPOSModal Component
 * Handles granular payments (partial quantity), multi-method (tenders), 
 * and features a 3-column professional layout.
 */
export default function PaymentPOSModal({ order, onClose, onSuccess, paymentMethods, restaurantSettings }) {
  const { activeBrand } = useAuth();

  const {
    isSplitting,
    waiveServiceFee,
    setWaiveServiceFee,
    wasAutoFinalized,
    selectedQuantities,
    manualAmount,
    paymentMode,
    setPaymentMode,
    tenders,
    currentMethod,
    setCurrentMethod,
    receivedAmount,
    setReceivedAmount,
    inputFocus,
    setInputFocus,
    customerPhone,
    customerName,
    loyaltyStats,
    isSearchingCustomer,
    isProcessing,
    showSuccessScreen,
    lastTransactionChange,
    calculations,
    isCash,
    keypadTarget,
    handleKeyPress,
    updateItemQty,
    toggleSplitting,
    addTender,
    removeTender,
    handleFinalize
  } = usePaymentPOSModal({
    order,
    onClose,
    onSuccess,
    paymentMethods,
    activeBrand
  });

  const {
    unpaidItems,
    remainingOrderBalance,
    currentServiceFee,
    amountToCover,
    totalTendered,
    pendingThreshold
  } = calculations;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-100 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-200">
      <POSHeader
        order={order}
        customerName={customerName}
        customerPhone={customerPhone}
        loyaltyStats={loyaltyStats}
        isSearchingCustomer={isSearchingCustomer}
        inputFocus={inputFocus}
        setInputFocus={setInputFocus}
        remainingOrderBalance={remainingOrderBalance}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-12 custom-scrollbar">
        <POSItemsColumn
          order={order}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          setInputFocus={setInputFocus}
          isSplitting={isSplitting}
          toggleSplitting={toggleSplitting}
          unpaidItems={unpaidItems}
          selectedQuantities={selectedQuantities}
          updateItemQty={updateItemQty}
          manualAmount={manualAmount}
          inputFocus={inputFocus}
          waiveServiceFee={waiveServiceFee}
          setWaiveServiceFee={setWaiveServiceFee}
          currentServiceFee={currentServiceFee}
          amountToCover={amountToCover}
        />

        <POSTendersColumn
          paymentMethods={paymentMethods}
          currentMethod={currentMethod}
          setCurrentMethod={setCurrentMethod}
          setInputFocus={setInputFocus}
          tenders={tenders}
          removeTender={removeTender}
          totalTendered={totalTendered}
          pendingThreshold={pendingThreshold}
        />

        <POSKeypadColumn
          isCash={isCash}
          keypadTarget={keypadTarget}
          receivedAmount={receivedAmount}
          setReceivedAmount={setReceivedAmount}
          pendingThreshold={pendingThreshold}
          handleKeyPress={handleKeyPress}
          isSplitting={isSplitting}
          tenders={tenders}
          addTender={addTender}
          handleFinalize={handleFinalize}
          isProcessing={isProcessing}
          amountToCover={amountToCover}
        />
      </div>

      <POSSuccessModal
        showSuccessScreen={showSuccessScreen}
        wasAutoFinalized={wasAutoFinalized}
        order={order}
        customerName={customerName}
        lastTransactionChange={lastTransactionChange}
        restaurantSettings={restaurantSettings}
        activeBrand={activeBrand}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}
