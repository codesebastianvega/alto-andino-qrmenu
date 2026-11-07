import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function RecipeGridCard({
  recipe,
  onEdit,
  onDelete,
  onViewKitchen,
  onPrepareBatch
}) {
  const ingredients = recipe.recipe_ingredients || [];
  const m = recipe.target_price > 0 ? ((recipe.target_price - recipe.total_cost) / recipe.target_price) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-sm hover:shadow-md ${
        recipe.is_subrecipe 
          ? 'border-amber-200/80 hover:border-amber-400/90' 
          : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full ${recipe.is_subrecipe ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {recipe.is_subrecipe ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/80 text-amber-900 border border-amber-300/60 shadow-2xs">
                <Icon icon="heroicons:beaker" className="text-sm text-amber-700" />
                Sub-receta Prep
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100/80 text-indigo-900 border border-indigo-200 shadow-2xs">
                <Icon icon="heroicons:sparkles" className="text-sm text-indigo-600" />
                Plato de Carta
              </span>
            )}

            {recipe.is_subrecipe ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-slate-800 bg-amber-50/70 border border-amber-200/80">
                <Icon icon="heroicons:scale" className="text-xs text-amber-600" />
                {recipe.batch_yield || 0} {recipe.batch_unit || 'g'}
              </span>
            ) : (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                m >= 40 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : m >= 30 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {m.toFixed(0)}% Margen
              </span>
            )}
          </div>

          {/* Title & Metadata */}
          <h3 
            onClick={() => onEdit(recipe)}
            className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1 min-h-[1.5rem]" 
            title={`Click para editar: ${recipe.name}`}
          >
            {recipe.name}
          </h3>
          
          <div className="flex items-center gap-2 mt-1.5 mb-3.5 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">{ingredients.length} insumos</span>
            {recipe.storage_location && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium truncate max-w-[170px]" title={recipe.storage_location}>
                  <Icon icon="heroicons:map-pin" className="text-xs text-slate-400 shrink-0" />
                  <span>{recipe.storage_location}</span>
                </span>
              </>
            )}
            {recipe.prep_time_minutes && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium font-mono">
                  <Icon icon="heroicons:clock" className="text-xs text-slate-400 shrink-0" />
                  <span>{recipe.prep_time_minutes}m</span>
                </span>
              </>
            )}
          </div>

          {/* Structured Ingredients Mini-Table with fixed uniform height */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1 border-b border-slate-200/80">
              <span>Ingrediente</span>
              <span>Gramaje</span>
            </div>
            
            <div className="space-y-1.5 min-h-[75px] flex flex-col justify-start">
              {ingredients.slice(0, 3).map((ri, index) => (
                <div key={ri.ingredient_id || index} className="flex items-center justify-between text-xs py-0.5 px-1">
                  <span className="text-slate-800 font-medium truncate pr-2">{ri.ingredients?.name}</span>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs shrink-0">
                    {ri.quantity} {ri.ingredients?.usage_unit || 'g'}
                  </span>
                </div>
              ))}
              {ingredients.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Sin ingredientes configurados</p>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-medium text-center pt-1 border-t border-slate-200/70 min-h-[22px]">
              {ingredients.length > 3 ? (
                <span>+ {ingredients.length - 3} ingredientes más en la ficha</span>
              ) : (
                <span className="text-slate-400 text-[10px]">Ficha completa</span>
              )}
            </div>
          </div>
        </div>

        {/* Financial Footer */}
        <div>
          <div className={`rounded-xl p-3 border flex items-center justify-between mb-3.5 ${
            recipe.is_subrecipe 
              ? 'bg-amber-50/40 border-amber-200/70' 
              : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {recipe.is_subrecipe ? 'Costo x gramo' : 'Precio venta'}
              </span>
              <span className="font-mono text-xs font-extrabold text-slate-800">
                {recipe.is_subrecipe 
                  ? `$${((recipe.total_cost || 0) / (recipe.batch_yield || 1)).toFixed(2)} / ${recipe.batch_unit || 'g'}`
                  : (recipe.target_price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {recipe.is_subrecipe ? 'Costo bache' : 'Costo unitario'}
              </span>
              <span className="font-mono text-base font-black text-slate-900">
                ${(recipe.total_cost || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {recipe.is_subrecipe && (
              <button 
                onClick={() => onPrepareBatch(recipe)}
                className="h-9 px-3 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-2xs flex items-center justify-center gap-1 transition-all shrink-0"
                title="Preparar bache y descontar insumos de bodega"
              >
                <span>🍳</span>
                <span>Preparar Bache</span>
              </button>
            )}
            <button 
              onClick={() => onViewKitchen(recipe)}
              className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                recipe.is_subrecipe
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
              title="Ver ficha técnica digital de cocina"
            >
              <Icon icon="heroicons:device-phone-mobile" className="text-sm" />
              <span>{recipe.is_subrecipe ? 'Ficha Bache' : 'Ficha Cocina'}</span>
            </button>
            <button 
              onClick={() => onEdit(recipe)}
              className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors"
              title="Editar receta"
            >
              <Icon icon="heroicons:pencil-square" className="text-sm" />
            </button>
            <button 
              onClick={() => onDelete(recipe.id)}
              className="w-9 h-9 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors"
              title="Eliminar receta"
            >
              <Icon icon="heroicons:trash" className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
