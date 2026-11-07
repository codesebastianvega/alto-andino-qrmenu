import React from 'react';
import { X } from 'lucide-react';

export default function QuickAddOptionModal({
  addOptionTargetGroup,
  setAddOptionTargetGroup,
  newOptionForm,
  setNewOptionForm,
  isSubmittingOption,
  handleQuickAddOption,
  ingredients = []
}) {
  if (!addOptionTargetGroup) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-black text-gray-900">Añadir Opción</h3>
            <p className="text-[11px] text-gray-500 font-bold">Grupo: {addOptionTargetGroup.name}</p>
          </div>
          <button 
            onClick={() => setAddOptionTargetGroup(null)} 
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleQuickAddOption} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Nombre de la opción</label>
            <input
              type="text"
              required
              placeholder="ej. Arroz Gohan Extra, Huevo, Queso..."
              value={newOptionForm.name}
              onChange={(e) => setNewOptionForm(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Precio Adicional (COP)</label>
            <input
              type="number"
              min="0"
              step="500"
              placeholder="0 si es incluido"
              value={newOptionForm.price}
              onChange={(e) => setNewOptionForm(prev => ({ ...prev, price: e.target.value }))}
              className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {ingredients && ingredients.length > 0 && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Vincular a Insumo de Cocina (Opcional)</label>
              <select
                value={newOptionForm.ingredient_id}
                onChange={(e) => {
                  const ingId = e.target.value;
                  const matchedIng = ingredients.find(i => i.id === ingId);
                  setNewOptionForm(prev => ({ 
                    ...prev, 
                    ingredient_id: ingId,
                    name: (!prev.name.trim() && matchedIng) ? matchedIng.name : prev.name
                  }));
                }}
                className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Ninguno (Opción manual)</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSubmittingOption}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingOption ? 'Guardando...' : 'Crear Opción'}
            </button>
            <button
              type="button"
              onClick={() => setAddOptionTargetGroup(null)}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
