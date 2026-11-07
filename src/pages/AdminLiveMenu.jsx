import React from 'react';
import { useAdminLiveMenuData } from '../hooks/livemenu/useAdminLiveMenuData';
import LiveMenuHeaderControls from '../components/admin/livemenu/LiveMenuHeaderControls';
import LiveMenuProductsPanel from '../components/admin/livemenu/LiveMenuProductsPanel';
import LiveMenuModifiersPanel from '../components/admin/livemenu/LiveMenuModifiersPanel';
import LiveMenuSelectedProductPanel from '../components/admin/livemenu/LiveMenuSelectedProductPanel';
import LinkedDishesModal from '../components/admin/livemenu/LinkedDishesModal';
import CascadeConfirmModal from '../components/admin/livemenu/CascadeConfirmModal';
import QuickAddOptionModal from '../components/admin/livemenu/QuickAddOptionModal';
import EmergencyPauseModal from '../components/admin/livemenu/EmergencyPauseModal';

export default function AdminLiveMenu() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    onlyOffFilter,
    setOnlyOffFilter,
    expandedCategories,
    expandedGroups,
    selectedProductId,
    setSelectedProductId,
    viewingLinkedDishesGroup,
    setViewingLinkedDishesGroup,
    addOptionTargetGroup,
    setAddOptionTargetGroup,
    newOptionForm,
    setNewOptionForm,
    isSubmittingOption,
    cascadeModal,
    setCascadeModal,
    showEmergencyModal,
    setShowEmergencyModal,
    emergencyAction,
    setEmergencyAction,
    isDailySpecialOpen,
    setIsDailySpecialOpen,
    ingredients,
    refreshProducts,
    deleteOption,
    updateOption,
    products,
    onProductsCount,
    offProducts,
    totalOffItems,
    selectedProduct,
    selectedProductGroups,
    dishCountByGroup,
    filteredProductsByCategory,
    filteredModifierGroups,
    toggleCategoryCollapse,
    toggleGroupCollapse,
    handleProductStockToggle,
    handleOptionToggle,
    handleConfirmCascade,
    handleQuickAddOption,
    handleEmergencyMenuToggle
  } = useAdminLiveMenuData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6 select-none animate-in fade-in duration-300">
      {/* ─── Encabezado y Controles Principales ─── */}
      <LiveMenuHeaderControls
        totalOffItems={totalOffItems}
        onlyOffFilter={onlyOffFilter}
        setOnlyOffFilter={setOnlyOffFilter}
        setShowEmergencyModal={setShowEmergencyModal}
        setEmergencyAction={setEmergencyAction}
        isDailySpecialOpen={isDailySpecialOpen}
        setIsDailySpecialOpen={setIsDailySpecialOpen}
        refreshProducts={refreshProducts}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onProductsCount={onProductsCount}
        offProducts={offProducts}
        modifierGroupsCount={filteredModifierGroups.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedProductId={setSelectedProductId}
      />

      {/* ─── Cuadrícula Balanceada de 12 Columnas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Platos por Categoría o Modificadores (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {activeTab === 'products' && (
            <LiveMenuProductsPanel
              filteredProductsByCategory={filteredProductsByCategory}
              expandedCategories={expandedCategories}
              toggleCategoryCollapse={toggleCategoryCollapse}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              handleProductStockToggle={handleProductStockToggle}
            />
          )}

          {activeTab === 'modifiers' && (
            <LiveMenuModifiersPanel
              filteredModifierGroups={filteredModifierGroups}
              expandedGroups={expandedGroups}
              toggleGroupCollapse={toggleGroupCollapse}
              dishCountByGroup={dishCountByGroup}
              setViewingLinkedDishesGroup={setViewingLinkedDishesGroup}
              setAddOptionTargetGroup={setAddOptionTargetGroup}
              setNewOptionForm={setNewOptionForm}
              handleOptionToggle={handleOptionToggle}
            />
          )}
        </div>

        {/* Panel Derecho: Modificadores del Plato Seleccionado (5 Cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-6">
          <LiveMenuSelectedProductPanel
            selectedProduct={selectedProduct}
            setSelectedProductId={setSelectedProductId}
            selectedProductGroups={selectedProductGroups}
            setAddOptionTargetGroup={setAddOptionTargetGroup}
            setNewOptionForm={setNewOptionForm}
            handleOptionToggle={handleOptionToggle}
            deleteOption={deleteOption}
          />
        </div>
      </div>

      {/* ─── Modales de Apoyo ─── */}
      <LinkedDishesModal
        viewingLinkedDishesGroup={viewingLinkedDishesGroup}
        setViewingLinkedDishesGroup={setViewingLinkedDishesGroup}
        products={products || []}
        handleProductStockToggle={handleProductStockToggle}
      />

      <CascadeConfirmModal
        cascadeModal={cascadeModal}
        setCascadeModal={setCascadeModal}
        handleConfirmCascade={handleConfirmCascade}
        updateOption={updateOption}
      />

      <QuickAddOptionModal
        addOptionTargetGroup={addOptionTargetGroup}
        setAddOptionTargetGroup={setAddOptionTargetGroup}
        newOptionForm={newOptionForm}
        setNewOptionForm={setNewOptionForm}
        isSubmittingOption={isSubmittingOption}
        handleQuickAddOption={handleQuickAddOption}
        ingredients={ingredients}
      />

      <EmergencyPauseModal
        showEmergencyModal={showEmergencyModal}
        setShowEmergencyModal={setShowEmergencyModal}
        emergencyAction={emergencyAction}
        handleEmergencyMenuToggle={handleEmergencyMenuToggle}
      />
    </div>
  );
}
