import React from 'react';
import { Utensils, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCOP } from '../../../utils/money';

export default function LiveMenuModifiersPanel({
  filteredModifierGroups = [],
  expandedGroups = {},
  toggleGroupCollapse,
  dishCountByGroup = {},
  setViewingLinkedDishesGroup,
  setAddOptionTargetGroup,
  setNewOptionForm,
  handleOptionToggle
}) {
  if (filteredModifierGroups.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-200">
        <p className="text-sm font-bold">No hay grupos de modificadores registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredModifierGroups.map(group => {
        const isExpanded = !!expandedGroups[group.id];
        const options = group.options || [];
        const linkedCount = dishCountByGroup[group.id] || 0;

        return (
          <div key={group.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="px-4 py-3 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleGroupCollapse(group.id)}
                className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
              >
                <span className="text-xs font-black text-gray-900 uppercase tracking-wide truncate">
                  {group.name}
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full shrink-0">
                  {options.length} opciones
                </span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {/* BOTÓN: Platos Vinculados */}
                <button
                  onClick={() => setViewingLinkedDishesGroup(group)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ver qué platos de la carta usan este modificador"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{linkedCount} platos</span>
                </button>

                {/* Botón Añadir Opción */}
                <button
                  onClick={() => {
                    setAddOptionTargetGroup(group);
                    setNewOptionForm({ name: '', price: 0, ingredient_id: '' });
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Opción</span>
                </button>

                {/* Flecha Desplegable */}
                <button onClick={() => toggleGroupCollapse(group.id)} className="text-gray-400 p-0.5 cursor-pointer">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opciones del Grupo */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {options.map(opt => {
                  const isOff = !opt.is_active || opt.stock_status === 'out';
                  return (
                    <div key={opt.id} className="p-3 px-4 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                      <div>
                        <p className={`text-xs font-bold ${isOff ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {opt.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                          {opt.price > 0 ? `+ ${formatCOP(opt.price)}` : 'Incluido'}
                        </p>
                      </div>
                      
                      {/* Chip de Stock Opción */}
                      <button
                        type="button"
                        onClick={() => handleOptionToggle(opt, group)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
                          !isOff 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
