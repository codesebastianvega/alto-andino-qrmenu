import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ProductFormHeader({
  name,
  isEditing,
  selectedCategoryName,
  isActive,
  onToggleActive,
  onCancel,
  onSave,
  isSaving
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
          <Icon icon="heroicons:sparkles" className="text-xl text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Product Studio
            </span>
            <span className="text-xs font-semibold text-slate-600 truncate">
              / {selectedCategoryName}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mt-0.5">
            {name?.trim() ? name : isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
        </div>
      </div>

      {/* Global Active Switch & Actions */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Active on Menu Toggle */}
        <button
          type="button"
          onClick={onToggleActive}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isActive
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          {isActive ? 'Visible en Carta' : 'Oculto en Carta'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 cursor-pointer"
        >
          Descartar (Esc)
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Icon icon="lucide:loader-2" className="animate-spin text-sm" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Icon icon="heroicons:check-circle" className="text-base" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
