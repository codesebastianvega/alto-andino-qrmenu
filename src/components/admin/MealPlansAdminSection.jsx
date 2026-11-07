import React from 'react';
import { useMealPlansAdmin } from './meal-plans/hooks/useMealPlansAdmin';
import MealPlansHeader from './meal-plans/subcomponents/MealPlansHeader';
import MealPlansKpisBar from './meal-plans/subcomponents/MealPlansKpisBar';
import MealPlansSubscribersList from './meal-plans/subcomponents/MealPlansSubscribersList';
import MealPlansConfigTab from './meal-plans/subcomponents/MealPlansConfigTab';
import MealPlanSubscriberModal from './meal-plans/subcomponents/MealPlanSubscriberModal';
import MealPlanTierModal from './meal-plans/subcomponents/MealPlanTierModal';

export default function MealPlansAdminSection({
  brandId,
  brandSlug = 'boku-bento',
  allProducts = [],
  currentLocation = null
}) {
  const {
    activeTab,
    setActiveTab,
    plans,
    programConfig,
    setProgramConfig,
    usageMap,
    saving,
    copiedCode,
    activeTiers,
    totalRemainingCredits,
    gpsVerifiedCount,
    handleQuickTemplateChange,
    handleTogglePaymentStatus,
    handleAdjustUsedCredit,
    handleRenewPlan,
    handleDeletePlan,
    handleQuickSoupChange,
    handleCopyVipLink,
    showModal,
    setShowModal,
    editingPlanId,
    form,
    setForm,
    openCreateModal,
    openEditModal,
    handleFormTemplateSelect,
    handleSaveForm,
    handleSaveProgramSettings,
    showTierModal,
    setShowTierModal,
    editingTierId,
    tierForm,
    setTierForm,
    openCreateTierModal,
    openEditTierModal,
    handleSaveTier,
    handleDeleteTier
  } = useMealPlansAdmin({ brandId, brandSlug });

  return (
    <div className="mb-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm overflow-hidden">
      {/* Cabecera Multi-Tenant con Selector de Pestañas y Franja de KPIs */}
      <div className="bg-gradient-to-r from-[#11241C] via-[#183328] to-stone-900 p-5 sm:p-6 text-white">
        <MealPlansHeader
          programConfig={programConfig}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          subscribersCount={plans.length}
          tiersCount={activeTiers.length}
          onOpenCreateModal={openCreateModal}
        />

        <MealPlansKpisBar
          plansCount={plans.length}
          totalRemainingCredits={totalRemainingCredits}
          gpsVerifiedCount={gpsVerifiedCount}
          creditUnitPlural={programConfig.credit_unit_plural || 'Almuerzos'}
        />
      </div>

      {/* Pestañas de Contenido */}
      {activeTab === 'subscribers' ? (
        <MealPlansSubscribersList
          plans={plans}
          usageMap={usageMap}
          programConfig={programConfig}
          activeTiers={activeTiers}
          brandSlug={brandSlug}
          saving={saving}
          copiedCode={copiedCode}
          onQuickTemplateChange={handleQuickTemplateChange}
          onTogglePaymentStatus={handleTogglePaymentStatus}
          onQuickSoupChange={handleQuickSoupChange}
          onAdjustUsedCredit={handleAdjustUsedCredit}
          onRenewPlan={handleRenewPlan}
          onCopyVipLink={handleCopyVipLink}
          onEdit={openEditModal}
          onDelete={handleDeletePlan}
        />
      ) : (
        <MealPlansConfigTab
          programConfig={programConfig}
          setProgramConfig={setProgramConfig}
          activeTiers={activeTiers}
          allProducts={allProducts}
          saving={saving}
          onSaveProgramSettings={handleSaveProgramSettings}
          onOpenCreateTierModal={openCreateTierModal}
          onOpenEditTierModal={openEditTierModal}
          onDeleteTier={handleDeleteTier}
        />
      )}

      {/* Modal Suscriptor con Mapa GPS */}
      <MealPlanSubscriberModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isEditing={Boolean(editingPlanId)}
        form={form}
        setForm={setForm}
        activeTiers={activeTiers}
        currentLocation={currentLocation}
        saving={saving}
        onTemplateSelect={handleFormTemplateSelect}
        onSubmit={handleSaveForm}
      />

      {/* Modal Crear / Editar Paquetes (Tiers) */}
      <MealPlanTierModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        isEditing={Boolean(editingTierId)}
        tierForm={tierForm}
        setTierForm={setTierForm}
        saving={saving}
        onSubmit={handleSaveTier}
      />
    </div>
  );
}
