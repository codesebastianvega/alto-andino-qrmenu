import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { SearchInput } from '../ui';
import Portal from '../../Portal';
import RecipeIngredientsTab from './RecipeIngredientsTab';
import RecipeStepsTab from './RecipeStepsTab';
import RecipeEnergyTab from './RecipeEnergyTab';

export default function RecipeEditorModal({
  isOpen,
  onClose,
  editingRecipe,
  formData,
  setFormData,
  totalCost,
  margin,
  modalTab,
  setModalTab,
  // Left column catalog
  filteredIngredients = [],
  catalogSearchTerm,
  setCatalogSearchTerm,
  handleAddIngredient,
  // Ingredients tab props
  handleTargetMarginChange,
  handleGenerateDescriptionAI,
  isGeneratingDesc,
  syncAsProduct,
  setSyncAsProduct,
  linkedProduct,
  categories = [],
  selectedCategoryId,
  setSelectedCategoryId,
  handleRemoveIngredient,
  handleUpdateQuantity,
  // Steps tab props
  isGeneratingSteps,
  handleGenerateStepsAI,
  handleAddStep,
  draggedStepIndex,
  setDraggedStepIndex,
  handleUpdateStep,
  handleMoveStep,
  handleRemoveStep,
  // Energy tab props
  energyCost,
  utilityRates,
  availableEquipment = [],
  onOpenUtilitiesModal,
  // Form submit
  handleSave
}) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-0 overflow-hidden animate-fade-in">
        <div className="bg-white w-full h-full max-w-none max-h-none overflow-hidden shadow-2xl flex flex-col border-none rounded-none">

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Icon icon={editingRecipe ? "heroicons:clipboard-document-check" : "heroicons:plus-circle"} className="text-xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRecipe ? 'Editar Ficha Técnica' : 'Nueva Receta / Sub-receta'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {editingRecipe ? editingRecipe.name : 'Configuración de producción y proporciones'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-500">Costo Producción</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-500">Margen Estimado</p>
                <p className={`text-lg font-bold tabular-nums ${margin >= 40 ? 'text-emerald-600' : margin >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {margin.toFixed(1)}%
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-all"
              >
                <Icon icon="heroicons:x-mark" className="text-xl" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-100/80 px-6 py-2.5 gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setModalTab('ingredients')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                modalTab === 'ingredients'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon icon="heroicons:scale" className={`text-sm ${modalTab === 'ingredients' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>1. Insumos & Gramera</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                modalTab === 'ingredients' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {formData.ingredients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModalTab('steps')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                modalTab === 'steps'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon icon="heroicons:clipboard-document-list" className={`text-sm ${modalTab === 'steps' ? 'text-white' : 'text-slate-500'}`} />
              <span>2. Procedimiento Operativo (SOP)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                modalTab === 'steps' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {(formData.step_by_step || []).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModalTab('energy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                modalTab === 'energy'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon icon="heroicons:bolt" className={`text-sm ${modalTab === 'energy' ? 'text-white' : 'text-slate-500'}`} />
              <span>3. Energía & Equipos (CIF)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                modalTab === 'energy' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {(formData.recipe_equipment || []).length}
              </span>
            </button>
          </div>

          {/* Modal Body: Split Columns */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column (34% / 32%) */}
            {modalTab === 'ingredients' ? (
              <div className="md:w-[34%] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/70">
                <div className="p-4 border-b border-slate-200 shrink-0 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Catálogo de Insumos</p>
                    <span className="text-[11px] font-semibold text-slate-400">{filteredIngredients.length} disponibles</span>
                  </div>
                  <SearchInput 
                    value={catalogSearchTerm} 
                    onChange={e => setCatalogSearchTerm(e.target.value)} 
                    placeholder="Buscar insumo por nombre..." 
                    className="rounded-lg border-slate-200 text-xs h-9"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {filteredIngredients.map(ing => {
                    const isAlreadyUsed = formData.ingredients.some(i => i.ingredient_id === ing.id);
                    return (
                      <button 
                        key={ing.id} 
                        type="button" 
                        onClick={() => handleAddIngredient(ing)}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex justify-between items-center group/ing ${
                          isAlreadyUsed
                            ? 'bg-emerald-50/60 border-2 border-emerald-500 shadow-2xs hover:bg-emerald-100/60'
                            : 'bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {ing.image_url ? (
                            <img
                              src={ing.image_url}
                              alt={ing.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${isAlreadyUsed ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                                {ing.name}
                              </p>
                              {isAlreadyUsed && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shrink-0 uppercase tracking-wider">
                                  ✓ En receta
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium tabular-nums mt-0.5">
                              ${ing.unit_cost?.toLocaleString('es-CO', { maximumFractionDigits: 1 })} / {ing.usage_unit}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                          isAlreadyUsed
                            ? 'bg-emerald-600 text-white border border-emerald-700'
                            : 'bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover/ing:bg-indigo-600 group-hover/ing:text-white'
                        }`}>
                          <Icon icon={isAlreadyUsed ? "heroicons:check" : "heroicons:plus"} className="text-sm font-bold" />
                        </div>
                      </button>
                    );
                  })}
                  {filteredIngredients.length === 0 && (
                    <div className="py-8 text-center flex flex-col items-center text-slate-400">
                      <Icon icon="heroicons:magnifying-glass" className="text-2xl mb-1 text-slate-300" />
                      <p className="text-xs font-medium">Sin insumos encontrados</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="md:w-[32%] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 shrink-0">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Insumos de la Receta</p>
                  <p className="text-[11px] text-slate-500">Consulta los gramajes exactos para redactar cada paso operativo.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {formData.ingredients.map((ing, i) => (
                    <div key={ing.ingredient_id || i} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{ing.name}</p>
                        <p className="text-[11px] text-indigo-600 font-semibold">{ing.quantity} {ing.usage_unit}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                  {formData.ingredients.length === 0 && (
                    <div className="p-6 text-center text-slate-400">
                      <p className="text-xs font-medium">No has agregado insumos aún.</p>
                      <button type="button" onClick={() => setModalTab('ingredients')} className="mt-2 text-xs font-bold text-indigo-600 hover:underline">
                        Ir a pestaña 1 (Insumos)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Column (68%) */}
            <form onSubmit={handleSave} className="md:w-[68%] flex flex-col overflow-hidden">
              {modalTab === 'ingredients' ? (
                <RecipeIngredientsTab 
                  formData={formData}
                  setFormData={setFormData}
                  margin={margin}
                  handleTargetMarginChange={handleTargetMarginChange}
                  handleGenerateDescriptionAI={handleGenerateDescriptionAI}
                  isGeneratingDesc={isGeneratingDesc}
                  totalCost={totalCost}
                  syncAsProduct={syncAsProduct}
                  setSyncAsProduct={setSyncAsProduct}
                  linkedProduct={linkedProduct}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  setSelectedCategoryId={setSelectedCategoryId}
                  handleRemoveIngredient={handleRemoveIngredient}
                  handleUpdateQuantity={handleUpdateQuantity}
                />
              ) : modalTab === 'steps' ? (
                <RecipeStepsTab 
                  formData={formData}
                  setFormData={setFormData}
                  isGeneratingSteps={isGeneratingSteps}
                  handleGenerateStepsAI={handleGenerateStepsAI}
                  handleAddStep={handleAddStep}
                  draggedStepIndex={draggedStepIndex}
                  setDraggedStepIndex={setDraggedStepIndex}
                  handleUpdateStep={handleUpdateStep}
                  handleMoveStep={handleMoveStep}
                  handleRemoveStep={handleRemoveStep}
                />
              ) : (
                <RecipeEnergyTab 
                  formData={formData}
                  setFormData={setFormData}
                  energyCost={energyCost}
                  utilityRates={utilityRates}
                  availableEquipment={availableEquipment}
                  onOpenUtilitiesModal={onOpenUtilitiesModal}
                />
              )}

              {/* Footer Controls */}
              <div className="px-6 py-3.5 border-t border-slate-200 flex justify-end gap-2.5 shrink-0 bg-slate-50">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                >
                  Descartar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {editingRecipe ? 'Actualizar Ficha Técnica' : 'Guardar Nueva Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
}
