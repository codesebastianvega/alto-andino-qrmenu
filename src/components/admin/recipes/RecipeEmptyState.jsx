import React from 'react';
import { Icon } from '@iconify-icon/react';
import { PrimaryButton } from '../ui';

export default function RecipeEmptyState({
  hasRecipes,
  onResetFilters,
  onCreateRecipe
}) {
  if (hasRecipes) {
    return (
      <div className="mt-8 py-20 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
        <Icon icon="heroicons:funnel" className="text-4xl mb-3 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">No hay recetas para este filtro</p>
        <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros o la búsqueda</p>
        <button 
          onClick={onResetFilters} 
          className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        >
          Ver todas las recetas
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 py-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
      <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600 border border-indigo-100">
        <Icon icon="heroicons:book-open" className="text-2xl" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">Recetario Vacío</h3>
      <p className="text-sm text-slate-500 font-normal max-w-md text-center mb-8">
        Las recetas te permiten controlar costos estándar, mermas y calcular márgenes brutos automáticamente.
      </p>

      {/* Step-by-step flow guide */}
      <div className="flex items-center gap-3 mb-8 flex-wrap justify-center max-w-2xl px-4">
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg flex-1 min-w-[180px]">
          <div className="w-7 h-7 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">1</div>
          <div>
            <p className="text-xs font-bold text-slate-900">Crear Insumos</p>
            <p className="text-xs text-slate-500">Materias primas y costos</p>
          </div>
        </div>
        <Icon icon="heroicons:chevron-right" className="text-slate-300 text-lg hidden sm:block shrink-0" />
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg flex-1 min-w-[180px]">
          <div className="w-7 h-7 bg-indigo-600 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">2</div>
          <div>
            <p className="text-xs font-bold text-slate-900">Armar Recetas</p>
            <p className="text-xs text-slate-500">Insumos y gramajes</p>
          </div>
        </div>
        <Icon icon="heroicons:chevron-right" className="text-slate-300 text-lg hidden sm:block shrink-0" />
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg flex-1 min-w-[180px]">
          <div className="w-7 h-7 bg-violet-600 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">3</div>
          <div>
            <p className="text-xs font-bold text-slate-900">Vincular Platos</p>
            <p className="text-xs text-slate-500">Márgenes automáticos</p>
          </div>
        </div>
      </div>

      <PrimaryButton onClick={onCreateRecipe} className="rounded-lg px-5 py-2.5 h-auto text-xs font-semibold shadow-sm">
        <Icon icon="heroicons:plus" className="text-base" />
        Crear Primera Receta
      </PrimaryButton>
    </div>
  );
}
