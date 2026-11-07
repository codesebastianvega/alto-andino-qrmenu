import React from 'react';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { KitchenRecipeViewerModal } from '../components/admin/KitchenRecipeViewerModal';
import { MiseEnPlace86Drawer } from '../components/admin/MiseEnPlace86Drawer';
import { NewOrderAlertModal } from '../components/admin/NewOrderAlertModal';
import soundService from '../utils/soundService';
import { useAdminKitchenData } from '../hooks/kitchen/useAdminKitchenData';
import KitchenHeaderBar from '../components/admin/kitchen/KitchenHeaderBar';
import KitchenOrderCard from '../components/admin/kitchen/KitchenOrderCard';
import KitchenBatchView from '../components/admin/kitchen/KitchenBatchView';

export default function AdminKitchen() {
  const k = useAdminKitchenData();

  if (k.loading && k.orders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${k.isDark ? 'text-gray-400' : 'text-slate-400'}`}>
        <Icon icon="line-md:loading-loop" className="text-4xl mb-3 text-emerald-500" />
        <p className="text-sm font-bold uppercase tracking-wider">Cargando comandas...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-5 font-sans transition-colors ${
      k.isDark ? 'bg-[#090d16] text-gray-100' : 'bg-[#f4f5f8] text-slate-900'
    }`}>
      <KitchenHeaderBar
        isDark={k.isDark}
        stationFilter={k.stationFilter}
        setStationFilter={k.setStationFilter}
        isSoundLoopActive={k.isSoundLoopActive}
        viewMode={k.viewMode}
        setViewMode={k.setViewMode}
        activeCount={k.activeCount}
        newCount={k.newCount}
        preparingCount={k.preparingCount}
        allRecipesCount={k.allRecipes.length}
        onOpen86Drawer={() => k.setIs86DrawerOpen(true)}
        onOpenRecipes={() => {
          if (k.allRecipes.length > 0) {
            k.setSelectedRecipeForViewer(k.allRecipes[0]);
          } else {
            toast('No hay recetas registradas');
          }
        }}
        onToggleTheme={k.toggleTheme}
        onRefresh={() => k.fetchKitchenOrders()}
        onToggleFullScreen={k.toggleFullScreen}
      />

      {k.viewMode === 'batch' ? (
        <KitchenBatchView batchOrders={k.batchOrders} isDark={k.isDark} />
      ) : k.displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Icon icon="heroicons:check-badge" className={`text-5xl mb-2 ${k.isDark ? 'text-gray-700' : 'text-slate-300'}`} />
          <p className={`text-sm font-bold uppercase tracking-wider ${k.isDark ? 'text-gray-400' : 'text-slate-600'}`}>Todo Al Día</p>
          <p className={`text-xs mt-0.5 ${k.isDark ? 'text-gray-600' : 'text-slate-400'}`}>No hay comandas pendientes para esta estación</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {k.displayedOrders.map(order => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              isDark={k.isDark}
              stationFilter={k.stationFilter}
              restaurantSettings={k.restaurantSettings}
              activeBrand={k.activeBrand}
              updatingStatus={k.updatingStatus}
              onOpenDishRecipe={k.handleOpenDishRecipe}
              onMarkAsPreparing={k.markAsPreparing}
              onMarkAsReady={k.markAsReady}
            />
          ))}
        </div>
      )}

      {k.selectedRecipeForViewer && (
        <KitchenRecipeViewerModal
          recipe={k.selectedRecipeForViewer}
          allRecipes={k.allRecipes}
          isOpen={Boolean(k.selectedRecipeForViewer)}
          onClose={() => k.setSelectedRecipeForViewer(null)}
        />
      )}

      <MiseEnPlace86Drawer
        isOpen={k.is86DrawerOpen}
        onClose={() => k.setIs86DrawerOpen(false)}
        isDark={k.isDark}
        activeBrandId={k.activeBrandId}
        activeLocationId={k.activeLocationId}
      />

      {k.isAlertModalOpen && k.incomingOrdersQueue.length > 0 && (
        <NewOrderAlertModal
          isOpen={k.isAlertModalOpen}
          order={k.incomingOrdersQueue[k.incomingOrderIndex] || k.incomingOrdersQueue[0]}
          onClose={() => {
            soundService.stopNewOrderLoop();
            k.setIsAlertModalOpen(false);
          }}
          onAcceptAndSendToKitchen={k.handleAcceptIncomingOrder}
          onReviewDetail={k.handleReviewIncomingOrder}
          queueCount={k.incomingOrdersQueue.length}
          currentIndex={k.incomingOrderIndex}
          onNextOrder={() => k.setIncomingOrderIndex(prev => Math.min(k.incomingOrdersQueue.length - 1, prev + 1))}
          onPrevOrder={() => k.setIncomingOrderIndex(prev => Math.max(0, prev - 1))}
          restaurantSettings={k.restaurantSettings}
        />
      )}
    </div>
  );
}
