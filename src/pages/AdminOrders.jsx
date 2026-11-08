import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';

import { useAdminOrders } from '../hooks/orders/useAdminOrders';
import DailyStats from '../components/admin/orders/DailyStats';
import OrdersSearchBar from '../components/admin/orders/OrdersSearchBar';
import OrderKanbanCard from '../components/admin/orders/OrderKanbanCard';
import DeliveredHistoryModal from '../components/admin/orders/DeliveredHistoryModal';
import CancelledHistoryModal from '../components/admin/orders/CancelledHistoryModal';
import FiadosCarteraModal from '../components/admin/orders/FiadosCarteraModal';
import OrderHistoryDetailModal from '../components/admin/orders/OrderHistoryDetailModal';
import OrderDetailModal from '../components/admin/orders/OrderDetailModal';
import OrderMergeConfirmModal from '../components/admin/orders/OrderMergeConfirmModal';
import PaymentPOSModal from '../components/admin/PaymentPOSModal';
import OrderAdditionModal from '../components/admin/OrderAdditionModal';
import ManualOrderModal from '../components/admin/ManualOrderModal';
import { NewOrderAlertModal } from '../components/admin/NewOrderAlertModal';

export const ORDER_STATUSES = [
  { id: 'new', label: 'Nuevos', color: 'text-blue-600', icon: 'heroicons:star' },
  { id: 'preparing', label: 'En Cocina', color: 'text-yellow-600', icon: 'heroicons:fire' },
  { id: 'ready', label: 'Listos', color: 'text-emerald-600', icon: 'heroicons:check-badge' },
  { id: 'on_table', label: 'En Mesa / En Camino', color: 'text-purple-600', icon: 'heroicons:home' },
];

