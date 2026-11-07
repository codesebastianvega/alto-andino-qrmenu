import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCOP } from '../../../utils/money';
import AAImage from '../../ui/AAImage';

export default function LiveMenuProductsPanel({
  filteredProductsByCategory = [],
  expandedCategories = {},
  toggleCategoryCollapse,
  selectedProductId,
  setSelectedProductId,
  handleProductStockToggle
}) {
  if (filteredProductsByCategory.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-200">
        <p className="text-sm font-bold">No se encontraron platos con el filtro aplicado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredProductsByCategory.map(({ category, items }) => {
        const isExpanded = !!expandedCategories[category.id];
        const activeInCat = items.filter(p => p.stock_status !== 'out').length;

        return (
          <div key={category.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            {/* Header de Categoría */}
            <button
              onClick={() => toggleCategoryCollapse(category.id)}
              className="w-full px-4 py-3 bg-gray-50/90 hover:bg-gray-100/80 border-b border-gray-200 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                  {category.name}
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full">
                  {activeInCat}/{items.length} disponibles
                </span>
              </div>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Lista de Platos */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {items.map(product => {
                  const isOff = product.stock_status === 'out';
                  const isSelected = selectedProductId === product.id;
                  const modCount = Array.isArray(product.modifier_groups) ? product.modifier_groups.length : 0;

                  return (
                    <div 
                      key={product.id}
                      className={`p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 transition-colors ${
                        isSelected 
                          ? 'bg-emerald-50/70 border-l-4 border-emerald-600' 
                          : 'hover:bg-gray-50/60'
                      }`}
                    >
                      {/* Info del Plato */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <AAImage src={product.image_url} alt={product.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-black truncate leading-tight ${isOff ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-emerald-600">
                              {formatCOP(product.price)}
                            </span>
                            <button
                              onClick={() => setSelectedProductId(product.id)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Modificadores ({modCount})</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CHIP DE STOCK ELEGANTE */}
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => handleProductStockToggle(product)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
                            !isOff 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={!isOff ? 'Disponible (Clic para Agotar)' : 'Agotado (Clic para Habilitar)'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                        </button>
                      </div>
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
