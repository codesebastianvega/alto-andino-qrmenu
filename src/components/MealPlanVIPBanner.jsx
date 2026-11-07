import React from 'react';
import DIYProductModal from './DIYProductModal';
import ProductQuickView from './ProductQuickView';
import { useMealPlanVIP } from './meal-plan/hooks/useMealPlanVIP';
import MealPlanMemberCard from './meal-plan/subcomponents/MealPlanMemberCard';
import MealPlanVisitorCard from './meal-plan/subcomponents/MealPlanVisitorCard';
import MealPlanMemberDrawer from './meal-plan/subcomponents/MealPlanMemberDrawer';
import MealPlanAddressModal from './meal-plan/subcomponents/MealPlanAddressModal';
import MealPlanAuthModal from './meal-plan/subcomponents/MealPlanAuthModal';
import MealPlanPwaHelpModal from './meal-plan/subcomponents/MealPlanPwaHelpModal';

export default function MealPlanVIPBanner({ onOpenCart, onInstallPWA, isPWAInstalled }) {
  const {
    activePlan,
    wantsSoupToday,
    wantsDrinkToday,
    usage,
    loadingUsage,
    showMemberDrawer,
    setShowMemberDrawer,
    showAuthModal,
    setShowAuthModal,
    modalTab,
    setModalTab,
    includeDeliveryInPreview,
    setIncludeDeliveryInPreview,
    loginInput,
    setLoginInput,
    showHistory,
    setShowHistory,
    showInstallHelp,
    setShowInstallHelp,
    diyPlanProduct,
    setDiyPlanProduct,
    quickBentoProduct,
    setQuickBentoProduct,
    showAddressModal,
    setShowAddressModal,
    customAddr,
    setCustomAddr,
    customNotes,
    setCustomNotes,
    customCoords,
    setCustomCoords,

    programConfig,
    activeDailyBento,
    whatsappNumber,
    displayedTemplates,
    totalStamps,
    filledStamps,
    currentLocation,

    handleToggleSoupPreference,
    handleToggleDrinkPreference,
    handleManualLogin,
    handleGoogleLogin,
    handleSaveCustomerLocation,
    handleOpenPlanDIYBowl,
    handleOpenDailyBento,
    handleLogoutPlan,
    handleInstallClick
  } = useMealPlanVIP({ onInstallPWA });

  if (programConfig?.is_enabled === false && !activePlan) return null;

  return (
    <>
      {/* Tarjeta de miembro VIP o Tarjeta de visitante */}
      {activePlan ? (
        <MealPlanMemberCard
          activePlan={activePlan}
          usage={usage}
          loadingUsage={loadingUsage}
          totalStamps={totalStamps}
          filledStamps={filledStamps}
          wantsSoupToday={wantsSoupToday}
          wantsDrinkToday={wantsDrinkToday}
          onOpenAddressModal={() => setShowAddressModal(true)}
          onOpenMemberDrawer={() => setShowMemberDrawer(true)}
          onToggleSoup={handleToggleSoupPreference}
          onToggleDrink={handleToggleDrinkPreference}
          onOpenPlanDIYBowl={handleOpenPlanDIYBowl}
        />
      ) : (
        <MealPlanVisitorCard
          onOpenPlans={() => {
            setModalTab('plans');
            setShowAuthModal(true);
          }}
          onOpenLogin={() => {
            setModalTab('login');
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Cajón deslizable de Miembro */}
      <MealPlanMemberDrawer
        open={showMemberDrawer}
        onClose={() => setShowMemberDrawer(false)}
        activePlan={activePlan}
        usage={usage}
        loadingUsage={loadingUsage}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        wantsSoupToday={wantsSoupToday}
        onToggleSoup={handleToggleSoupPreference}
        wantsDrinkToday={wantsDrinkToday}
        onToggleDrink={handleToggleDrinkPreference}
        onOpenAddressModal={() => setShowAddressModal(true)}
        onOpenPlanDIYBowl={handleOpenPlanDIYBowl}
        activeDailyBento={activeDailyBento}
        onOpenDailyBento={handleOpenDailyBento}
        isPWAInstalled={isPWAInstalled}
        onInstallClick={handleInstallClick}
        onLogout={handleLogoutPlan}
      />

      {/* Modal de Dirección con Pin en Mapa */}
      <MealPlanAddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        activePlan={activePlan}
        customAddr={customAddr}
        setCustomAddr={setCustomAddr}
        customNotes={customNotes}
        setCustomNotes={setCustomNotes}
        customCoords={customCoords}
        setCustomCoords={setCustomCoords}
        currentLocation={currentLocation}
        onSaveLocation={handleSaveCustomerLocation}
      />

      {/* Modal de Validación / Catálogo de Planes */}
      <MealPlanAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        modalTab={modalTab}
        setModalTab={setModalTab}
        loginInput={loginInput}
        setLoginInput={setLoginInput}
        onManualLogin={handleManualLogin}
        onGoogleLogin={handleGoogleLogin}
        includeDeliveryInPreview={includeDeliveryInPreview}
        setIncludeDeliveryInPreview={setIncludeDeliveryInPreview}
        displayedTemplates={displayedTemplates}
        whatsappNumber={whatsappNumber}
      />

      {/* Modal PWA Help */}
      <MealPlanPwaHelpModal
        open={showInstallHelp}
        onClose={() => setShowInstallHelp(false)}
      />

      {/* Modales DIY y QuickView de Producto */}
      <DIYProductModal
        open={Boolean(diyPlanProduct)}
        product={diyPlanProduct}
        onClose={() => setDiyPlanProduct(null)}
        onAdd={() => {
          setDiyPlanProduct(null);
          if (typeof onOpenCart === 'function') {
            onOpenCart();
          }
        }}
      />

      <ProductQuickView
        open={Boolean(quickBentoProduct)}
        product={quickBentoProduct}
        onClose={() => setQuickBentoProduct(null)}
        onAdded={() => {
          setQuickBentoProduct(null);
          if (typeof onOpenCart === 'function') {
            onOpenCart();
          }
        }}
      />
    </>
  );
}
