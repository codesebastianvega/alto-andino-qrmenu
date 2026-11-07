import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function RecipeListItem({
  recipe,
  recipeCategoryTab,
  onEdit,
  onDelete,
  onViewKitchen,
  onPrepareBatch
}) {
  const m = recipe.target_price > 0 ? ((recipe.target_price - recipe.total_cost) / recipe.target_price) * 100 : 0;

  return (
    <tr 
      onClick={(e) => {
        if (!e.target.closest('button')) {
          onEdit(recipe);
        }
      }}
      className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3.5">
        <div>
          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
            {recipe.name}
            <Icon icon="heroicons:pencil-square" className="text-xs opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
          </p>
          {recipe.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{recipe.description}</p>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
            recipe.is_subrecipe 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {recipe.is_subrecipe ? 'Sub-receta' : `${recipe.recipe_ingredients?.length || 0} Insumos`}
          </span>
          {recipe.storage_location && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Icon icon="heroicons:map-pin" className="text-xs text-slate-400" />
              {recipe.storage_location}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell tabular-nums font-semibold text-slate-700">
        {recipe.is_subrecipe ? (
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
            {recipe.batch_yield || 0} {recipe.batch_unit || 'g'}
          </span>
        ) : (
          (recipe.target_price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="tabular-nums font-bold text-slate-900">
          {(recipe.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
        </div>
        {recipe.is_subrecipe ? (
          <div className="text-[11px] text-slate-500 font-medium">
            ${((recipe.total_cost || 0) / (recipe.batch_yield || 1)).toFixed(2)} / {recipe.batch_unit || 'g'}
          </div>
        ) : (
          <span className={`text-[11px] font-semibold ${m >= 40 ? 'text-emerald-600' : m >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
            {m.toFixed(1)}% Margen
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {recipe.is_subrecipe && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPrepareBatch(recipe); }} 
              className="h-8 px-2.5 flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 shadow-2xs transition-all"
              title="Preparar bache y descontar insumos de bodega"
            >
              <span>🍳</span>
              <span>Preparar Bache</span>
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onViewKitchen(recipe); }} 
            className="h-8 px-2.5 flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-all"
            title="Ver Ficha Digital de Cocina"
          >
            <Icon icon="heroicons:device-phone-mobile" className="text-sm" />
            <span className="hidden lg:inline">Ficha</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(recipe); }} 
            className="w-8 h-8 flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-all"
            title="Editar receta"
          >
            <Icon icon="heroicons:pencil-square" className="text-base" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }} 
            className="w-8 h-8 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-all"
            title="Eliminar receta"
          >
            <Icon icon="heroicons:trash" className="text-base" />
          </button>
        </div>
      </td>
    </tr>
  );
}
