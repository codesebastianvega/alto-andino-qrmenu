import React from 'react';
import { getFulfillmentLabel } from './OrderKanbanCard';
import { useOrderDetailActions } from './detail-modal/hooks/useOrderDetailActions';
import OrderDetailHeader from './detail-modal/subcomponents/OrderDetailHeader';
import OrderDetailItemsColumn from './detail-modal/subcomponents/OrderDetailItemsColumn';
import OrderDetailCustomerCard from './detail-modal/subcomponents/OrderDetailCustomerCard';
import OrderDetailDeliveryCard from './detail-modal/subcomponents/OrderDetailDeliveryCard';
import OrderDetailWaiterCard from './detail-modal/subcomponents/OrderDetailWaiterCard';
import OrderDetailFinancialCard from './detail-modal/subcomponents/OrderDetailFinancialCard';
import OrderDetailDiscountsCard from './detail-modal/subcomponents/OrderDetailDiscountsCard';
import OrderDetailFooter from './detail-modal/subcomponents/OrderDetailFooter';

export const OrderDetailModal = ({
  selectedOrder,
  onClose,
  restaurantSettings,
  activeBrand,
  waiters,
  assignWaiter,
  updateOrderStatus,
  applyDiscount,
  cancelOrder,
  isCancelling,
  setIsCancelling,
  cancellationReason,
  setCancellationReason,
  updatingStatus,
  setIsPOSModalOpen,
  setIsMerging,
  setMergeSourceOrder,
  setAdditionOrder,
  setSelectedOrder,
  fetchOrders,
  shareToWhatsApp,
  selectedPaymentMethod
}) => {
  const {
    handleAssignFiado,
    handleDirectPayment,
    handleCustomerArrivalAlert,
    handleSendDriverLink,
    handleApplyCourtesyDiscount
  } = useOrderDetailActions({
    selectedOrder,
    setSelectedOrder,
    fetchOrders,
    activeBrand,
    applyDiscount,
    updateOrderStatus,
    selectedPaymentMethod
  });

  if (!selectedOrder) return null;

  const fulfillmentInfo = getFulfillmentLabel(selectedOrder.fulfillment_type);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-slate-50 w-full max-w-6xl h-[94vh] md:h-[88vh] max-h-[920px] rounded-t-[2rem] rounded-b-none md:rounded-b-[2rem] shadow-2xl overflow-hidden flex flex-col mt-auto md:mt-0 border border-slate-200/80 animate-in slide-in-from-bottom-4 md:zoom-in duration-300">
        
        <OrderDetailHeader
          selectedOrder={selectedOrder}
          fulfillmentInfo={fulfillmentInfo}
          onClose={onClose}
        />

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-7 custom-scrollbar bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 items-start">
            
            {/* Columna Izquierda: Detalle de Platos, Notas y Totales */}
            <OrderDetailItemsColumn
              selectedOrder={selectedOrder}
              setAdditionOrder={setAdditionOrder}
            />

            {/* Columna Derecha: Sidebar Admin */}
            <div className="space-y-4">
              <OrderDetailCustomerCard
                selectedOrder={selectedOrder}
                fulfillmentInfo={fulfillmentInfo}
                shareToWhatsApp={shareToWhatsApp}
              />

              <OrderDetailDeliveryCard
                selectedOrder={selectedOrder}
                onCustomerArrivalAlert={handleCustomerArrivalAlert}
                onSendDriverLink={handleSendDriverLink}
              />

              <OrderDetailWaiterCard
                selectedOrder={selectedOrder}
                waiters={waiters}
                assignWaiter={assignWaiter}
              />

              <OrderDetailFinancialCard
                selectedOrder={selectedOrder}
                onAssignFiado={handleAssignFiado}
                onDirectPayment={handleDirectPayment}
              />

              <OrderDetailDiscountsCard
                selectedOrder={selectedOrder}
                onApplyDiscount={handleApplyCourtesyDiscount}
                updatingStatus={updatingStatus}
              />
            </div>
          </div>
        </div>

        <OrderDetailFooter
          selectedOrder={selectedOrder}
          restaurantSettings={restaurantSettings}
          activeBrand={activeBrand}
          shareToWhatsApp={shareToWhatsApp}
          setIsMerging={setIsMerging}
          setMergeSourceOrder={setMergeSourceOrder}
          setSelectedOrder={setSelectedOrder}
          isCancelling={isCancelling}
          setIsCancelling={setIsCancelling}
          cancellationReason={cancellationReason}
          setCancellationReason={setCancellationReason}
          cancelOrder={cancelOrder}
          setIsPOSModalOpen={setIsPOSModalOpen}
          updateOrderStatus={updateOrderStatus}
          updatingStatus={updatingStatus}
        />
      </div>
    </div>
  );
};

export default OrderDetailModal;
