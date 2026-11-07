import React from 'react';
import { Utensils, X, Plus, Trash2 } from 'lucide-react';
import { formatCOP } from '../../../utils/money';

export default function LiveMenuSelectedProductPanel({
  selectedProduct,
  setSelectedProductId,
  selectedProductGroups = [],
  setAddOptionTargetGroup,
  setNewOptionForm,
  handleOptionToggle,
  deleteOption
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
      {selectedProduct ? (
        <div className="flex flex-col">
          {/* Header Panel Derecho */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                Modificadores del plato
              </span>
              <h3 className="text-sm font-black text-gray-900 truncate">
                {selectedProduct.name}
              </h3>
            </div>

            <button
              onClick={() => setSelectedProductId(null)}
              className="p-1.5 rounded-xl hover:bg-gray-200/80 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Cerrar panel de modificadores"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Grupos Asignados a este plato */}
          <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
            {selectedProductGroups.length === 0 ? (
              <div className="py-12 text-center text-gray-400 p-6 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-xs font-bold text-gray-600">Este plato no tiene modificadores asignados.</p>
                <p className="text-[11px] text-gray-400 mt-1">Puedes asignarle grupos en la pestaña de Carta Principal.</p>
              </div>
            ) : (
              selectedProductGroups.map(group => {
                const options = group.options || [];

                return (
                  <div key={group.id} className="bg-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                    {/* Header de Grupo */}
                    <div className="p-3 px-3.5 bg-gray-100/70 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">{group.name}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">
                          {group.min_selections > 0 ? `Obligatorio (${group.min_selections})` : 'Opcional'} · Máx {group.max_selections}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAddOptionTargetGroup(group);
                          setNewOptionForm({ name: '', price: 0, ingredient_id: '' });
                        }}
                        className="p-1 px-2.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Opción</span>
                      </button>
                    </div>

                    {/* Opciones del Grupo */}
                    <div className="divide-y divide-gray-200/60 bg-white">
                      {options.length === 0 ? (
                        <p className="p-3 text-[11px] text-gray-400 italic text-center">Sin opciones en este grupo</p>
                      ) : (
                        options.map(opt => {
                          const isOff = !opt.is_active || opt.stock_status === 'out';
                          return (
                            <div key={opt.id} className="p-2.5 px-3.5 flex items-center justify-between gap-2 hover:bg-gray-50/50">
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold truncate ${isOff ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {opt.name}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                                  {opt.price > 0 ? `+ ${formatCOP(opt.price)}` : 'Incluido'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Chip de Stock Opción */}
                                <button
                                  type="button"
                                  onClick={() => handleOptionToggle(opt, group)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border cursor-pointer ${
                                    !isOff 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs' 
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title={!isOff ? 'Disponible' : 'Agotado'}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                                </button>

                                {/* Delete Option button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar opción "${opt.name}" del grupo?`)) {
                                      deleteOption(opt.id);
                                    }
                                  }}
                                  className="p-1 text-gray-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar opción"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Estado vacío */
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
            <Utensils className="w-7 h-7 text-gray-300" />
          </div>
          <h4 className="text-sm font-black text-gray-700">Selecciona un plato</h4>
          <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
            Haz clic en <span className="font-bold text-blue-600">"Modificadores"</span> en cualquier plato para ver y gestionar sus opciones o bases en tiempo real.
          </p>
        </div>
      )}
    </div>
  );
}
