import React from 'react';
import { Icon } from '@iconify-icon/react';
import { toast } from '../../../Toast';

export default function ProductPricingSection({
  formData,
  handleChange,
  setFormData,
  linkedRecipe,
  linkedIngredient,
  cogsMode,
  setCogsMode,
  recipeSearch,
  setRecipeSearch,
  ingredientSearch,
  setIngredientSearch,
  searchedFinalRecipes = [],
  searchedIngredients = [],
  financialMetrics,
  targetMargin,
  setTargetMargin,
  customLocationPricing,
  setCustomLocationPricing,
  locations = [],
  locationOverrides = [],
  setLocationOverrides,
  handleOverrideChange
}) {
  const { totalCOGS = 0, margin = 0, profit = 0, suggestedPrice = 0, priceNum = 0 } =
    financialMetrics || {};

  return (
    <div className="space-y-6">
      {/* Tarjeta de Receta / Insumo Directo Vinculado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Ficha Técnica, Insumo & COGS
            </span>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Vincula con recetas de platos o insumos directos (bebidas/botellas) para sincronizar costos y descontar inventario.
            </p>
          </div>
          {(formData.recipe_id || formData.ingredient_id) && (
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  recipe_id: null,
                  ingredient_id: null,
                  cost: 0
                }))
              }
              className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer"
            >
              Desvincular
            </button>
          )}
        </div>

        {/* Status de la Vinculación Actual */}
        {linkedRecipe ? (
          <div
            className={`p-3.5 rounded-xl border mb-4 flex items-center justify-between ${
              linkedRecipe.is_subrecipe
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50/70 border-blue-200 text-blue-950'
            }`}
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold truncate">{linkedRecipe.name}</span>
                {linkedRecipe.is_subrecipe && (
                  <span className="bg-amber-200 text-amber-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                    Subreceta
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {linkedRecipe.is_subrecipe
                  ? '⚠️ Atención: Es una subreceta. Se recomienda vincular una Receta de Plato Final.'
                  : '✓ Receta de plato final sincronizada'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Costo Porción
              </span>
              <span className="text-sm font-black text-blue-700">
                ${Number(linkedRecipe.total_cost || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ) : linkedIngredient ? (
          <div className="p-3.5 rounded-xl border mb-4 flex items-center justify-between bg-emerald-50/80 border-emerald-200 text-emerald-950">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold truncate">{linkedIngredient.name}</span>
                <span className="bg-emerald-200 text-emerald-900 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                  Insumo Directo
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                ✓ Descuenta 1 {linkedIngredient.usage_unit || 'unidad'} por venta | Stock bodega:{' '}
                <strong>
                  {linkedIngredient.stock_current ?? 0} {linkedIngredient.usage_unit}
                </strong>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Costo Insumo
              </span>
              <span className="text-sm font-black text-emerald-800">
                ${Number(linkedIngredient.unit_cost || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-center">
            <p className="text-xs font-semibold text-slate-500">Sin vinculación a receta ni insumo</p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Puedes elegir una receta, un insumo de bodega o ingresar el costo manual abajo.
            </p>
          </div>
        )}

        {/* Segmented Mode Selector: Recetas vs Insumos Directos */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setCogsMode('recipe')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cogsMode === 'recipe'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🍳</span>
            <span>Receta de Plato</span>
          </button>
          <button
            type="button"
            onClick={() => setCogsMode('ingredient')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cogsMode === 'ingredient'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🥤</span>
            <span>Insumo Directo (Bebidas / Retail)</span>
          </button>
        </div>

        {/* Contenido según el modo */}
        {cogsMode === 'recipe' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type="text"
                  placeholder="Buscar entre recetas de platos finales..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {searchedFinalRecipes.length === 0 ? (
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-800">No hay recetas de platos finales</p>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Las subrecetas (salsas, marinados, arroces base) están protegidas y no aparecen aquí para evitar distorsiones de costo.
                </p>
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      recipe_id: null,
                      ingredient_id: null,
                      cost: 0
                    }))
                  }
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    !formData.recipe_id && !formData.ingredient_id
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <span>Sin vinculación (Costo manual)</span>
                  {!formData.recipe_id && !formData.ingredient_id && (
                    <Icon icon="heroicons:check" className="text-emerald-600" />
                  )}
                </button>
                {searchedFinalRecipes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        recipe_id: r.id,
                        ingredient_id: null,
                        cost: r.total_cost || 0
                      }))
                    }
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      formData.recipe_id === r.id
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate pr-2">{r.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 font-medium">
                        ${Number(r.total_cost || 0).toLocaleString()}
                      </span>
                      {formData.recipe_id === r.id && (
                        <Icon icon="heroicons:check" className="text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type="text"
                  placeholder="Buscar gaseosas, cervezas, tés, insumos de venta directa..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {searchedIngredients.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-xs font-bold text-slate-700">No se encontraron insumos</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Crea el insumo primero en la pestaña de Inventario para poder vincularlo aquí.
                </p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      recipe_id: null,
                      ingredient_id: null,
                      cost: 0
                    }))
                  }
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    !formData.recipe_id && !formData.ingredient_id
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <span>Sin vinculación (Costo manual)</span>
                  {!formData.recipe_id && !formData.ingredient_id && (
                    <Icon icon="heroicons:check" className="text-emerald-600" />
                  )}
                </button>
                {searchedIngredients.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        ingredient_id: ing.id,
                        recipe_id: null,
                        cost: Number(ing.unit_cost || 0)
                      }))
                    }
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      formData.ingredient_id === ing.id
                        ? 'bg-emerald-50 text-emerald-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="truncate block">{ing.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Stock: {ing.stock_current ?? 0} {ing.usage_unit || 'u'}{' '}
                        {ing.sku ? `· SKU: ${ing.sku}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-500 font-medium">
                        ${Number(ing.unit_cost || 0).toLocaleString()}
                      </span>
                      {formData.ingredient_id === ing.id && (
                        <Icon icon="heroicons:check" className="text-emerald-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desglose de Costos (COGS) */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Costo Insumo / Receta
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                $
              </span>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                readOnly={Boolean(formData.recipe_id || formData.ingredient_id)}
                placeholder="0"
                className={`w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-bold outline-none ${
                  formData.recipe_id || formData.ingredient_id
                    ? 'bg-blue-50/50 border-blue-200 text-blue-950 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500'
                }`}
              />
            </div>
            {formData.recipe_id && (
              <span className="text-[9px] font-bold text-blue-600 mt-0.5 block">
                Sincronizado con receta de plato
              </span>
            )}
            {formData.ingredient_id && (
              <span className="text-[9px] font-bold text-emerald-600 mt-0.5 block">
                Sincronizado con insumo directo de bodega
              </span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Costo Empaque / Desechables
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                $
              </span>
              <input
                type="number"
                name="packaging_fee"
                value={formData.recipe_id ? 0 : formData.packaging_fee}
                onChange={handleChange}
                disabled={!!formData.recipe_id}
                placeholder="0"
                className={`w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-bold outline-none ${
                  formData.recipe_id
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500'
                }`}
              />
            </div>
            <span
              className={`text-[9px] mt-0.5 block ${
                formData.recipe_id ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
            >
              {formData.recipe_id
                ? '✓ Incluido directamente en el escandallo de la receta'
                : 'Opcional: vaso, pitillo o bolsa'}
            </span>
          </div>
        </div>

        {/* Total Unit COGS summary badge */}
        <div className="mt-3 bg-slate-100 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Costo Total Unitario (COGS):</span>
          <span className="text-sm font-black text-slate-900">
            ${totalCOGS.toLocaleString()} COP
          </span>
        </div>
      </div>

      {/* Tarjeta de Fijación de Precios & Margen */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md space-y-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
            Precio Base al Público (COP)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-slate-400 text-2xl font-bold">$</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="0"
              className="bg-transparent border-none p-0 text-3xl font-black text-white w-full focus:ring-0 outline-none placeholder:text-slate-600"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Este es el precio oficial y uniforme que ven tus comensales en el menú digital.
          </p>
        </div>

        {/* Margen Real vs Meta */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Margen Bruto Real
              </span>
              <span
                className={`text-2xl font-black ${
                  margin >= targetMargin
                    ? 'text-emerald-400'
                    : margin > 0
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {margin.toFixed(0)}%
              </span>
            </div>

            {/* Target Margin Input */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Meta Deseada
              </span>
              <div className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 mt-0.5">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={targetMargin}
                  onChange={(e) =>
                    setTargetMargin(Math.min(99, Math.max(1, Number(e.target.value))))
                  }
                  className="w-8 bg-transparent text-xs font-bold text-white text-center outline-none"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                margin >= targetMargin
                  ? 'bg-emerald-400'
                  : margin > 0
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
            />
          </div>

          {/* Profit info and Suggested Price */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300 font-medium">
              Ganancia: <strong className="text-white">${profit.toLocaleString()}</strong> / plato
            </span>
            {suggestedPrice > 0 && suggestedPrice !== priceNum && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, price: suggestedPrice }))}
                className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
              >
                Sugerido: ${suggestedPrice.toLocaleString()} (Usar ↑)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta de Disponibilidad y Precios por Sede */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Icon icon="heroicons:map-pin" className="text-base text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Precios y Sedes de Venta</h3>
              <p className="text-[10px] text-slate-600">Control de visibilidad y sobrecostos por punto de venta.</p>
            </div>
          </div>
        </div>

        {/* Master Pricing Mode Switch */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <p className="text-xs font-bold text-slate-800">
                {customLocationPricing ? 'Precios diferenciados por sede' : 'Mismo precio en todas las sedes'}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {customLocationPricing
                  ? 'Permite fijar precios únicos para sedes de alto costo.'
                  : `Recomendado: todas las sedes heredan el Precio Base ($${formData.price || 0} COP).`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !customLocationPricing;
                setCustomLocationPricing(next);
                if (!next) {
                  // Clear all override prices so they inherit base price
                  setLocationOverrides((prev) => prev.map((o) => ({ ...o, price: '' })));
                  toast('Precios unificados con el precio base', { type: 'success' });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                customLocationPricing
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}
            >
              {customLocationPricing ? 'Personalizado' : '✓ Unificado'}
            </button>
          </div>
        </div>

        {/* Locations List */}
        <div className="space-y-2.5">
          {locations.map((loc) => {
            const override = locationOverrides.find((o) => o.location_id === loc.id) || {
              is_active: formData.is_active ?? true,
              stock_status: 'in',
              price: '',
              is_linked: false
            };
            const isActive = override.is_active ?? (formData.is_active ?? true);
            const hasCustomPrice =
              customLocationPricing && override.price !== '' && override.price !== null && override.price !== undefined;

            return (
              <div
                key={loc.id}
                className={`p-3 rounded-xl border transition-all ${
                  isActive ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/60 border-slate-100 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Location Name & Status Toggle */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleOverrideChange(loc.id, 'is_active', !isActive)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                        isActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isActive && <Icon icon="heroicons:check" className="text-xs" />}
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate block">{loc.name}</span>
                      <span className="text-[10px] text-slate-600">
                        {isActive ? 'Activo en sede' : 'Oculto en sede'}
                      </span>
                    </div>
                  </div>

                  {/* Price Input or Inherited Badge */}
                  <div className="shrink-0 text-right">
                    {customLocationPricing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          placeholder={formData.price || '0'}
                          value={override.price}
                          onChange={(e) => handleOverrideChange(loc.id, 'price', e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-emerald-500 outline-none text-right"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        Hereda ${Number(formData.price || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {hasCustomPrice && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-700">Override activo en comensal</span>
                    <button
                      type="button"
                      onClick={() => handleOverrideChange(loc.id, 'price', '')}
                      className="text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                    >
                      Restablecer a base
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
