import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function RecipeIngredientsTab({
  formData,
  setFormData,
  margin,
  handleTargetMarginChange,
  handleGenerateDescriptionAI,
  isGeneratingDesc,
  totalCost,
  syncAsProduct,
  setSyncAsProduct,
  linkedProduct,
  categories = [],
  selectedCategoryId,
  setSelectedCategoryId,
  handleRemoveIngredient,
  handleUpdateQuantity
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Receta *</label>
          <input 
            required 
            value={formData.name} 
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="Ej. Poke Bowl Pollito Crazy" 
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Precio Venta</label>
            <span className="text-[10px] text-slate-400 font-semibold">Al público</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
            <input 
              type="number" 
              value={formData.target_price} 
              onChange={e => setFormData(prev => ({ ...prev, target_price: Number(e.target.value) }))} 
              className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 tabular-nums"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Margen Deseado</label>
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
              margin >= 60 ? 'bg-emerald-100 text-emerald-800' : margin >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {margin > 0 ? `${margin.toFixed(1)}% Real` : '0%'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input 
                type="number" 
                min="0"
                max="99.9"
                step="any"
                value={margin > 0 ? Number(margin.toFixed(1)) : ''} 
                onChange={e => handleTargetMarginChange(e.target.value)}
                placeholder="65"
                className="w-full h-10 px-3 pr-7 bg-indigo-50/50 border border-indigo-200 rounded-lg text-sm font-black text-indigo-900 outline-none focus:border-indigo-500 tabular-nums"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs">%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {[60, 70].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleTargetMarginChange(pct)}
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 transition-colors"
                  title={`Fijar margen en ${pct}%`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sm:col-span-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Descripción & Notas Técnicas</label>
            <button
              type="button"
              onClick={handleGenerateDescriptionAI}
              disabled={isGeneratingDesc}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
            >
              <Icon icon={isGeneratingDesc ? "lucide:loader-2" : "heroicons:sparkles"} className={`text-xs ${isGeneratingDesc ? 'animate-spin' : ''}`} />
              <span>{isGeneratingDesc ? 'Generando...' : 'Sugerir con IA ✨'}</span>
            </button>
          </div>
          <textarea 
            value={formData.description} 
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Instrucciones para cocina, montaje, advertencias de alérgenos o descripción atractiva..." 
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 min-h-[64px]"
          />
        </div>

        {/* Subreceta Toggle & Extra fields */}
        <div className="sm:col-span-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-4 mb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Icon icon="heroicons:beaker" className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950">Sub-receta / Preparación en Bache (Mise en Place)</p>
                <p className="text-xs text-amber-800 mt-0.5">Activar si se prepara en volumen previo al turno (arroz sushi preparado, salsas, cubos marinados).</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={formData.is_subrecipe} 
                onChange={e => setFormData(prev => ({ ...prev, is_subrecipe: e.target.checked }))} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {formData.is_subrecipe && (() => {
            const batchYield = Number(formData.batch_yield) || 1000;
            const unitCostPerGram = batchYield > 0 ? (totalCost / batchYield) : 0;
            const portionGrams = Number(formData.addon_portion_grams) || 150;
            const portionCost = Math.round(portionGrams * unitCostPerGram);
            const addonPrice = Number(formData.addon_price) || 0;
            const addonMargin = addonPrice > 0 ? (((addonPrice - portionCost) / addonPrice) * 100) : 0;

            return (
              <>
                {/* Métricas clave del bache */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 border-t border-amber-200/80 animate-fade-in">
                  <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Costo Total Bache</span>
                    <span className="text-sm font-black font-mono text-amber-950">${Math.round(totalCost).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Costo Unitario</span>
                    <span className="text-sm font-black font-mono text-amber-950">${unitCostPerGram > 0 ? unitCostPerGram.toFixed(1) : '0'} / {formData.batch_unit || 'g'}</span>
                  </div>
                  <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Rendimiento</span>
                    <span className="text-sm font-black font-mono text-amber-950">{batchYield.toLocaleString()} {formData.batch_unit || 'g'}</span>
                  </div>
                  <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Porciones Estándar</span>
                    <span className="text-sm font-black font-mono text-amber-950">~{portionGrams > 0 ? Math.floor(batchYield / portionGrams) : 0} porciones</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-amber-200/60">
                  <div>
                    <label className="text-xs font-bold text-amber-950 block mb-1">Rendimiento Bache</label>
                    <input 
                      type="number" 
                      value={formData.batch_yield} 
                      onChange={e => setFormData(prev => ({ ...prev, batch_yield: Number(e.target.value) }))} 
                      placeholder="Ej: 2200" 
                      className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 outline-none focus:border-amber-600 tabular-nums shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-950 block mb-1">Unidad</label>
                    <input 
                      type="text" 
                      value={formData.batch_unit} 
                      onChange={e => setFormData(prev => ({ ...prev, batch_unit: e.target.value }))} 
                      placeholder="g, ml, porción" 
                      className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-semibold text-xs text-slate-900 outline-none focus:border-amber-600 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-950 block mb-1">Vida Útil (Días)</label>
                    <input 
                      type="number" 
                      value={formData.shelf_life_days} 
                      onChange={e => setFormData(prev => ({ ...prev, shelf_life_days: Number(e.target.value) }))} 
                      placeholder="Ej: 3" 
                      className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 outline-none focus:border-amber-600 tabular-nums shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-950 block mb-1">Ubicación / Nevera</label>
                    <input 
                      type="text" 
                      value={formData.storage_location} 
                      onChange={e => setFormData(prev => ({ ...prev, storage_location: e.target.value }))} 
                      placeholder="Nevera 1 - Inserto..." 
                      className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-medium text-xs text-slate-900 outline-none focus:border-amber-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Opciones de Venta como Adición y Producto Público */}
                <div className={`mt-4 pt-4 border-t transition-all rounded-2xl p-4 border shadow-2xs space-y-3.5 ${
                  formData.available_as_addon 
                    ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300/60' 
                    : 'bg-white/80 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.available_as_addon}
                        onClick={() => setFormData(prev => ({ ...prev, available_as_addon: !prev.available_as_addon }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          formData.available_as_addon ? 'bg-amber-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.available_as_addon ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-950 block">Disponible como Adición / Extra en Menú</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            formData.available_as_addon 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {formData.available_as_addon ? 'Activo' : 'Desactivado'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">Permite a los comensales pedir una porción extra (ej. 110g Shari) descontando del bache preparado</span>
                      </div>
                    </div>

                    {formData.available_as_addon && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Gramaje de Porción */}
                        <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                          <span className="text-[10px] font-bold text-amber-800 uppercase">Porción:</span>
                          <input 
                            type="number"
                            min="1"
                            value={formData.addon_portion_grams}
                            onChange={e => setFormData(prev => ({ ...prev, addon_portion_grams: e.target.value }))}
                            className="w-16 h-6 text-center font-bold text-xs text-slate-900 outline-none tabular-nums bg-slate-50 border border-slate-200 rounded"
                          />
                          <span className="text-xs font-bold text-slate-700">{formData.batch_unit || 'g'}</span>
                        </div>

                        {/* Precio de Venta Adición */}
                        <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                          <span className="text-[10px] font-bold text-amber-800 uppercase">Precio:</span>
                          <span className="text-xs font-bold text-slate-400">$</span>
                          <input 
                            type="number"
                            min="0"
                            step="100"
                            value={formData.addon_price}
                            onChange={e => setFormData(prev => ({ ...prev, addon_price: Number(e.target.value) }))}
                            placeholder="4500"
                            className="w-20 h-6 font-bold text-xs text-slate-900 outline-none tabular-nums bg-slate-50 border border-slate-200 rounded px-1"
                          />
                        </div>

                        {/* Preset 60% Margen para la adición */}
                        <button
                          type="button"
                          onClick={() => {
                            const suggestedAddon = portionCost > 0 ? Math.round(portionCost / (1 - 0.60)) : 4000;
                            setFormData(prev => ({ ...prev, addon_price: suggestedAddon }));
                          }}
                          className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-md text-[10px] font-bold transition-colors shadow-2xs"
                          title="Calcular precio con 60% de margen"
                        >
                          Sugerir 60%
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Desglose financiero y rentabilidad de la adición */}
                  {formData.available_as_addon && (
                    <>
                      <div className="flex items-center justify-between p-2.5 bg-amber-100/70 rounded-xl border border-amber-200/90 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">Costo porción ({portionGrams}{formData.batch_unit || 'g'}):</span>
                          <strong className="font-mono font-bold text-slate-900">${portionCost.toLocaleString('es-CO')} COP</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">Rentabilidad estimada:</span>
                          <span className={`px-2 py-0.5 rounded-md font-black font-mono text-xs border ${
                            addonMargin >= 50 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                              : addonMargin >= 30 
                              ? 'bg-amber-100 text-amber-800 border-amber-300' 
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {addonMargin > 0 ? `${addonMargin.toFixed(1)}% Margen` : '0.0%'}
                          </span>
                        </div>
                      </div>

                      {/* Publicar directamente como Producto en la Carta Pública */}
                      <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={syncAsProduct}
                              onClick={() => setSyncAsProduct(prev => !prev)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                syncAsProduct ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  syncAsProduct ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <div>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>🛍️ Mostrar como Ítem Suelto en la Carta Pública</span>
                                {linkedProduct && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    linkedProduct.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {linkedProduct.is_active ? '• Publicado' : '• Pausado'}
                                  </span>
                                )}
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Crea una tarjeta individual en la carta para que el cliente pueda pedir la porción directamente al carrito sin entrar a un bowl.
                              </p>
                            </div>
                          </div>

                          {syncAsProduct && (
                            <div className="flex items-center gap-2 shrink-0">
                              <label className="text-[11px] font-bold text-slate-600">Categoría:</label>
                              <select
                                value={selectedCategoryId}
                                onChange={e => setSelectedCategoryId(e.target.value)}
                                className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                              >
                                <option value="">-- Seleccionar categoría --</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Ingredient Composition Area */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Composición de Ingredientes</h4>
            <p className="text-xs text-slate-500 font-medium">Define las cantidades exactas para el gramaje estándar.</p>
          </div>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200">
            {formData.ingredients.length} Insumos vinculados
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formData.ingredients.map(ing => (
            <div key={ing.ingredient_id} className="p-3.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {ing.image_url ? (
                    <img
                      src={ing.image_url}
                      alt={ing.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                      {ing.name?.charAt(0) || '•'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{ing.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium tabular-nums mt-0.5">
                      Costo unitario: ${ing.unit_cost?.toFixed(2)} / {ing.usage_unit}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveIngredient(ing.ingredient_id)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                  title="Quitar de la receta"
                >
                  <Icon icon="heroicons:trash" className="text-base" />
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[11px] text-slate-500 font-bold uppercase">Cant:</span>
                  <input 
                    type="number" 
                    step="any" 
                    min="0" 
                    value={ing.quantity}
                    onChange={e => handleUpdateQuantity(ing.ingredient_id, e.target.value)}
                    className="w-16 h-7 px-1.5 bg-white border border-slate-300 rounded font-black text-xs text-center text-slate-900 focus:border-indigo-600 outline-none tabular-nums" 
                  />
                  <span className="text-xs text-slate-700 font-bold">{ing.usage_unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black tabular-nums bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md border border-emerald-100">
                    ${Math.round(ing.quantity * ing.unit_cost).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {formData.ingredients.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
            <Icon icon="heroicons:beaker" className="text-3xl text-slate-300 mb-2" />
            <h5 className="text-xs font-bold text-slate-700">Sin ingredientes en la receta</h5>
            <p className="text-xs text-slate-500 max-w-xs mt-1">Haz clic en los insumos del catálogo izquierdo para agregarlos a la ficha técnica.</p>
          </div>
        )}
      </div>
    </div>
  );
}
