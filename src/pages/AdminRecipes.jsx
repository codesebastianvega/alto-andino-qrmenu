import React from 'react';
import { useAdminRecipesManager } from '../hooks/recipes/useAdminRecipesManager';
import RecipeKpiCards from '../components/admin/recipes/RecipeKpiCards';
import RecipeToolbar from '../components/admin/recipes/RecipeToolbar';
import RecipeListItem from '../components/admin/recipes/RecipeListItem';
import RecipeGridCard from '../components/admin/recipes/RecipeGridCard';
import RecipeEmptyState from '../components/admin/recipes/RecipeEmptyState';
import RecipeEditorModal from '../components/admin/recipes/RecipeEditorModal';
import { KitchenStationLayout } from '../components/admin/KitchenStationLayout';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';
import { KitchenRecipeViewerModal } from '../components/admin/KitchenRecipeViewerModal';
import KitchenUtilitiesModal from '../components/admin/KitchenUtilitiesModal';
import { BatchProductionModal } from '../components/admin/BatchProductionModal';

export default function AdminRecipes() {
  const {
    // Brand & Location
    brandId,
    activeLocationId,
    activeLocation,
    isAllLocations,
    // Recipes & Ingredients
    recipes,
    loading,
    fetchRecipes,
    allIngredients,
    fetchIngredients,
    // Filters & Navigation
    viewMode,
    setViewMode,
    activeFilter,
    setActiveFilter,
    recipeCategoryTab,
    setRecipeCategoryTab,
    searchTerm,
    setSearchTerm,
    catalogSearchTerm,
    setCatalogSearchTerm,
    selectedStation,
    setSelectedStation,
    selectedIngredientId,
    setSelectedIngredientId,
    availableStations,
    filteredIngredients,
    displayRecipes,
    dishes,
    subrecipes,
    activeRecipeList,
    statsMetrics,
    hasActiveFilters,
    resetFilters,
    // Form & Modal
    isModalOpen,
    setIsModalOpen,
    isLinkModalOpen,
    setIsLinkModalOpen,
    isUtilitiesModalOpen,
    setIsUtilitiesModalOpen,
    viewingKitchenRecipe,
    setViewingKitchenRecipe,
    batchModalRecipe,
    setBatchModalRecipe,
    editingRecipe,
    modalTab,
    setModalTab,
    draggedStepIndex,
    setDraggedStepIndex,
    isGeneratingDesc,
    isGeneratingSteps,
    formData,
    setFormData,
    totalCost,
    margin,
    energyCost,
    utilityRates,
    availableEquipment,
    categories,
    linkedProduct,
    syncAsProduct,
    setSyncAsProduct,
    selectedCategoryId,
    setSelectedCategoryId,
    showTip,
    dismissTip,
    fetchUtilitiesAndEquipment,
    // Actions
    handleOpenModal,
    handleSave,
    handleDelete,
    handleAddStep,
    handleUpdateStep,
    handleRemoveStep,
    handleMoveStep,
    handleGenerateStepsAI,
    handleGenerateDescriptionAI,
    handleTargetMarginChange,
    handleAddIngredient,
    handleRemoveIngredient,
    handleUpdateQuantity
  } = useAdminRecipesManager();

  if (loading && recipes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Cargando recetas…
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* ── KPI Metrics Cards ── */}
      <RecipeKpiCards 
        statsMetrics={statsMetrics}
        availableEquipment={availableEquipment}
        onOpenUtilitiesModal={() => setIsUtilitiesModalOpen(true)}
      />

      {/* ── Toolbar & View Tabs ── */}
      <RecipeToolbar 
        isAllLocations={isAllLocations}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenBatchModal={() => setBatchModalRecipe({ is_subrecipe: true })}
        onOpenCreateModal={() => handleOpenModal()}
        recipeCategoryTab={recipeCategoryTab}
        setRecipeCategoryTab={setRecipeCategoryTab}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        dishesCount={dishes.length}
        subrecipesCount={subrecipes.length}
        showTip={showTip}
        onDismissTip={dismissTip}
        hasRecipes={recipes.length > 0}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
        availableStations={availableStations}
        selectedIngredientId={selectedIngredientId}
        setSelectedIngredientId={setSelectedIngredientId}
        allIngredients={allIngredients}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        displayCount={displayRecipes.length}
        totalActiveCount={activeRecipeList.length}
      />

      {/* ── Main View Content ── */}
      {recipeCategoryTab === 'layout' ? (
        <KitchenStationLayout />
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Nombre de Receta</th>
                      <th className="px-5 py-3">Tipo & Ubicación</th>
                      <th className="px-5 py-3 hidden md:table-cell">
                        {recipeCategoryTab === 'subrecipes' ? 'Rendimiento' : 'Precio Sugerido'}
                      </th>
                      <th className="px-5 py-3 text-right">Costo & Margen</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayRecipes.map(recipe => (
                      <RecipeListItem 
                        key={recipe.id}
                        recipe={recipe}
                        recipeCategoryTab={recipeCategoryTab}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                        onViewKitchen={setViewingKitchenRecipe}
                        onPrepareBatch={setBatchModalRecipe}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {displayRecipes.map(recipe => (
                <RecipeGridCard 
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                  onViewKitchen={setViewingKitchenRecipe}
                  onPrepareBatch={setBatchModalRecipe}
                />
              ))}
            </div>
          )}

          {/* Empty / Filtered States */}
          {(displayRecipes.length === 0 || recipes.length === 0) && (
            <RecipeEmptyState 
              hasRecipes={recipes.length > 0}
              onResetFilters={() => setActiveFilter('all')}
              onCreateRecipe={() => handleOpenModal()}
            />
          )}
        </>
      )}

      {/* ── Recipe Editor Modal ── */}
      <RecipeEditorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingRecipe={editingRecipe}
        formData={formData}
        setFormData={setFormData}
        totalCost={totalCost}
        margin={margin}
        modalTab={modalTab}
        setModalTab={setModalTab}
        filteredIngredients={filteredIngredients}
        catalogSearchTerm={catalogSearchTerm}
        setCatalogSearchTerm={setCatalogSearchTerm}
        handleAddIngredient={handleAddIngredient}
        handleTargetMarginChange={handleTargetMarginChange}
        handleGenerateDescriptionAI={handleGenerateDescriptionAI}
        isGeneratingDesc={isGeneratingDesc}
        syncAsProduct={syncAsProduct}
        setSyncAsProduct={setSyncAsProduct}
        linkedProduct={linkedProduct}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        handleRemoveIngredient={handleRemoveIngredient}
        handleUpdateQuantity={handleUpdateQuantity}
        isGeneratingSteps={isGeneratingSteps}
        handleGenerateStepsAI={handleGenerateStepsAI}
        handleAddStep={handleAddStep}
        draggedStepIndex={draggedStepIndex}
        setDraggedStepIndex={setDraggedStepIndex}
        handleUpdateStep={handleUpdateStep}
        handleMoveStep={handleMoveStep}
        handleRemoveStep={handleRemoveStep}
        energyCost={energyCost}
        utilityRates={utilityRates}
        availableEquipment={availableEquipment}
        onOpenUtilitiesModal={() => setIsUtilitiesModalOpen(true)}
        handleSave={handleSave}
      />

      {/* ── Catalog Link Modal ── */}
      <LinkCatalogModal 
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          fetchRecipes(activeLocationId);
        }}
        type="recipe"
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede'}
      />

      {/* ── Mobile Kitchen Recipe Viewer Modal ── */}
      {viewingKitchenRecipe && (
        <KitchenRecipeViewerModal
          recipe={viewingKitchenRecipe}
          allRecipes={recipes}
          isOpen={Boolean(viewingKitchenRecipe)}
          onClose={() => setViewingKitchenRecipe(null)}
          onPrepareBatch={(rec) => {
            setViewingKitchenRecipe(null);
            setBatchModalRecipe(rec);
          }}
        />
      )}

      {/* ── Modal de Tarifas de Energía & Equipos de Cocina ── */}
      <KitchenUtilitiesModal
        isOpen={isUtilitiesModalOpen}
        onClose={() => {
          setIsUtilitiesModalOpen(false);
          fetchUtilitiesAndEquipment();
        }}
        brandId={brandId}
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede Principal'}
      />

      {/* ── Modal de Producción de Bache de Subrecetas ── */}
      <BatchProductionModal
        isOpen={Boolean(batchModalRecipe)}
        onClose={() => setBatchModalRecipe(null)}
        targetItem={batchModalRecipe}
        activeLocationId={activeLocationId}
        onProduced={() => {
          fetchRecipes(activeLocationId);
          fetchIngredients(activeLocationId);
        }}
      />
    </div>
  );
}