export default function AdminOrders() {
  const {
    orders,
    loading,
    dateRange,
    setDateRange,
    selectedOrder,
    setSelectedOrder,
    updatingStatus,
    isCancelling,
    setIsCancelling,
    cancellationReason,
    setCancellationReason,
    selectedPaymentMethod,
    restaurantSettings,
    isPOSModalOpen,
    setIsPOSModalOpen,
    isMerging,
    setIsMerging,
    mergeSourceOrder,
    setMergeSourceOrder,
    mergeTargetOrder,
    isMergeConfirmOpen,
    setIsMergeConfirmOpen,
    showCancelledHistory,
    setShowCancelledHistory,
    showDeliveredHistory,
    setShowDeliveredHistory,
    historyDetailOrder,
    setHistoryDetailOrder,
    mobileActiveStatus,
    setMobileActiveStatus,
    searchQuery,
    setSearchQuery,
    additionOrder,
    setAdditionOrder,
    incomingOrdersQueue,
    incomingOrderIndex,
    setIncomingOrderIndex,
    isAlertModalOpen,
    setIsAlertModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isSoundLoopActive,
    setIsSoundLoopActive,
    isFiadosDrawerOpen,
    setIsFiadosDrawerOpen,
    activeBrand,
    activeBrandId,
    defaultOrderLocationId,
    filteredOrders,
    pendingFiadosList,
    fiadosCount,
    totalCarteraAmount,
    waiters,
    activeMethods,
    fetchOrders,
    updateOrderStatus,
    assignWaiter,
    applyDiscount,
    updateDeliveryFee,
    cancelOrder,
    handleMergeOrders,
    onDragEnd,
    handleAcceptIncomingOrder,
    handleReviewIncomingOrder,
    handleCancelIncomingOrder,
    handleSettleFiadoOrder,
    handleSendWhatsAppCobro,
    shareToWhatsApp,
    sendCancellationApologyWhatsApp
  } = useAdminOrders();

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-between">
      <div>
        {/* Merging Notification Bar */}
        {isMerging && (
          <div className="mb-4 p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Icon icon="solar:round-transfer-horizontal-bold" className="text-2xl" />
              <div>
                <p className="font-black text-sm">MODO FUSIÓN ACTIVO</p>
                <p className="text-xs text-emerald-100">Haz clic en el pedido de destino para unirlos, o cancela.</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsMerging(false); setMergeSourceOrder(null); }}
              className="px-4 py-2 bg-white text-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-all shadow-sm"
            >
              Cancelar Fusión
            </button>
          </div>
        )}

        {/* Actions Bar & Quick Search */}
        <OrdersSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredOrdersCount={filteredOrders.length}
          isSoundLoopActive={isSoundLoopActive}
          setIsSoundLoopActive={setIsSoundLoopActive}
          incomingOrdersQueue={incomingOrdersQueue}
          isAlertModalOpen={isAlertModalOpen}
          setIsAlertModalOpen={setIsAlertModalOpen}
          fiadosCount={fiadosCount}
          totalCarteraAmount={totalCarteraAmount}
          setIsFiadosDrawerOpen={setIsFiadosDrawerOpen}
          dateRange={dateRange}
          setDateRange={setDateRange}
          setIsManualOrderModalOpen={setIsManualOrderModalOpen}
          fetchOrders={fetchOrders}
          loading={loading}
        />

        <DailyStats 
          orders={orders} 
          range={dateRange} 
          onCancelledClick={() => setShowCancelledHistory(true)} 
          onDeliveredClick={() => setShowDeliveredHistory(true)}
          onFiadosClick={() => setIsFiadosDrawerOpen(true)}
          fiadosCount={fiadosCount}
          totalCartera={totalCarteraAmount}
        />

        {/* Modal de Historial de Entregados */}
        <DeliveredHistoryModal
          isOpen={showDeliveredHistory}
          onClose={() => setShowDeliveredHistory(false)}
          orders={orders}
          onSelectOrderDetail={setHistoryDetailOrder}
        />

        {/* Modal de Historial de Cancelados */}
        <CancelledHistoryModal
          isOpen={showCancelledHistory}
          onClose={() => setShowCancelledHistory(false)}
          orders={orders}
          onSelectOrderDetail={setHistoryDetailOrder}
        />

        {/* Modal / Drawer de Cartera de Fiados & Cuentas por Cobrar */}
        <FiadosCarteraModal
          isOpen={isFiadosDrawerOpen}
          onClose={() => setIsFiadosDrawerOpen(false)}
          pendingFiadosList={pendingFiadosList}
          totalCarteraAmount={totalCarteraAmount}
          onSelectOrder={setSelectedOrder}
          onSendWhatsAppCobro={handleSendWhatsAppCobro}
          onSettleFiadoOrder={handleSettleFiadoOrder}
        />

        {/* Modal Extra Optimizado para Ver el Detalle del Pedido del Historial */}
        <OrderHistoryDetailModal
          historyDetailOrder={historyDetailOrder}
          onClose={() => setHistoryDetailOrder(null)}
          onOpenFullOrder={(ord) => {
            setHistoryDetailOrder(null);
            setShowDeliveredHistory(false);
            setShowCancelledHistory(false);
            setSelectedOrder(ord);
          }}
          sendCancellationApologyWhatsApp={sendCancellationApologyWhatsApp}
        />

        {loading && orders.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]" />
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="pb-8 h-auto md:h-[calc(100vh-280px)] min-h-[600px]">
              {/* Selector de Pestañas en Móvil */}
              <div className="flex md:hidden items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm mb-4 overflow-x-auto no-scrollbar">
                {ORDER_STATUSES.map(sc => {
                  const count = sc.id === 'new'
                    ? filteredOrders.filter(o => o.status === 'new' || o.status === 'waiting_payment').length
                    : sc.id === 'on_table'
                      ? filteredOrders.filter(o => o.status === 'on_table' || o.status === 'on_the_way').length
                      : filteredOrders.filter(o => o.status === sc.id).length;
                  const isSelected = mobileActiveStatus === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setMobileActiveStatus(sc.id)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#2f4131] text-white shadow-md'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <span>{sc.label.split(' ')[0]}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-row overflow-x-auto gap-4 h-auto md:h-[calc(100vh-280px)] min-h-[500px] md:min-h-[600px] items-stretch pb-6 snap-x custom-scrollbar">
                {ORDER_STATUSES.map((statusCol, index) => {
                  const fTypeWeights = { 'dine_in': 1, 'takeaway': 2, 'delivery': 3 };
                  
                  const sortOrders = (a, b, ascending = true) => {
                    const weightA = fTypeWeights[a.fulfillment_type] || 99;
                    const weightB = fTypeWeights[b.fulfillment_type] || 99;
                    if (weightA !== weightB) return weightA - weightB;
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return ascending ? dateA - dateB : dateB - dateA;
                  };

                  const colOrders = statusCol.id === 'new'
                      ? filteredOrders.filter(o => o.status === 'new' || o.status === 'waiting_payment').sort((a, b) => sortOrders(a, b, true))
                      : statusCol.id === 'on_table'
                        ? filteredOrders.filter(o => o.status === 'on_table' || o.status === 'on_the_way').sort((a, b) => sortOrders(a, b, true))
                        : filteredOrders.filter(o => o.status === statusCol.id).sort((a, b) => sortOrders(a, b, true));

                  const themes = {
                    new: 'border-t-blue-500 bg-slate-50/70',
                    preparing: 'border-t-amber-500 bg-slate-50/70',
                    ready: 'border-t-emerald-500 bg-slate-50/70',
                    on_table: 'border-t-purple-500 bg-slate-50/70'
                  };

                  return (
                    <Droppable key={`status-column-${statusCol.id}-${index}`} droppableId={statusCol.id} isCombineEnabled>
                      {(provided, snapshot) => (
                        <div 
                          className={`${mobileActiveStatus === statusCol.id ? 'flex' : 'hidden md:flex'} w-full sm:w-[320px] md:w-[320px] lg:w-[330px] xl:flex-1 shrink-0 snap-start flex-col rounded-2xl p-3.5 md:p-4 border border-slate-200/90 shadow-sm transition-all duration-300 border-t-4 ${
                            snapshot.isDraggingOver 
                              ? 'bg-emerald-50/60 border-emerald-300 shadow-lg' 
                              : `${themes[statusCol.id]}`
                          } h-full`}
                        >
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/60">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl bg-white shadow-2xs border border-gray-100 ${statusCol.color.replace('text-', 'text-opacity-80')}`}>
                                <Icon icon={statusCol.icon} className="text-lg" />
                              </div>
                              <h3 className="font-extrabold text-gray-800 text-base tracking-tight">{statusCol.label}</h3>
                            </div>
                            <span className={`text-xs font-black px-3 py-1 rounded-xl shadow-2xs border border-gray-100 bg-white ${statusCol.color}`}>
                              {colOrders.length}
                            </span>
                          </div>
                          
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar flex flex-col gap-3.5"
                          >
                            {colOrders.map((order, orderIdx) => (
                              <OrderKanbanCard
                                key={order.id}
                                order={order}
                                index={orderIdx}
                                isMerging={isMerging}
                                mergeSourceOrder={mergeSourceOrder}
                                handleMergeOrders={handleMergeOrders}
                                onSelectOrder={(ord) => {
                                  setSelectedOrder(ord);
                                  setIsCancelling(false);
                                }}
                                onOpenAddition={setAdditionOrder}
                                restaurantSettings={restaurantSettings}
                              />
                            ))}
                            {provided.placeholder}
                            {colOrders.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-12 opacity-20">
                                <Icon icon={statusCol.icon} className="text-4xl mb-2" />
                                <span className="text-xs font-bold uppercase tracking-widest">Sin pedidos</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Modal Detalle Pedido */}
      <OrderDetailModal
        selectedOrder={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setIsCancelling(false);
        }}
        restaurantSettings={restaurantSettings}
        activeBrand={activeBrand}
        waiters={waiters}
        assignWaiter={assignWaiter}
        updateOrderStatus={updateOrderStatus}
        applyDiscount={applyDiscount}
        updateDeliveryFee={updateDeliveryFee}
        cancelOrder={cancelOrder}
        isCancelling={isCancelling}
        setIsCancelling={setIsCancelling}
        cancellationReason={cancellationReason}
        setCancellationReason={setCancellationReason}
        updatingStatus={updatingStatus}
        setIsPOSModalOpen={setIsPOSModalOpen}
        setIsMerging={setIsMerging}
        setMergeSourceOrder={setMergeSourceOrder}
        setAdditionOrder={setAdditionOrder}
        setSelectedOrder={setSelectedOrder}
        fetchOrders={fetchOrders}
        shareToWhatsApp={shareToWhatsApp}
        selectedPaymentMethod={selectedPaymentMethod}
      />

      {/* POS Payment Modal */}
      {isPOSModalOpen && selectedOrder && (
        <PaymentPOSModal 
          order={selectedOrder}
          paymentMethods={activeMethods || []}
          restaurantSettings={restaurantSettings}
          onClose={() => setIsPOSModalOpen(false)}
          onSuccess={async ({ autoFinalized } = {}) => {
            if (autoFinalized) {
              setSelectedOrder(null);
              toast.success(`🎉 Pedido #${selectedOrder.id.slice(0, 4).toUpperCase()} finalizado con éxito`);
            }
            await fetchOrders();
          }}
        />
      )}

      {/* MERGE CONFIRMATION MODAL */}
      <OrderMergeConfirmModal
        isOpen={isMergeConfirmOpen}
        onClose={() => setIsMergeConfirmOpen(false)}
        mergeSourceOrder={mergeSourceOrder}
        mergeTargetOrder={mergeTargetOrder}
        onConfirmMerge={handleMergeOrders}
      />

      {/* Modal de Pedido Manual (WhatsApp / Mostrador) */}
      {isManualOrderModalOpen && (
        <ManualOrderModal
          isOpen={isManualOrderModalOpen}
          onClose={() => setIsManualOrderModalOpen(false)}
          onOrderCreated={() => fetchOrders()}
          brandId={activeBrandId}
          locationId={defaultOrderLocationId}
          restaurantSettings={restaurantSettings}
        />
      )}

      {/* Modal MiniPOS de Adición a Comanda Existente */}
      {additionOrder && (
        <OrderAdditionModal
          order={additionOrder}
          isOpen={Boolean(additionOrder)}
          onClose={() => setAdditionOrder(null)}
          onOrderUpdated={() => fetchOrders()}
          brandId={activeBrandId}
          restaurantSettings={restaurantSettings}
        />
      )}

      {/* Modal de Alerta de Nuevo Pedido Entrante */}
      {isAlertModalOpen && incomingOrdersQueue.length > 0 && (
        <NewOrderAlertModal
          isOpen={isAlertModalOpen}
          order={incomingOrdersQueue[incomingOrderIndex] || incomingOrdersQueue[0]}
          onClose={() => setIsAlertModalOpen(false)}
          onAcceptAndSendToKitchen={handleAcceptIncomingOrder}
          onReviewDetail={handleReviewIncomingOrder}
          onCancelOrder={handleCancelIncomingOrder}
          queueCount={incomingOrdersQueue.length}
          currentIndex={incomingOrderIndex}
          onNextOrder={() => setIncomingOrderIndex(prev => Math.min(incomingOrdersQueue.length - 1, prev + 1))}
          onPrevOrder={() => setIncomingOrderIndex(prev => Math.max(0, prev - 1))}
          restaurantSettings={restaurantSettings}
        />
      )}
    </div>
  );
}
