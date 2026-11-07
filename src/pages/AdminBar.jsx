import React from 'react';
import { Icon } from '@iconify-icon/react';
import { NewOrderAlertModal } from '../components/admin/NewOrderAlertModal';
import soundService from '../utils/soundService';
import { useAdminBarData } from '../hooks/bar/useAdminBarData';
import BarHeaderBar from '../components/admin/bar/BarHeaderBar';
import BarOrderCard from '../components/admin/bar/BarOrderCard';
import BarBatchView from '../components/admin/bar/BarBatchView';

export default function AdminBar() {
  const b = useAdminBarData();

  if (b.loading && b.orders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${b.isDark ? 'text-gray-400' : 'text-slate-400'}`}>
        <Icon icon="line-md:loading-loop" className="text-4xl mb-3 text-cyan-500" />
        <p className="text-sm font-bold uppercase tracking-wider">Cargando barra...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-5 font-sans transition-colors ${
      b.isDark ? 'bg-[#090d16] text-gray-100' : 'bg-[#f4f5f8] text-slate-900'
    }`}>
      <BarHeaderBar
        isDark={b.isDark}
        stationFilter={b.stationFilter}
        setStationFilter={b.setStationFilter}
        isSoundLoopActive={b.isSoundLoopActive}
        viewMode={b.viewMode}
        setViewMode={b.setViewMode}
        activeCount={b.activeCount}
        newCount={b.newCount}
        preparingCount={b.preparingCount}
        onToggleTheme={b.toggleTheme}
        onRefresh={() => b.fetchBarOrders()}
        onToggleFullScreen={b.toggleFullScreen}
      />

      {b.viewMode === 'batch' ? (
        <BarBatchView batchOrders={b.batchOrders} isDark={b.isDark} />
      ) : b.displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Icon icon="heroicons:check-badge" className={`text-5xl mb-2 ${b.isDark ? 'text-gray-700' : 'text-slate-300'}`} />
          <p className={`text-sm font-bold uppercase tracking-wider ${b.isDark ? 'text-gray-400' : 'text-slate-600'}`}>Barra Despejada</p>
          <p className={`text-xs mt-0.5 ${b.isDark ? 'text-gray-600' : 'text-slate-400'}`}>No hay comandas pendientes para la barra</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {b.displayedOrders.map(order => (
            <BarOrderCard
              key={order.id}
              order={order}
              isDark={b.isDark}
              stationFilter={b.stationFilter}
              restaurantSettings={b.restaurantSettings}
              activeBrand={b.activeBrand}
              updatingStatus={b.updatingStatus}
              onMarkAsPreparing={b.markAsPreparing}
              onMarkAsReady={b.markAsReady}
            />
          ))}
        </div>
      )}

      {/* ── Modal de Alerta de Nuevo Pedido Entrante en Barra */}
      {b.isAlertModalOpen && b.incomingOrdersQueue.length > 0 && (
        <NewOrderAlertModal
          isOpen={b.isAlertModalOpen}
          order={b.incomingOrdersQueue[b.incomingOrderIndex] || b.incomingOrdersQueue[0]}
          onClose={() => {
            soundService.stopNewOrderLoop();
            b.setIsSoundLoopActive(false);
            b.setIsAlertModalOpen(false);
          }}
          onAcceptAndSendToKitchen={b.handleAcceptIncomingOrder}
          onReviewDetail={b.handleReviewIncomingOrder}
          queueCount={b.incomingOrdersQueue.length}
          currentIndex={b.incomingOrderIndex}
          onNextOrder={() => b.setIncomingOrderIndex(prev => Math.min(b.incomingOrdersQueue.length - 1, prev + 1))}
          onPrevOrder={() => b.setIncomingOrderIndex(prev => Math.max(0, prev - 1))}
          restaurantSettings={b.restaurantSettings}
        />
      )}
    </div>
  );
}
