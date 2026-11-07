import React from 'react';
import { Utensils, X } from 'lucide-react';
import { formatCOP } from '../../../utils/money';
import AAImage from '../../ui/AAImage';

export default function LinkedDishesModal({
  viewingLinkedDishesGroup,
  setViewingLinkedDishesGroup,
  products = [],
  handleProductStockToggle
}) {
  if (!viewingLinkedDishesGroup) return null;

  const linkedDishes = products.filter(p => 
    Array.isArray(p.modifier_groups) && p.modifier_groups.includes(viewingLinkedDishesGroup.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Platos Vinculados</h3>
              <p className="text-[11px] text-gray-500 font-bold">Modificador: {viewingLinkedDishesGroup.name}</p>
            </div>
          </div>
          <button 
            onClick={() => setViewingLinkedDishesGroup(null)} 
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-500 font-semibold mb-3">
            Este grupo de modificadores está activo en los siguientes platos:
          </p>

          {linkedDishes.length === 0 ? (
            <div className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              <p className="text-xs font-bold">Ningún plato tiene asignado este grupo actualmente.</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {linkedDishes.map(dish => {
                const isOff = dish.stock_status === 'out';
                return (
                  <div key={dish.id} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <AAImage src={dish.image_url} alt={dish.name} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-gray-900 truncate">{dish.name}</h4>
                        <p className="text-[10px] text-emerald-600 font-bold">{formatCOP(dish.price)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleProductStockToggle(dish)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border shrink-0 cursor-pointer ${
                        !isOff 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
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

        <div className="mt-5 pt-3 border-t border-gray-100">
          <button
            onClick={() => setViewingLinkedDishesGroup(null)}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
