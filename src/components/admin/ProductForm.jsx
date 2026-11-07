import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { useAdminModalBack } from '../../hooks/useAdminModalBack';
import { convertDriveLink } from '../../utils/images';

import { useProductFormData } from './product-form/hooks/useProductFormData';
import { useProductImageUpload } from './product-form/hooks/useProductImageUpload';

import ProductFormHeader from './product-form/subcomponents/ProductFormHeader';
import ProductImageSection from './product-form/subcomponents/ProductImageSection';
import ProductIdentitySection from './product-form/subcomponents/ProductIdentitySection';
import ProductPricingSection from './product-form/subcomponents/ProductPricingSection';
import ProductModifiersSection from './product-form/subcomponents/ProductModifiersSection';

export default function ProductForm({
  product = null,
  categories = [],
  recipes = [],
  ingredients = [],
  allergens = [],
  modifierGroups: propModifierGroups = null,
  onSave,
  onCancel
}) {
  const { activeBrand } = useAuth();
  useAdminModalBack(true, onCancel);

  const { rawModifierGroups: contextModifierGroups = [] } = useMenuData();
  const rawModifierGroups = propModifierGroups || contextModifierGroups;

  const {
    formData,
    setFormData,
    targetMargin,
    setTargetMargin,
    recipeSearch,
    setRecipeSearch,
    ingredientSearch,
    setIngredientSearch,
    cogsMode,
    setCogsMode,
    customLocationPricing,
    setCustomLocationPricing,
    locationOverrides,
    setLocationOverrides,
    locations,
    isSaving,
    isGeneratingText,
    mainGroups,
    subGroups,
    availableSubcategories,
    brandConceptOptions,
    linkedRecipe,
    linkedIngredient,
    searchedIngredients,
    searchedFinalRecipes,
    selectedCategoryName,
    financialMetrics,
    handleChange,
    handleOverrideChange,
    toggleModifierGroup,
    onDragEnd,
    toggleTag,
    handleGenerateAI,
    handleSubmit
  } = useProductFormData({
    product,
    categories,
    recipes,
    ingredients,
    rawModifierGroups,
    activeBrand,
    onSave
  });

  const {
    isUploading,
    imgError,
    setImgError,
    uploadStats,
    liveImageSize,
    fileInputRef,
    handleImageUpload
  } = useProductImageUpload({
    imageUrl: formData.image_url,
    planId: activeBrand?.plan_id,
    onImageUploaded: (url) => setFormData((prev) => ({ ...prev, image_url: url }))
  });

  const { totalCOGS = 0, margin = 0, priceNum = 0 } = financialMetrics || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-between overflow-hidden">
      {/* Top Sticky Header */}
      <ProductFormHeader
        name={formData.name}
        isEditing={Boolean(product)}
        selectedCategoryName={selectedCategoryName}
        isActive={formData.is_active}
        onToggleActive={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
        onCancel={onCancel}
        onSave={handleSubmit}
        isSaving={isSaving}
      />

      {/* Main Content Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar bg-slate-50">
        <form
          onSubmit={handleSubmit}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* COLUMNA 1: FOTO & IDENTIDAD COMERCIAL */}
          <div className="space-y-6">
            <ProductImageSection
              imageUrl={formData.image_url}
              name={formData.name}
              onImageChange={(e) =>
                setFormData((prev) => ({ ...prev, image_url: convertDriveLink(e.target.value) }))
              }
              onClearImage={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
              imgError={imgError}
              setImgError={setImgError}
              uploadStats={uploadStats}
              liveImageSize={liveImageSize}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handleImageUpload={handleImageUpload}
            />

            <ProductIdentitySection
              formData={formData}
              handleChange={handleChange}
              setFormData={setFormData}
              categories={categories}
              availableSubcategories={availableSubcategories}
              brandConceptOptions={brandConceptOptions}
              handleGenerateAI={handleGenerateAI}
              isGeneratingText={isGeneratingText}
            />
          </div>

          {/* COLUMNA 2: COSTOS, RECETA & PRECIOS */}
          <ProductPricingSection
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            linkedRecipe={linkedRecipe}
            linkedIngredient={linkedIngredient}
            cogsMode={cogsMode}
            setCogsMode={setCogsMode}
            recipeSearch={recipeSearch}
            setRecipeSearch={setRecipeSearch}
            ingredientSearch={ingredientSearch}
            setIngredientSearch={setIngredientSearch}
            searchedFinalRecipes={searchedFinalRecipes}
            searchedIngredients={searchedIngredients}
            financialMetrics={financialMetrics}
            targetMargin={targetMargin}
            setTargetMargin={setTargetMargin}
            customLocationPricing={customLocationPricing}
            setCustomLocationPricing={setCustomLocationPricing}
            locations={locations}
            locationOverrides={locationOverrides}
            setLocationOverrides={setLocationOverrides}
            handleOverrideChange={handleOverrideChange}
          />

          {/* COLUMNA 3: MODIFICADORES & DIETAS/ALERGENOS */}
          <ProductModifiersSection
            formData={formData}
            setFormData={setFormData}
            rawModifierGroups={rawModifierGroups}
            mainGroups={mainGroups}
            subGroups={subGroups}
            toggleModifierGroup={toggleModifierGroup}
            onDragEnd={onDragEnd}
            allergens={allergens}
            toggleTag={toggleTag}
          />
        </form>
      </main>

      {/* STICKY BOTTOM BAR */}
      <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Precio Base
            </span>
            <span className="text-sm font-black text-slate-900">
              ${priceNum.toLocaleString()} COP
            </span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              COGS Total
            </span>
            <span className="text-xs font-bold text-slate-700">
              ${totalCOGS.toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Margen
            </span>
            <span
              className={`text-xs font-bold ${
                margin >= targetMargin ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {margin.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Guardando...' : product ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </footer>
    </div>
  );
}
